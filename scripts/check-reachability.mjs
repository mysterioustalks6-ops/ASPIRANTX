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
      // Dismiss any popups or modals
      document.querySelectorAll('.fixed.inset-0 button[aria-label*="Close"]').forEach(b => b.click());
      window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: { tab: id } }));
      // Give React, AnimatePresence, and lazy components time to mount
      await new Promise(r => setTimeout(r, 750));
      
      const main = document.querySelector('main') || document.body;
      const html = main ? main.innerHTML.trim() : '';
      
      // Look for active view title, heading, or primary badge
      const candidates = Array.from(main.querySelectorAll('h1, h2, h3, [role="heading"], p.font-black, span.font-black, h4'))
        .map(el => el.innerText.trim().replace(/\s+/g, ' '))
        .filter(t => t.length > 3 && !t.includes('Announcement') && !t.includes('StudyRide AI'));
      
      let evidence = candidates[0];
      if (!evidence) {
        const textLines = (main.innerText || '')
          .split('\n')
          .map(s => s.trim())
          .filter(s => s.length > 3 && !s.includes('Announcement') && !s.includes('StudyRide AI'));
        evidence = textLines[0] || 'DOM content rendered';
      }
      evidence = evidence.slice(0, 45);
      
      if (html.length > 50) {
        return { ok: true, evidence: evidence || 'DOM node rendered' };
      }
      return { ok: false, evidence: 'Empty main container' };
    } catch (e) {
      return { ok: false, evidence: e.message };
    }
  }, tabId);

  const errorMsg = errors.length > 0 ? errors.join('; ').slice(0, 30) : 'None';
  const isPass = status.ok && errors.length === 0;

  console.log(`| \`${tabId}\` | ${isPass ? '**PASS**' : '**FAIL**'} | ${status.evidence.replace(/\|/g, '/')} | ${errorMsg} |`);
  results.push({ tabId, pass: isPass });
}

await browser.close();

const totalPassed = results.filter(r => r.pass).length;
console.log(`\nSummary: ${totalPassed}/${tabIds.length} tabs reachable.`);
if (totalPassed < tabIds.length) {
  process.exit(1);
} else {
  process.exit(0);
}
