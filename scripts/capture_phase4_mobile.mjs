import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:\\Users\\AMBUJ YADAV\\.gemini\\antigravity-ide\\brain\\58e0c542-e90b-490e-93d8-363b9e766b54';
const DOCS_DIR = path.resolve('docs/screenshots/phase4');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

if (!fs.existsSync(DOCS_DIR)) {
  fs.mkdirSync(DOCS_DIR, { recursive: true });
}

// Clean out previous files in docs/screenshots/phase4 to strictly maintain <= 10 files
for (const f of fs.readdirSync(DOCS_DIR)) {
  try {
    fs.unlinkSync(path.join(DOCS_DIR, f));
  } catch (e) {}
}

// Exactly the 10 key files to keep in docs/screenshots/phase4
const KEY_COMMITTED_FILES = new Set([
  'today_dark_390x844.png',
  'today_light_390x844.png',
  'today_light_360x800.png',
  'today_dark_font130.png',
  'today_light_font130.png',
  'map_dark_390x844.png',
  'map_light_390x844.png',
  'map_dark_font130.png',
  'map_light_font130.png',
  'search_focus_ring_390x844.png'
]);

async function captureScreen(page, filename) {
  const artifactPath = path.join(ARTIFACT_DIR, filename);
  await page.screenshot({ path: artifactPath });
  if (KEY_COMMITTED_FILES.has(filename)) {
    const docsPath = path.join(DOCS_DIR, filename);
    fs.copyFileSync(artifactPath, docsPath);
    console.log(`Saved to docs/screenshots/phase4: ${filename}`);
  } else {
    console.log(`Saved to artifact store: ${filename}`);
  }
}

async function main() {
  console.log('Starting Phase 4a mobile verification capture...');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  await page.goto('http://localhost:5173/?no_splash=1', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1200));

  // Enter shell
  await page.evaluate(() => {
    const b = document.querySelector('#hero-guest-btn') || Array.from(document.querySelectorAll('button')).find(x => x.textContent?.includes('Guest Demo'));
    if (b) b.click();
  });

  await page.waitForSelector('#mobile-bottom-nav', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 1000));

  const navTab = async (index) => {
    // Ensure all modals are closed before switching tabs
    await page.evaluate(() => {
      document.querySelectorAll('.fixed.inset-0.z-50 button[aria-label*="Close"]').forEach(b => b.click());
    });
    await new Promise(r => setTimeout(r, 300));

    await page.evaluate((idx) => {
      const buttons = Array.from(document.querySelectorAll('#mobile-bottom-nav button'));
      if (buttons[idx]) buttons[idx].click();
    }, index);
    await new Promise(r => setTimeout(r, 800));

    // Wait for content container
    if (index === 0) {
      await page.waitForSelector('#student-dashboard', { visible: true, timeout: 10000 });
    }
  };

  const setTheme = async (theme) => {
    await page.evaluate((th) => {
      document.documentElement.classList.remove('light', 'dark', 'night');
      document.documentElement.classList.add(th);
      localStorage.setItem('studyride_theme', th);
      localStorage.setItem('sr_theme', th);
    }, theme);
    await new Promise(r => setTimeout(r, 500));
  };

  const setFontScale = async (scalePercent) => {
    await page.evaluate((scale) => {
      document.documentElement.style.fontSize = `${scale}%`;
    }, scalePercent);
    await new Promise(r => setTimeout(r, 400));
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

    // Standard viewports: 360x800, 390x844, 412x915
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
    }

    // 130% Font Scale verification (using 390x844)
    console.log(`\n--- Viewport: 390x844 with 130% Font Scale (${theme}) ---`);
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await setFontScale(130);

    // Today 130%
    await navTab(0);
    await captureScreen(page, `today_${theme}_font130.png`);

    // Map 130%
    await navTab(1);
    await captureScreen(page, `map_${theme}_font130.png`);
  }

  // Blocker 2 Focus Verification Screenshot:
  // Open search modal, focus search input, capture 390x844 showing ring on wrapper and NO double outline on input
  console.log('\n--- Capturing Search Focus Ring at 390x844 ---');
  await setTheme('dark');
  await setFontScale(100);
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('studyride:open-search'));
  });
  await new Promise(r => setTimeout(r, 600));
  await page.evaluate(() => {
    const input = document.querySelector('input[placeholder*="Search features"]');
    if (input) input.focus();
  });
  await new Promise(r => setTimeout(r, 400));
  await captureScreen(page, 'search_focus_ring_390x844.png');

  await browser.close();
  console.log('\nAll captures completed successfully! Key committed count: ', fs.readdirSync(DOCS_DIR).length);
}

main().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
