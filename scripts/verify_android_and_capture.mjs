import puppeteer from 'puppeteer-core';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ADB = 'C:\\Users\\AMBUJ YADAV\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe';

function adb(cmd) {
  return execSync(`"${ADB}" ${cmd}`, { encoding: 'utf8' }).trim();
}

function adbScreencap(targetPath) {
  const buf = execSync(`"${ADB}" exec-out screencap -p`, { maxBuffer: 50 * 1024 * 1024 });
  fs.writeFileSync(targetPath, buf);
  console.log(`✓ Saved ${targetPath} (${buf.length} bytes)`);
}

async function main() {
  console.log('Connecting to Android WebView on http://localhost:9222...');
  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
    defaultViewport: null
  });

  const pages = await browser.pages();
  console.log(`Discovered ${pages.length} page(s).`);
  const page = pages.find(p => p.url().includes('localhost') || p.url().includes('index.html')) || pages[0];
  console.log(`Attached to page URL: ${page.url()}`);

  // Dismiss any system dialogs via ADB
  adb('shell input keyevent KEYCODE_BACK');
  await new Promise(r => setTimeout(r, 1000));

  // If on landing page, click Guest Demo
  await page.evaluate(() => {
    const b = document.querySelector('#hero-guest-btn') || 
              Array.from(document.querySelectorAll('button')).find(x => x.textContent?.includes('Guest Demo'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // --- ITEM 2: FONT CHECK ---
  console.log('\n================ ITEM 2: ANDROID WEBVIEW FONT VERIFICATION ================');
  const fontCheck = await page.evaluate(async () => {
    await document.fonts.ready;
    const bodyFont = window.getComputedStyle(document.body).fontFamily;
    const isNunitoLoaded = document.fonts.check('16px "Nunito"');
    const isNunitoBoldLoaded = document.fonts.check('bold 16px "Nunito"');
    
    // Check all loaded font faces
    const loadedFaces = [];
    document.fonts.forEach(f => {
      loadedFaces.push({ family: f.family, weight: f.weight, style: f.style, status: f.status });
    });

    return {
      bodyFont,
      isNunitoLoaded,
      isNunitoBoldLoaded,
      loadedFaces
    };
  });

  console.log('getComputedStyle(document.body).fontFamily:', fontCheck.bodyFont);
  console.log('document.fonts.check(\'16px "Nunito"\'):', fontCheck.isNunitoLoaded);
  console.log('document.fonts.check(\'bold 16px "Nunito"\'):', fontCheck.isNunitoBoldLoaded);
  console.log('Loaded @font-face entries:', JSON.stringify(fontCheck.loadedFaces, null, 2));

  // --- ITEM 1: SCREENSHOTS ---
  console.log('\n================ ITEM 1: ANDROID SCREENSHOTS ================');
  const outDir = path.resolve('docs/screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // 1. TODAY SCREEN (scrolled so full Ride hero, 3-stop road, and Pace tile are visible)
  console.log('Navigating to Today...');
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'dashboard' }));
  });
  await page.waitForSelector('[data-screen="dashboard"]', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 1500));

  // Scroll to bring Ride hero, 3-stop road and Pace tile into view
  await page.evaluate(() => {
    const paceEl = Array.from(document.querySelectorAll('*')).find(el => el.textContent?.includes('Daily Pace') || el.textContent?.includes('Daily pace'));
    if (paceEl) {
      paceEl.scrollIntoView({ block: 'center', behavior: 'instant' });
    } else {
      window.scrollTo(0, 180);
    }
  });
  await new Promise(r => setTimeout(r, 1200));

  adb('shell input keyevent KEYCODE_BACK'); // ensure no overlay
  await new Promise(r => setTimeout(r, 500));
  adbScreencap(path.join(outDir, 'android_today.png'));

  // 2. MAP (TERRITORY) SCREEN
  console.log('Navigating to Map (Territory)...');
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'syllabus' }));
  });
  await page.waitForSelector('[data-screen="syllabus"]', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 1500));

  // Ensure Territory view is active
  await page.evaluate(() => {
    const territoryBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Territory'));
    if (territoryBtn) territoryBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  adb('shell input keyevent KEYCODE_BACK');
  await new Promise(r => setTimeout(r, 500));
  adbScreencap(path.join(outDir, 'android_map_territory.png'));

  // 3. ME SCREEN
  console.log('Navigating to Me...');
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'more_hub' }));
  });
  await page.waitForSelector('[data-screen="more_hub"]', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 1500));

  adb('shell input keyevent KEYCODE_BACK');
  await new Promise(r => setTimeout(r, 500));
  adbScreencap(path.join(outDir, 'android_me.png'));

  console.log('\nAll 3 Android screenshots successfully refreshed without system dialog!');
  await browser.disconnect();
}

main().catch(err => {
  console.error('Execution error:', err);
  process.exit(1);
});
