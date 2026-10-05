import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:\\Users\\AMBUJ YADAV\\.gemini\\antigravity-ide\\brain\\58e0c542-e90b-490e-93d8-363b9e766b54';
const DOCS_DIR = path.resolve('docs/screenshots/phase4');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

if (!fs.existsSync(DOCS_DIR)) {
  fs.mkdirSync(DOCS_DIR, { recursive: true });
}

// Clean out previous files in docs/screenshots/phase4 to maintain clean screenshot directory
for (const f of fs.readdirSync(DOCS_DIR)) {
  try {
    fs.unlinkSync(path.join(DOCS_DIR, f));
  } catch (e) {}
}

// Key files to keep in docs/screenshots/phase4
const KEY_COMMITTED_FILES = new Set([
  'map_bottomsheet_390x844_dark.png',
  'map_list_390x844_dark.png',
  'map_path_390x844_dark.png',
  'map_dark_360x800.png',
  'map_light_360x800.png',
  'map_dark_412x915.png',
  'map_light_412x915.png',
  'map_dark_390x844.png',
  'map_light_390x844.png',
  'today_dark_font130_scrolled.png',
  'today_dark_390x844.png',
  'today_light_390x844.png',
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
  console.log('Starting Phase 4a (fixed 2) mobile verification capture...');

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
      document.querySelectorAll('.fixed.inset-0 button[aria-label*="Close"]').forEach(b => b.click());
    });
    await new Promise(r => setTimeout(r, 300));

    await page.evaluate((idx) => {
      const buttons = Array.from(document.querySelectorAll('#mobile-bottom-nav button'));
      if (buttons[idx]) buttons[idx].click();
    }, index);
    await new Promise(r => setTimeout(r, 800));

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

      // Map (Territory view)
      await navTab(1);
      await captureScreen(page, `map_${theme}_${vp.name}.png`);
    }

    if (theme === 'dark') {
      // Detailed Map Sub-views at 390x844 Dark
      console.log('\n--- Capturing Map Sub-Views (BottomSheet, List, Path) at 390x844 Dark ---');
      await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      await navTab(1);

      // 1. Open BottomSheet by clicking first topic cell
      await page.evaluate(() => {
        const cell = document.querySelector('button[aria-label*="Mechanics & Motion"]') 
          || Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Mechanics & Motion'));
        if (cell) cell.click();
      });
      await new Promise(r => setTimeout(r, 600));
      await captureScreen(page, 'map_bottomsheet_390x844_dark.png');

      // Close BottomSheet
      await page.evaluate(() => {
        const closeBtn = document.querySelector('.fixed.inset-0 button');
        if (closeBtn) closeBtn.click();
      });
      await new Promise(r => setTimeout(r, 400));

      // 2. Switch to List View
      await page.evaluate(() => {
        const listBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === 'List');
        if (listBtn) listBtn.click();
      });
      await new Promise(r => setTimeout(r, 600));
      await captureScreen(page, 'map_list_390x844_dark.png');

      // 3. Switch to Path View
      await page.evaluate(() => {
        const pathBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Path');
        if (pathBtn) pathBtn.click();
      });
      await new Promise(r => setTimeout(r, 600));
      await captureScreen(page, 'map_path_390x844_dark.png');

      // Switch back to Territory View
      await page.evaluate(() => {
        const terrBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Territory');
        if (terrBtn) terrBtn.click();
      });
      await new Promise(r => setTimeout(r, 400));
    }
  }

  // 130% Font Scale: Today scrolled to show START RIDE button
  console.log('\n--- Capturing Today 130% Font Scrolled to START RIDE (390x844 Dark) ---');
  await setTheme('dark');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await setFontScale(130);
  await navTab(0);
  await new Promise(r => setTimeout(r, 600));

  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('START RIDE'));
    if (btn) {
      btn.scrollIntoView({ behavior: 'instant', block: 'center' });
    } else {
      window.scrollTo(0, 320);
    }
  });
  await new Promise(r => setTimeout(r, 600));
  await captureScreen(page, 'today_dark_font130_scrolled.png');

  // Search Focus Ring
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
