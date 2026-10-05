import puppeteer from 'puppeteer-core';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ADB = 'C:\\Users\\AMBUJ YADAV\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe';

async function main() {
  console.log('Connecting to Android WebView via DevTools port 9222...');
  
  // Forward port 9222 just in case
  try {
    const unixPipes = execSync(`"${ADB}" shell cat /proc/net/unix | findstr devtools_remote`).toString();
    console.log('Unix devtools sockets found:\n', unixPipes);
    const m = unixPipes.match(/@webview_devtools_remote_(\d+)/);
    if (m) {
      const pid = m[1];
      console.log(`Forwarding tcp:9222 to localabstract:webview_devtools_remote_${pid}...`);
      execSync(`"${ADB}" forward tcp:9222 localabstract:webview_devtools_remote_${pid}`);
    }
  } catch (e) {
    console.log('Forward check error or already forwarded:', e.message);
  }

  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
    defaultViewport: null
  });

  const pages = await browser.pages();
  console.log(`Discovered ${pages.length} WebView page(s).`);
  let page = pages.find(p => p.url().includes('localhost')) || pages[0];

  console.log(`Active WebView URL: ${page.url()}`);

  // Check if landing page guest demo needs to be clicked
  await page.evaluate(() => {
    const b = document.querySelector('#hero-guest-btn') || 
              Array.from(document.querySelectorAll('button')).find(x => x.textContent?.includes('Guest Demo'));
    if (b) {
      console.log('Clicking Guest Demo button inside WebView...');
      b.click();
    }
  });

  await new Promise(r => setTimeout(r, 2000));

  // Ensure docs/screenshots directory exists
  const outDir = path.resolve('docs/screenshots');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. CAPTURE TODAY SCREEN
  console.log('\n--- 1. Navigating to Today Screen ---');
  await page.evaluate(() => {
    window.location.hash = 'dashboard';
    window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'dashboard' }));
    const btns = document.querySelectorAll('#mobile-bottom-nav button');
    if (btns[0]) btns[0].click();
  });
  await new Promise(r => setTimeout(r, 2000));

  const todayInfo = await page.evaluate(() => {
    const main = document.querySelector('main') || document.body;
    return {
      title: document.title,
      hash: window.location.hash,
      heading: main.querySelector('h1, h2, h3, [role="heading"]')?.textContent?.trim() || 'No heading',
      textSnippet: main.innerText?.slice(0, 150)
    };
  });
  console.log('Today Screen State:', todayInfo);

  // Take screenshot via adb screencap for 100% native Android fidelity
  execSync(`"${ADB}" exec-out screencap -p > "docs/screenshots/android_today.png"`);
  console.log(`✓ Saved docs/screenshots/android_today.png (${fs.statSync('docs/screenshots/android_today.png').size} bytes)`);

  // 2. CAPTURE MAP (TERRITORY) SCREEN
  console.log('\n--- 2. Navigating to Map (Territory) Screen ---');
  await page.evaluate(() => {
    window.location.hash = 'syllabus';
    window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'syllabus' }));
    const btns = document.querySelectorAll('#mobile-bottom-nav button');
    if (btns[1]) btns[1].click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // Ensure Territory view is active
  await page.evaluate(() => {
    const territoryBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Territory'));
    if (territoryBtn) territoryBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const mapInfo = await page.evaluate(() => {
    const main = document.querySelector('main') || document.body;
    return {
      title: document.title,
      hash: window.location.hash,
      heading: main.querySelector('h1, h2, h3, [role="heading"]')?.textContent?.trim() || 'No heading',
      textSnippet: main.innerText?.slice(0, 150)
    };
  });
  console.log('Map (Territory) Screen State:', mapInfo);

  execSync(`"${ADB}" exec-out screencap -p > "docs/screenshots/android_map_territory.png"`);
  console.log(`✓ Saved docs/screenshots/android_map_territory.png (${fs.statSync('docs/screenshots/android_map_territory.png').size} bytes)`);

  // 3. CAPTURE ME (MORE HUB) SCREEN
  console.log('\n--- 3. Navigating to Me Screen ---');
  await page.evaluate(() => {
    window.location.hash = 'more_hub';
    window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'more_hub' }));
    const btns = document.querySelectorAll('#mobile-bottom-nav button');
    if (btns[4]) btns[4].click();
  });
  await new Promise(r => setTimeout(r, 2000));

  const meInfo = await page.evaluate(() => {
    const main = document.querySelector('main') || document.body;
    return {
      title: document.title,
      hash: window.location.hash,
      heading: main.querySelector('h1, h2, h3, [role="heading"]')?.textContent?.trim() || 'No heading',
      textSnippet: main.innerText?.slice(0, 150)
    };
  });
  console.log('Me Screen State:', meInfo);

  execSync(`"${ADB}" exec-out screencap -p > "docs/screenshots/android_me.png"`);
  console.log(`✓ Saved docs/screenshots/android_me.png (${fs.statSync('docs/screenshots/android_me.png').size} bytes)`);

  // 4. TEST OFFLINE (AIRPLANE MODE ON)
  console.log('\n--- 4. Testing Offline Capabilities (Airplane Mode ON) ---');
  try {
    execSync(`"${ADB}" shell cmd connectivity airplane-mode enable`);
    console.log('Airplane mode: ENABLED');
    await new Promise(r => setTimeout(r, 1000));

    // Test Map/Territory offline
    await page.evaluate(() => {
      window.location.hash = 'syllabus';
      window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'syllabus' }));
      const btns = document.querySelectorAll('#mobile-bottom-nav button');
      if (btns[1]) btns[1].click();
    });
    await new Promise(r => setTimeout(r, 2000));
    await page.evaluate(() => {
      const territoryBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Territory'));
      if (territoryBtn) territoryBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    const offlineTerritory = await page.evaluate(() => {
      const main = document.querySelector('main') || document.body;
      return {
        onlineStatus: navigator.onLine,
        hasTerritory: main.innerText?.includes('Territory') || main.innerText?.includes('Mastered'),
        snippet: main.innerText?.slice(0, 100)
      };
    });
    console.log('Offline Territory Test Result:', offlineTerritory);

    // Test CBT simulator offline
    await page.evaluate(() => {
      window.location.hash = 'practice_hub';
      window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'practice_hub' }));
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.evaluate(() => {
      const cbtBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('CBT'));
      if (cbtBtn) cbtBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    const offlineCbt = await page.evaluate(() => {
      const main = document.querySelector('main') || document.body;
      return {
        onlineStatus: navigator.onLine,
        hasCbt: main.innerText?.includes('CBT') || main.innerText?.includes('Simulator') || main.innerText?.includes('Mock'),
        snippet: main.innerText?.slice(0, 100)
      };
    });
    console.log('Offline CBT Test Result:', offlineCbt);

  } finally {
    execSync(`"${ADB}" shell cmd connectivity airplane-mode disable`);
    console.log('Airplane mode: DISABLED (restored)');
  }

  await browser.disconnect();
  console.log('\nAndroid capture and offline verification complete!');
}

main().catch(err => {
  console.error('Android capture failed:', err);
  process.exit(1);
});
