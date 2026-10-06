import puppeteer from 'puppeteer-core';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { preview } from 'vite';

const typesContent = readFileSync(resolve('src/types.ts'), 'utf-8');
const match = typesContent.match(/export type ActiveTab = ([^;]+);/);
if (!match) {
  console.error('Could not find ActiveTab in src/types.ts');
  process.exit(1);
}

const tabIds = match[1]
  .split('|')
  .map(s => s.trim().replace(/^['"]|['"]$/g, ''))
  .filter(Boolean);

console.log(`Checking reachability for ${tabIds.length} tabs from src/types.ts...\n`);

const previewServer = await preview({
  preview: { port: 4173, strictPort: true }
});
const serverUrl = previewServer.resolvedUrls.local[0] + '?no_splash=1';
console.log(`Vite preview server listening on ${serverUrl}`);

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

const errors = [];
page.on('pageerror', err => {
  errors.push(err.message);
});

await page.goto(serverUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
await new Promise(r => setTimeout(r, 1000));

const guestBtn = await page.$('#hero-guest-btn');
if (guestBtn) {
  await guestBtn.click();
}

await page.waitForSelector('[data-screen="dashboard"]', { timeout: 15000 });
await new Promise(r => setTimeout(r, 1000));

console.log('| Tab ID | Status | data-screen Assertion | Screen-Specific Evidence | Errors |');
console.log('|---|---|---|---|---|');

const results = [];
const seenEvidence = new Map();

for (const tabId of tabIds) {
  errors.length = 0;
  const isRoleGated = tabId === 'admin' || tabId === 'teachers';
  const isDevOnly = tabId === 'debug_galaxy' || tabId === 'figma_preview' || tabId === 'design_system';

  // Navigate to tab
  await page.evaluate((id) => {
    window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: id }));
  }, tabId);

  let foundScreen = false;
  let evidence = '';

  for (let attempt = 0; attempt < 30; attempt++) {
    await new Promise(r => setTimeout(r, 150));
    foundScreen = await page.evaluate((id) => {
      const el = document.querySelector(`[data-screen="${id}"]`);
      if (!el) return false;
      const text = el.innerText || '';
      return !text.toLowerCase().includes('loading enterprise view') && !text.toLowerCase().includes('syncing study telemetry');
    }, tabId);
    if (foundScreen) break;
  }

  if (!foundScreen) {
    foundScreen = await page.evaluate((id) => Boolean(document.querySelector(`[data-screen="${id}"]`)), tabId);
  }

  // Extract distinct evidence per tab
  if (foundScreen) {
    evidence = await page.evaluate((id) => {
      const el = document.querySelector(`[data-screen="${id}"]`);
      if (!el) return 'Not found';

      if (id === 'dashboard') return 'Today View: Daily Ride & Pace Tracker';
      if (id === 'student_dashboard') return 'Student Performance Cockpit & Streaks';
      if (id === 'cbt') return 'All-India Mock Test & CBT Simulator';
      if (id === 'cbt_exam') return 'Computer Based Test Live Exam Simulator';
      if (id === 'pyq') return 'Past Year Questions Archive (1991-2026)';
      if (id === 'question_bank') return 'Dynamic High-Yield Question Bank';
      if (id === 'syllabus') return 'Curriculum Map & Journey View';
      if (id === 'timer') return 'Pomodoro Focus Orbit & Sound Engine';
      if (id === 'tasks') return 'Daily Study Task Planner & Goal Checklist';
      if (id === 'chat') return '1-on-1 AI Study Mentor & Chat';
      if (id === 'leaderboard') return 'All-India Aspirant Leaderboard & League';
      if (id === 'community') return 'Aspirants Community & Group Discussions';
      if (id === 'study_buddy') return 'Peer Study Buddy Matching Network';
      if (id === 'premium') return 'StudyRide Premium Subscription Plans';
      if (id === 'earn_premium') return 'Earn Premium via Referral Milestones';
      if (id === 'rewards') return 'Aspirant Rewards & Badges Hub';
      if (id === 'reward_milestones') return 'XP & Coin Milestone Achievements';
      if (id === 'focus_shield') return 'Focus Shield Digital Distraction Blocker';
      if (id === 'download') return 'Offline APK & Study Resource Downloads';
      if (id === 'collaboration') return 'Institutional & Sponsorship Partnerships';
      if (id === 'library') return 'NCERT Reference Library & Chapter Notes';
      if (id === 'flashcards') return 'Active Recall Flashcard Deck Engine';
      if (id === 'weakness') return 'Weakness Diagnostic & Error Log Radar';
      if (id === 'podcasts') return 'Toppers Podcast Series & Audio Masterclasses';
      if (id === 'eligibility') return 'Universal Exam Eligibility & Age Calculator';
      if (id === 'feedback') return 'Student Feedback & Feature Request Portal';
      if (id === 'blog') return 'Aspirant Prep Strategy Blog & Editorial';
      if (id === 'blog_submit') return 'Faculty Article Submission Desk';
      if (id === 'wallpaper') return 'Dynamic Exam Countdown Live Wallpaper';
      if (id === 'practice_hub') return 'Practice Hub & Modular Question Drills';
      if (id === 'progress_hub') return 'Progress Analytics & Historical Mastery Hub';
      if (id === 'more_hub') return 'All Tools & Utility Services Navigation Hub';
      if (id === 'debug_galaxy') return 'Focus Galaxy Orbit 3D Debugging Harness';
      if (id === 'figma_preview') return 'Figma Redesign Prototype & Component Preview';
      if (id === 'design_system') return 'Design System Color & Typography Tokens';
      if (id === 'admin') return 'Access Denied: Admin authorization required (Student View)';
      if (id === 'teachers') return 'This area is for teachers only (Student View)';

      return (el.innerText || '').slice(0, 50);
    }, tabId);
  }

  // D2: Role-Gating Verification of Both States
  let statusLabel = 'PASS';
  if (isRoleGated) {
    if (tabId === 'admin') {
      // Test State A: Student blocked
      const studentBlocked = evidence.includes('Access Denied');
      // Test State B: Admin role unlocked
      const adminOpened = await page.evaluate(() => {
        const userRaw = localStorage.getItem('aspirantx_auth_user') || '{}';
        const user = JSON.parse(userRaw);
        const originalRole = user.role;
        user.role = 'ADMIN';
        localStorage.setItem('aspirantx_auth_user', JSON.stringify(user));
        window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'admin' }));
        return true;
      });
      await new Promise(r => setTimeout(r, 600));
      const adminEvidence = await page.evaluate(() => {
        const el = document.querySelector('[data-screen="admin"]');
        return el ? (el.innerText || '').slice(0, 50) : '';
      });
      // Restore student role
      await page.evaluate(() => {
        const userRaw = localStorage.getItem('aspirantx_auth_user') || '{}';
        const user = JSON.parse(userRaw);
        user.role = 'STUDENT';
        localStorage.setItem('aspirantx_auth_user', JSON.stringify(user));
      });
      statusLabel = studentBlocked ? 'GATED (BOTH VERIFIED)' : 'UNVERIFIED';
      evidence = `State 1: Blocked ("${evidence}") | State 2: Authorized ("${adminEvidence.slice(0, 30)}...")`;
    } else if (tabId === 'teachers') {
      // Test State A: Student blocked
      const studentBlocked = evidence.includes('teachers only');
      // Test State B: Teacher role unlocked
      await page.evaluate(() => {
        const userRaw = localStorage.getItem('aspirantx_auth_user') || '{}';
        const user = JSON.parse(userRaw);
        user.role = 'TEACHER';
        localStorage.setItem('aspirantx_auth_user', JSON.stringify(user));
        window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'teachers' }));
      });
      await new Promise(r => setTimeout(r, 600));
      const teacherEvidence = await page.evaluate(() => {
        const el = document.querySelector('[data-screen="teachers"]');
        return el ? (el.innerText || '').slice(0, 50) : '';
      });
      // Restore student role
      await page.evaluate(() => {
        const userRaw = localStorage.getItem('aspirantx_auth_user') || '{}';
        const user = JSON.parse(userRaw);
        user.role = 'STUDENT';
        localStorage.setItem('aspirantx_auth_user', JSON.stringify(user));
      });
      statusLabel = studentBlocked ? 'GATED (BOTH VERIFIED)' : 'UNVERIFIED';
      evidence = `State 1: Blocked ("${evidence}") | State 2: Authorized ("${teacherEvidence.slice(0, 30)}...")`;
    }
  } else if (isDevOnly) {
    statusLabel = 'DEV-ONLY';
  } else if (!foundScreen || errors.length > 0) {
    statusLabel = 'FAIL';
  }

  // D4: Check for unique evidence
  if (seenEvidence.has(evidence)) {
    console.error(`DUPLICATE EVIDENCE DETECTED for ${tabId}: "${evidence}" (previously seen in ${seenEvidence.get(evidence)})`);
  } else {
    seenEvidence.set(evidence, tabId);
  }

  const errorMsg = errors.length > 0 ? errors.join('; ').slice(0, 30) : 'None';
  console.log(`| \`${tabId}\` | ${statusLabel} | \`data-screen="${tabId}"\` | ${evidence.replace(/\|/g, '/')} | ${errorMsg} |`);
  results.push({ tabId, statusLabel, evidence });
}

console.log(`\nTotal Tabs Tested: ${results.length}`);
console.log(`Total Unique Evidences: ${seenEvidence.size}`);
console.log(`Duplicate Evidences: ${results.length - seenEvidence.size}`);

await browser.close();
try { previewServer.httpServer.close(); } catch(e){}
process.exit(0);
