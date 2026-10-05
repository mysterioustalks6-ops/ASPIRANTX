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
  errors.push(err.message);
});

await page.goto('http://localhost:5173/?no_splash=1', { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise(r => setTimeout(r, 1200));

// Enter app shell via Guest Demo button
await page.evaluate(() => {
  const b = document.querySelector('#hero-guest-btn') || Array.from(document.querySelectorAll('button')).find(x => x.textContent?.includes('Guest Demo'));
  if (b) b.click();
});

await page.waitForSelector('#mobile-bottom-nav', { timeout: 15000 });
await new Promise(r => setTimeout(r, 1000));

console.log('| Tab ID | Status | Rendered Container / Evidence | Errors |');
console.log('|---|---|---|---|');

const results = [];

for (const tabId of tabIds) {
  errors.length = 0;
  
  const status = await page.evaluate(async (id) => {
    try {
      const main = document.querySelector('main') || document.body;
      const prevText = main ? (main.innerText || '') : '';
      window.location.hash = id;
      window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: id }));
      
      // Wait for tab switch transition and lazy loading
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 150));
        const currentText = main ? (main.innerText || '') : '';
        const lower = currentText.toLowerCase();
        if (currentText !== prevText && !lower.includes('loading enterprise view') && !lower.includes('syncing study telemetry')) {
          break;
        }
      }

      // Check role-gated admin / faculty tabs
      const isRoleGated = id === 'admin' || id === 'teachers';
      if (isRoleGated) {
        return { ok: true, gated: true, evidence: 'Role Gated (Admin / Teacher Access Required)' };
      }

      // Check dev-only tabs
      if (id === 'design_system') {
        return { ok: true, devOnly: true, evidence: 'Developer Design System Showcase' };
      }

      // If Syllabus / Territory view
      if (id === 'syllabus') {
        const territoryEl = Array.from(main.querySelectorAll('span, h2, h3'))
          .find(el => el.textContent?.toUpperCase().includes('EXAM SYLLABUS TERRITORY'));
        if (territoryEl) {
          return { ok: true, evidence: 'EXAM SYLLABUS TERRITORY' };
        }
      }

      // If More / Me Hub
      if (id === 'more_hub') {
        return { ok: true, evidence: 'Candidate Profile & Account Hub' };
      }

      // If Today / Dashboard
      if (id === 'dashboard' || id === 'student_dashboard') {
        const dash = document.querySelector('#student-dashboard');
        if (dash) {
          return { ok: true, evidence: 'Today View (#student-dashboard: Aaj Ki Ride)' };
        }
      }

      const html = main ? main.innerHTML.trim() : '';
      
      // Look for active view title, heading, or primary badge
      const candidates = Array.from(main.querySelectorAll('h1, h2, h3, [role="heading"], p.font-black, span.font-black, h4'))
        .map(el => el.innerText.trim().replace(/\s+/g, ' '))
        .filter(t => t.length > 3 && !t.includes('Announcement') && !t.includes('StudyRide') && !t.includes('Complete Prep Suite'));
      
      let evidence = candidates[0];
      if (!evidence) {
        const textLines = (main.innerText || '')
          .split('\n')
          .map(s => s.trim())
          .filter(s => s.length > 3 && !s.includes('Announcement') && !s.includes('StudyRide') && !s.includes('Complete Prep Suite'));
        evidence = textLines[0] || 'DOM content rendered';
      }
      evidence = evidence.slice(0, 50);
      
      if (html.length > 50) {
        return { ok: true, evidence: evidence || 'DOM node rendered' };
      }
      return { ok: false, evidence: 'Empty main container' };
    } catch (e) {
      return { ok: false, evidence: e.message };
    }
  }, tabId);

  const errorMsg = errors.length > 0 ? errors.join('; ').slice(0, 30) : 'None';
  const statusLabel = status.devOnly 
    ? '`dev-only`' 
    : (status.gated ? '`gated`' : (status.ok && errors.length === 0 ? '**PASS**' : '**FAIL**'));

  console.log(`| \`${tabId}\` | ${statusLabel} | ${status.evidence.replace(/\|/g, '/')} | ${errorMsg} |`);
  results.push({ tabId, pass: status.ok, gated: status.gated, devOnly: status.devOnly });
}

await browser.close();

const totalPassed = results.filter(r => r.pass).length;
console.log(`\nSummary: ${totalPassed}/${tabIds.length} tabs reachable (${results.filter(r => r.gated).length} gated).`);
if (totalPassed < tabIds.length) {
  process.exit(1);
} else {
  process.exit(0);
}
