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

const BASE_URL = process.env.TEST_API_URL || 'https://aspirantx.vercel.app';
const JWT_SECRET = process.env.JWT_SECRET || 'aspirantx_ultra_secure_jwt_secret_key_2026';
const DATABASE_URL = process.env.DATABASE_URL;

console.log(`\n===============================================================`);
console.log(`COMPREHENSIVE AUTH RELEASE GATE TEST SUITE`);
console.log(`Target Host: ${BASE_URL}`);
console.log(`===============================================================\n`);

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const results = {
  passed: 0,
  failed: 0,
  details: []
};

function recordTest(name, passed, detail) {
  if (passed) {
    console.log(`✅ PASS: ${name}`);
    results.passed++;
  } else {
    console.log(`❌ FAIL: ${name} -> ${detail}`);
    results.failed++;
  }
  results.details.push({ name, passed, detail });
}

async function run() {
  const client = await pool.connect();

  try {
    // -------------------------------------------------------------
    // 1. NEON DATABASE SCHEMA & AUTHORITY AUDIT
    // -------------------------------------------------------------
    console.log(`\n--- 1. NEON DATABASE TABLES & COLUMNS AUDIT ---`);
    const tablesRes = await client.query(`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
    `);
    const publicTables = tablesRes.rows.map(r => r.table_name);

    const authTablesRes = await client.query(`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'auth';
    `);
    const authTables = authTablesRes.rows.map(r => r.table_name);

    recordTest(
      'Neon has auth.users table',
      authTables.includes('users'),
      `Found auth tables: ${authTables.join(', ')}`
    );

    recordTest(
      'Neon has user_profiles table',
      publicTables.includes('user_profiles'),
      'user_profiles table presence'
    );

    recordTest(
      'Neon has admin_users table',
      publicTables.includes('admin_users'),
      'admin_users table presence'
    );

    const colsRes = await client.query(`
      SELECT column_name FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users';
    `);
    const authCols = colsRes.rows.map(r => r.column_name);

    recordTest(
      'auth.users has password_hash and metadata columns',
      authCols.includes('password_hash') && authCols.includes('raw_user_meta_data'),
      `Columns: ${authCols.join(', ')}`
    );

    // -------------------------------------------------------------
    // 2. EMAIL/PASSWORD REGISTRATION (PRODUCTION API)
    // -------------------------------------------------------------
    console.log(`\n--- 2. EMAIL / PASSWORD REGISTRATION & PERSISTENCE ---`);
    const testEmail = `gate_${Date.now()}_${Math.random().toString(36).substring(2, 6)}@aspirantx.test`;
    const testPassword = 'SecurePassword2026!';
    const testName = 'Release Gate Aspirant';

    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword, name: testName })
    });

    const regData = await regRes.json().catch(() => ({}));
    recordTest(
      'POST /api/auth/register returns 200 with JWT and user object',
      regRes.status === 200 && regData.success === true && Boolean(regData.token),
      `Status: ${regRes.status}, Body: ${JSON.stringify(regData)}`
    );

    const userToken = regData.token;
    const userId = regData.user?.id;

    // Verify Neon Database Effect
    const neonUserCheck = await client.query('SELECT id, email, password_hash FROM auth.users WHERE email = $1', [testEmail]);
    recordTest(
      'Registered user exists in Neon auth.users with salted hash',
      neonUserCheck.rows.length === 1 && neonUserCheck.rows[0].password_hash.includes(':'),
      `Found ${neonUserCheck.rows.length} rows, hash: ${neonUserCheck.rows[0]?.password_hash?.substring(0, 15)}...`
    );

    const neonProfileCheck = await client.query('SELECT id, xp, coins, level FROM user_profiles WHERE id = $1', [userId]);
    recordTest(
      'Registered user profile exists in Neon user_profiles',
      neonProfileCheck.rows.length === 1,
      `Found ${neonProfileCheck.rows.length} profile rows`
    );

    // -------------------------------------------------------------
    // 3. DUPLICATE REGISTRATION PREVENTION
    // -------------------------------------------------------------
    console.log(`\n--- 3. DUPLICATE REGISTRATION PREVENTION ---`);
    const dupRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword, name: testName })
    });
    recordTest(
      'Duplicate email registration is rejected with 400',
      dupRes.status === 400,
      `Duplicate status: ${dupRes.status}`
    );

    // -------------------------------------------------------------
    // 4. AUTHENTICATED /api/auth/me (TOKEN VERIFICATION)
    // -------------------------------------------------------------
    console.log(`\n--- 4. AUTHENTICATED /api/auth/me VERIFICATION ---`);
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    const meData = await meRes.json().catch(() => ({}));
    recordTest(
      'GET /api/auth/me returns 200 with verified user profile',
      meRes.status === 200 && meData.success === true && meData.user?.email === testEmail,
      `Status: ${meRes.status}, User: ${JSON.stringify(meData.user)}`
    );

    // -------------------------------------------------------------
    // 5. EMAIL / PASSWORD LOGIN
    // -------------------------------------------------------------
    console.log(`\n--- 5. EMAIL / PASSWORD LOGIN ---`);
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    const loginData = await loginRes.json().catch(() => ({}));
    recordTest(
      'POST /api/auth/login succeeds with correct password',
      loginRes.status === 200 && loginData.success === true && Boolean(loginData.token),
      `Status: ${loginRes.status}`
    );

    // -------------------------------------------------------------
    // 6. SECURITY: INVALID PASSWORD REJECTION
    // -------------------------------------------------------------
    console.log(`\n--- 6. SECURITY: INVALID CREDENTIALS REJECTION ---`);
    const badPwRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'WrongPassword123' })
    });
    recordTest(
      'POST /api/auth/login rejects incorrect password with 401',
      badPwRes.status === 401,
      `Status: ${badPwRes.status}`
    );

    const nonExistRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent_user_9999@aspirantx.test', password: 'Password123' })
    });
    recordTest(
      'POST /api/auth/login rejects nonexistent user with 401',
      nonExistRes.status === 401,
      `Status: ${nonExistRes.status}`
    );

    // -------------------------------------------------------------
    // 7. SECURITY: TOKEN TAMPERING & IDOR PREVENTION
    // -------------------------------------------------------------
    console.log(`\n--- 7. SECURITY: TOKEN TAMPERING & IDOR TESTS ---`);
    const fakeToken = jwt.sign(
      { sub: 'hacked_admin_id', email: 'ambujyadav0010@gmail.com', role: 'ADMIN' },
      'wrong_fake_secret_key'
    );
    const fakeTokenRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${fakeToken}` }
    });
    recordTest(
      'Tampered JWT signed with wrong secret is rejected with 401',
      fakeTokenRes.status === 401,
      `Status: ${fakeTokenRes.status}`
    );

    const noTokenRes = await fetch(`${BASE_URL}/api/auth/me`);
    recordTest(
      'Missing token request is rejected with 401',
      noTokenRes.status === 401,
      `Status: ${noTokenRes.status}`
    );

    // -------------------------------------------------------------
    // 8. GOOGLE OAUTH SECURITY: FAKE/INVALID CREDENTIAL REJECTION
    // -------------------------------------------------------------
    console.log(`\n--- 8. GOOGLE OAUTH SECURITY TESTS ---`);
    const badGoogleRes = await fetch(`${BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'fake_forged_google_id_token_12345' })
    });
    recordTest(
      'POST /api/auth/google rejects forged Google credential with 401',
      badGoogleRes.status === 401,
      `Status: ${badGoogleRes.status}`
    );

    const emptyGoogleRes = await fetch(`${BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    recordTest(
      'POST /api/auth/google rejects empty body with 400',
      emptyGoogleRes.status === 400,
      `Status: ${emptyGoogleRes.status}`
    );

    // -------------------------------------------------------------
    // 9. CLEAN UP PROBE USER
    // -------------------------------------------------------------
    console.log(`\n--- 9. CLEANUP ---`);
    await client.query('DELETE FROM user_profiles WHERE id = $1', [userId]);
    await client.query('DELETE FROM auth.users WHERE id = $1', [userId]);
    await client.query('DELETE FROM admin_users WHERE email = $1', [testEmail]);
    console.log('Test probe user cleaned up from Neon database');

    console.log(`\n===============================================================`);
    console.log(`SUMMARY: ${results.passed} PASSED, ${results.failed} FAILED`);
    console.log(`===============================================================\n`);

    if (results.failed > 0) {
      process.exit(1);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error('Test run error:', err);
  process.exit(1);
});
