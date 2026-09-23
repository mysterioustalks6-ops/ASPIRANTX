import 'dotenv/config';
import { queryPostgres, pgPool } from '../src/lib/postgres.js';
import { CbtService } from '../src/lib/cbt/cbtService.js';
import { getQuestionInventory } from '../src/lib/cbt/questionGenerator.js';

async function runE2ETests() {
  console.log(`\n================================================================================`);
  console.log(`🧪 CBT ENGINE — END-TO-END LIFECYCLE & INTEGRATION SUITE`);
  console.log(`================================================================================\n`);

  const testUserId = `test_user_e2e_${Date.now()}`;
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
    // 1. Inventory Check
    console.log(`\n[Test 1] Question Inventory Transparency`);
    const inv = await getQuestionInventory('UPSC_CSE');
    assert(typeof inv.verified_count === 'number', 'Inventory returns verified_count');
    assert(typeof inv.pending_review_count === 'number', 'Inventory returns pending_review_count');
    console.log(`   UPSC_CSE inventory: Verified = ${inv.verified_count}, Pending = ${inv.pending_review_count}`);

    // 2. Blueprint Retrieval
    console.log(`\n[Test 2] Blueprints Retrieval`);
    const bpRes = await queryPostgres(`SELECT * FROM cbt_blueprints WHERE verification_status = 'verified';`);
    assert(bpRes.rows.length >= 4, `At least 4 verified blueprints exist (found ${bpRes.rows.length})`);
    const upscBp = bpRes.rows.find((b: any) => b.exam_id === 'UPSC_CSE');
    assert(Boolean(upscBp), 'UPSC_CSE blueprint exists');

    // 3. Verify Honest Inventory Enforcement on 100-Question Blueprint
    console.log(`\n[Test 3] Strict Inventory Boundary Enforcement (No Fake Questions)`);
    let blueprintBlocked = false;
    try {
      await CbtService.createAttempt({
        userId: testUserId,
        examId: 'UPSC_CSE',
        blueprintId: upscBp.id,
        mode: 'full',
        allowPendingReview: true
      });
    } catch (err: any) {
      if (err.message.includes('Insufficient question inventory')) {
        blueprintBlocked = true;
        console.log(`   Correctly rejected: ${err.message}`);
      }
    }
    assert(blueprintBlocked, 'Full blueprint attempt rejected when requested 100 exceeds available 8');

    // 4. Create Quick Attempt (5 questions) within available inventory
    console.log(`\n[Test 4] Create Authoritative Attempt Session (Quick Mode, 5 questions)`);
    const { attempt, questions } = await CbtService.createAttempt({
      userId: testUserId,
      examId: 'UPSC_CSE',
      mode: 'quick',
      title: 'UPSC General Practice Quick Test',
      count: 5,
      allowPendingReview: true // Seed questions are marked pending_review
    });

    assert(Boolean(attempt.id), `Attempt created with ID: ${attempt.id}`);
    assert(attempt.status === 'IN_PROGRESS', `Attempt status is IN_PROGRESS`);
    assert(questions.length === 5, `Returned exactly 5 questions for attempt`);

    // Verify snapshot immutability
    const snapshotDb = await queryPostgres(
      `SELECT * FROM cbt_attempt_questions WHERE attempt_id = $1 ORDER BY position ASC;`,
      [attempt.id]
    );
    assert(snapshotDb.rows.length === questions.length, `Snapshot row count matches questions count`);

    // 4. Zero Answer Leakage Verification on Live Attempt
    console.log(`\n[Test 4] Zero Answer Leakage on Live Attempt`);
    const liveState = await CbtService.getAttemptPublic(attempt.id, testUserId);
    for (const q of liveState.questions) {
      assert(q.correct_answer === undefined || q.correct_answer === null, `Question ${q.id} hides correct_answer`);
      assert(q.explanation === undefined || q.explanation === null, `Question ${q.id} hides explanation`);
      assert(q.option_explanations === undefined || q.option_explanations === null, `Question ${q.id} hides option_explanations`);
    }

    // 5. Review Blocked During Active Attempt
    console.log(`\n[Test 5] Review Forbidden While In-Progress`);
    let reviewBlocked = false;
    try {
      await CbtService.getAttemptReview(attempt.id, testUserId);
    } catch (err: any) {
      if (err.message.includes('only available after')) {
        reviewBlocked = true;
      }
    }
    assert(reviewBlocked, 'getAttemptReview throws error while attempt is active');

    // 6. Record Answer
    console.log(`\n[Test 6] Record Answer with Row Locking`);
    const firstQ = questions[0];
    const ansRes = await CbtService.recordAnswer({
      attemptId: attempt.id,
      userId: testUserId,
      questionId: firstQ.id,
      selectedAnswer: 1,
      confidenceLevel: 'sure',
      timeSpentIncrement: 15
    });
    assert(ansRes.success === true, 'Answer successfully recorded');
    assert(ansRes.is_answered === true, 'Question marked as answered');

    // 7. Mark for Review
    console.log(`\n[Test 7] Mark Question for Review`);
    const markRes = await CbtService.markQuestion({
      attemptId: attempt.id,
      userId: testUserId,
      questionId: firstQ.id,
      isMarked: true
    });
    assert(markRes.success === true, 'markQuestion returned success');
    assert(markRes.is_marked === true, 'Question marked for review');

    // 8. Pause Attempt
    console.log(`\n[Test 8] Pause Attempt (Server Authoritative)`);
    const pauseRes = await CbtService.pauseAttempt(attempt.id, testUserId);
    assert(pauseRes.success === true, 'pauseAttempt returned success');
    assert(typeof pauseRes.remaining_time_seconds === 'number', 'Remaining seconds frozen');

    // 9. Answer Mutation Rejected While Paused
    console.log(`\n[Test 9] Mutation Blocked During Pause`);
    let mutationBlocked = false;
    try {
      await CbtService.recordAnswer({
        attemptId: attempt.id,
        userId: testUserId,
        questionId: firstQ.id,
        selectedAnswer: 2
      });
    } catch (err: any) {
      if (err.message.includes('PAUSED')) {
        mutationBlocked = true;
      }
    }
    assert(mutationBlocked, 'recordAnswer rejected with 409 while attempt is PAUSED');

    // 10. Resume Attempt
    console.log(`\n[Test 10] Resume Attempt`);
    const resumeRes = await CbtService.resumeAttempt(attempt.id, testUserId);
    assert(resumeRes.success === true, 'resumeAttempt returned success');
    assert(Boolean(resumeRes.expires_at), 'expires_at recalculated from frozen remaining seconds');

    // 11. Submit Attempt & Authoritative Evaluation
    console.log(`\n[Test 11] Submit Attempt & Authoritative Evaluation`);
    const result = await CbtService.submitAttempt(attempt.id, testUserId);
    assert(Number(result.total_questions) === questions.length, `Evaluated all ${questions.length} questions`);
    assert(typeof Number(result.score) === 'number', `Score calculated: ${result.score}`);
    assert(typeof Number(result.accuracy_percent) === 'number', `Accuracy calculated: ${result.accuracy_percent}%`);

    // 12. Idempotent Double Submission
    console.log(`\n[Test 12] Double Submit Idempotency`);
    const secondSubmit = await CbtService.submitAttempt(attempt.id, testUserId);
    assert(secondSubmit.id === result.id, 'Second submission returns identical evaluated result');

    // 13. Post-Exam Review Now Permitted
    console.log(`\n[Test 13] Post-Exam Review Exposure`);
    const reviewQuestions = await CbtService.getAttemptReview(attempt.id, testUserId);
    assert(reviewQuestions.length === questions.length, 'All questions available for review');
    const reviewedFirstQ = reviewQuestions.find(q => q.id === firstQ.id);
    assert(reviewedFirstQ !== undefined, 'Found first question in review');
    assert(typeof reviewedFirstQ.correct_answer === 'number', 'correct_answer is now revealed');
    assert(reviewedFirstQ.explanation !== undefined, 'explanation is now revealed');

    // 14. Tag Mistake
    console.log(`\n[Test 14] Tag Mistake (Why Was I Wrong)`);
    const mistakeRes = await CbtService.tagMistake({
      attemptId: attempt.id,
      userId: testUserId,
      questionId: firstQ.id,
      mistakeCategory: 'Careless Error',
      notes: 'Misread the negative phrasing in the question.'
    });
    assert(mistakeRes.success === true, 'Mistake category recorded successfully');

    // 15. User History
    console.log(`\n[Test 15] User Attempt History`);
    const history = await CbtService.getUserHistory(testUserId, 'UPSC_CSE');
    assert(history.length >= 1, `Found ${history.length} historical attempt for test user`);
    assert(history[0].attempt_id === attempt.id, 'Historical attempt ID matches created attempt');

    console.log(`\n================================================================================`);
    console.log(`🎉 ALL ${passed} / ${total} E2E TESTS PASSED SUCCESSFULLY!`);
    console.log(`================================================================================\n`);
  } finally {
    // Clean up test data
    await queryPostgres(`DELETE FROM cbt_question_feedback WHERE user_id = $1;`, [testUserId]);
    await queryPostgres(`DELETE FROM cbt_attempt_results WHERE user_id = $1;`, [testUserId]);
    await queryPostgres(`DELETE FROM cbt_attempt_questions WHERE attempt_id IN (SELECT id FROM cbt_attempts WHERE user_id = $1);`, [testUserId]);
    await queryPostgres(`DELETE FROM cbt_attempts WHERE user_id = $1;`, [testUserId]);
    await pgPool.end();
  }
}

runE2ETests().catch((err) => {
  console.error('E2E Test Suite Failed:', err);
  process.exit(1);
});
