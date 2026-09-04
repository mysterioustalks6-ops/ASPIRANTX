import fs from 'fs';
import path from 'path';

console.log('=== VERIFYING PHASE 4: AUTHENTICATION ===\n');

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

// 1. Verify LandingPage Auth Modal
const landingPath = path.resolve('src/components/LandingPage.tsx');
const landingContent = fs.readFileSync(landingPath, 'utf8');

assert(landingContent.includes("Sign In to AspirantX"), 'Auth modal includes Sign In header');
assert(landingContent.includes("Create Student Account"), 'Auth modal includes Create Student Account header');
assert(landingContent.includes("Continue with Google"), 'Auth modal has Google OAuth button');
assert(landingContent.includes("authMode === 'signin' ? 'bg-sky-600"), 'Auth mode toggle uses primary design token');
assert(landingContent.includes("bg-sky-600 hover:bg-sky-500"), 'Auth submit button uses sky design token');
assert(landingContent.includes("256-bit Encrypted • Powered by Supabase Secure Auth"), 'Auth modal includes security & trust badge');
assert(landingContent.includes("Authentication Diagnostics"), 'Preserves Google/OAuth diagnostic modal');
assert(landingContent.includes("handleGoogleSignIn"), 'Preserves handleGoogleSignIn logic');
assert(landingContent.includes("handleEmailAuthSubmit"), 'Preserves handleEmailAuthSubmit logic');

// 2. Verify DemoExpiredModal
const demoModalPath = path.resolve('src/components/DemoExpiredModal.tsx');
const demoModalContent = fs.readFileSync(demoModalPath, 'utf8');

assert(demoModalContent.includes("Ready to Save Your Progress?"), 'Demo modal has clear, reassuring title');
assert(demoModalContent.includes("Sign In to Continue"), 'Demo modal has clean primary CTA');
assert(demoModalContent.includes("bg-sky-600 hover:bg-sky-500"), 'Demo modal primary CTA uses sky design token');
assert(demoModalContent.includes("Open Sign In / Register Modal"), 'Demo modal provides login navigation option');
assert(demoModalContent.includes("100% Free Account • Your progress will be safely synced"), 'Demo modal has trust guarantee');
assert(demoModalContent.includes("handleGoogleAuth"), 'Preserves handleGoogleAuth logic');

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
