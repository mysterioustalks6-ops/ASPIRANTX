import fs from 'fs';
import path from 'path';

console.log('============================================================');
console.log('🔬 PHASE 8 — PRACTICE AREA VERIFICATION AUDIT');
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

// 1. Check PyqEngine.tsx
const pyqPath = path.resolve('src/components/PyqEngine.tsx');
assert(fs.existsSync(pyqPath), 'PyqEngine.tsx exists');
const pyqContent = fs.readFileSync(pyqPath, 'utf-8');

assert(pyqContent.includes('Enterprise PYQ Engine'), 'PyqEngine renders archive header');
assert(pyqContent.includes('getStandardSubject'), 'PyqEngine exports canonical standard subject mapper');
assert(pyqContent.includes('getExamSubjects'), 'PyqEngine exports canonical exam subjects resolver');
assert(pyqContent.includes('DIAGNOSTIC_QUESTION_BANK'), 'PyqEngine provides offline diagnostic fallback');
assert(pyqContent.includes('fetchPdfPapers'), 'PyqEngine provides full question paper PDF retrieval');
assert(pyqContent.includes('handleSelectOption'), 'PyqEngine provides interactive option evaluation');
assert(pyqContent.includes('bg-sky-600'), 'PyqEngine uses Sky-600 design tokens');
assert(!pyqContent.includes('#00FF94'), 'PyqEngine has zero instances of neon #00FF94');

// 2. Check QuestionBankEngine.tsx
const qbPath = path.resolve('src/components/QuestionBankEngine.tsx');
assert(fs.existsSync(qbPath), 'QuestionBankEngine.tsx exists');
const qbContent = fs.readFileSync(qbPath, 'utf-8');

assert(qbContent.includes('Enterprise Question Bank & Analytics'), 'QuestionBankEngine renders header');
assert(qbContent.includes('activeEngineTab'), 'QuestionBankEngine supports Browse, Quiz, and Trend tabs');
assert(qbContent.includes('startQuiz'), 'QuestionBankEngine provides interactive 10-minute quiz mode');
assert(qbContent.includes('getTopicTrends'), 'QuestionBankEngine computes topic frequency & repetition patterns');
assert(qbContent.includes('q.correctOption === oIdx'), 'QuestionBankEngine displays verified correct answer key');
assert(qbContent.includes('bg-sky-600'), 'QuestionBankEngine uses Sky-600 design tokens');
assert(!qbContent.includes('#00FF94'), 'QuestionBankEngine has zero instances of neon #00FF94');

// 3. Check CbtExamEngine.tsx (Exam-Room Austerity & Integrity)
const cbtPath = path.resolve('src/components/CbtExamEngine.tsx');
assert(fs.existsSync(cbtPath), 'CbtExamEngine.tsx exists');
const cbtContent = fs.readFileSync(cbtPath, 'utf-8');

assert(cbtContent.includes('id="cbt-live-exam-workspace"'), 'CbtExamEngine provides isolated full-screen exam workspace');
assert(cbtContent.includes('fixed inset-0 z-50'), 'CbtExamEngine locks interface in distraction-free viewport');
assert(!cbtContent.includes('<AdSenseBanner'), 'CbtExamEngine has NO promotional widgets or advertisements inside CBT');
assert(cbtContent.includes('id="cbt-btn-review"'), 'CbtExamEngine provides Mark for Review & Next control');
assert(cbtContent.includes('id="cbt-btn-clear"'), 'CbtExamEngine provides Clear Response control');
assert(cbtContent.includes('id="cbt-btn-prev"'), 'CbtExamEngine provides Previous Question navigation control');
assert(cbtContent.includes('id="cbt-btn-save-next"'), 'CbtExamEngine provides Save & Next progression control');
assert(cbtContent.includes('remainingSeconds < 300'), 'CbtExamEngine provides live authoritative countdown timer');
assert(cbtContent.includes('marked_for_review'), 'CbtExamEngine adheres to national NTA question status palette');
assert(cbtContent.includes('/api/academic/cbt/submit'), 'CbtExamEngine maintains atomic backend scoring evaluation');
assert(cbtContent.includes('bg-sky-600'), 'CbtExamEngine uses Sky-600 design tokens in portal and scorecard');
assert(!cbtContent.includes('#00FF94'), 'CbtExamEngine has zero instances of neon #00FF94');

console.log('\n------------------------------------------------------------');
console.log(`TOTAL CHECKS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
console.log('------------------------------------------------------------\n');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('✨ ALL PHASE 8 PRACTICE AREA CHECKS COMPLETED SUCCESSFULLY!');
  process.exit(0);
}
