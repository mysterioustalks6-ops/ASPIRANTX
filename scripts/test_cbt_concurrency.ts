import 'dotenv/config';
import { queryPostgres, pgPool } from '../src/lib/postgres.js';
import { CbtService } from '../src/lib/cbt/cbtService.js';

async function runConcurrencyTests() {
  console.log(`\n================================================================================`);
  console.log(`⚡ CBT ENGINE — CONCURRENCY & RACE CONDITION SUITE`);
  console.log(`================================================================================\n`);

  const testUserId = `test_user_concurrency_${Date.now()}`;
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
    // 1. Create a test attempt
    console.log(`[Test 1] Initialize Concurrency Test Attempt`);
    const { attempt, questions } = await CbtService.createAttempt({
      userId: testUserId,
      examId: 'UPSC_CSE',
      mode: 'quick',
      count: 5,
      allowPendingReview: true
    });
    assert(Boolean(attempt.id), `Created attempt: ${attempt.id}`);

    // 2. High-concurrency simultaneous answer submissions on distinct questions
    console.log(`\n[Test 2] Simultaneous Answering Across Multiple Questions`);
    const answerPromises = questions.map((q, idx) =>
      CbtService.recordAnswer({
        attemptId: attempt.id,
        userId: testUserId,
        questionId: q.id,
        selectedAnswer: idx % 4,
        confidenceLevel: 'sure',
        timeSpentIncrement: 5
      })
    );
    const answerResults = await Promise.all(answerPromises);
    assert(answerResults.every(r => r.success && r.is_answered), 'All 5 concurrent answers saved without deadlock');

    // 3. Simultaneous conflicting answer updates on the same question
    console.log(`\n[Test 3] Rapid Conflicting Mutations on Same Question`);
    const targetQ = questions[0];
    const conflictingPromises = [0, 1, 2, 3].map(opt =>
      CbtService.recordAnswer({
        attemptId: attempt.id,
        userId: testUserId,
        questionId: targetQ.id,
        selectedAnswer: opt,
        confidenceLevel: 'guess',
        timeSpentIncrement: 2
      })
    );
    const conflictingResults = await Promise.all(conflictingPromises);
    assert(conflictingResults.every(r => r.success), 'All conflicting concurrent mutations serialized cleanly');

    // 4. Simultaneous double submit race condition
    console.log(`\n[Test 4] Simultaneous Double Submit Race Condition`);
    const [sub1, sub2] = await Promise.all([
      CbtService.submitAttempt(attempt.id, testUserId),
      CbtService.submitAttempt(attempt.id, testUserId)
    ]);
    assert(sub1.id === sub2.id, `Both submit calls returned identical result ID: ${sub1.id}`);
    assert(Number(sub1.score) === Number(sub2.score), 'Score evaluation is completely deterministic and idempotent');

    // Verify only ONE row exists in cbt_attempt_results
    const rowCountRes = await queryPostgres(
      `SELECT count(*) FROM cbt_attempt_results WHERE attempt_id = $1;`,
      [attempt.id]
    );
    assert(Number(rowCountRes.rows[0].count) === 1, 'Exactly 1 row created in cbt_attempt_results');

    // 5. Post-Submission Mutation Blocked
    console.log(`\n[Test 5] Mutation Blocked on Submitted Attempt`);
    let postSubmitBlocked = false;
    try {
      await CbtService.recordAnswer({
        attemptId: attempt.id,
        userId: testUserId,
        questionId: targetQ.id,
        selectedAnswer: 0
      });
    } catch (err: any) {
      if (err.message.includes('SUBMITTED')) {
        postSubmitBlocked = true;
      }
    }
    assert(postSubmitBlocked, 'recordAnswer rejected on SUBMITTED attempt');

    // 6. Expired Attempt Enforcement
    console.log(`\n[Test 6] Expired Attempt Auto-Transition & Lockout`);
    const { attempt: expiredAttempt } = await CbtService.createAttempt({
      userId: testUserId,
      examId: 'UPSC_CSE',
      mode: 'quick',
      count: 3,
      allowPendingReview: true
    });

    // Artificially backdate expires_at to 10 minutes ago
    await queryPostgres(
      `UPDATE cbt_attempts SET expires_at = NOW() - INTERVAL '10 minutes' WHERE id = $1;`,
      [expiredAttempt.id]
    );

    let expiryHandled = false;
    try {
      await CbtService.recordAnswer({
        attemptId: expiredAttempt.id,
        userId: testUserId,
        questionId: questions[0].id,
        selectedAnswer: 1
      });
    } catch (err: any) {
      if (err.message.includes('expired')) {
        expiryHandled = true;
      }
    }
    assert(expiryHandled, 'Mutation on expired attempt triggered auto-submit lockout');

    // Verify attempt transitioned to SUBMITTED
    const checkExpired = await queryPostgres(
      `SELECT status FROM cbt_attempts WHERE id = $1;`,
      [expiredAttempt.id]
    );
    assert(checkExpired.rows[0].status === 'SUBMITTED', 'Expired attempt auto-submitted');

    console.log(`\n================================================================================`);
    console.log(`⚡ ALL ${passed} / ${total} CONCURRENCY & RACE CONDITION TESTS PASSED!`);
    console.log(`================================================================================\n`);
  } finally {
    // Cleanup
    await queryPostgres(`DELETE FROM cbt_attempt_results WHERE user_id = $1;`, [testUserId]);
    await queryPostgres(`DELETE FROM cbt_attempt_questions WHERE attempt_id IN (SELECT id FROM cbt_attempts WHERE user_id = $1);`, [testUserId]);
    await queryPostgres(`DELETE FROM cbt_attempts WHERE user_id = $1;`, [testUserId]);
    await pgPool.end();
  }
}

runConcurrencyTests().catch((err) => {
  console.error('Concurrency Test Suite Failed:', err);
  process.exit(1);
});
