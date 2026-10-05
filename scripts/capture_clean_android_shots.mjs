import puppeteer from 'puppeteer-core';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ADB = 'C:\\Users\\AMBUJ YADAV\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe';

function adb(cmd) {
  try {
    return execSync(`"${ADB}" ${cmd}`, { encoding: 'utf8' }).trim();
  } catch (e) {
    console.warn(`adb ${cmd} warning:`, e.message);
    return '';
  }
}

function adbScreencap(targetPath) {
  const buf = execSync(`"${ADB}" exec-out screencap -p`, { maxBuffer: 50 * 1024 * 1024 });
  fs.writeFileSync(targetPath, buf);
  console.log(`✓ Saved ${targetPath} (${buf.length} bytes)`);
}

async function main() {
  console.log('Connecting to Android WebView...');
  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
    defaultViewport: null
  });

  const pages = await browser.pages();
  const page = pages.find(p => p.url().includes('localhost') || p.url().includes('index.html')) || pages[0];
  console.log(`Attached to page URL: ${page.url()}`);

  const outDir = path.resolve('docs/screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // Dismiss any ANR / system dialogs
  adb('shell input keyevent KEYCODE_BACK');
  await new Promise(r => setTimeout(r, 500));

  // --- 1. TODAY SCREEN ---
  console.log('\n--- Capturing Today Screen ---');
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'dashboard' }));
  });
  await new Promise(r => setTimeout(r, 1500));

  // Scroll to position Ride hero, 3-stop road, and Pace tile perfectly
  await page.evaluate(() => {
    window.scrollTo({ top: 120, behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 1200));

  adb('shell input keyevent KEYCODE_BACK');
  await new Promise(r => setTimeout(r, 500));
  adbScreencap(path.join(outDir, 'android_today.png'));

  // --- 2. MAP (TERRITORY) SCREEN ---
  console.log('\n--- Capturing Map (Territory) Screen ---');
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'syllabus' }));
  });
  await new Promise(r => setTimeout(r, 1500));

  await page.evaluate(() => {
    const territoryBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Territory'));
    if (territoryBtn) territoryBtn.click();
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 1200));

  adb('shell input keyevent KEYCODE_BACK');
  await new Promise(r => setTimeout(r, 500));
  adbScreencap(path.join(outDir, 'android_map_territory.png'));

  // --- 3. ME SCREEN ---
  console.log('\n--- Capturing Me Screen ---');
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'more_hub' }));
  });
  await new Promise(r => setTimeout(r, 1500));

  await page.evaluate(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await new Promise(r => setTimeout(r, 1200));

  adb('shell input keyevent KEYCODE_BACK');
  await new Promise(r => setTimeout(r, 500));
  adbScreencap(path.join(outDir, 'android_me.png'));

  console.log('\nAll 3 clean Android screenshots captured successfully!');
  await browser.disconnect();
}

main().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
