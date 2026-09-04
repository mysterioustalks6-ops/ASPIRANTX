import fs from 'fs';
import path from 'path';

console.log('=== VERIFYING PHASE 3: LANDING PAGE ===\n');

let failed = 0;
let passed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${message}`);
    failed++;
  }
}

const landingPath = path.resolve('src/components/LandingPage.tsx');
const content = fs.readFileSync(landingPath, 'utf8');

// 1. First Viewport Hierarchy
assert(content.includes("The Unified Competitive Exam Command Center"), 'Landing has concise eyebrow');
assert(content.includes("Master Any Exam."), 'Landing has strong headline');
assert(content.includes("Precision syllabus tracking"), 'Landing has concise value proposition');
assert(content.includes("aspirantx.in/workspace • NEET / UPSC / JEE Prep"), 'Landing first viewport has live product preview frame');
assert(content.includes("Indian Polity"), 'Preview includes active continuity card');
assert(content.includes("Full Mock Series #04"), 'Preview includes CBT mock preview');
assert(content.includes("Revise Modern History PYQs"), 'Preview includes AI Mentor priority recommendation');

// 2. Uncrowded Hero Section
assert(content.includes("Supported Competitive Examinations Strip"), 'Supported exams moved to dedicated supporting strip below hero');

// 3. Automation IDs Preserved
assert(content.includes('id="landing-guest-demo-btn"'), 'Preserves landing-guest-demo-btn');
assert(content.includes('id="landing-signin-btn"'), 'Preserves landing-signin-btn');
assert(content.includes('id="hero-guest-btn"'), 'Preserves hero-guest-btn');
assert(content.includes('id="hero-google-signin-btn"'), 'Preserves hero-google-signin-btn');

// 4. Core Story Flow
assert(content.includes("Everything You Need. Nothing You Don't."), 'Landing has 6 core capability modules section');
assert(content.includes("Syllabus Command Center"), 'Includes Syllabus Command Center module');
assert(content.includes("35-Year PYQ Archive"), 'Includes 35-Year PYQ Archive module');
assert(content.includes("CBT Mock Test Simulator"), 'Includes CBT Mock Test Simulator module');
assert(content.includes("Gemini AI Study Mentor"), 'Includes Gemini AI Study Mentor module');
assert(content.includes("The Daily Preparation Rhythm"), 'Landing has 3-step preparation rhythm loop');
assert(content.includes("step: '01'") && content.includes("title: 'Learn & Track'"), 'Includes Step 01 Learn & Track');
assert(content.includes("step: '02'") && content.includes("title: 'Practice & Test'"), 'Includes Step 02 Practice & Test');
assert(content.includes("step: '03'") && content.includes("title: 'Analyze & Improve'"), 'Includes Step 03 Analyze & Improve');
assert(content.includes("Trust & Reliability Metrics"), 'Landing has trust & benchmark metrics');

// 5. Auth & Modals
assert(content.includes("Authentication Diagnostics"), 'Preserves Google/OAuth diagnostics modal');
assert(content.includes("Email / Password Sign In & Sign Up Modal"), 'Preserves Email sign in / sign up modal');
assert(content.includes("Continue with Google"), 'Preserves Google button inside Email modal');

console.log(`\n========================================`);
console.log(`TOTAL CHECKS: ${passed + failed}`);
console.log(`PASSED:       ${passed}`);
console.log(`FAILED:       ${failed}`);
console.log(`========================================`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
