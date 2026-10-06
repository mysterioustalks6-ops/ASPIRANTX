import puppeteer from 'puppeteer-core';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const ADB = 'C:\\Users\\AMBUJ YADAV\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe';
const SERIAL = '10BD570GL500057';
const ARTIFACT_DIR = 'C:\\Users\\AMBUJ YADAV\\.gemini\antigravity-ide\\brain\\3fc6a120-a4e1-424f-a3e4-12fe899fc95a';

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

  // Navigate to syllabus tab
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'syllabus' }));
  });
  await new Promise(r => setTimeout(r, 2000));

  // Switch Target Examination to NEET_UG
  await page.evaluate(() => {
    const select = document.querySelector('select[aria-label="Target Examination"]');
    if (select) {
      select.value = 'NEET_UG';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await new Promise(r => setTimeout(r, 2000));

  // Ensure List view is active
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
