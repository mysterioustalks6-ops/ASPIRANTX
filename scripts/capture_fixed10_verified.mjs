import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const COMMIT_DIR = path.resolve('docs/screenshots');
const REVIEW_DIR = path.resolve('scratch/review');

[COMMIT_DIR, REVIEW_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function assert(condition, message) {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED] ${message}`);
  }
}

async function assertScreenReady(page, screenName, expectedTheme, expectedZoom) {
  const state = await page.evaluate(() => {
    const text = document.body.innerText || '';
    const hasLoading = text.includes('Loading Syllabus Checklist...') ||
                      text.includes('Loading syllabus topics...') ||
                      text.includes('Loading Question Bank...') ||
                      text.includes('Syncing Study Telemetry...');
    const theme = document.documentElement.classList.contains('light') ? 'light' : 'dark';
    const zoom = document.body.style.zoom || '100%';
    const dataScreen = document.querySelector('[data-screen]')?.getAttribute('data-screen') || '';
    return { textSnippet: text.substring(0, 150), hasLoading, theme, zoom, dataScreen };
  });

  assert(!state.hasLoading, `Screen "${screenName}" contains stuck loading text! Snippet: ${state.textSnippet}`);
  if (expectedTheme) {
    assert(state.theme === expectedTheme, `Screen "${screenName}" expected theme ${expectedTheme} but found ${state.theme}`);
  }
  if (expectedZoom) {
    assert(state.zoom === expectedZoom, `Screen "${screenName}" expected zoom ${expectedZoom} but found ${state.zoom}`);
  }
  console.log(`  ✓ Screen assertion passed for [${screenName}]: theme=${state.theme}, zoom=${state.zoom}`);
}

async function main() {
  console.log('--- Launching Browser for Fixed 10 Verified Screen Captures ---');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(60000);
  const mockUser = {
    id: 'usr_local_test_1',
    name: 'Priya Sharma',
    email: 'priya.sharma@aspirantx.in',
    role: 'USER',
    exam: 'NEET_UG',
    targetYear: 2027,
    level: 3,
    xp: 450,
    streakDays: 7,
    isProfileComplete: true,
    isPremium: false,
  };

  await page.evaluateOnNewDocument((userData) => {
    localStorage.setItem('aspirantx_auth_user', JSON.stringify(userData));
    localStorage.setItem('aspirantx_user_profile', JSON.stringify(userData));
    localStorage.setItem(`aspirantx_profile_cache_${userData.id}`, JSON.stringify(userData));
    localStorage.setItem('aspirantx_global_selected_exam', 'NEET_UG');
    localStorage.setItem('aspirantx_session_v1', JSON.stringify(userData));
    localStorage.setItem('aspirantx_active_exam', 'NEET_UG');
  }, mockUser);

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto('http://127.0.0.1:5173/#dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 });
  
  // Give splash time to appear and click to dismiss
  await new Promise(r => setTimeout(r, 1200));
  await page.evaluate(() => {
    const splash = document.querySelector('[class*="z-[9999]"]');
    if (splash) splash.click();
    const guestBtn = document.querySelector('#hero-guest-btn');
    if (guestBtn) guestBtn.click();
  });
  
  // Wait for bottom nav and click guest button if still on landing page
  for (let i = 0; i < 20; i++) {
    const hasNav = await page.evaluate(() => {
      const splash = document.querySelector('[class*="z-[9999]"]');
      if (splash) splash.click();
      const guestBtn = document.querySelector('#hero-guest-btn');
      if (guestBtn) guestBtn.click();
      return !!document.querySelector('#mobile-bottom-nav');
    });
    if (hasNav) break;
    await new Promise(r => setTimeout(r, 500));
  }
  await page.waitForSelector('#mobile-bottom-nav', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1000));

  async function setTheme(theme) {
    try {
      await page.evaluate((th) => {
        document.documentElement.classList.remove('light', 'dark', 'night');
        document.documentElement.classList.add(th);
        localStorage.setItem('studyride_theme', th);
      }, theme);
    } catch (e) {
      await new Promise(r => setTimeout(r, 600));
      await page.evaluate((th) => {
        document.documentElement.classList.remove('light', 'dark', 'night');
        document.documentElement.classList.add(th);
        localStorage.setItem('studyride_theme', th);
      }, theme);
    }
    await new Promise(r => setTimeout(r, 400));
  }

  async function setZoom(zoom) {
    try {
      await page.evaluate((z) => {
        document.body.style.zoom = z;
      }, zoom);
    } catch (e) {
      await new Promise(r => setTimeout(r, 600));
      await page.evaluate((z) => {
        document.body.style.zoom = z;
      }, zoom);
    }
    await new Promise(r => setTimeout(r, 400));
  }

  // ==========================================
  // ITEM 1: LIST VIEW (LIGHT + DARK) -> COMMIT SET
  // ==========================================
  console.log('\n--- Capturing Item 1: List View ---');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.evaluate(() => {
    window.location.hash = 'syllabus';
    window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'syllabus' }));
    const btns = document.querySelectorAll('#mobile-bottom-nav button');
    if (btns[1]) btns[1].click();
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.evaluate(() => {
    const listBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('List'));
    if (listBtn) listBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Dark List View
  await setTheme('dark');
  await setZoom('100%');
  await assertScreenReady(page, 'List View Dark', 'dark', '100%');
  await page.screenshot({ path: path.join(COMMIT_DIR, 'map_list_dark.png') });
  console.log('✓ Saved docs/screenshots/map_list_dark.png');

  // Light List View
  await setTheme('light');
  await setZoom('100%');
  await assertScreenReady(page, 'List View Light', 'light', '100%');
  await page.screenshot({ path: path.join(COMMIT_DIR, 'map_list_light.png') });
  console.log('✓ Saved docs/screenshots/map_list_light.png');

  // ==========================================
  // ITEM 2: TERRITORY AT 150% (360x800) -> COMMIT SET + 130% in scratch/review
  // ==========================================
  console.log('\n--- Capturing Item 2: Territory at 360x800 ---');
  await page.setViewport({ width: 360, height: 800, deviceScaleFactor: 2 });
  await page.evaluate(() => {
    const terrBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Territory'));
    if (terrBtn) terrBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // Helper to scroll so "Thermodynamics & Heat" is visible
  async function scrollToThermodynamics() {
    await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('h3, div, span, p')).find(e => 
        e.textContent?.includes('Thermodynamics') || e.textContent?.includes('Physics')
      );
      if (el) {
        el.scrollIntoView({ behavior: 'instant', block: 'center' });
      } else {
        window.scrollBy(0, 300);
      }
    });
    await new Promise(r => setTimeout(r, 400));
  }

  // 150% Dark (Commit set)
  await setTheme('dark');
  await setZoom('150%');
  await scrollToThermodynamics();
  await assertScreenReady(page, 'Territory 360 150% Dark', 'dark', '150%');
  await page.screenshot({ path: path.join(COMMIT_DIR, 'map_territory_dark_150.png') });
  console.log('✓ Saved docs/screenshots/map_territory_dark_150.png');

  // 150% Light (Commit set)
  await setTheme('light');
  await setZoom('150%');
  await scrollToThermodynamics();
  await assertScreenReady(page, 'Territory 360 150% Light', 'light', '150%');
  await page.screenshot({ path: path.join(COMMIT_DIR, 'map_territory_light_150.png') });
  console.log('✓ Saved docs/screenshots/map_territory_light_150.png');

  // 130% Dark & Light (Scratch review)
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

  // Reset scroll
  await page.evaluate(() => window.scrollTo(0, 0));

  // ==========================================
  // ITEM 3: PRACTICE (390) -> COMMIT SET practice_dark_130.png + others in scratch/review
  // ==========================================
  console.log('\n--- Capturing Item 3: Practice Hub ---');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.evaluate(() => {
    window.location.hash = 'practice_hub';
    window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'practice_hub' }));
    const btns = document.querySelectorAll('#mobile-bottom-nav button');
    if (btns[2]) btns[2].click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Practice 130% Dark (Commit set)
  await setTheme('dark');
  await setZoom('130%');
  await assertScreenReady(page, 'Practice 390 130% Dark', 'dark', '130%');
  await page.screenshot({ path: path.join(COMMIT_DIR, 'practice_dark_130.png') });
  console.log('✓ Saved docs/screenshots/practice_dark_130.png');

  // Practice 130% Light (Scratch review)
  await setTheme('light');
  await setZoom('130%');
  await assertScreenReady(page, 'Practice 390 130% Light', 'light', '130%');
  await page.screenshot({ path: path.join(REVIEW_DIR, 'practice_light_130.png') });
  console.log('✓ Saved scratch/review/practice_light_130.png');

  // Practice 100% Dark & Light (Scratch review)
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

  // Practice tab row scrolled to end showing Question Bank reachable
  await page.evaluate(() => {
    const scrollContainer = document.querySelector('#practice-tabs-scroll-row');
    if (scrollContainer) scrollContainer.scrollLeft = 500;
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(REVIEW_DIR, 'practice_tabs_scrolled_question_bank.png') });
  console.log('✓ Saved scratch/review/practice_tabs_scrolled_question_bank.png');

  // ==========================================
  // ITEM 4: PATH VIEW (390) -> COMMIT SET map_path_dark_130.png & map_path_light_130.png
  // ==========================================
  console.log('\n--- Capturing Item 4: Path View ---');
  await page.evaluate(() => {
    window.location.hash = 'syllabus';
    window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'syllabus' }));
    const btns = document.querySelectorAll('#mobile-bottom-nav button');
    if (btns[1]) btns[1].click();
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.evaluate(() => {
    const pathBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Path'));
    if (pathBtn) pathBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Path 130% Dark (Commit set)
  await setTheme('dark');
  await setZoom('130%');
  await assertScreenReady(page, 'Path 390 130% Dark', 'dark', '130%');
  await page.screenshot({ path: path.join(COMMIT_DIR, 'map_path_dark_130.png') });
  console.log('✓ Saved docs/screenshots/map_path_dark_130.png');

  // Path 130% Light (Commit set)
  await setTheme('light');
  await setZoom('130%');
  await assertScreenReady(page, 'Path 390 130% Light', 'light', '130%');
  await page.screenshot({ path: path.join(COMMIT_DIR, 'map_path_light_130.png') });
  console.log('✓ Saved docs/screenshots/map_path_light_130.png');

  // Path 100% Dark & Light (Scratch review)
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

  await browser.close();
  console.log('\n✓ Web screenshot capture completed with full assertions.');
}

main().catch(err => {
  console.error('\n❌ CAPTURE FAILED:', err);
  process.exit(1);
});
