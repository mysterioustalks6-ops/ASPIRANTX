import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:3000';
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runAuthRbacTests() {
  console.log('=== STARTING ADVERSARIAL AUTH & RBAC VERIFICATION ===\n');
  const results = {};

  // 1. Invalid Password Attempt
  console.log('[1] Testing Invalid Credentials Submission...');
  const { data: failData, error: failError } = await supabase.auth.signInWithPassword({
    email: 'ambujyadav0010@gmail.com',
    password: 'WrongPassword_12345!'
  });

  const exchangeWithBadToken = await fetch(`${BASE_URL}/api/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ supabaseToken: 'invalid.token.here' })
  });

  results['invalid_credentials'] = {
    supabaseRejected: !!failError,
    errorMessage: failError?.message,
    sessionCreated: !!failData?.session,
    backendRejectedBadToken: exchangeWithBadToken.status === 401,
    backendStatus: exchangeWithBadToken.status
  };
  console.log('Invalid credentials result:', results['invalid_credentials']);

  // 2. Valid Credentials Authentication
  console.log('\n[2] Testing Legitimate Credentials Authentication...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'ambujyadav0010@gmail.com',
    password: '637881@Am'
  });

  if (authError || !authData?.session) {
    console.error('CRITICAL: Legitimate login failed:', authError);
    results['valid_credentials'] = { pass: false, error: authError?.message };
    return results;
  }

  const sbAccessToken = authData.session.access_token;
  const userUuid = authData.user.id;

  // 3. Token Exchange with Backend
  console.log('\n[3] Testing /api/auth/token Exchange...');
  const exchangeRes = await fetch(`${BASE_URL}/api/auth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sbAccessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email: 'ambujyadav0010@gmail.com' })
  });
  const exchangeData = await exchangeRes.json();
  const internalToken = exchangeData.token;

  let decodedClaims = null;
  if (internalToken) {
    decodedClaims = jwt.decode(internalToken);
  }

  results['valid_credentials'] = {
    loginSuccess: true,
    userUuid: userUuid,
    email: authData.user.email,
    tokenReceived: !!internalToken,
    internalRole: decodedClaims?.role,
    internalSubject: decodedClaims?.sub,
    matchesSupabaseUser: decodedClaims?.sub === userUuid,
    expiresAt: decodedClaims?.exp
  };
  console.log('Valid credentials result:', results['valid_credentials']);

  // 4. Client Tampering / Privilege Escalation Attempt
  console.log('\n[4] Testing Client Tampering (Forging role in signature)...');
  const forgedToken = jwt.sign(
    { sub: userUuid, email: 'ambujyadav0010@gmail.com', role: 'ADMIN' },
    'attacker_fake_secret_123',
    { expiresIn: '1h' }
  );

  const testForgedReq = await fetch(`${BASE_URL}/api/admin/watchdog`, {
    headers: { 'Authorization': `Bearer ${forgedToken}` }
  });

  const testParamTamper = await fetch(`${BASE_URL}/api/admin/watchdog?user_role=ADMIN`, {
    headers: { 'Authorization': `Bearer ${forgedToken}` }
  });

  results['tampering_privilege_escalation'] = {
    forgedTokenRejected: testForgedReq.status === 401 || testForgedReq.status === 403,
    forgedTokenStatus: testForgedReq.status,
    queryParamTamperRejected: testParamTamper.status === 401 || testParamTamper.status === 403,
    queryParamTamperStatus: testParamTamper.status
  };
  console.log('Tampering result:', results['tampering_privilege_escalation']);

  // 5. RBAC: Anonymous vs Student vs Admin
  console.log('\n[5] Testing RBAC on Admin Protected Endpoints (/api/admin/watchdog)...');

  // 5a. Anonymous access to admin
  const anonAdmin = await fetch(`${BASE_URL}/api/admin/watchdog`);
  
  // 5b. Student token (validly signed by backend secret but role: STUDENT)
  const studentToken = jwt.sign(
    { sub: '00000000-0000-0000-0000-000000000001', email: 'student@example.com', role: 'STUDENT' },
    process.env.JWT_SECRET || 'fallback-secret-for-protrack-jwt-production-environment-only',
    { expiresIn: '1h' }
  );

  const studentAdminReq = await fetch(`${BASE_URL}/api/admin/watchdog`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });

  // 5c. Valid Admin access with real exchanged token
  const adminReq = await fetch(`${BASE_URL}/api/admin/watchdog`, {
    headers: { 'Authorization': `Bearer ${internalToken}` }
  });
  const adminData = await adminReq.json();

  results['rbac_enforcement'] = {
    anonymousRejected: anonAdmin.status === 401,
    anonymousStatus: anonAdmin.status,
    studentForbidden: studentAdminReq.status === 403,
    studentStatus: studentAdminReq.status,
    adminAuthorized: adminReq.status === 200,
    adminStatus: adminReq.status,
    adminDataReturned: adminData?.status === 'HEALTHY' || adminData?.success === true
  };
  console.log('RBAC enforcement result:', results['rbac_enforcement']);

  console.log('\n=== AUTH & RBAC SUMMARY ===');
  console.log(JSON.stringify(results, null, 2));
}

runAuthRbacTests();
