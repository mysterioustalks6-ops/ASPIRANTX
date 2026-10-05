import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:\\Users\\AMBUJ YADAV\\.gemini\\antigravity-ide\\brain\\58e0c542-e90b-490e-93d8-363b9e766b54';
const DOCS_DIR = path.resolve('docs/screenshots');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

if (!fs.existsSync(DOCS_DIR)) {
  fs.mkdirSync(DOCS_DIR, { recursive: true });
}

// Remove legacy files from docs/screenshots to keep count <= 10
function cleanDocsDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      cleanDocsDir(fullPath);
      try { fs.rmdirSync(fullPath); } catch (e) {}
    } else {
      try { fs.unlinkSync(fullPath); } catch (e) {}
    }
  }
}

cleanDocsDir(DOCS_DIR);

async function captureScreen(page, filename) {
  const artifactPath = path.join(ARTIFACT_DIR, filename);
  const docsPath = path.join(DOCS_DIR, filename);
  await page.screenshot({ path: artifactPath });
  fs.copyFileSync(artifactPath, docsPath);
  console.log(`Saved screenshot: ${filename}`);
}

async function main() {
  console.log('Capturing Phase 4a (fixed 3) screenshots...');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();

  const navTab = async (index) => {
    await page.evaluate(() => {
      document.querySelectorAll('.fixed.inset-0 button[aria-label*="Close"]').forEach(b => b.click());
    });
    await new Promise(r => setTimeout(r, 200));

    await page.evaluate((idx) => {
      const buttons = Array.from(document.querySelectorAll('#mobile-bottom-nav button'));
      if (buttons[idx]) buttons[idx].click();
    }, index);
    await new Promise(r => setTimeout(r, 600));
  };

  const setTheme = async (theme) => {
    await page.evaluate((th) => {
      document.documentElement.classList.remove('light', 'dark', 'night');
      document.documentElement.classList.add(th);
      localStorage.setItem('studyride_theme', th);
      localStorage.setItem('sr_theme', th);
    }, theme);
    await new Promise(r => setTimeout(r, 400));
  };

  const setFontScale = async (scalePercent) => {
    await page.evaluate((scale) => {
      document.documentElement.style.fontSize = `${scale}%`;
    }, scalePercent);
    await new Promise(r => setTimeout(r, 400));
  };

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:5173/?no_splash=1', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 1500));

  // Enter guest mode
  await page.evaluate(() => {
    const b = document.querySelector('#hero-guest-btn') || Array.from(document.querySelectorAll('button')).find(x => x.textContent?.includes('Guest Demo'));
    if (b) b.click();
  });

  await page.waitForSelector('#mobile-bottom-nav', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 1000));

  const themes = ['dark', 'light'];

  for (const theme of themes) {
    await setTheme(theme);
    await setFontScale(100);

    // 1. Today 360x800
    await page.setViewport({ width: 360, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await navTab(0);
    await new Promise(r => setTimeout(r, 500));
    await captureScreen(page, `today_${theme}_360x800.png`);

    // 2. Today 412x915
    await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await navTab(0);
    await new Promise(r => setTimeout(r, 500));
    await captureScreen(page, `today_${theme}_412x915.png`);

    // 3. Today 390x844
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await navTab(0);
    await new Promise(r => setTimeout(r, 500));
    await captureScreen(page, `today_${theme}_390x844.png`);

    // 4. Map 130% Font Scale (390x844)
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await setFontScale(130);
    await navTab(1); // Map tab
    await new Promise(r => setTimeout(r, 600));
    await captureScreen(page, `map_${theme}_font130.png`);
    await setFontScale(100);
  }

  await browser.close();
  console.log(`Finished capture. Total files in docs/screenshots: ${fs.readdirSync(DOCS_DIR).length}`);
}

main().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
