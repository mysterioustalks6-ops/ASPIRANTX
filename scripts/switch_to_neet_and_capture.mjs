import puppeteer from 'puppeteer-core';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const ADB = 'C:\\Users\\AMBUJ YADAV\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe';
const SERIAL = '10BD570GL500057';

async function main() {
  const { stdout: unixOut } = await execFileAsync(ADB, ['-s', SERIAL, 'shell', 'cat', '/proc/net/unix']);
  const match = unixOut.match(/@webview_devtools_remote_(\d+)/);
  if (!match) throw new Error('Webview socket not found');
  const socketName = match[0].replace('@', '');
  await execFileAsync(ADB, ['-s', SERIAL, 'forward', 'tcp:9222', `localabstract:${socketName}`]);

  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
    defaultViewport: null
  });

  const pages = await browser.pages();
  let page = pages.find(p => p.url().includes('localhost')) || pages[0];

  // 1. Open Exam picker modal
  await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label*="Current target exam"]');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // 2. Select Medical category or search NEET
  await page.evaluate(() => {
    // Look for exam option button with NEET
    const buttons = Array.from(document.querySelectorAll('button'));
    const neetBtn = buttons.find(b => b.innerText && b.innerText.includes('NEET (UG)'));
    if (neetBtn) {
      neetBtn.click();
      return 'clicked_neet_btn';
    }
    // Alternatively click Medical category pill
    const medPill = buttons.find(b => b.innerText && b.innerText.includes('Medical'));
    if (medPill) medPill.click();
    return 'clicked_med_pill';
  });
  await new Promise(r => setTimeout(r, 1000));

  // Click NEET button after category filter
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const neetBtn = buttons.find(b => b.innerText && b.innerText.includes('NEET (UG)'));
    if (neetBtn) neetBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // 3. Navigate to Syllabus Map -> List View
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'syllabus' }));
  });
  await new Promise(r => setTimeout(r, 2500));

  await page.evaluate(() => {
    const listBtn = Array.from(document.querySelectorAll('button')).find(b => 
      b.textContent?.includes('List View') || b.textContent?.includes('List')
    );
    if (listBtn) listBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  const dest = 'C:\\Users\\AMBUJ YADAV\\.gemini\\antigravity-ide\\brain\\3fc6a120-a4e1-424f-a3e4-12fe899fc95a\\gate_a3_android_list.png';
  await execFileAsync(ADB, ['-s', SERIAL, 'shell', 'screencap', '-p', '/sdcard/gate_a3_android_list.png']);
  await execFileAsync(ADB, ['-s', SERIAL, 'pull', '/sdcard/gate_a3_android_list.png', dest]);
  console.log('Recaptured Android NEET List screenshot to:', dest);

  await browser.disconnect();
}

main().catch(console.error);
