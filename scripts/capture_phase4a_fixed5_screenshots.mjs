import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outDir = path.resolve('docs/screenshots');

// Ensure outDir exists
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function capture() {
  const browser = await puppeteer.launch({ 
    executablePath: EDGE_PATH, 
    headless: true, 
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();

  async function initSession(width, height, dpr = 2) {
    await page.setViewport({ width, height, deviceScaleFactor: dpr });
    await page.goto('http://localhost:5173/?no_splash=1', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 1500));
    await page.evaluate(() => {
      const b = document.querySelector('#hero-guest-btn') || Array.from(document.querySelectorAll('button')).find(x => x.textContent?.includes('Guest Demo'));
      if (b) b.click();
    });
    await page.waitForSelector('#mobile-bottom-nav', { timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));
  }

  async function setTheme(th) {
    await page.evaluate((t) => {
      document.documentElement.classList.remove('light', 'dark', 'night');
      document.documentElement.classList.add(t);
      localStorage.setItem('studyride_theme', t);
    }, th);
    await new Promise(r => setTimeout(r, 300));
  }

  async function navTab(tab) {
    await page.evaluate((t) => {
      window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: t }));
    }, tab);
    await new Promise(r => setTimeout(r, 800));
  }

  async function setMapView(view) {
    await page.evaluate((v) => {
      const btns = Array.from(document.querySelectorAll('button'));
      const target = btns.find(b => b.textContent?.trim().toLowerCase() === v.toLowerCase());
      if (target) target.click();
    }, view);
    await new Promise(r => setTimeout(r, 800));
  }

  // 1 & 2. Map Territory 360x800 (Light & Dark)
  console.log('Capturing Map Territory 360x800 (Light & Dark)...');
  await initSession(360, 800);
  await navTab('syllabus');
  await setMapView('territory');
  
  await setTheme('light');
  await page.screenshot({ path: path.join(outDir, 'map_territory_light_360x800.png') });
  console.log('Saved map_territory_light_360x800.png');

  await setTheme('dark');
  await page.screenshot({ path: path.join(outDir, 'map_territory_dark_360x800.png') });
  console.log('Saved map_territory_dark_360x800.png');

  // 3 & 4. Map Territory at 130% zoom (Light & Dark)
  console.log('Capturing Map Territory at 130% zoom...');
  await page.evaluate(() => {
    document.body.style.zoom = '1.3';
  });
  await setTheme('light');
  await page.screenshot({ path: path.join(outDir, 'map_territory_light_130.png') });
  console.log('Saved map_territory_light_130.png');

  await setTheme('dark');
  await page.screenshot({ path: path.join(outDir, 'map_territory_dark_130.png') });
  console.log('Saved map_territory_dark_130.png');

  // Reset zoom
  await page.evaluate(() => {
    document.body.style.zoom = '1.0';
  });

  // 5. Map List (light, after fix)
  console.log('Capturing Map List (light)...');
  await setTheme('light');
  await setMapView('list');
  await page.screenshot({ path: path.join(outDir, 'map_list_light.png') });
  console.log('Saved map_list_light.png');

  // 6 & 7. Path 390 + 130% (Light & Dark)
  console.log('Capturing Path 390 + 130% (Light & Dark)...');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await setMapView('path');
  await page.evaluate(() => {
    document.body.style.zoom = '1.3';
  });

  await setTheme('light');
  await page.screenshot({ path: path.join(outDir, 'map_path_light_390_130.png') });
  console.log('Saved map_path_light_390_130.png');

  await setTheme('dark');
  await page.screenshot({ path: path.join(outDir, 'map_path_dark_390_130.png') });
  console.log('Saved map_path_dark_390_130.png');

  // Reset zoom
  await page.evaluate(() => {
    document.body.style.zoom = '1.0';
  });

  // 8. Practice (light)
  console.log('Capturing Practice (light)...');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await setTheme('light');
  await navTab('practice_hub');
  await page.screenshot({ path: path.join(outDir, 'practice_light.png') });
  console.log('Saved practice_light.png');

  await browser.close();
  console.log('All screenshots captured successfully.');
}

capture().catch(err => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
