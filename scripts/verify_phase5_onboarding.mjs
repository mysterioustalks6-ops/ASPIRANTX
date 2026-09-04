import fs from 'fs';
import path from 'path';

console.log('============================================================');
console.log('🔬 PHASE 5 — ONBOARDING WIZARD VERIFICATION AUDIT');
console.log('============================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`❌ [FAIL] ${message}`);
    failCount++;
  }
}

const onboardingPath = path.resolve('src/components/OnboardingWizard.tsx');
const customModalPath = path.resolve('src/components/CustomExamModal.tsx');

assert(fs.existsSync(onboardingPath), 'OnboardingWizard.tsx exists');
assert(fs.existsSync(customModalPath), 'CustomExamModal.tsx exists');

const onboardingContent = fs.readFileSync(onboardingPath, 'utf-8');
const customModalContent = fs.readFileSync(customModalPath, 'utf-8');

// Step 1 Check
assert(onboardingContent.includes('step === 1'), 'Wizard includes Step 1 logic');
assert(onboardingContent.includes('Your Full Name'), 'Step 1 collects full name');
assert(onboardingContent.includes('Please enter your full name to proceed'), 'Step 1 enforces full name validation');

// Step 2 Check
assert(onboardingContent.includes('step === 2'), 'Wizard includes Step 2 logic');
assert(onboardingContent.includes('EXAM_CATEGORIES.map'), 'Step 2 renders category selection from EXAM_CATEGORIES');
assert(onboardingContent.includes('EXAM_PREP_TIPS'), 'Step 2 renders contextual exam preparation tips');

// Step 3 Check
assert(onboardingContent.includes('step === 3'), 'Wizard includes Step 3 logic');
assert(onboardingContent.includes('INDIAN_STATES_AND_UTS'), 'Step 3 provides State/Region selection');
assert(onboardingContent.includes('[2025, 2026, 2027, 2028, 2029]'), 'Step 3 provides 5-year target year selector');
assert(onboardingContent.includes('CustomExamModal'), 'Step 3 integrates CustomExamModal for unlisted examinations');
assert(onboardingContent.includes('getCombinedExamList'), 'Step 3 loads standard and custom examinations');

// Persistence & Business Logic Check
assert(onboardingContent.includes('saveUserProfile'), 'Calls saveUserProfile to persist to local and Supabase');
assert(onboardingContent.includes('SYLLABUS_PRESETS'), 'Seeds initial curriculum presets based on exam field');
assert(onboardingContent.includes('onComplete(updatedProfile)'), 'Invokes onComplete callback with completed profile');

// Design Tokens & Aesthetic Discipline Check
assert(!onboardingContent.includes('#00FF94'), 'No neon #00FF94 in OnboardingWizard');
assert(!customModalContent.includes('#00FF94'), 'No neon #00FF94 in CustomExamModal');
assert(!customModalContent.includes('cyan-500'), 'No loud cyan gradients in CustomExamModal');
assert(onboardingContent.includes('bg-sky-600'), 'Uses primary Sky-600 action button in OnboardingWizard');
assert(customModalContent.includes('bg-sky-600'), 'Uses primary Sky-600 action button in CustomExamModal');

console.log('\n============================================================');
console.log(`📊 AUDIT RESULT: ${passCount} PASSED, ${failCount} FAILED`);
console.log('============================================================');

if (failCount > 0) {
  process.exit(1);
}
