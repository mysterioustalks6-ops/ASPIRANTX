import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outDir = path.resolve('docs/screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function capture() {
  const browser = await puppeteer.launch({ executablePath: EDGE_PATH, headless: true, args: ['--no-sandbox'] });
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

  // 1 & 2: Today 360x800 (Light & Dark)
  await initSession(360, 800);
  await setTheme('light');
  await navTab('dashboard');
  await page.screenshot({ path: path.join(outDir, 'today_light_360x800.png') });
  console.log('Captured today_light_360x800.png');

  await setTheme('dark');
  await navTab('dashboard');
  await page.screenshot({ path: path.join(outDir, 'today_dark_360x800.png') });
  console.log('Captured today_dark_360x800.png');

  // 3 & 4: Today 412x915 (Light & Dark)
  await initSession(412, 915);
  await setTheme('light');
  await navTab('dashboard');
  await page.screenshot({ path: path.join(outDir, 'today_light_412x915.png') });
  console.log('Captured today_light_412x915.png');

  await setTheme('dark');
  await navTab('dashboard');
  await page.screenshot({ path: path.join(outDir, 'today_dark_412x915.png') });
  console.log('Captured today_dark_412x915.png');

  // 5: Map List (Light)
  await initSession(390, 844);
  await setTheme('light');
  await navTab('syllabus');
  // Switch to list view if currently in path view
  await page.evaluate(() => {
    const listBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('List') || b.getAttribute('aria-label')?.includes('list'));
    if (listBtn) listBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, 'map_light_list.png') });
  console.log('Captured map_light_list.png');

  // 6: Map Path (Light)
  await page.evaluate(() => {
    const pathBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Journey') || b.textContent?.includes('Path') || b.getAttribute('aria-label')?.includes('path'));
    if (pathBtn) pathBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, 'map_light_path.png') });
  console.log('Captured map_light_path.png');

  // 7 & 8: Map 130% Font Zoom (Light & Dark)
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '130%';
  });
  await setTheme('light');
  await page.screenshot({ path: path.join(outDir, 'map_light_font130.png') });
  console.log('Captured map_light_font130.png');

  await setTheme('dark');
  await page.screenshot({ path: path.join(outDir, 'map_dark_font130.png') });
  console.log('Captured map_dark_font130.png');

  await page.evaluate(() => {
    document.documentElement.style.fontSize = '';
  });

  // 9: Practice Hub (Light)
  await setTheme('light');
  await navTab('practice_hub');
  await page.screenshot({ path: path.join(outDir, 'practice_light.png') });
  console.log('Captured practice_light.png');

  // 10: League / Leaderboard (Light)
  await navTab('leaderboard');
  await page.screenshot({ path: path.join(outDir, 'league_light.png') });
  console.log('Captured league_light.png');

  await browser.close();
}

capture().catch(console.error);
