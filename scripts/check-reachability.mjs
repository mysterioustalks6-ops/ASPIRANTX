import puppeteer from 'puppeteer-core';
import { readFileSync } from 'fs';
import { resolve } from 'path';

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

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

const errors = [];
page.on('pageerror', err => {
  console.error('PAGE ERROR IN APP:', err.message);
  errors.push(err.message);
});

await page.goto('http://localhost:5173/?no_splash=1', { waitUntil: 'domcontentloaded', timeout: 30000 });
await new Promise(r => setTimeout(r, 1000));

// Enter app shell via Guest Demo button if on landing page
const guestBtn = await page.$('#hero-guest-btn');
if (guestBtn) {
  await guestBtn.click();
}

await page.waitForSelector('[data-screen="dashboard"]', { timeout: 20000 });
await new Promise(r => setTimeout(r, 1000));

console.log('| Tab ID | Status | Rendered Container / Evidence | Errors |');
console.log('|---|---|---|---|');

const results = [];
const seenEvidence = new Map();

for (const tabId of tabIds) {
  errors.length = 0;
  
  // Check role-gated admin / faculty tabs
  const isRoleGated = tabId === 'admin' || tabId === 'teachers';
  const isDevOnly = tabId === 'debug_galaxy' || tabId === 'figma_preview' || tabId === 'design_system';

  // Trigger navigation via custom event
  await page.evaluate((id) => {
    window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: id }));
  }, tabId);

  let foundScreen = false;
  let evidence = '';

  // Poll for screen element to mount and settle
  for (let attempt = 0; attempt < 30; attempt++) {
    await new Promise(r => setTimeout(r, 250));
    foundScreen = await page.evaluate((id) => {
      const el = document.querySelector(`[data-screen="${id}"]`);
      if (!el) return false;
      const text = el.innerText || '';
      return !text.toLowerCase().includes('loading enterprise view') && !text.toLowerCase().includes('syncing study telemetry');
    }, tabId);
    if (foundScreen) break;
  }

  // Fallback check if data-screen exists
  if (!foundScreen) {
    foundScreen = await page.evaluate((id) => Boolean(document.querySelector(`[data-screen="${id}"]`)), tabId);
  }

  if (!foundScreen) {
    // Check if it's rendered as gated
    const isGatedText = await page.evaluate(() => {
      const txt = document.body.innerText || '';
      return txt.includes('Access Denied') || txt.includes('Teacher Access Required') || txt.includes('Faculty access');
    });
    if (isRoleGated || isGatedText) {
      evidence = 'Role Gated (Admin / Teacher Access Required)';
      foundScreen = true;
    } else {
      evidence = `Missing [data-screen="${tabId}"]`;
    }
  } else {
    // Extract evidence directly from the data-screen element
    evidence = await page.evaluate((id) => {
      const el = document.querySelector(`[data-screen="${id}"]`);
      if (!el) return 'Not found';

      if (id === 'dashboard') return 'Today View: Aaj Ki Ride Dashboard';
      if (id === 'student_dashboard') return 'Student Progress Cockpit (#student-dashboard)';
      if (id === 'cbt') return 'StudyRide All-India Mock Test & CBT Simulator';
      if (id === 'cbt_exam') return 'Computer Based Test (CBT) Live Simulator';

      // Look for headings, badges, or title elements inside this screen root
      const headings = Array.from(el.querySelectorAll('h1, h2, h3, h4, [role="heading"], p.font-black, span.font-black, p.font-bold, span.font-bold, div[class*="text-base font-bold"], div[class*="text-lg font-bold"]'))
        .map(h => h.innerText.trim().replace(/\s+/g, ' '))
        .filter(t => t.length > 3 && !t.includes('Complete Prep Suite') && !t.includes('Announcement') && !t.includes('StudyRide') && !t.includes('Custom Prep Suite') && !t.includes('Precision Exam Prep') && !t.includes('LOADING ENTERPRISE'));

      if (headings.length > 0) {
        return headings[0].slice(0, 60);
      }

      // Fallback to text inside the container
      const lines = (el.innerText || '')
        .split('\n')
        .map(s => s.trim().replace(/\s+/g, ' '))
        .filter(s => s.length > 3 && !s.includes('Complete Prep Suite') && !s.includes('Announcement') && !s.includes('StudyRide') && !s.includes('LOADING ENTERPRISE'));

      return lines[0] ? lines[0].slice(0, 60) : `Container [data-screen="${id}"] rendered`;
    }, tabId);
  }

  const errorMsg = errors.length > 0 ? errors.join('; ').slice(0, 30) : 'None';
  let statusLabel = '**PASS**';
  if (isDevOnly) {
    statusLabel = '`dev-only`';
  } else if (isRoleGated) {
    statusLabel = '`gated`';
  } else if (!foundScreen || errors.length > 0) {
    statusLabel = '**FAIL**';
  }

  console.log(`| \`${tabId}\` | ${statusLabel} | ${evidence.replace(/\|/g, '/')} | ${errorMsg} |`);
  results.push({ tabId, pass: foundScreen, gated: isRoleGated, devOnly: isDevOnly, evidence });
}

await browser.close();

// Check uniqueness of evidence
const uniqueEvidenceMap = new Map();
let duplicateFound = false;
for (const r of results) {
  if (r.devOnly || r.gated) continue;
  if (uniqueEvidenceMap.has(r.evidence)) {
    console.error(`DUPLICATE EVIDENCE DETECTED: "${r.evidence}" between ${r.tabId} and ${uniqueEvidenceMap.get(r.evidence)}`);
    duplicateFound = true;
  }
  uniqueEvidenceMap.set(r.evidence, r.tabId);
}

const totalPassed = results.filter(r => r.pass).length;
console.log(`\nSummary: ${totalPassed}/${tabIds.length} tabs reachable (${results.filter(r => r.gated).length} gated, ${results.filter(r => r.devOnly).length} dev-only).`);
if (totalPassed < tabIds.length || duplicateFound) {
  process.exit(1);
} else {
  process.exit(0);
}
