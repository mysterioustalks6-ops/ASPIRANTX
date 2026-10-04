import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\AMBUJ YADAV\\.gemini\\antigravity-ide\\brain\\58e0c542-e90b-490e-93d8-363b9e766b54';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function main() {
  console.log('Launching browser with puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: { width: 1200, height: 1600 }
  });

  const page = await browser.newPage();
  console.log('Navigating to http://localhost:5173/#design-system...');
  await page.goto('http://localhost:5173/#design-system', { waitUntil: 'networkidle0', timeout: 30000 });

  await new Promise(r => setTimeout(r, 1000));

  // 1. Capture Light Mode
  const lightPath = path.join(ARTIFACT_DIR, 'design_system_light.png');
  await page.screenshot({ path: lightPath, fullPage: true });
  console.log('✓ Captured Light Mode:', lightPath);

  // 2. Switch to Dark Mode & Capture
  console.log('Switching to Dark Mode...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const darkBtn = buttons.find(b => b.textContent.includes('Dark'));
    if (darkBtn) darkBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  const darkPath = path.join(ARTIFACT_DIR, 'design_system_dark.png');
  await page.screenshot({ path: darkPath, fullPage: true });
  console.log('✓ Captured Dark Mode:', darkPath);

  // 3. Switch to Night (OLED) Mode & Capture
  console.log('Switching to Night (OLED) Mode...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const nightBtn = buttons.find(b => b.textContent.includes('Night'));
    if (nightBtn) nightBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  const nightPath = path.join(ARTIFACT_DIR, 'design_system_night.png');
  await page.screenshot({ path: nightPath, fullPage: true });
  console.log('✓ Captured Night Mode:', nightPath);

  // 4. Test Celebration Overlay
  console.log('Triggering Celebration Overlay...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const celebBtn = buttons.find(b => b.textContent.includes('Trigger Ride Celebration'));
    if (celebBtn) celebBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));
  const celebPath = path.join(ARTIFACT_DIR, 'design_system_celebration.png');
  await page.screenshot({ path: celebPath, fullPage: false });
  console.log('✓ Captured Celebration Overlay:', celebPath);

  await browser.close();
  console.log('All screenshots captured successfully!');
}

main().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});
