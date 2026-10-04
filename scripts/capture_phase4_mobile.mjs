import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:\\Users\\AMBUJ YADAV\\.gemini\\antigravity-ide\\brain\\58e0c542-e90b-490e-93d8-363b9e766b54';
const DOCS_DIR = path.resolve('docs/screenshots/phase4');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

if (!fs.existsSync(DOCS_DIR)) {
  fs.mkdirSync(DOCS_DIR, { recursive: true });
}

async function captureScreen(page, filename) {
  const artifactPath = path.join(ARTIFACT_DIR, filename);
  const docsPath = path.join(DOCS_DIR, filename);
  await page.screenshot({ path: artifactPath });
  fs.copyFileSync(artifactPath, docsPath);
  console.log(`Saved screenshot: ${filename}`);
}

async function main() {
  console.log('Starting Phase 4a mobile verification capture (Dark + Light across viewports)...');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();

  // Set default mobile viewport before page load
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  console.log('Navigating to http://localhost:5173/?no_splash=1...');
  await page.goto('http://localhost:5173/?no_splash=1', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1200));

  // Click guest demo button to enter shell
  await page.evaluate(() => {
    const b = document.querySelector('#hero-guest-btn') || Array.from(document.querySelectorAll('button')).find(x => x.textContent?.includes('Guest Demo'));
    if (b) b.click();
  });

  await page.waitForSelector('#mobile-bottom-nav', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 1200));
  console.log('App shell loaded successfully with #mobile-bottom-nav!');

  const navTab = async (index) => {
    await page.evaluate((idx) => {
      const buttons = Array.from(document.querySelectorAll('#mobile-bottom-nav button'));
      if (buttons[idx]) buttons[idx].click();
    }, index);
    await new Promise(r => setTimeout(r, 800));
  };

  const openExamSheet = async () => {
    await page.evaluate(() => {
      const headerBtn = document.querySelector('header button:first-child');
      if (headerBtn) headerBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));
  };

  const closeExamSheet = async () => {
    await page.evaluate(() => {
      const closeBtn = document.querySelector('button[aria-label="Close sheet"]');
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));
  };

  const openSearchSheet = async () => {
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('studyride:open-search'));
    });
    await new Promise(r => setTimeout(r, 600));
  };

  const closeSearchSheet = async () => {
    await page.evaluate(() => {
      const closeBtn = document.querySelector('button[aria-label="Close search sheet"]');
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));
  };

  const setTheme = async (theme) => {
    await page.evaluate((th) => {
      document.documentElement.classList.remove('light', 'dark', 'night');
      document.documentElement.classList.add(th);
      localStorage.setItem('studyride_theme', th);
    }, theme);
    await new Promise(r => setTimeout(r, 400));
  };

  const setFontScale = async (scalePercent) => {
    await page.evaluate((scale) => {
      document.documentElement.style.fontSize = `${scale}%`;
    }, scalePercent);
    await new Promise(r => setTimeout(r, 300));
  };

  const themes = ['dark', 'light'];
  const viewports = [
    { name: '360x800', width: 360, height: 800 },
    { name: '390x844', width: 390, height: 844 },
    { name: '412x915', width: 412, height: 915 },
  ];

  for (const theme of themes) {
    console.log(`\n================== Capturing Theme: ${theme.toUpperCase()} ==================`);
    await setTheme(theme);

    // 1. Standard viewports: 360x800, 390x844, 412x915
    for (const vp of viewports) {
      console.log(`\n--- Viewport: ${vp.name} (${theme}) ---`);
      await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      await setFontScale(100);

      // Today
      await navTab(0);
      await captureScreen(page, `today_${theme}_${vp.name}.png`);

      // Map
      await navTab(1);
      await captureScreen(page, `map_${theme}_${vp.name}.png`);

      // Me
      await navTab(4);
      await captureScreen(page, `me_${theme}_${vp.name}.png`);

      // Exam sheet
      await openExamSheet();
      await captureScreen(page, `exam_sheet_${theme}_${vp.name}.png`);
      await closeExamSheet();

      // Search sheet
      await openSearchSheet();
      await captureScreen(page, `search_sheet_${theme}_${vp.name}.png`);
      await closeSearchSheet();
    }

    // 2. 130% Font Scale verification (using 390x844)
    console.log(`\n--- Viewport: 390x844 with 130% Font Scale (${theme}) ---`);
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await setFontScale(130);

    // Today
    await navTab(0);
    await captureScreen(page, `today_${theme}_font130.png`);

    // Map
    await navTab(1);
    await captureScreen(page, `map_${theme}_font130.png`);

    // Me
    await navTab(4);
    await captureScreen(page, `me_${theme}_font130.png`);

    // Exam sheet
    await openExamSheet();
    await captureScreen(page, `exam_sheet_${theme}_font130.png`);
    await closeExamSheet();

    // Search sheet
    await openSearchSheet();
    await captureScreen(page, `search_sheet_${theme}_font130.png`);
    await closeSearchSheet();
  }

  await browser.close();
  console.log('\nAll Phase 4a mobile verification captures completed successfully!');
}

main().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
