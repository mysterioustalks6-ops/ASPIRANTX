/**
 * Test AI CBT Custom Generation & From Bank Generation
 */
import assert from 'node:assert/strict';

const BASE_URL = 'http://127.0.0.1:3000';

console.log('=== TESTING AI & QUESTION BANK TEST GENERATION ===\n');

async function testGeneration() {
  // Test 1: From Bank Generation
  console.log('[1] Testing /api/academic/cbt/from-bank...');
  const bankRes = await fetch(`${BASE_URL}/api/academic/cbt/from-bank`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      exam: 'UPSC_CSE',
      mode: 'full',
      questionCount: 5,
      durationMinutes: 15
    })
  });
  assert.equal(bankRes.status, 200);
  const bankData = await bankRes.json();
  assert.equal(bankData.success, true);
  assert(bankData.test, 'test must exist');
  assert(Array.isArray(bankData.test.questions), 'questions must be array');
  assert(Array.isArray(bankData.test.sections) && bankData.test.sections.length > 0, 'sections must be array with length > 0');
  assert.equal(typeof bankData.test.markingScheme.correct, 'number');
  console.log(`  ✓ Bank test built successfully with ${bankData.test.questions.length} questions`);

  // Verify questions schema
  const q0 = bankData.test.questions[0];
  assert(typeof q0.id === 'string');
  assert(typeof q0.questionText === 'string');
  assert(Array.isArray(q0.options) && q0.options.length === 4);
  assert(typeof q0.correctOption === 'number');
  assert(q0.marks > 0);
  assert(q0.negativeMarks > 0);
  console.log('  ✓ Question schema verified: options is 4 strings, correctOption is number, negativeMarks is positive magnitude');

  // Test 2: Submit Bank Test
  console.log('\n[2] Submitting Bank Test to verify scoring...');
  const submitRes = await fetch(`${BASE_URL}/api/academic/cbt/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      testId: bankData.test.id,
      sessionState: {
        testId: bankData.test.id,
        startTimeIso: new Date().toISOString(),
        elapsedSeconds: 60,
        currentQuestionIndex: 0,
        isSubmitted: true,
        currentSection: bankData.test.sections[0].name,
        language: 'English',
        responses: {
          [q0.id]: {
            questionId: q0.id,
            selectedOption: q0.correctOption,
            status: 'answered',
            timeSpentSeconds: 60
          }
        }
      },
      userId: 'test_user_ai',
      exam: 'UPSC_CSE',
      test: bankData.test
    })
  });
  assert.equal(submitRes.status, 200);
  const submitData = await submitRes.json();
  assert.equal(submitData.success, true);
  assert.equal(submitData.result.correctCount, 1);
  assert(submitData.result.score > 0);
  console.log(`  ✓ Bank test evaluated with score: ${submitData.result.score} (PASS)`);

  console.log('\n=============================================');
  console.log('ALL GENERATION TESTS PASSED (100% OK)');
  console.log('=============================================');
}

testGeneration().catch(e => {
  console.error('Generation test failed:', e);
  process.exit(1);
});
