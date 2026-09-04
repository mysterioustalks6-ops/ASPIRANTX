import fs from 'fs';
import path from 'path';

console.log('=== VERIFYING PHASE 2: GLOBAL SHELL & NAVIGATION ===\n');

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

// 1. Verify Header.tsx
const headerPath = path.resolve('src/components/Header.tsx');
const headerContent = fs.readFileSync(headerPath, 'utf8');

assert(headerContent.includes("Candidate Command Center"), 'Header getTabTitle includes default and dashboard title');
assert(headerContent.includes("Syllabus Command Center"), 'Header getTabTitle includes Syllabus');
assert(headerContent.includes("CBT Mock Test Simulator"), 'Header getTabTitle includes CBT');
assert(headerContent.includes("PYQ Archive & Predictor"), 'Header getTabTitle includes PYQ');
assert(headerContent.includes("Deep-Work Focus Timer"), 'Header getTabTitle includes Timer');
assert(headerContent.includes("Master Operations & Admin Panel"), 'Header getTabTitle includes Admin');
assert(headerContent.includes("Teacher & Faculty Portal"), 'Header getTabTitle includes Teachers');
assert(headerContent.includes("header-profile-dashboard-btn"), 'Header preserves header-profile-dashboard-btn automation ID');
assert(headerContent.includes("bg-sky-600"), 'Header uses sky primary token');

// 2. Verify Sidebar.tsx
const sidebarPath = path.resolve('src/components/Sidebar.tsx');
const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');

assert(sidebarContent.includes("sidebar-nav-${item.id}"), 'Sidebar preserves sidebar-nav automation selector pattern');
assert(sidebarContent.includes("bg-sky-600 text-white shadow-md shadow-sky-600/25"), 'Sidebar active nav item uses sky design token');
assert(sidebarContent.includes("logout-btn"), 'Sidebar preserves logout-btn automation ID');
assert(sidebarContent.includes("Learn"), 'Sidebar has Learn domain header');
assert(sidebarContent.includes("Practice"), 'Sidebar has Practice domain header');
assert(sidebarContent.includes("Plan & Focus"), 'Sidebar has Plan domain header');
assert(sidebarContent.includes("Improve"), 'Sidebar has Improve domain header');
assert(sidebarContent.includes("Connect"), 'Sidebar has Connect domain header');
assert(sidebarContent.includes("Account & Perks"), 'Sidebar has Account domain header');
assert(sidebarContent.includes("Administration"), 'Sidebar has Administration domain header');

// 3. Verify MobileDrawer.tsx
const drawerPath = path.resolve('src/components/MobileDrawer.tsx');
const drawerContent = fs.readFileSync(drawerPath, 'utf8');

assert(drawerContent.includes("bg-sky-600 text-white font-bold shadow-md shadow-sky-600/25"), 'MobileDrawer uses sky token for active state');
assert(drawerContent.includes("Learn & Resources"), 'MobileDrawer has Learn domain');
assert(drawerContent.includes("Practice Engines"), 'MobileDrawer has Practice domain');
assert(drawerContent.includes("Plan & Focus"), 'MobileDrawer has Plan domain');
assert(drawerContent.includes("Improve & Analytics"), 'MobileDrawer has Improve domain');
assert(drawerContent.includes("Connect & Mentorship"), 'MobileDrawer has Connect domain');
assert(drawerContent.includes("Account & Perks"), 'MobileDrawer has Account domain');

// 4. Verify MobileBottomNav.tsx
const bnavPath = path.resolve('src/components/MobileBottomNav.tsx');
const bnavContent = fs.readFileSync(bnavPath, 'utf8');

assert(bnavContent.includes("Home"), 'MobileBottomNav has Home tab');
assert(bnavContent.includes("Learn"), 'MobileBottomNav has Learn tab');
assert(bnavContent.includes("Practice"), 'MobileBottomNav has Practice tab');
assert(bnavContent.includes("Progress"), 'MobileBottomNav has Progress tab');
assert(bnavContent.includes("More"), 'MobileBottomNav has More tab');
assert(bnavContent.includes("min-h-[48px]"), 'MobileBottomNav satisfies 48px touch target accessibility standard');
assert(bnavContent.includes("text-sky-400"), 'MobileBottomNav uses sky active tokens');

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
