import 'dotenv/config';
import { cbtService } from '../src/lib/cbt/cbtService';
import { getUniversalExamConfig, UNIVERSAL_EXAM_CATALOG } from '../src/lib/cbt/universalExamConfig';

async function runUniversalCbtAudit() {
  console.log('===============================================================');
  console.log('🚀 AUDITING & TESTING UNIVERSAL INDIAN EXAM CBT ENGINE');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      failed++;
    }
  }

  // TEST 1: CATALOG AUDIT
  console.log('📌 Test 1: Validating Exam Catalog & Configuration Integrity');
  const catalogKeys = Object.keys(UNIVERSAL_EXAM_CATALOG);
  assert(catalogKeys.length >= 15, `Found ${catalogKeys.length} official universal exam blueprints`);

  // Verify representative exams exist with correct models
  const jeeConfig = getUniversalExamConfig('jee-main');
  const jeePaper = jeeConfig.stages[0].papers[0];
  assert(jeePaper.timingModel === 'GLOBAL_TIMER', 'JEE Main uses GLOBAL_TIMER');
  assert(jeePaper.sections.length === 3, 'JEE Main has 3 default sections (Phy, Chem, Math)');
  assert(jeePaper.sections[0].markingScheme.positive === 4 && jeePaper.sections[0].markingScheme.negative === 1, 'JEE Main has +4 / -1 marking');
  assert(jeePaper.sections[0].allowedQuestionTypes.includes('NUMERICAL'), 'JEE Main supports NUMERICAL question type');

  const ibpsConfig = getUniversalExamConfig('ibps-po');
  const ibpsPaper = ibpsConfig.stages[0].papers[0];
  assert(ibpsPaper.timingModel === 'SECTION_TIMER', 'IBPS PO uses SECTION_TIMER');
  assert(ibpsPaper.sections.length === 3, 'IBPS PO has 3 sections (English, Quant, Reasoning)');
  assert(ibpsPaper.sections[0].navigationRule === 'SECTION_LOCKED' || ibpsPaper.sections[0].navigationRule === 'SEPARATELY_TIMED', 'IBPS PO has SECTION_LOCKED or SEPARATELY_TIMED navigation rule');
  assert(ibpsPaper.sections[0].durationMinutes === 20, 'IBPS PO has 20 min section time limit');
  assert(ibpsPaper.sections[0].markingScheme.positive === 1 && ibpsPaper.sections[0].markingScheme.negative === 0.25, 'IBPS PO has +1 / -0.25 marking');

  const ctetConfig = getUniversalExamConfig('ctet');
  const ctetPaper = ctetConfig.stages[0].papers[0];
  assert(ctetPaper.timingModel === 'GLOBAL_TIMER', 'CTET uses GLOBAL_TIMER');
  assert(ctetPaper.sections[0].markingScheme.negative === 0, 'CTET has strictly ZERO (0) negative marking');
  assert(ctetPaper.sections[0].markingScheme.positive === 1, 'CTET has +1 mark per question');

  const upscConfig = getUniversalExamConfig('upsc-cse');
  const upscPaper = upscConfig.stages[0].papers[0];
  assert(upscPaper.sections[0].markingScheme.positive === 2 && Math.abs(upscPaper.sections[0].markingScheme.negative - 0.66) < 0.01, 'UPSC CSE has +2 / -0.66 marking');

  // TEST 2: ATTEMPT CREATION & ZERO-LEAK TEST (JEE MAIN)
  console.log('\n📌 Test 2: Attempt Creation & Zero-Leak Security Audit (JEE Main)');
  try {
    const testUserId = 'test-cbt-audit-user-001';
    const { attempt, questions } = await cbtService.createAttempt({
      examId: 'jee-main',
      userId: testUserId,
      mode: 'full',
      count: 6, // 2 per section
    });

    assert(Boolean(attempt.id), `Attempt created with ID: ${attempt.id}`);
    assert(attempt.timing_model === 'GLOBAL_TIMER', `Attempt timing model correctly set to GLOBAL_TIMER`);
    assert(questions.length >= 6, `Attempt generated with ${questions.length} questions`);

    // Verify section distribution
    const sec1Count = questions.filter((q: any) => q.section_id === 'physics').length;
    const sec2Count = questions.filter((q: any) => q.section_id === 'chemistry').length;
    const sec3Count = questions.filter((q: any) => q.section_id === 'mathematics').length;
    assert(sec1Count > 0 && sec2Count > 0 && sec3Count > 0, `Questions distributed across sections (Phy: ${sec1Count}, Chem: ${sec2Count}, Math: ${sec3Count})`);

    // Zero answer-key leak test on public endpoint
    const publicAttempt = await cbtService.getAttemptPublic(attempt.id, testUserId);
    assert(Boolean(publicAttempt), 'Public attempt retrieved successfully');
    let leakDetected = false;
    for (const q of publicAttempt.questions) {
      if ((q as any).correct_answer !== undefined || (q as any).explanation !== undefined || (q as any).solution !== undefined) {
        leakDetected = true;
        break;
      }
    }
    assert(!leakDetected, 'Zero Answer-Key Leak Audit Passed: Public attempt does not contain correct_answer, explanation, or solution');

    // TEST 3: ANSWERING, REVIEW & SCORING (JEE MAIN)
    console.log('\n📌 Test 3: Numerical & MCQ Answers, Review States, and Server-Side Scoring');
    const q1 = questions[0];
    const q2 = questions[1];

    // Answer Q1 with numerical value
    const ans1 = await cbtService.recordAnswer({
      attemptId: attempt.id,
      questionId: q1.id,
      userId: testUserId,
      selectedOption: '42.5',
      timeSpentSeconds: 45,
      isReview: false,
    });
    assert(ans1.status === 'answered' && ans1.selected_option === '42.5', 'Numerical answer recorded correctly');

    // Answer Q2 with option 2 and mark for review
    const ans2 = await cbtService.recordAnswer({
      attemptId: attempt.id,
      questionId: q2.id,
      userId: testUserId,
      selectedOption: 2,
      timeSpentSeconds: 60,
      isReview: true,
    });
    assert(ans2.status === 'answered_review', 'Answered + Marked for review state updated correctly');

    // Submit Attempt
    const result = await cbtService.submitAttempt({
      attemptId: attempt.id,
      userId: testUserId,
      timeSpentSeconds: 120,
    });
    assert(Boolean(result.score_summary), 'Server-side scoring completed and score summary generated');
    assert(result.score_summary.total_questions === questions.length, `Total questions matches ${questions.length}`);
    assert(result.score_summary.attempted === 2, 'Attempted count matches 2');
    assert(result.score_summary.unattempted === questions.length - 2, `Unattempted count matches ${questions.length - 2}`);
    console.log(`  📊 Score: ${result.score_summary.total_score} / ${result.score_summary.max_possible_score} | Accuracy: ${result.score_summary.accuracy_pct}%`);
  } catch (err: any) {
    assert(false, `JEE Main Attempt Test failed with error: ${err.message}`);
  }

  // TEST 4: SECTION-TIMED EXAM AUDIT (IBPS PO)
  console.log('\n📌 Test 4: Section-Timed & Section-Locked Audit (IBPS PO)');
  try {
    const testUserId2 = 'test-cbt-audit-user-002';
    const { attempt, questions } = await cbtService.createAttempt({
      examId: 'ibps-po',
      userId: testUserId2,
      mode: 'full',
      count: 6,
    });

    assert(attempt.timing_model === 'SECTION_TIMER', 'IBPS PO attempt correctly initialized with SECTION_TIMER');
    assert(Boolean(attempt.section_states), 'Section states object initialized for section-timed exam');
    const secCount = Array.isArray(attempt.section_states) ? attempt.section_states.length : Object.keys(attempt.section_states || {}).length;
    assert(secCount === 3, '3 section states initialized');
    assert(attempt.current_section_id === 'english_lang', 'Current section initialized to first section (english_lang)');

    // Test Section Locking: Try switching directly from Section 1 to Section 3 without completing Section 2
    let jumpPrevented = false;
    try {
      await cbtService.switchSection({
        attemptId: attempt.id,
        userId: testUserId2,
        targetSectionId: 'reasoning_ability', // Trying to skip quant_apt
        timeSpentInCurrentSection: 30,
      });
    } catch (err: any) {
      if (err.message.includes('Strict sequence required') || err.message.includes('locked')) {
        jumpPrevented = true;
      }
    }
    assert(jumpPrevented, 'Section Navigation Rule Enforced: Direct skipping of locked sections prevented');

    // Valid forward switch to Section 2 (quant_apt)
    const switchRes = await cbtService.switchSection({
      attemptId: attempt.id,
      userId: testUserId2,
      targetSectionId: 'quant_apt',
      timeSpentInCurrentSection: 1200,
    });
    assert(switchRes.currentSectionId === 'quant_apt', 'Successfully transitioned to next section (quant_apt)');

    // Test No Backwards Hopping: Try switching back to Section 1
    let backPrevented = false;
    try {
      await cbtService.switchSection({
        attemptId: attempt.id,
        userId: testUserId2,
        targetSectionId: 'english_lang',
        timeSpentInCurrentSection: 10,
      });
    } catch (err: any) {
      if (err.message.includes('completed') || err.message.includes('locked')) {
        backPrevented = true;
      }
    }
    assert(backPrevented, 'Section Navigation Rule Enforced: Returning to completed/locked section prevented');
  } catch (err: any) {
    assert(false, `IBPS PO Section Timer Test failed with error: ${err.message}`);
  }

  // TEST 5: ZERO NEGATIVE MARKING AUDIT (CTET / TEACHING EXAMS)
  console.log('\n📌 Test 5: Zero Negative Marking Audit (CTET)');
  try {
    const testUserId3 = 'test-cbt-audit-user-003';
    const { attempt, questions } = await cbtService.createAttempt({
      examId: 'ctet',
      userId: testUserId3,
      mode: 'topic',
      count: 2,
    });

    const q1 = questions[0];
    // Intentionally submit an incorrect option to verify no negative deduction occurs
    await cbtService.recordAnswer({
      attemptId: attempt.id,
      questionId: q1.id,
      userId: testUserId3,
      selectedOption: 999, // Wrong option
      timeSpentSeconds: 20,
      isReview: false,
    });

    const result = await cbtService.submitAttempt({
      attemptId: attempt.id,
      userId: testUserId3,
      timeSpentSeconds: 30,
    });

    assert(result.score_summary.incorrect === 1, '1 incorrect answer registered');
    assert(result.score_summary.total_score >= 0, `Total score is ${result.score_summary.total_score} (Zero negative penalty enforced)`);
  } catch (err: any) {
    assert(false, `CTET Zero Negative Marking Test failed with error: ${err.message}`);
  }

  console.log('\n===============================================================');
  console.log(`🏁 AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runUniversalCbtAudit().catch((err) => {
  console.error('Fatal error during audit:', err);
  process.exit(1);
});
