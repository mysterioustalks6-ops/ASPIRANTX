import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const outDir = path.resolve('docs/screenshots');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

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
  await page.waitForSelector('#mobile-bottom-nav', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 1000));

  // Helper to set theme
  async function setTheme(theme) {
    await page.evaluate((th) => {
      document.documentElement.classList.remove('light', 'dark', 'night');
      document.documentElement.classList.add(th);
      localStorage.setItem('studyride_theme', th);
    }, theme);
    await new Promise(r => setTimeout(r, 400));
  }

  // Helper to set zoom
  async function setZoom(zoom) {
    await page.evaluate((z) => {
      document.body.style.zoom = z;
    }, zoom);
    await new Promise(r => setTimeout(r, 400));
  }

  // Navigate to Syllabus / Map
  await page.evaluate(() => {
    window.location.hash = 'syllabus';
    window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'syllabus' }));
    const btns = document.querySelectorAll('#mobile-bottom-nav button');
    if (btns[1]) btns[1].click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // 1. CAPTURE PATH VIEW AT 390 (DARK & LIGHT)
  await page.evaluate(() => {
    const pathBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Path'));
    if (pathBtn) pathBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Path 390 (100% Dark & Light)
  await setTheme('dark');
  await setZoom('100%');
  await page.screenshot({ path: path.join(outDir, 'map_path_dark_390.png') });
  console.log('✓ Captured map_path_dark_390.png');

  await setTheme('light');
  await setZoom('100%');
  await page.screenshot({ path: path.join(outDir, 'map_path_light_390.png') });
  console.log('✓ Captured map_path_light_390.png');

  // Path 390 & 130% Dark
  await setTheme('dark');
  await setZoom('130%');
  await page.screenshot({ path: path.join(outDir, 'map_path_dark_390_130.png') });
  console.log('✓ Captured map_path_dark_390_130.png');

  // Path 390 & 130% Light
  await setTheme('light');
  await setZoom('130%');
  await page.screenshot({ path: path.join(outDir, 'map_path_light_390_130.png') });
  console.log('✓ Captured map_path_light_390_130.png');

  // Reset zoom
  await setZoom('100%');

  // 2. CAPTURE TERRITORY AT 130% (DARK & LIGHT)
  await page.evaluate(() => {
    const territoryBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Territory'));
    if (territoryBtn) territoryBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Territory 130% Dark
  await setTheme('dark');
  await setZoom('130%');
  await page.screenshot({ path: path.join(outDir, 'map_territory_dark_130.png') });
  console.log('✓ Captured map_territory_dark_130.png');

  // Territory 130% Light
  await setTheme('light');
  await setZoom('130%');
  await page.screenshot({ path: path.join(outDir, 'map_territory_light_130.png') });
  console.log('✓ Captured map_territory_light_130.png');

  // Reset zoom
  await setZoom('100%');

  // 3. CAPTURE LIST (LIGHT, AFTER FIX)
  await page.evaluate(() => {
    const listBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('List'));
    if (listBtn) listBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await setTheme('light');
  await page.screenshot({ path: path.join(outDir, 'map_list_light.png') });
  console.log('✓ Captured map_list_light.png');

  await browser.close();
  console.log('All web screenshots captured successfully!');
}

main().catch(err => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
