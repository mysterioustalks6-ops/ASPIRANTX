import puppeteer from 'puppeteer-core';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execFileAsync = promisify(execFile);
const ADB = 'C:\\Users\\AMBUJ YADAV\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe';
const SERIAL = '10BD570GL500057';

async function main() {
  console.log('=== GATE-A2 EVIDENCE RUNNER ===');

  // 1. Discover socket & forward tcp:9222
  const { stdout: unixOut } = await execFileAsync(ADB, ['-s', SERIAL, 'shell', 'cat', '/proc/net/unix']);
  const match = unixOut.match(/@webview_devtools_remote_(\d+)/);
  if (!match) throw new Error('Webview socket not found');
  const socketName = match[0].replace('@', '');
  console.log(`Forwarding tcp:9222 to ${socketName}...`);
  await execFileAsync(ADB, ['-s', SERIAL, 'forward', 'tcp:9222', `localabstract:${socketName}`]);

  // 2. Connect via puppeteer-core
  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
    defaultViewport: null
  });

  const pages = await browser.pages();
  let page = pages.find(p => p.url().includes('localhost')) || pages[0];
  console.log('Connected to Android WebView:', page.url());

  // 3. Click Instant Guest Demo if on landing page
  await page.evaluate(() => {
    const guestBtn = Array.from(document.querySelectorAll('button')).find(b => 
      b.textContent?.includes('Try Instant Guest Demo') || b.textContent?.includes('Guest Demo')
    );
    if (guestBtn) {
      console.log('Clicking guest demo button in real UI...');
      guestBtn.click();
    }
  });

  await new Promise(r => setTimeout(r, 2000));

  // 4. Navigate to syllabus tab
  await page.evaluate(() => {
    const bottomBtns = Array.from(document.querySelectorAll('#mobile-bottom-nav button, nav button'));
    const mapBtn = bottomBtns.find(b => b.textContent?.includes('Map') || b.textContent?.includes('Syllabus'));
    if (mapBtn) {
      mapBtn.click();
    } else {
      window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'syllabus' }));
    }
  });

  await new Promise(r => setTimeout(r, 2000));

  // 5. Switch to List view if currently in visual graph mode
  await page.evaluate(() => {
    const listBtn = Array.from(document.querySelectorAll('button')).find(b => 
      b.textContent?.includes('List View') || b.textContent?.includes('List')
    );
    if (listBtn) listBtn.click();
  });

  await new Promise(r => setTimeout(r, 1500));

  // 6. Extract DOM evidence on Android
  const androidDOM = await page.evaluate(() => {
    const title = document.title;
    const online = navigator.onLine;
    const userStr = localStorage.getItem('studyride_user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    const unverifiedNotice = document.querySelector('.bg-amber-500\\/10, [class*="amber"]')?.textContent?.trim() || '';
    const bodyText = document.body.innerText;
    
    // Look for hours and topics in summary banner
    const statCards = Array.from(document.querySelectorAll('[class*="rounded"]'))
      .map(el => el.innerText?.trim())
      .filter(t => t && (t.includes('Topics') || t.includes('Est. Hours') || t.includes('Buffer') || t.includes('Curriculum')));

    return {
      title,
      online,
      userAvatar: user?.avatar_url,
      userExam: user?.exam,
      userTargetYear: user?.targetYear,
      unverifiedNotice,
      statCards: statCards.slice(0, 5),
      bodySnippet: bodyText.slice(0, 1000)
    };
  });

  console.log('\n--- ANDROID DOM EVIDENCE ---');
  console.log(JSON.stringify(androidDOM, null, 2));

  // 7. Pull clean screencap from phone
  const outDir = path.resolve('docs/screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  await execFileAsync(ADB, ['-s', SERIAL, 'shell', 'screencap', '-p', '/sdcard/android_list_gate_a2.png']);
  await execFileAsync(ADB, ['-s', SERIAL, 'pull', '/sdcard/android_list_gate_a2.png', 'docs/screenshots/android_list_gate_a2.png']);
  console.log('Saved Android screenshot to docs/screenshots/android_list_gate_a2.png');

  await browser.disconnect();
}

main().catch(console.error);
