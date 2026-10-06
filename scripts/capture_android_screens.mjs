import puppeteer from 'puppeteer-core';
import { execSync } from 'child_process';
import path from 'path';

const ADB = process.env.LOCALAPPDATA + '\\Android\\Sdk\\platform-tools\\adb.exe';

async function main() {
  console.log('Connecting to Android WebView DevTools on port 9222...');
  const browser = await puppeteer.connect({ browserURL: 'http://localhost:9222' });
  const pages = await browser.pages();
  const page = pages[0];

  function captureAndroid(outName) {
    execSync(`"${ADB}" shell screencap -p /sdcard/screen.png`);
    execSync(`"${ADB}" pull /sdcard/screen.png "${path.resolve('docs/screenshots', outName)}"`);
    console.log(`✓ Successfully pulled docs/screenshots/${outName}`);
  }

  // 1. Android Today
  console.log('Navigating to Today tab...');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('#mobile-bottom-nav button');
    if (btns[0]) btns[0].click();
  });
  await new Promise(r => setTimeout(r, 1500));
  captureAndroid('android_today.png');

  // 2. Android Map (Territory)
  console.log('Navigating to Map Territory tab...');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('#mobile-bottom-nav button');
    if (btns[1]) btns[1].click();
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.evaluate(() => {
    const terrBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Territory'));
    if (terrBtn) terrBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  captureAndroid('android_map_territory.png');

  // 3. Android Me
  console.log('Navigating to Me tab...');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('#mobile-bottom-nav button');
    if (btns[4]) btns[4].click();
  });
  await new Promise(r => setTimeout(r, 1500));
  captureAndroid('android_me.png');

  await browser.disconnect();
  console.log('\nAll 3 Android screenshots captured successfully!');
}

main().catch(err => {
  console.error('Android capture failed:', err);
  process.exit(1);
});
