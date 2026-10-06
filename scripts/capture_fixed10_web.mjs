import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const COMMIT_DIR = path.resolve('docs/screenshots');
const REVIEW_DIR = path.resolve('scratch/review');

[COMMIT_DIR, REVIEW_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function assert(cond, msg) {
  if (!cond) throw new Error(`[ASSERTION FAILED] ${msg}`);
}

async function assertScreenReady(page, screenName, expectedTheme, expectedZoom) {
  const startTime = Date.now();
  let state;
  while (Date.now() - startTime < 10000) {
    state = await page.evaluate(() => {
      const text = document.body.innerText || '';
      const hasLoading = /Loading\b|Syncing\b/i.test(text);
      const theme = document.documentElement.classList.contains('light') ? 'light' : 'dark';
      const zoom = document.body.style.zoom || '100%';
      const dataScreen = document.querySelector('[data-screen]')?.getAttribute('data-screen') || '';
      return { textSnippet: text.substring(0, 150), hasLoading, theme, zoom, dataScreen };
    });
    if (!state.hasLoading) break;
    await new Promise(r => setTimeout(r, 250));
  }

  assert(!state.hasLoading, `Screen "${screenName}" still contains loading text after 10 seconds! Snippet: ${state.textSnippet}`);
  if (expectedTheme) {
    assert(state.theme === expectedTheme, `Screen "${screenName}" expected theme ${expectedTheme} but found ${state.theme}`);
  }
  if (expectedZoom) {
    assert(state.zoom === expectedZoom, `Screen "${screenName}" expected zoom ${expectedZoom} but found ${state.zoom}`);
  }
  console.log(`  ✓ Screen assertion passed for [${screenName}]: theme=${state.theme}, zoom=${state.zoom}`);
}

async function main() {
  console.log('=== Web Screenshot Capture Pipeline (Fixed 10) ===\n');

  let browser;
  const scriptTimeout = setTimeout(() => {
    console.error('FATAL: Web capture script reached 58s timeout!');
    process.exit(1);
  }, 58000);

  try {
    const profileDir = path.join(process.env.TEMP || 'C:\\Windows\\Temp', 'studyride_web_edge_' + Date.now());
    browser = await puppeteer.launch({
      executablePath: EDGE_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', `--user-data-dir=${profileDir}`]
    });

    const page = await browser.newPage();
    const consoleErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('adsbygoogle') && !text.includes('googleads') && !text.includes('pagead') && !text.includes('404')) {
          consoleErrors.push(text);
          console.error(`  [PAGE CONSOLE ERROR] ${text}`);
        }
      }
    });

    page.on('pageerror', err => {
      consoleErrors.push(err.stack || err.message);
      console.error(`  [PAGE UNCAUGHT ERROR] ${err.message}`);
    });

    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('studyride_skip_splash', 'true');
    });

    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    console.log(`[${new Date().toLocaleTimeString()}] Navigating to app...`);
    await page.goto('http://127.0.0.1:5173/?no_splash=1', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for landing page or bottom nav
    await page.waitForFunction(() => {
      return !!document.querySelector('#mobile-bottom-nav') || !!document.querySelector('#hero-guest-btn');
    }, { timeout: 15000 });

    // Click guest button if on landing page
    await page.evaluate(() => {
      const btn = document.querySelector('#hero-guest-btn');
      if (btn) btn.click();
    });

    await page.waitForSelector('#mobile-bottom-nav', { timeout: 15000 });
    await new Promise(r => setTimeout(r, 600));

    async function setTheme(theme) {
      await page.evaluate((th) => {
        document.documentElement.classList.remove('light', 'dark', 'night');
        document.documentElement.classList.add(th);
        localStorage.setItem('studyride_theme', th);
      }, theme);
      await new Promise(r => setTimeout(r, 200));
    }

    async function setZoom(zoom) {
      await page.evaluate((z) => {
        document.body.style.zoom = z;
      }, zoom);
      await new Promise(r => setTimeout(r, 200));
    }

    // =========================================================================
    // ITEM 1: LIST VIEW (LIGHT + DARK) -> COMMIT SET
    // =========================================================================
    console.log(`\n[${new Date().toLocaleTimeString()}] --- Capturing Item 1: List View ---`);
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.evaluate(() => {
      window.location.hash = 'syllabus';
      window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'syllabus' }));
    });
    await page.waitForSelector('[data-screen="syllabus"]', { timeout: 15000 });
    await new Promise(r => setTimeout(r, 500));

    // Switch to List mode
    await page.evaluate(() => {
      const listBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('List'));
      if (listBtn) listBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    // 1a. List View Light (Commit set)
    await setTheme('light');
    await setZoom('100%');
    await assertScreenReady(page, 'List View Light', 'light', '100%');
    await page.screenshot({ path: path.join(COMMIT_DIR, 'map_list_light.png') });
    console.log('✓ Saved docs/screenshots/map_list_light.png');

    // 1b. List View Dark (Commit set)
    await setTheme('dark');
    await setZoom('100%');
    await assertScreenReady(page, 'List View Dark', 'dark', '100%');
    await page.screenshot({ path: path.join(COMMIT_DIR, 'map_list_dark.png') });
    console.log('✓ Saved docs/screenshots/map_list_dark.png');

    // =========================================================================
    // ITEM 2: TERRITORY AT 360x800 (150% -> COMMIT SET, 130% -> SCRATCH REVIEW)
    // =========================================================================
    console.log(`\n[${new Date().toLocaleTimeString()}] --- Capturing Item 2: Territory at 360x800 ---`);
    await page.setViewport({ width: 360, height: 800, deviceScaleFactor: 2 });
    await page.evaluate(() => {
      const terrBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Territory'));
      if (terrBtn) terrBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    async function scrollToThermodynamics() {
      await page.evaluate(() => {
        const main = document.querySelector('main');
        const el = Array.from(document.querySelectorAll('h3, div, span, p')).find(e => 
          e.textContent?.includes('Thermodynamics')
        );
        if (el) {
          el.scrollIntoView({ behavior: 'instant', block: 'center' });
        } else if (main) {
          main.scrollTop = 220;
        }
      });
      await new Promise(r => setTimeout(r, 200));
    }

    async function scrollToTop() {
      await page.evaluate(() => {
        window.scrollTo(0, 0);
        const main = document.querySelector('main');
        if (main) main.scrollTop = 0;
      });
      await new Promise(r => setTimeout(r, 200));
    }

    // 2a. Territory 150% Dark (Commit set)
    await setTheme('dark');
    await setZoom('150%');
    await scrollToTop();
    await assertScreenReady(page, 'Territory 360 150% Dark', 'dark', '150%');
    await page.screenshot({ path: path.join(COMMIT_DIR, 'map_territory_dark_150.png') });
    console.log('✓ Saved docs/screenshots/map_territory_dark_150.png');

    // 2b. Territory 150% Light (Commit set)
    await setTheme('light');
    await setZoom('150%');
    await scrollToTop();
    await assertScreenReady(page, 'Territory 360 150% Light', 'light', '150%');
    await page.screenshot({ path: path.join(COMMIT_DIR, 'map_territory_light_150.png') });
    console.log('✓ Saved docs/screenshots/map_territory_light_150.png');

    // 2c. Territory 130% Dark & Light (Scratch review)
    await setTheme('dark');
    await setZoom('130%');
    await scrollToThermodynamics();
    await assertScreenReady(page, 'Territory 360 130% Dark', 'dark', '130%');
    await page.screenshot({ path: path.join(REVIEW_DIR, 'map_territory_dark_130_360x800.png') });
    console.log('✓ Saved scratch/review/map_territory_dark_130_360x800.png');

    await setTheme('light');
    await setZoom('130%');
    await scrollToThermodynamics();
    await assertScreenReady(page, 'Territory 360 130% Light', 'light', '130%');
    await page.screenshot({ path: path.join(REVIEW_DIR, 'map_territory_light_130_360x800.png') });
    console.log('✓ Saved scratch/review/map_territory_light_130_360x800.png');

    // Reset zoom & scroll
    await setZoom('100%');
    await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) main.scrollTop = 0;
    });

    // =========================================================================
    // ITEM 3: PRACTICE (390 at 130% Dark -> COMMIT SET, others -> REVIEW)
    // =========================================================================
    console.log(`\n[${new Date().toLocaleTimeString()}] --- Capturing Item 3: Practice Hub ---`);
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.evaluate(() => {
      window.location.hash = 'practice_hub';
      window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'practice_hub' }));
    });
    await new Promise(r => setTimeout(r, 800));

    // 3a. Practice 130% Dark (Commit set)
    await setTheme('dark');
    await setZoom('130%');
    await assertScreenReady(page, 'Practice 390 130% Dark', 'dark', '130%');
    await page.screenshot({ path: path.join(COMMIT_DIR, 'practice_dark_130.png') });
    console.log('✓ Saved docs/screenshots/practice_dark_130.png');

    // 3b. Practice 130% Light (Scratch review)
    await setTheme('light');
    await setZoom('130%');
    await assertScreenReady(page, 'Practice 390 130% Light', 'light', '130%');
    await page.screenshot({ path: path.join(REVIEW_DIR, 'practice_light_130.png') });
    console.log('✓ Saved scratch/review/practice_light_130.png');

    // 3c. Practice 100% Dark & Light (Scratch review)
    await setTheme('dark');
    await setZoom('100%');
    await assertScreenReady(page, 'Practice 390 100% Dark', 'dark', '100%');
    await page.screenshot({ path: path.join(REVIEW_DIR, 'practice_dark_100.png') });
    console.log('✓ Saved scratch/review/practice_dark_100.png');

    await setTheme('light');
    await setZoom('100%');
    await assertScreenReady(page, 'Practice 390 100% Light', 'light', '100%');
    await page.screenshot({ path: path.join(REVIEW_DIR, 'practice_light_100.png') });
    console.log('✓ Saved scratch/review/practice_light_100.png');

    // 3d. Scrolled tab row showing Question Bank reachable
    await page.evaluate(() => {
      const scrollContainer = document.querySelector('#practice-tabs-scroll-row');
      if (scrollContainer) scrollContainer.scrollLeft = 500;
    });
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({ path: path.join(REVIEW_DIR, 'practice_tabs_scrolled_question_bank.png') });
    console.log('✓ Saved scratch/review/practice_tabs_scrolled_question_bank.png');

    // =========================================================================
    // ITEM 4: PATH VIEW (390 at 130% Dark & Light -> COMMIT SET, 100% -> REVIEW)
    // =========================================================================
    console.log(`\n[${new Date().toLocaleTimeString()}] --- Capturing Item 4: Path View ---`);
    await page.evaluate(() => {
      window.location.hash = 'syllabus';
      window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'syllabus' }));
    });
    await page.waitForSelector('[data-screen="syllabus"]', { timeout: 15000 });
    await new Promise(r => setTimeout(r, 500));

    await page.evaluate(() => {
      const pathBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Path'));
      if (pathBtn) pathBtn.click();
    });
    await new Promise(r => setTimeout(r, 800));

    // 4a. Path 130% Dark (Commit set)
    await setTheme('dark');
    await setZoom('130%');
    await assertScreenReady(page, 'Path 390 130% Dark', 'dark', '130%');
    await page.screenshot({ path: path.join(COMMIT_DIR, 'map_path_dark_130.png') });
    console.log('✓ Saved docs/screenshots/map_path_dark_130.png');

    // 4b. Path 130% Light (Commit set)
    await setTheme('light');
    await setZoom('130%');
    await assertScreenReady(page, 'Path 390 130% Light', 'light', '130%');
    await page.screenshot({ path: path.join(COMMIT_DIR, 'map_path_light_130.png') });
    console.log('✓ Saved docs/screenshots/map_path_light_130.png');

    // 4c. Path 100% Dark & Light (Scratch review)
    await setTheme('dark');
    await setZoom('100%');
    await assertScreenReady(page, 'Path 390 100% Dark', 'dark', '100%');
    await page.screenshot({ path: path.join(REVIEW_DIR, 'map_path_dark_100.png') });
    console.log('✓ Saved scratch/review/map_path_dark_100.png');

    await setTheme('light');
    await setZoom('100%');
    await assertScreenReady(page, 'Path 390 100% Light', 'light', '100%');
    await page.screenshot({ path: path.join(REVIEW_DIR, 'map_path_light_100.png') });
    console.log('✓ Saved scratch/review/map_path_light_100.png');

    // Assert zero unhandled console errors
    assert(consoleErrors.length === 0, `Regression Test Failed! Uncaught console errors: ${JSON.stringify(consoleErrors)}`);

    console.log(`\n[${new Date().toLocaleTimeString()}] ✓ ALL WEB CAPTURES COMPLETED WITH STRICT ASSERTIONS!`);
  } finally {
    clearTimeout(scriptTimeout);
    if (browser) await browser.close();
  }
}

main().catch(err => {
  console.error('\n❌ WEB CAPTURE FAILED:', err);
  process.exit(1);
});
