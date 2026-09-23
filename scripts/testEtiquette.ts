// ============================================================================
// VERIFICATION TEST SUITE FOR AUTO-FETCH AGENT COMPLIANCE & RULES
// ============================================================================

import 'dotenv/config';
import { isCopyrightedOrPaidSource } from '../src/lib/autoFetch/sourceRegistry.js';
import { isUrlPermittedByRobots } from '../src/lib/autoFetch/robotsCompliance.js';
import { isContentFresh } from '../src/lib/autoFetch/contentStore.js';

async function runTests() {
  console.log('🧪 Starting Compliance & Etiquette Verification Tests...\n');
  let passed = 0;
  let failed = 0;

  // Test 1: Commercial Coaching Domain Rejection
  const coachingCheck1 = isCopyrightedOrPaidSource('https://testbook.com/question-bank');
  if (coachingCheck1.rejected && coachingCheck1.reason?.includes('testbook.com')) {
    console.log('✅ Test 1 Passed: Commercial coaching domain (testbook.com) was rejected.');
    passed++;
  } else {
    console.error('❌ Test 1 Failed: Commercial coaching domain was not rejected.');
    failed++;
  }

  // Test 2: Paid Coaching Domain Rejection (PW)
  const coachingCheck2 = isCopyrightedOrPaidSource('https://pw.live/courses/upsc-test-series');
  if (coachingCheck2.rejected) {
    console.log('✅ Test 2 Passed: Commercial coaching domain (pw.live) was rejected.');
    passed++;
  } else {
    console.error('❌ Test 2 Failed: Commercial coaching domain (pw.live) was not rejected.');
    failed++;
  }

  // Test 3: Copyright Phrase Heuristic Rejection
  const phraseCheck = isCopyrightedOrPaidSource(
    'https://example.org/study-material',
    'This page is proprietary. Unauthorized reproduction is strictly prohibited. Buy full test series to view.'
  );
  if (phraseCheck.rejected) {
    console.log('✅ Test 3 Passed: Page text with proprietary/copyright markers was rejected.');
    passed++;
  } else {
    console.error('❌ Test 3 Failed: Proprietary page text was not rejected.');
    failed++;
  }

  // Test 4: Official Conducting Body Whitelist
  const officialCheck = isCopyrightedOrPaidSource('https://upsc.gov.in/examinations/syllabus');
  if (!officialCheck.rejected) {
    console.log('✅ Test 4 Passed: Official conducting body (upsc.gov.in) permitted.');
    passed++;
  } else {
    console.error('❌ Test 4 Failed: Official conducting body was unexpectedly rejected.');
    failed++;
  }

  // Test 5: Robots.txt parser validation
  const robotsCheck = await isUrlPermittedByRobots('https://en.wikipedia.org/wiki/Civil_Services_Examination');
  if (robotsCheck.permitted) {
    console.log('✅ Test 5 Passed: Wikipedia public article permitted by robots.txt.');
    passed++;
  } else {
    console.error('❌ Test 5 Failed: Public Wikipedia article was blocked by robots.txt.');
    failed++;
  }

  // Test 6: Freshness Check for UPSC_CSE
  const freshCheck = await isContentFresh('UPSC_CSE', 'syllabus', 30);
  if (freshCheck.isFresh && freshCheck.ageDays === 0) {
    console.log('✅ Test 6 Passed: Stored UPSC_CSE syllabus correctly flagged as fresh (0 days old).');
    passed++;
  } else {
    console.error('❌ Test 6 Failed: Freshness check failed.');
    failed++;
  }

  console.log(`\n🏁 Test Results: ${passed} Passed, ${failed} Failed.`);
  process.exit(failed === 0 ? 0 : 1);
}

runTests();
