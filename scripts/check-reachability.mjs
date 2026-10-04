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

await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });

// Ensure app is loaded and bypass any onboarding
await page.evaluate(() => {
  localStorage.setItem('aspirantx_onboarding_completed', 'true');
  localStorage.setItem('aspirantx_current_user', JSON.stringify({
    id: 'test_user',
    name: 'Aspirant Student',
    email: 'test@studyride.in',
    selectedExam: 'NEET',
    role: 'student',
    isAdmin: false
  }));
});
await page.reload({ waitUntil: 'networkidle0' });

console.log('| Tab ID | Status | Rendered Container / Evidence | Errors |');
console.log('|---|---|---|---|');

const results = [];

for (const tabId of tabIds) {
  errors.length = 0;
  
  const status = await page.evaluate(async (id) => {
    try {
      window.dispatchEvent(new CustomEvent('aspirantx_navigate', { detail: { tab: id } }));
      // Give React a moment to render
      await new Promise(r => setTimeout(r, 250));
      
      const main = document.querySelector('main') || document.body;
      const html = main ? main.innerHTML.trim() : '';
      const text = main ? (main.innerText || '').slice(0, 100).replace(/\s+/g, ' ') : '';
      
      if (html.length > 50) {
        return { ok: true, evidence: text.slice(0, 45) || 'DOM node rendered' };
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
