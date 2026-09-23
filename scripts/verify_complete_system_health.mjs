import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
const defaultLookup = dns.lookup;
dns.lookup = (hostname, options, callback) => {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  dns.resolve4(hostname, (err, addresses) => {
    if (!err && addresses && addresses.length > 0) {
      if (options && options.all) {
        return callback(null, addresses.map(a => ({ address: a, family: 4 })));
      }
      return callback(null, addresses[0], 4);
    }
    defaultLookup(hostname, options, callback);
  });
};

import pg from 'pg';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'aspirantx_ultra_secure_jwt_secret_key_2026';
const DATABASE_URL = process.env.DATABASE_URL;

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

function createTestUser(label = 'user', role = 'STUDENT', email = null, customId = null) {
  const id = customId || crypto.randomUUID();
  const token = jwt.sign(
    { sub: id, email: email || `${label}_${Date.now()}@example.com`, role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  return { id, token };
}

async function runCompleteSystemHealthCheck() {
  console.log('================================================================');
  console.log('COMPREHENSIVE END-TO-END SYSTEM & DATABASE HEALTH VERIFICATION');
  console.log('================================================================\n');

  const results = {
    database: { passed: 0, failed: 0, errors: [] },
    apis: { passed: 0, failed: 0, errors: [] },
    security: { passed: 0, failed: 0, errors: [] }
  };

  // --------------------------------------------------------------------------
  // 1. DATABASE CONNECTIVITY & 70 TABLES SELECT VERIFICATION
  // --------------------------------------------------------------------------
  console.log('--- 1. VERIFYING ALL 70 TABLES IN NEON POSTGRESQL ---');
  const client = await pool.connect();
  try {
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const tableNames = tablesRes.rows.map(r => r.table_name);
    console.log(`Found ${tableNames.length} tables in schema public.`);

    for (const tbl of tableNames) {
      try {
        await client.query(`SELECT * FROM public.${tbl} LIMIT 1;`);
        results.database.passed++;
      } catch (err) {
        results.database.failed++;
        results.database.errors.push(`Table public.${tbl} query failed: ${err.message}`);
        console.error(`  ✕ Table public.${tbl}: ${err.message}`);
      }
    }
    console.log(`  ✓ All ${results.database.passed} tables queryable without error.`);
  } finally {
    client.release();
  }

  // --------------------------------------------------------------------------
  // 2. BACKEND API ENDPOINTS END-TO-END AUDIT
  // --------------------------------------------------------------------------
  console.log('\n--- 2. BACKEND API ENDPOINTS VERIFICATION ---');

  const adminUser = createTestUser('admin_user', 'ADMIN', 'ambujyadav0010@gmail.com', '6f5e0712-5be9-4036-a0ab-c8dadf00c811');
  const studentUser = createTestUser('student_user', 'STUDENT');

  const endpoints = [
    { name: 'Health Check', url: '/api/health', method: 'GET', auth: null, expectedStatus: 200 },
    { name: 'Public Podcasts', url: '/api/podcasts', method: 'GET', auth: null, expectedStatus: 200 },
    { name: 'PYQ Analytics', url: '/api/academic/pyqs/analytics', method: 'GET', auth: null, expectedStatus: 200 },
    { name: 'PYQ PDFs', url: '/api/academic/pyqs/pdfs', method: 'GET', auth: null, expectedStatus: 200 },
    { name: 'Global Search', url: '/api/search?q=polity', method: 'GET', auth: null, expectedStatus: 200 },
    { name: 'Community Posts', url: '/api/community/posts', method: 'GET', auth: null, expectedStatus: 200 },
    { name: 'Community Groups', url: '/api/community/groups', method: 'GET', auth: null, expectedStatus: 200 },
    { name: 'User Tasks GET', url: '/api/user/tasks?exam=UPSC', method: 'GET', auth: studentUser.token, expectedStatus: 200 },
    { name: 'Flashcards GET', url: '/api/academic/flashcards?exam=UPSC', method: 'GET', auth: studentUser.token, expectedStatus: 200 },
    { name: 'Syllabus Progress GET', url: '/api/user/syllabus-progress/ALL', method: 'GET', auth: studentUser.token, expectedStatus: 200 },
    { name: 'Streak Status GET', url: '/api/rewards/streak', method: 'GET', auth: studentUser.token, expectedStatus: 200 },
    { name: 'Feedback Reports Mine', url: '/api/feedback/mine', method: 'GET', auth: studentUser.token, expectedStatus: 200 },
    { name: 'Educators Public List', url: '/api/teachers', method: 'GET', auth: null, expectedStatus: 200 },
    { name: 'Admin Watchdog (Authorized)', url: '/api/admin/watchdog', method: 'GET', auth: adminUser.token, expectedStatus: 200 },
    { name: 'Admin Watchdog (Student Forbidden)', url: '/api/admin/watchdog', method: 'GET', auth: studentUser.token, expectedStatus: [401, 403] },
    { name: 'Admin Settings GET', url: '/api/admin/settings', method: 'GET', auth: adminUser.token, expectedStatus: 200 },
    { name: 'Admin Settings (Student Forbidden)', url: '/api/admin/settings', method: 'GET', auth: studentUser.token, expectedStatus: [401, 403] }
  ];

  for (const ep of endpoints) {
    try {
      const headers = {};
      if (ep.auth) headers['Authorization'] = `Bearer ${ep.auth}`;
      const res = await fetch(`${BASE_URL}${ep.url}`, { method: ep.method, headers });
      
      const expected = Array.isArray(ep.expectedStatus) ? ep.expectedStatus : [ep.expectedStatus];
      if (expected.includes(res.status)) {
        results.apis.passed++;
        console.log(`  ✓ ${ep.name} -> HTTP ${res.status}`);
      } else {
        results.apis.failed++;
        results.apis.errors.push(`${ep.name} expected ${expected.join('/')} but got ${res.status}`);
        console.error(`  ✕ ${ep.name} -> HTTP ${res.status} (Expected: ${expected.join('/')})`);
      }
    } catch (err) {
      results.apis.failed++;
      results.apis.errors.push(`${ep.name} fetch failed: ${err.message}`);
      console.error(`  ✕ ${ep.name} fetch error: ${err.message}`);
    }
  }

  // --------------------------------------------------------------------------
  // 3. COMPLETE REWARD & FLASHCARD CRUD FLOW
  // --------------------------------------------------------------------------
  console.log('\n--- 3. VERIFYING CRUD DATA FLOW (Flashcards, Tasks, Rewards) ---');

  // Flashcard creation & retrieval
  const cardQ = `Health Check Q: ${Date.now()}`;
  const cardRes = await fetch(`${BASE_URL}/api/academic/flashcards/custom`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${studentUser.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: cardQ, answer: 'Health Check Answer', category: 'Polity', exam: 'UPSC' })
  });
  const cardData = await cardRes.json();
  if (cardRes.status === 201 && cardData.card?.id) {
    results.apis.passed++;
    console.log(`  ✓ Custom Flashcard Created: ${cardData.card.id}`);
  } else {
    results.apis.failed++;
    results.apis.errors.push(`Flashcard creation failed: HTTP ${cardRes.status}`);
  }

  // Task creation & retrieval
  const taskTitle = `Health Check Task: ${Date.now()}`;
  const taskRes = await fetch(`${BASE_URL}/api/user/tasks`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${studentUser.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: taskTitle, subject: 'Polity', priority: 'High', minutes: 30, exam: 'UPSC' })
  });
  const taskData = await taskRes.json();
  if (taskRes.status === 200 && taskData.task?.id) {
    results.apis.passed++;
    console.log(`  ✓ Task Created: ${taskData.task.id}`);
  } else {
    results.apis.failed++;
    results.apis.errors.push(`Task creation failed: HTTP ${taskRes.status}`);
  }

  // Audio Streaming Range Request
  const audioRes = await fetch(`${BASE_URL}/audio/upsc_gs2_polity_masterclass.wav`, {
    headers: { 'Range': 'bytes=0-100' }
  });
  if (audioRes.status === 206 && audioRes.headers.get('content-range')) {
    results.apis.passed++;
    console.log(`  ✓ Audio Range Streaming (HTTP 206 Partial Content): ${audioRes.headers.get('content-range')}`);
  } else {
    results.apis.failed++;
    results.apis.errors.push(`Audio streaming failed: HTTP ${audioRes.status}`);
  }

  console.log('\n================================================================');
  console.log(`HEALTH CHECK SUMMARY:`);
  console.log(`  Database Tables Tested: ${results.database.passed} Passed, ${results.database.failed} Failed`);
  console.log(`  API Endpoints Tested:   ${results.apis.passed} Passed, ${results.apis.failed} Failed`);
  console.log(`  Total Errors Encountered: ${results.database.errors.length + results.apis.errors.length}`);
  if (results.database.failed === 0 && results.apis.failed === 0) {
    console.log('STATUS: ZERO PROBLEMS DETECTED - SYSTEM 100% HEALTHY & FULLY OPERATIONAL');
  } else {
    console.log('STATUS: PROBLEMS FOUND');
    console.log(JSON.stringify([...results.database.errors, ...results.apis.errors], null, 2));
  }
  console.log('================================================================\n');

  await pool.end();
}

runCompleteSystemHealthCheck().catch(err => {
  console.error('Fatal health check error:', err);
  pool.end();
  process.exit(1);
});
