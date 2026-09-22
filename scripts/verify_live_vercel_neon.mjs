import 'dotenv/config';
import pg from 'pg';

const VERCEL_URL = 'https://aspirantx.vercel.app';

console.log('=== STEP 1: Check Vercel Health Endpoint ===');
try {
  const healthRes = await fetch(`${VERCEL_URL}/api/health?_t=${Date.now()}`);
  const healthJson = await healthRes.json();
  console.log('Health HTTP Status:', healthRes.status);
  console.log('Health Response:', JSON.stringify(healthJson, null, 2));

  if (!healthJson.postgresConfigured || !healthJson.neonPoolInitialized) {
    console.log('[WARN] postgresConfigured or neonPoolInitialized is still false on Vercel.');
  } else {
    console.log('[SUCCESS] Neon PostgreSQL is reported configured & initialized on Vercel!');
  }
} catch (err) {
  console.error('Failed to fetch health:', err);
}

console.log('\n=== STEP 2: Live UTR Submit to Public Vercel API ===');
const uniqueUtr = `VCL_LIVE_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
const payload = {
  utr: uniqueUtr,
  userEmail: 'live_verifier@aspirantx.com',
  userName: 'Live Cloud Tester',
  plan: 'monthly',
  amount: 499
};

let submitRecordId = null;
try {
  const submitRes = await fetch(`${VERCEL_URL}/api/payments/utr-submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  console.log('Submit HTTP Status:', submitRes.status);
  const submitJson = await submitRes.json();
  console.log('Submit Response:', JSON.stringify(submitJson, null, 2));

  if (submitJson.success && submitJson.record?.id) {
    submitRecordId = submitJson.record.id;
    console.log('[SUCCESS] Received record ID from public API:', submitRecordId);
  } else {
    console.log('[FAIL] API did not return a successful record ID:', submitJson);
  }
} catch (err) {
  console.error('Failed to submit UTR:', err);
}

console.log('\n=== STEP 3: Direct Neon SQL Verification ===');
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

try {
  const neonRes = await pool.query(
    'SELECT id, utr, plan, amount, user_email, user_name, status, created_at FROM public.utr_requests WHERE utr = $1',
    [uniqueUtr]
  );
  console.log('Neon Direct Rows for UTR:', uniqueUtr);
  console.log(JSON.stringify(neonRes.rows, null, 2));

  if (neonRes.rows.length > 0) {
    console.log('\n======================================================');
    console.log('LEVEL 1 PROOF ESTABLISHED:');
    console.log('Public API returned ID:', submitRecordId);
    console.log('Neon PostgreSQL row ID:', neonRes.rows[0].id);
    console.log('MATCH:', submitRecordId === neonRes.rows[0].id ? 'EXACT MATCH' : 'MISMATCH');
    console.log('======================================================\n');
  } else {
    console.log('\n[FAIL] No row found in Neon for UTR:', uniqueUtr);
  }
} catch (err) {
  console.error('Error querying Neon directly:', err);
} finally {
  await pool.end();
}
