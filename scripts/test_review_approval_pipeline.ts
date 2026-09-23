process.env.VERCEL = '1';
import 'dotenv/config';
import { queryPostgres, pgPool } from '../src/lib/postgres.js';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import http from 'http';

import { JWT_SECRET, DESIGNATED_ADMIN_EMAIL } from '../routes/shared.js';

const ADMIN_EMAIL = DESIGNATED_ADMIN_EMAIL.toLowerCase();
const STUDENT_EMAIL = 'student_test@aspirantx.com';

// Generate test JWT tokens
const adminToken = jwt.sign(
  { email: ADMIN_EMAIL, role: 'ADMIN', sub: '00000000-0000-0000-0000-000000000001' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const studentToken = jwt.sign(
  { email: STUDENT_EMAIL, role: 'USER', sub: '00000000-0000-0000-0000-000000000002' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const TEST_EXAM_ID = 'INTERNAL_REVIEW_TEST';

async function makeRequest(
  serverPort: number,
  path: string,
  method: string = 'GET',
  body?: any,
  token?: string
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: serverPort,
        path,
        method,
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let parsed = {};
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = { raw };
          }
          resolve({ status: res.statusCode || 500, data: parsed });
        });
      }
    );
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runPipelineTests() {
  console.log(`\n================================================================================`);
  console.log(`🛡️ TESTING HUMAN REVIEW -> APPROVAL -> CANONICAL PUBLICATION PIPELINE`);
  console.log(`================================================================================\n`);

  const { app } = await import('../server.js');
  // Start temporary Express server instance on ephemeral port
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as any).port;
  console.log(`Test server active on port ${port}`);

  const testResults: Record<string, 'PASS' | 'FAIL'> = {};

  try {
    // -------------------------------------------------------------------------
    // SETUP: Clean existing test record if any
    // -------------------------------------------------------------------------
    await queryPostgres(`DELETE FROM exam_content WHERE exam_id = $1`, [TEST_EXAM_ID]);

    // -------------------------------------------------------------------------
    // TEST 1: Unauthenticated request to Admin Review Status Endpoint
    // -------------------------------------------------------------------------
    console.log(`\n--- Test 1: Unauthorized Approval (No Token) ---`);
    const unauthRes = await makeRequest(
      port,
      `/api/admin/exam-content/${TEST_EXAM_ID}/status`,
      'PATCH',
      { type: 'syllabus', status: 'approved' }
    );
    console.log(`  Response: status=${unauthRes.status}`);
    if (unauthRes.status === 401) {
      console.log(`  ✅ PASS: Blocked unauthenticated attempt with 401.`);
      testResults['unauthorized_no_token'] = 'PASS';
    } else {
      console.log(`  ❌ FAIL: Expected 401, got ${unauthRes.status}`);
      testResults['unauthorized_no_token'] = 'FAIL';
    }

    // -------------------------------------------------------------------------
    // TEST 2: Non-Admin Student Token Attempt to Approve
    // -------------------------------------------------------------------------
    console.log(`\n--- Test 2: Forbidden Approval (Student Token) ---`);
    const studentRes = await makeRequest(
      port,
      `/api/admin/exam-content/${TEST_EXAM_ID}/status`,
      'PATCH',
      { type: 'syllabus', status: 'approved' },
      studentToken
    );
    console.log(`  Response: status=${studentRes.status}, data=`, studentRes.data);
    if (studentRes.status === 403) {
      console.log(`  ✅ PASS: Blocked non-admin student token with 403 Forbidden.`);
      testResults['unauthorized_student_token'] = 'PASS';
    } else {
      console.log(`  ❌ FAIL: Expected 403, got ${studentRes.status}`);
      testResults['unauthorized_student_token'] = 'FAIL';
    }

    // -------------------------------------------------------------------------
    // TEST 3: Pre-Approval Canonical Visibility (Pending Review Record)
    // -------------------------------------------------------------------------
    console.log(`\n--- Test 3: Pre-Approval Canonical Visibility ---`);
    // Insert synthetic pending_review test record into Neon
    await queryPostgres(`
      INSERT INTO exam_content (
        exam_id, type, source_url, status, verification_status, content_usage,
        sections, questions, provenance, fetched_at
      ) VALUES (
        $1, 'syllabus', 'https://official.gov.in/test-syllabus', 'pending_review', 'verified', 'structured_factual_information',
        $2::jsonb, '[]'::jsonb, '{"publisher": "Official Testing Commission"}'::jsonb, NOW()
      )
    `, [
      TEST_EXAM_ID,
      JSON.stringify([
        {
          title: 'Module 1: Core Fundamentals',
          topics: ['Topic 1.1 Test', 'Topic 1.2 Analysis'],
          exam_stage: 'Stage 1'
        }
      ])
    ]);

    const preApproveCanonical = await makeRequest(
      port,
      `/api/exams/${TEST_EXAM_ID}/canonical-content`
    );
    console.log(`  Canonical response:`, JSON.stringify(preApproveCanonical.data.canonical));
    if (preApproveCanonical.data?.canonical?.syllabus === null) {
      console.log(`  ✅ PASS: Canonical endpoint strictly hides pending_review content (returns null).`);
      testResults['pre_approval_visibility'] = 'PASS';
    } else {
      console.log(`  ❌ FAIL: Unapproved record leaked through canonical endpoint!`);
      testResults['pre_approval_visibility'] = 'FAIL';
    }

    // -------------------------------------------------------------------------
    // TEST 4: Attempt to Approve invalid_placeholder Record
    // -------------------------------------------------------------------------
    console.log(`\n--- Test 4: Provenance Gate on 'invalid_placeholder' ---`);
    await queryPostgres(`
      UPDATE exam_content SET verification_status = 'invalid_placeholder' WHERE exam_id = $1
    `, [TEST_EXAM_ID]);

    const approvePlaceholderRes = await makeRequest(
      port,
      `/api/admin/exam-content/${TEST_EXAM_ID}/status`,
      'PATCH',
      { type: 'syllabus', status: 'approved' },
      adminToken
    );
    console.log(`  Response: status=${approvePlaceholderRes.status}, error=${approvePlaceholderRes.data?.error}`);
    if (approvePlaceholderRes.status === 422) {
      console.log(`  ✅ PASS: Provenance Gate blocked approval of invalid_placeholder with 422.`);
      testResults['gate_invalid_placeholder'] = 'PASS';
    } else {
      console.log(`  ❌ FAIL: Provenance Gate failed to block invalid_placeholder.`);
      testResults['gate_invalid_placeholder'] = 'FAIL';
    }

    // -------------------------------------------------------------------------
    // TEST 5: Attempt to Approve extraction_failed Record
    // -------------------------------------------------------------------------
    console.log(`\n--- Test 5: Provenance Gate on 'extraction_failed' ---`);
    await queryPostgres(`
      UPDATE exam_content SET verification_status = 'extraction_failed' WHERE exam_id = $1
    `, [TEST_EXAM_ID]);

    const approveFailedRes = await makeRequest(
      port,
      `/api/admin/exam-content/${TEST_EXAM_ID}/status`,
      'PATCH',
      { type: 'syllabus', status: 'approved' },
      adminToken
    );
    console.log(`  Response: status=${approveFailedRes.status}, error=${approveFailedRes.data?.error}`);
    if (approveFailedRes.status === 422) {
      console.log(`  ✅ PASS: Provenance Gate blocked approval of extraction_failed with 422.`);
      testResults['gate_extraction_failed'] = 'PASS';
    } else {
      console.log(`  ❌ FAIL: Provenance Gate failed to block extraction_failed.`);
      testResults['gate_extraction_failed'] = 'FAIL';
    }

    // -------------------------------------------------------------------------
    // TEST 6: Attempt to Approve legacy_fallback Record Without Re-Verification
    // -------------------------------------------------------------------------
    console.log(`\n--- Test 6: Provenance Gate on 'legacy_fallback' ---`);
    await queryPostgres(`
      UPDATE exam_content SET verification_status = 'legacy_fallback' WHERE exam_id = $1
    `, [TEST_EXAM_ID]);

    const approveLegacyRes = await makeRequest(
      port,
      `/api/admin/exam-content/${TEST_EXAM_ID}/status`,
      'PATCH',
      { type: 'syllabus', status: 'approved' },
      adminToken
    );
    console.log(`  Response: status=${approveLegacyRes.status}, error=${approveLegacyRes.data?.error}`);
    if (approveLegacyRes.status === 422) {
      console.log(`  ✅ PASS: Provenance Gate blocked approval of legacy_fallback with 422.`);
      testResults['gate_legacy_fallback'] = 'PASS';
    } else {
      console.log(`  ❌ FAIL: Provenance Gate failed to block legacy_fallback.`);
      testResults['gate_legacy_fallback'] = 'FAIL';
    }

    // -------------------------------------------------------------------------
    // TEST 7: Authorized Admin Approval of Verified Record
    // -------------------------------------------------------------------------
    console.log(`\n--- Test 7: Authorized Admin Approval (Verified Record) ---`);
    await queryPostgres(`
      UPDATE exam_content SET verification_status = 'verified' WHERE exam_id = $1
    `, [TEST_EXAM_ID]);

    const adminApproveRes = await makeRequest(
      port,
      `/api/admin/exam-content/${TEST_EXAM_ID}/status`,
      'PATCH',
      { type: 'syllabus', status: 'approved', reviewReason: 'Verified against official commission gazette' },
      adminToken
    );
    console.log(`  Response: status=${adminApproveRes.status}, data=`, adminApproveRes.data);
    if (adminApproveRes.status === 200 && adminApproveRes.data?.status === 'approved') {
      console.log(`  ✅ PASS: Admin successfully approved verified record.`);
      testResults['admin_approval'] = 'PASS';
    } else {
      console.log(`  ❌ FAIL: Admin approval failed.`);
      testResults['admin_approval'] = 'FAIL';
    }

    // -------------------------------------------------------------------------
    // TEST 8: Post-Approval Canonical Visibility
    // -------------------------------------------------------------------------
    console.log(`\n--- Test 8: Post-Approval Canonical Visibility ---`);
    const postApproveCanonical = await makeRequest(
      port,
      `/api/exams/${TEST_EXAM_ID}/canonical-content`
    );
    console.log(`  Canonical syllabus title:`, postApproveCanonical.data?.canonical?.syllabus?.sections?.[0]?.title);
    if (postApproveCanonical.data?.canonical?.syllabus?.status === 'approved') {
      console.log(`  ✅ PASS: Approved record is now publicly served as canonical syllabus.`);
      testResults['post_approval_visibility'] = 'PASS';
    } else {
      console.log(`  ❌ FAIL: Canonical endpoint did not return approved content.`);
      testResults['post_approval_visibility'] = 'FAIL';
    }

    // -------------------------------------------------------------------------
    // TEST 9: Admin Rejection & Immediate Revocation from Canonical API
    // -------------------------------------------------------------------------
    console.log(`\n--- Test 9: Admin Rejection & Revocation ---`);
    const rejectRes = await makeRequest(
      port,
      `/api/admin/exam-content/${TEST_EXAM_ID}/status`,
      'PATCH',
      { type: 'syllabus', status: 'rejected', reviewReason: 'Content discovered to be superseded' },
      adminToken
    );
    console.log(`  Rejection response: status=${rejectRes.status}, data=`, rejectRes.data);

    const postRejectCanonical = await makeRequest(
      port,
      `/api/exams/${TEST_EXAM_ID}/canonical-content`
    );
    console.log(`  Canonical after rejection:`, postRejectCanonical.data?.canonical?.syllabus);
    if (postRejectCanonical.data?.canonical?.syllabus === null) {
      console.log(`  ✅ PASS: Rejected content immediately revoked from canonical API (returns null).`);
      testResults['rejection_revocation'] = 'PASS';
    } else {
      console.log(`  ❌ FAIL: Rejected content is still visible on canonical API!`);
      testResults['rejection_revocation'] = 'FAIL';
    }

    // -------------------------------------------------------------------------
    // TEST 10: Neon Database Authority & Direct Verification
    // -------------------------------------------------------------------------
    console.log(`\n--- Test 10: Neon Database Authority ---`);
    const dbCheck = await queryPostgres(
      `SELECT status, verification_status, review_reason FROM exam_content WHERE exam_id = $1 AND type = 'syllabus'`,
      [TEST_EXAM_ID]
    );
    const dbRow = dbCheck.rows[0];
    console.log(`  Direct Neon Row: status='${dbRow.status}', verification_status='${dbRow.verification_status}', review_reason='${dbRow.review_reason}'`);
    if (dbRow.status === 'rejected' && dbRow.verification_status === 'invalid_placeholder') {
      console.log(`  ✅ PASS: Neon Postgres directly reflects authorized state transitions.`);
      testResults['neon_authority'] = 'PASS';
    } else {
      console.log(`  ❌ FAIL: Neon state does not match expected transition.`);
      testResults['neon_authority'] = 'FAIL';
    }

    // -------------------------------------------------------------------------
    // TEST 11: Audit Trail Verification
    // -------------------------------------------------------------------------
    console.log(`\n--- Test 11: Audit Trail Logging ---`);
    const { blockedAuditLogs } = await import('../routes/shared.js');
    const examAuditLogs = blockedAuditLogs.filter((l: any) => l.action === 'EXAM_CONTENT_STATUS_TRANSITION');
    console.log(`  Audit log count for transitions: ${examAuditLogs.length}`);
    if (examAuditLogs.length >= 2) {
      const latestLog = examAuditLogs[0];
      console.log(`  Latest log actor: ${latestLog.user}, details: ${latestLog.details}`);
      console.log(`  ✅ PASS: Admin audit trail recorded who approved/rejected, timestamp, and status transition.`);
      testResults['audit_trail'] = 'PASS';
    } else {
      console.log(`  ❌ FAIL: Audit log missing transition records.`);
      testResults['audit_trail'] = 'FAIL';
    }

    // -------------------------------------------------------------------------
    // CLEANUP: Purge Isolated Test Record
    // -------------------------------------------------------------------------
    console.log(`\n--- Step 15: Cleaning up Isolated Test Record ---`);
    await queryPostgres(`DELETE FROM exam_content WHERE exam_id = $1`, [TEST_EXAM_ID]);
    const cachePath = 'data/exam_content.json';
    if (fs.existsSync(cachePath)) {
      const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      delete cache[`${TEST_EXAM_ID}::syllabus`];
      fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), 'utf8');
    }
    console.log(`  Cleaned up ${TEST_EXAM_ID} from Neon DB and local cache.`);

    // -------------------------------------------------------------------------
    // TEST SUMMARY
    // -------------------------------------------------------------------------
    console.log(`\n================================================================================`);
    console.log(`TEST SUITE RESULTS`);
    console.log(`================================================================================`);
    for (const [test, result] of Object.entries(testResults)) {
      console.log(`  - ${test}: ${result}`);
    }

    fs.writeFileSync('data/review_approval_test_results.json', JSON.stringify({
      timestamp: new Date().toISOString(),
      testResults,
      allPassed: Object.values(testResults).every(r => r === 'PASS')
    }, null, 2));

  } finally {
    server.close();
    if (pgPool) await pgPool.end();
  }
}

runPipelineTests().catch(console.error);
