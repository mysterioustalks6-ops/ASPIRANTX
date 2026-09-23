import 'dotenv/config';
import { queryPostgres, pgPool } from '../src/lib/postgres.js';
import { CbtService } from '../src/lib/cbt/cbtService.js';

async function runSecurityTests() {
  console.log(`\n================================================================================`);
  console.log(`🛡️ CBT ENGINE — ZERO-LEAKAGE SECURITY & IDOR AUDIT`);
  console.log(`================================================================================\n`);

  const studentA = `student_alice_${Date.now()}`;
  const studentB = `student_bob_${Date.now()}`;
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (!condition) {
      console.error(`❌ FAIL: ${msg}`);
      throw new Error(`Assertion failed: ${msg}`);
    }
    console.log(`✅ PASS: ${msg}`);
    passed++;
  }

  try {
    // 1. Create Attempt for Alice
    console.log(`[Test 1] Create Attempt for Student A (Alice)`);
    const { attempt, questions } = await CbtService.createAttempt({
      userId: studentA,
      examId: 'UPSC_CSE',
      mode: 'quick',
      count: 4,
      allowPendingReview: true
    });
    assert(Boolean(attempt.id), `Alice's attempt created: ${attempt.id}`);

    // 2. Strict Live Projection Security (No Cheat Leakage)
    console.log(`\n[Test 2] Cheat-Proof Live Projection Audit`);
    const publicAttempt = await CbtService.getAttemptPublic(attempt.id, studentA);
    for (const q of publicAttempt.questions) {
      assert(q.correct_answer === undefined || q.correct_answer === null, `Question ${q.id}: correct_answer omitted from projection`);
      assert(q.explanation === undefined || q.explanation === null, `Question ${q.id}: explanation omitted from projection`);
      assert(q.option_explanations === undefined || q.option_explanations === null, `Question ${q.id}: option_explanations omitted from projection`);
      assert(Array.isArray(q.options), `Question ${q.id}: options array provided without answers`);
    }

    // 3. Review Access Denied During Active Examination
    console.log(`\n[Test 3] Review Access Lock During Live Session`);
    let reviewBlocked = false;
    try {
      await CbtService.getAttemptReview(attempt.id, studentA);
    } catch (err: any) {
      if (err.message.includes('only available after')) {
        reviewBlocked = true;
      }
    }
    assert(reviewBlocked, 'Review API returns 403 Forbidden while attempt is active');

    // 4. IDOR Protection: Student B cannot view Student A's active attempt
    console.log(`\n[Test 4] IDOR: Student B Viewing Student A's Attempt`);
    let viewBlocked = false;
    try {
      await CbtService.getAttemptPublic(attempt.id, studentB);
    } catch (err: any) {
      if (err.message.includes('Unauthorized')) {
        viewBlocked = true;
      }
    }
    assert(viewBlocked, 'Student B denied access to Student A attempt state');

    // 5. IDOR Protection: Student B cannot answer Student A's exam
    console.log(`\n[Test 5] IDOR: Student B Submitting Answers on Student A's Attempt`);
    let answerBlocked = false;
    try {
      await CbtService.recordAnswer({
        attemptId: attempt.id,
        userId: studentB,
        questionId: questions[0].id,
        selectedAnswer: 2
      });
    } catch (err: any) {
      if (err.message.includes('Unauthorized')) {
        answerBlocked = true;
      }
    }
    assert(answerBlocked, 'Student B blocked from recording answers on Student A attempt');

    // 6. IDOR Protection: Student B cannot pause/resume Student A's exam
    console.log(`\n[Test 6] IDOR: Student B Pausing Student A's Attempt`);
    let pauseBlocked = false;
    try {
      await CbtService.pauseAttempt(attempt.id, studentB);
    } catch (err: any) {
      if (err.message.includes('Unauthorized')) {
        pauseBlocked = true;
      }
    }
    assert(pauseBlocked, 'Student B blocked from pausing Student A attempt');

    // 7. IDOR Protection: Student B cannot submit Student A's exam
    console.log(`\n[Test 7] IDOR: Student B Submitting Student A's Attempt`);
    let submitBlocked = false;
    try {
      await CbtService.submitAttempt(attempt.id, studentB);
    } catch (err: any) {
      if (err.message.includes('Unauthorized')) {
        submitBlocked = true;
      }
    }
    assert(submitBlocked, 'Student B blocked from submitting Student A attempt');

    // 8. IDOR Protection: Student B cannot view Student A's review after submission
    console.log(`\n[Test 8] IDOR: Student B Viewing Student A's Submitted Review`);
    // Submit Alice's exam
    await CbtService.submitAttempt(attempt.id, studentA);
    let reviewIdorBlocked = false;
    try {
      await CbtService.getAttemptReview(attempt.id, studentB);
    } catch (err: any) {
      if (err.message.includes('Unauthorized')) {
        reviewIdorBlocked = true;
      }
    }
    assert(reviewIdorBlocked, 'Student B blocked from viewing Alice post-exam review');

    console.log(`\n================================================================================`);
    console.log(`🛡️ ALL ${passed} / ${total} SECURITY & IDOR AUDIT TESTS PASSED!`);
    console.log(`================================================================================\n`);
  } finally {
    // Cleanup
    await queryPostgres(`DELETE FROM cbt_attempt_results WHERE user_id IN ($1, $2);`, [studentA, studentB]);
    await queryPostgres(`DELETE FROM cbt_attempt_questions WHERE attempt_id IN (SELECT id FROM cbt_attempts WHERE user_id IN ($1, $2));`, [studentA, studentB]);
    await queryPostgres(`DELETE FROM cbt_attempts WHERE user_id IN ($1, $2);`, [studentA, studentB]);
    await pgPool.end();
  }
}

runSecurityTests().catch((err) => {
  console.error('Security Test Suite Failed:', err);
  process.exit(1);
});
