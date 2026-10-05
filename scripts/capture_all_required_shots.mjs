import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\AMBUJ YADAV\\.gemini\\antigravity-ide\\brain\\58e0c542-e90b-490e-93d8-363b9e766b54';
const DOCS_DIR = path.resolve('docs/screenshots');

async function main() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto('http://localhost:5173/?no_splash=1', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  // Enter guest mode
  await page.evaluate(() => {
    const b = document.querySelector('#hero-guest-btn') || 
              Array.from(document.querySelectorAll('button')).find(x => x.textContent?.includes('Guest Demo'));
    if (b) b.click();
  });
  await page.waitForSelector('[data-screen="dashboard"]', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 1000));

  async function setTheme(theme) {
    await page.evaluate((th) => {
      document.documentElement.classList.remove('light', 'dark', 'night');
      document.documentElement.classList.add(th);
      localStorage.setItem('studyride_theme', th);
    }, theme);
    await new Promise(r => setTimeout(r, 300));
  }

  async function setZoom(zoom) {
    await page.evaluate((z) => {
      document.body.style.zoom = z;
    }, zoom);
    await new Promise(r => setTimeout(r, 300));
  }

  async function saveScreenshot(filename, saveToDocs = false) {
    const artifactPath = path.join(ARTIFACT_DIR, filename);
    await page.screenshot({ path: artifactPath });
    console.log(`Saved artifact: ${artifactPath}`);
    if (saveToDocs) {
      const docPath = path.join(DOCS_DIR, filename);
      fs.copyFileSync(artifactPath, docPath);
      console.log(`Saved doc: ${docPath}`);
    }
  }

  // --- ITEM 5: TERRITORY AT 360x800 WITH 130% AND 150% ---
  console.log('\n--- ITEM 5: Territory at 360x800 (130% and 150%) ---');
  await page.setViewport({ width: 360, height: 800, deviceScaleFactor: 2 });
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'syllabus' }));
  });
  await page.waitForSelector('[data-screen="syllabus"]', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1000));

  // Ensure Territory view
  await page.evaluate(() => {
    const territoryBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Territory'));
    if (territoryBtn) territoryBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // 130% Dark & Light at 360x800
  await setTheme('dark');
  await setZoom('130%');
  await saveScreenshot('map_territory_dark_130.png', true);

  await setTheme('light');
  await setZoom('130%');
  await saveScreenshot('map_territory_light_130.png', true);

  // 150% Dark & Light at 360x800
  await setTheme('dark');
  await setZoom('150%');
  await saveScreenshot('map_territory_360_150_dark.png', false);
  await saveScreenshot('map_territory_360_150.png', true); // committed slot

  await setTheme('light');
  await setZoom('150%');
  await saveScreenshot('map_territory_360_150_light.png', false);

  // Reset zoom and viewport
  await setZoom('100%');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  // --- ITEM 6: LIST VIEW (LIGHT + DARK) ---
  console.log('\n--- ITEM 6: List View (Light + Dark) ---');
  await page.evaluate(() => {
    const listBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('List'));
    if (listBtn) listBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  await setTheme('dark');
  await saveScreenshot('map_list_dark.png', true);

  await setTheme('light');
  await saveScreenshot('map_list_light.png', true);

  // --- ITEM 7: PRACTICE SCREENSHOTS (LIGHT + DARK, 390 and 130%) ---
  console.log('\n--- ITEM 7: Practice Hub (Light + Dark, 390 and 130%) ---');
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'practice_hub' }));
  });
  await page.waitForSelector('[data-screen="practice_hub"]', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1000));

  // 100% zoom
  await setTheme('dark');
  await setZoom('100%');
  await saveScreenshot('practice_dark_390.png', false);

  await setTheme('light');
  await setZoom('100%');
  await saveScreenshot('practice_light_390.png', false);

  // 130% zoom
  await setTheme('dark');
  await setZoom('130%');
  await saveScreenshot('practice_dark_390_130.png', true);

  await setTheme('light');
  await setZoom('130%');
  await saveScreenshot('practice_light_390_130.png', true);

  console.log('\nAll web screenshots captured successfully!');
  await browser.close();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
