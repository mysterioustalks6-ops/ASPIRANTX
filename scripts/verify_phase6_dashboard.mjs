import fs from 'fs';
import path from 'path';

console.log('============================================================');
console.log('🔬 PHASE 6 — STUDENT DASHBOARD VERIFICATION AUDIT');
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

const dashboardPath = path.resolve('src/components/StudentDashboard.tsx');
assert(fs.existsSync(dashboardPath), 'StudentDashboard.tsx exists');

const content = fs.readFileSync(dashboardPath, 'utf-8');

// 1. Above the Fold Hierarchy Checks
assert(content.includes('Welcome back,'), 'Renders personalized candidate greeting');
assert(content.includes('Target Exam:'), 'Renders active exam selector');
assert(content.includes('EXAM_LIST.map'), 'Loads preset examinations in exam selector');
assert(content.includes('__CREATE_CUSTOM__'), 'Allows custom exam creation trigger');
assert(content.includes('Daily Streak'), 'Renders daily streak counter');
assert(content.includes('Days Left'), 'Renders exam countdown days');

// 2. Primary Hero Card: Continue Learning
assert(content.includes('Continue Learning'), 'Renders dominant Continue Learning card');
assert(content.includes('lastTopic.subject'), 'Renders last studied subject');
assert(content.includes('lastTopic.chapter'), 'Renders last studied chapter');
assert(content.includes('lastTopic.subtopic'), 'Renders last studied subtopic');
assert(content.includes('overallProgressPercent'), 'Renders progress percentage');
assert(content.includes('onNavigate(lastTopic.tab'), 'Primary button invokes navigation to resume topic');

// 3. Next Best Action: Single strong recommendation
assert(content.includes('Recommended Next'), 'Renders Recommended Next action card');
assert(content.includes('primarySuggestion'), 'Renders high-yield primary AI suggestion');
assert(content.includes('getRecommendationAction'), 'Derives specific action CTA from AI recommendation');

// 4. Small Progress Summary
assert(content.includes('Daily Quota'), 'Renders daily study quota metrics');
assert(content.includes('Test Accuracy'), 'Renders CBT mock test accuracy metric');

// 5. Performance Telemetry Hub
assert(content.includes('CircularPerformanceHub'), 'Integrates CircularPerformanceHub');

// 6. Compact Quick Launch (4-6 primary shortcuts default)
assert(content.includes('allFeatures.slice(0, 6)'), 'Enforces compact 6-shortcut default density');
assert(content.includes('showAllShortcuts'), 'Provides expandable toggle for full module catalog');
assert(content.includes('recordFeatureUsage'), 'Preserves feature analytics telemetry');

// 7. Lower Region Preservations
assert(content.includes('ExamWallpaperWidget'), 'Preserves Exam Wallpaper widget lower down');
assert(content.includes('DailyStudySummaryCard'), 'Preserves Daily Study Summary card lower down');
assert(content.includes('AdSenseBanner'), 'Preserves non-intrusive AdSense banner for free users');

// 8. Design System Discipline
assert(!content.includes('#00FF94'), 'Zero instances of neon #00FF94 in StudentDashboard');
assert(content.includes('bg-sky-600'), 'Uses Sky-600 primary action button');
assert(content.includes('text-sky-400'), 'Uses Sky-400 accent typography');

console.log('\n============================================================');
console.log(`📊 AUDIT RESULT: ${passCount} PASSED, ${failCount} FAILED`);
console.log('============================================================');

if (failCount > 0) {
  process.exit(1);
}
