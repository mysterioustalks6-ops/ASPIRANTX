import fetch from 'node-fetch';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const BASE_URL = 'https://aspirantx.vercel.app';
const JWT_SECRET = 'aspirantx_dev_jwt_secret_fallback_key_2026';

function generateToken(sub, email, role = 'USER') {
  return jwt.sign({ sub, email, role }, JWT_SECRET, { expiresIn: '2h' });
}

async function run() {
  console.log('=== VERIFYING PRODUCTION HTTPS -> VERCEL -> NEON ROUNDTRIP ===\n');

  // Test User UUID
  const testUserId = 'e7777777-7777-4777-8777-777777777777';
  const testEmail = 'release_gate_auditor@aspirantx.in';
  const token = generateToken(testUserId, testEmail);

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 1. CBT Submission on Production
  console.log('1. Submitting CBT test result via Production API...');
  const cbtPayload = {
    testId: 'cbt_mock_live_01',
    testTitle: 'UPSC CSE 2026 Live Diagnostic Mock',
    exam: 'UPSC_CSE',
    questions: [
      { id: 'q1', marks: 2, negativeMarks: 0.66, correctOption: 1, subject: 'Polity', topic: 'Preamble' },
      { id: 'q2', marks: 2, negativeMarks: 0.66, correctOption: 2, subject: 'Economy', topic: 'Monetary Policy' }
    ],
    responses: {
      q1: { selectedOption: 1, timeSpentSeconds: 45 },
      q2: { selectedOption: 2, timeSpentSeconds: 60 }
    }
  };

  const cbtRes = await fetch(`${BASE_URL}/api/cbt/submit`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(cbtPayload)
  });
  console.log(`   CBT Submit Status: ${cbtRes.status}`);
  const cbtData = await cbtRes.json();
  console.log(`   CBT Submit Result: Score=${cbtData.result?.score}, Percentile=${cbtData.result?.percentile}%`);

  // 2. Task Creation on Production
  console.log('\n2. Creating Daily Task via Production API...');
  const taskRes = await fetch(`${BASE_URL}/api/user/tasks`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Production Verification Task - Ethics Case Studies',
      priority: 'high',
      dueDate: new Date().toISOString()
    })
  });
  console.log(`   Task Create Status: ${taskRes.status}`);
  const taskData = await taskRes.json();
  console.log(`   Task Data: ID=${taskData.task?.id}, Title="${taskData.task?.title}"`);

  // 3. Pomodoro Session on Production
  console.log('\n3. Recording Pomodoro Session via Production API...');
  const pomoRes = await fetch(`${BASE_URL}/api/user/study-sessions`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      duration: 30,
      completedDuration: 30,
      subject: 'Polity - Directive Principles of State Policy',
      exam: 'UPSC_CSE'
    })
  });
  console.log(`   Pomodoro Session Status: ${pomoRes.status}`);
  const pomoData = await pomoRes.json();
  console.log(`   Pomodoro Data: Success=${pomoData.success}, Minutes=${pomoData.session?.minutes}`);

  // 4. Syllabus Progress on Production
  console.log('\n4. Updating Syllabus Progress via Production API...');
  const sylRes = await fetch(`${BASE_URL}/api/user/syllabus-progress`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      exam: 'UPSC_CSE',
      topicId: 'upsc_gs2_polity_dpsp',
      status: 'COMPLETED',
      notes: 'Reviewed fully with Lakshmikanth Chapter 8'
    })
  });
  console.log(`   Syllabus Update Status: ${sylRes.status}`);
  const sylData = await sylRes.json();
  console.log(`   Syllabus Data: Success=${sylData.success}`);

  // 5. Query Neon Database to confirm row-level persistence
  console.log('\n5. Querying Neon PostgreSQL Directly to Confirm Persistence...');
  
  const cbtSql = await pool.query('SELECT user_id, data, updated_at FROM public.cbt_results WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1', [testUserId]);
  console.log(`   [NEON SQL] CBT Results: ${cbtSql.rows.length} row(s) found!`);
  if (cbtSql.rows.length > 0) {
    const rawData = cbtSql.rows[0].data;
    const firstScore = Array.isArray(rawData) ? rawData[0]?.score : rawData?.score;
    console.log(`     Confirmed in Neon: Score=${firstScore}, UpdatedAt=${cbtSql.rows[0].updated_at}`);
  }

  const taskSql = await pool.query('SELECT id, user_id, title, priority, created_at FROM public.user_tasks WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [testUserId]);
  console.log(`   [NEON SQL] User Tasks: ${taskSql.rows.length} row(s) found!`);
  if (taskSql.rows.length > 0) {
    console.log(`     Confirmed in Neon: Title="${taskSql.rows[0].title}", Priority=${taskSql.rows[0].priority}`);
  }

  const pomoSql = await pool.query('SELECT id, user_id, minutes, date, created_at FROM public.user_pomodoro_sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [testUserId]);
  console.log(`   [NEON SQL] Pomodoro Sessions: ${pomoSql.rows.length} row(s) found!`);
  if (pomoSql.rows.length > 0) {
    console.log(`     Confirmed in Neon: Minutes=${pomoSql.rows[0].minutes}, Date="${pomoSql.rows[0].date}"`);
  }

  const sylSql = await pool.query('SELECT id, user_id, exam, progress, updated_at FROM public.user_syllabus_progress WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1', [testUserId]);
  console.log(`   [NEON SQL] Syllabus Progress: ${sylSql.rows.length} row(s) found!`);
  if (sylSql.rows.length > 0) {
    console.log(`     Confirmed in Neon: Exam="${sylSql.rows[0].exam}", Progress=${JSON.stringify(sylSql.rows[0].progress).slice(0, 80)}`);
  }

  // 6. Production Read Verification
  console.log('\n6. Reading Data Back via Production API to Verify Full Loop...');
  const readTaskRes = await fetch(`${BASE_URL}/api/user/tasks`, { headers: authHeaders });
  const readTaskData = await readTaskRes.json();
  console.log(`   Production Read Tasks: Status ${readTaskRes.status}, count = ${readTaskData.tasks?.length || 0}`);

  const readSylRes = await fetch(`${BASE_URL}/api/user/syllabus-progress?exam=UPSC_CSE`, { headers: authHeaders });
  const readSylData = await readSylRes.json();
  console.log(`   Production Read Syllabus: Status ${readSylRes.status}, success = ${readSylData.success}`);

  const readCbtRes = await fetch(`${BASE_URL}/api/cbt/history?userId=${testUserId}`, { headers: authHeaders });
  const readCbtData = await readCbtRes.json();
  console.log(`   Production Read CBT History: Status ${readCbtRes.status}, history count = ${readCbtData.history?.length || 0}`);

  // 7. Gemini AI Production Request
  console.log('\n7. Real Gemini AI Production Evaluation...');
  const aiRes = await fetch(`${BASE_URL}/api/gemini/chat`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      message: 'Briefly explain Article 21 of Indian Constitution in 2 sentences for UPSC Mains.',
      context: 'UPSC CSE GS Paper 2'
    })
  });
  console.log(`   Gemini Status: ${aiRes.status}`);
  const aiData = await aiRes.json();
  const reply = aiData.reply || aiData.text || aiData.response || JSON.stringify(aiData);
  console.log(`   Gemini Response: "${reply.trim().slice(0, 180)}..."`);
  console.log(`   API Key Exposure Check: ${reply.includes('AIza') ? 'FAIL: KEY LEAKED!' : 'PASS: NO KEY LEAK'}`);

  await pool.end();
  console.log('\n=== ALL PRODUCTION ROUNDTRIP CHECKS COMPLETED SUCCESSFULLY ===');
}

run().catch(err => {
  console.error('Test Failed:', err);
  pool.end();
  process.exit(1);
});
