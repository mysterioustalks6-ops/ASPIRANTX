import puppeteer from 'puppeteer-core';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const ADB = 'C:\\Users\\AMBUJ YADAV\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe';
const SERIAL = '10BD570GL500057';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DIST_DIR = path.resolve('dist');
const ARTIFACT_DIR = 'C:\\Users\\AMBUJ YADAV\\.gemini\\antigravity-ide\\brain\\3fc6a120-a4e1-424f-a3e4-12fe899fc95a';

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

function startStaticServer(port = 4173) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url.split('?')[0];
      if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
      let filePath = path.join(DIST_DIR, reqPath);
      
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(DIST_DIR, 'index.html');
      }

      const ext = path.extname(filePath);
      const contentType = MIME[ext] || 'application/octet-stream';

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      });
    });

    server.listen(port, () => {
      console.log(`Static server running at http://localhost:${port}`);
      resolve(server);
    });
  });
}

async function captureAndroidScreen(remoteTempPath, localDestPath) {
  await execFileAsync(ADB, ['-s', SERIAL, 'shell', 'screencap', '-p', remoteTempPath]);
  await execFileAsync(ADB, ['-s', SERIAL, 'pull', remoteTempPath, localDestPath]);
  console.log(`Pulled Android screenshot to: ${localDestPath}`);
}

async function main() {
  console.log('=== STARTING GATE-A3 SCREENSHOT CAPTURE RUNNER ===');

  // Ensure phone is unlocked and app is focused
  await execFileAsync(ADB, ['-s', SERIAL, 'shell', 'input keyevent 224; wm dismiss-keyguard; am start -n com.aspirantx.app/.MainActivity']);
  await new Promise(r => setTimeout(r, 2000));

  // Forward tcp:9222
  const { stdout: unixOut } = await execFileAsync(ADB, ['-s', SERIAL, 'shell', 'cat', '/proc/net/unix']);
  const match = unixOut.match(/@webview_devtools_remote_(\d+)/);
  if (!match) throw new Error('Webview socket not found on device');
  const socketName = match[0].replace('@', '');
  await execFileAsync(ADB, ['-s', SERIAL, 'forward', 'tcp:9222', `localabstract:${socketName}`]);
  console.log(`Forwarded tcp:9222 to ${socketName}`);

  const androidBrowser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
    defaultViewport: null
  });

  const androidPages = await androidBrowser.pages();
  let aPage = androidPages.find(p => p.url().includes('localhost')) || androidPages[0];
  console.log('Connected to Android WebView at:', aPage.url());

  // Click guest demo if on landing page
  await aPage.evaluate(() => {
    const guestBtn = Array.from(document.querySelectorAll('button')).find(b => 
      b.textContent?.includes('Try Instant Guest Demo') || b.textContent?.includes('Guest Demo')
    );
    if (guestBtn) guestBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // Ensure NEET_UG is set
  await aPage.evaluate(() => {
    const userStr = localStorage.getItem('studyride_user');
    let user = userStr ? JSON.parse(userStr) : {};
    user.exam = 'NEET_UG';
    localStorage.setItem('studyride_user', JSON.stringify(user));
    localStorage.setItem('aspirantx_selected_exam', 'NEET_UG');
  });

  // 1. Android List View
  console.log('Navigating to Syllabus Map -> List View on Android...');
  await aPage.evaluate(() => {
    window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'syllabus' }));
  });
  await new Promise(r => setTimeout(r, 2500));
  await aPage.evaluate(() => {
    const listBtn = Array.from(document.querySelectorAll('button')).find(b => 
      b.textContent?.includes('List View') || b.textContent?.includes('List')
    );
    if (listBtn) listBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await captureAndroidScreen('/sdcard/gate_a3_android_list.png', path.join(ARTIFACT_DIR, 'gate_a3_android_list.png'));

  // 2. Android Today View
  console.log('Navigating to Today on Android...');
  await aPage.evaluate(() => {
    window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'dashboard' }));
  });
  await new Promise(r => setTimeout(r, 2000));
  await captureAndroidScreen('/sdcard/gate_a3_android_today.png', path.join(ARTIFACT_DIR, 'gate_a3_android_today.png'));

  // 3. Android Me View
  console.log('Navigating to Me (More Hub) on Android...');
  await aPage.evaluate(() => {
    window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'more_hub' }));
  });
  await new Promise(r => setTimeout(r, 2000));
  await captureAndroidScreen('/sdcard/gate_a3_android_me.png', path.join(ARTIFACT_DIR, 'gate_a3_android_me.png'));

  // 4. Android Leaderboard View
  console.log('Navigating to Leaderboard on Android...');
  await aPage.evaluate(() => {
    window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'leaderboard' }));
  });
  await new Promise(r => setTimeout(r, 2000));
  await captureAndroidScreen('/sdcard/gate_a3_leaderboard.png', path.join(ARTIFACT_DIR, 'gate_a3_leaderboard.png'));

  // 5. Android StudyBuddy View
  console.log('Navigating to StudyBuddy on Android...');
  await aPage.evaluate(() => {
    window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'study_buddy' }));
  });
  await new Promise(r => setTimeout(r, 2000));
  await captureAndroidScreen('/sdcard/gate_a3_studybuddy.png', path.join(ARTIFACT_DIR, 'gate_a3_studybuddy.png'));

  // 6. Android Sponsorship View
  console.log('Navigating to Sponsorship on Android...');
  await aPage.evaluate(() => {
    window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'collaboration' }));
  });
  await new Promise(r => setTimeout(r, 2000));
  await captureAndroidScreen('/sdcard/gate_a3_sponsorship.png', path.join(ARTIFACT_DIR, 'gate_a3_sponsorship.png'));

  await androidBrowser.disconnect();

  // 7. Web List View (NEET, same data)
  console.log('Launching Web instance for Web List (NEET)...');
  const server = await startStaticServer(4174);
  const webBrowser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const webPage = await webBrowser.newPage();
  await webPage.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });
  await webPage.goto('http://localhost:4174/', { waitUntil: 'networkidle2' });

  // Guest demo
  await webPage.waitForSelector('#hero-guest-btn', { timeout: 5000 }).catch(() => {});
  await webPage.evaluate(() => {
    const btn = document.querySelector('#hero-guest-btn') || Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Guest Demo'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // Set exam NEET_UG
  await webPage.evaluate(() => {
    const userStr = localStorage.getItem('studyride_user');
    let user = userStr ? JSON.parse(userStr) : {};
    user.exam = 'NEET_UG';
    localStorage.setItem('studyride_user', JSON.stringify(user));
    localStorage.setItem('aspirantx_selected_exam', 'NEET_UG');
    window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'syllabus' }));
  });
  await new Promise(r => setTimeout(r, 2500));

  // Switch to list view
  await webPage.evaluate(() => {
    const listBtn = Array.from(document.querySelectorAll('button')).find(b => 
      b.textContent?.includes('List View') || b.textContent?.includes('List')
    );
    if (listBtn) listBtn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  const webDestPath = path.join(ARTIFACT_DIR, 'gate_a3_web_list.png');
  await webPage.screenshot({ path: webDestPath });
  console.log(`Saved Web List screenshot to: ${webDestPath}`);

  await webBrowser.close();
  server.close();

  console.log('=== ALL GATE-A3 SCREENSHOTS CAPTURED SUCCESSFULLY ===');
}

main().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
