import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

const PROD_URL = process.argv[2] || 'https://aspirantx.vercel.app';
const JWT_SECRET = process.env.JWT_SECRET || 'protrack_dev_jwt_secret_key_fixed_for_local_env_2026';

function generateToken(sub, email, role = 'STUDENT') {
  return jwt.sign({ sub, email, role }, JWT_SECRET, { expiresIn: '1h' });
}

const testUserToken = generateToken('a1111111-1111-4111-8111-111111111111', 'prod_tester@test.com', 'STUDENT');

async function testEndpoint(name, path, options = {}) {
  try {
    const res = await fetch(`${PROD_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      timeout: 10000
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch (_e) {}
    return { name, path, status: res.status, ok: res.ok, json, raw: text.slice(0, 100) };
  } catch (err) {
    return { name, path, error: err.message };
  }
}

async function runProdAudit() {
  console.log(`=== TESTING ENDPOINTS ON: ${PROD_URL} ===\n`);

  const tests = [
    { name: 'Health Check', path: '/api/health' },
    { name: 'AI Status', path: '/api/ai/status' },
    { name: 'Global Search', path: '/api/search?q=upsc' },
    { name: 'Podcasts', path: '/api/podcasts' },
    { name: 'PYQ Analytics', path: '/api/academic/pyqs/analytics' },
    { name: 'Question Bank', path: '/api/academic/question-bank?limit=5' },
    { name: 'Library / Books', path: '/api/academic/books' },
    { name: 'Leaderboard', path: '/api/academic/leaderboard?exam=UPSC_CSE' },
    { name: 'Community Posts', path: '/api/community/posts' },
    { name: 'Teacher Classes', path: '/api/teacher/classes' },
    { name: 'Flashcards', path: '/api/academic/flashcards', options: { headers: { Authorization: `Bearer ${testUserToken}` } } },
    { name: 'User Tasks (Auth)', path: '/api/user/tasks', options: { headers: { Authorization: `Bearer ${testUserToken}` } } },
    { name: 'Syllabus Progress (Auth)', path: '/api/user/syllabus-progress?exam=UPSC_CSE', options: { headers: { Authorization: `Bearer ${testUserToken}` } } },
    { name: 'Study Sessions (Auth)', path: '/api/user/study-sessions', options: { headers: { Authorization: `Bearer ${testUserToken}` } } },
    { name: 'Rewards Status (Auth)', path: '/api/rewards/status', options: { headers: { Authorization: `Bearer ${testUserToken}` } } },
    { name: 'Notifications (Auth)', path: '/api/notifications', options: { headers: { Authorization: `Bearer ${testUserToken}` } } },
    { name: 'Weakness Analytics (Auth)', path: '/api/user/analytics/weaknesses?exam=UPSC_CSE', options: { headers: { Authorization: `Bearer ${testUserToken}` } } }
  ];

  for (const t of tests) {
    const res = await testEndpoint(t.name, t.path, t.options);
    console.log(`[${res.status || 'ERR'}] ${t.name} (${t.path}) -> ok: ${res.ok}`);
    if (res.json) console.log(`   Data:`, JSON.stringify(res.json).slice(0, 110));
    if (res.error) console.log(`   Error: ${res.error}`);
  }
}

runProdAudit();
