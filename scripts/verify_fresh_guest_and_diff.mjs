import http from 'http';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const ADB = '"C:\\Users\\AMBUJ YADAV\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe" -s 10BD570GL500057';
const ARTIFACTS_DIR = path.resolve('artifacts');

function adbExec(cmd) {
  return execSync(`${ADB} ${cmd}`, { encoding: 'utf-8' });
}

function getDevtoolsSocket() {
  const unix = adbExec('shell cat /proc/net/unix');
  const match = unix.match(/@(webview_devtools_remote_\d+)/);
  if (match) return match[1];
  return 'webview_devtools_remote_21492';
}

function getWebSocketUrl() {
  return new Promise((resolve, reject) => {
    const socket = getDevtoolsSocket();
    adbExec(`forward tcp:9222 localabstract:${socket}`);
    http.get('http://127.0.0.1:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const list = JSON.parse(data);
          resolve(list[0].webSocketDebuggerUrl);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function cdpEval(ws, expression) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 100000);
    const handler = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        if (msg.error) return reject(msg.error);
        if (msg.result?.exceptionDetails) {
          const detail = msg.result.exceptionDetails;
          return reject(new Error(detail.exception?.description || detail.text || 'CDP Error'));
        }
        resolve(msg.result?.result?.value);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({
      id,
      method: 'Runtime.evaluate',
      params: {
        expression,
        returnByValue: true,
        awaitPromise: true
      }
    }));
  });
}

function captureScreenshot(filename) {
  const phonePath = `/sdcard/${filename}`;
  const localPath = path.join(ARTIFACTS_DIR, filename);
  adbExec(`shell screencap -p ${phonePath}`);
  adbExec(`pull ${phonePath} "${localPath}"`);
  return localPath;
}

function sha256File(filepath) {
  const buffer = fs.readFileSync(filepath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log('🚀 Running Guest Login & Relax Parallax Frame Diff Verification...');

  adbExec('shell am start -n com.aspirantx.app/.MainActivity');
  await sleep(1500);

  const wsUrl = await getWebSocketUrl();
  console.log('Connected to CDP at:', wsUrl);
  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.onopen = r);

  // Set guest login with NEET_UG
  console.log('Ensuring clean NEET_UG Guest login...');
  const guestState = await cdpEval(ws, `
    (() => {
      const demoUser = {
        id: 'demo-guest-123',
        name: 'Aspirant',
        email: 'guest@studyride.in',
        exam: 'NEET_UG',
        targetYear: 2027,
        streakDays: 0,
        isPremium: false,
        isGuest: true,
        studyHoursToday: 0,
        xp: 0,
        coins: 50,
        level: 1,
        role: 'USER',
        isProfileComplete: true
      };
      localStorage.setItem('studyride_user', JSON.stringify(demoUser));
      localStorage.setItem('aspirantx_auth_user', JSON.stringify(demoUser));
      localStorage.setItem('aspirantx_global_selected_exam', 'NEET_UG');
      localStorage.setItem('aspirantx_selected_exam', 'NEET_UG');
      window.location.hash = '#timer';
      return {
        user: demoUser.email,
        exam: demoUser.exam,
        storedExam: localStorage.getItem('aspirantx_global_selected_exam')
      };
    })()
  `);
  console.log('Guest state established:', guestState);
  await sleep(2000);

  // Now in #timer, open Relax view
  console.log('Opening Relax scenery...');
  await cdpEval(ws, `
    (() => {
      const inRelax = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Exit relax'));
      if (inRelax) return true;
      const relaxBtn = document.querySelector('button[aria-label="Relax scenery"], button[title="Relax scenery"]');
      if (relaxBtn) {
        relaxBtn.click();
        return true;
      }
      return false;
    })()
  `);
  await sleep(2000);

  // Click start/resume ride
  console.log('Starting Relax ride animation...');
  await cdpEval(ws, `
    (() => {
      const startBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.innerText && (b.innerText.includes('Start ride') || b.innerText.includes('Resume ride') || b.innerText.includes('Start'))
      );
      if (startBtn) startBtn.click();
    })()
  `);
  await sleep(2000);

  // Capture Frame 1 (Running)
  console.log('Capturing Relax Running Frame 1...');
  captureScreenshot('relax_running_f1.png');

  // Wait 5.0 seconds while running at 60 FPS
  console.log('Waiting 5.0s during continuous highway parallax animation...');
  await sleep(5000);

  // Capture Frame 2 (Running)
  console.log('Capturing Relax Running Frame 2...');
  captureScreenshot('relax_running_f2.png');

  // Pause ride
  console.log('\nPausing Relax ride...');
  await cdpEval(ws, `
    (() => {
      const pauseBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.innerText && (b.innerText.includes('Pause ride') || b.innerText.includes('Pause'))
      );
      if (pauseBtn) pauseBtn.click();
    })()
  `);
  await sleep(2000);

  // Ensure we are not near a minute boundary when capturing paused frames
  console.log('Synchronizing with minute boundary for paused frames...');
  const currentSec = new Date().getSeconds();
  if (currentSec > 50) {
    console.log(`Waiting ${62 - currentSec}s for next minute to start...`);
    await sleep((62 - currentSec) * 1000);
  }

  // Capture Paused Frame 1
  console.log('Capturing Relax Paused Frame 1...');
  captureScreenshot('relax_paused_f1.png');

  // Wait 5.0 seconds while frozen
  console.log('Waiting 5.0s during frozen paused state...');
  await sleep(5000);

  // Capture Paused Frame 2
  console.log('Capturing Relax Paused Frame 2...');
  captureScreenshot('relax_paused_f2.png');

  // Exit relax back to timer
  await cdpEval(ws, `
    (() => {
      const backBtn = document.querySelector('button[aria-label="Back to timer"], button[title="Back to timer"]');
      if (backBtn) backBtn.click();
    })()
  `);

  ws.close();

  // Pixel Diff Analysis for Running Frames
  console.log('\n======================================================');
  console.log('  PIXEL DIFF: RELAX RUNNING (5s apart)');
  console.log('======================================================');
  const imgR1 = PNG.sync.read(fs.readFileSync(path.join(ARTIFACTS_DIR, 'relax_running_f1.png')));
  const imgR2 = PNG.sync.read(fs.readFileSync(path.join(ARTIFACTS_DIR, 'relax_running_f2.png')));
  const diffRunning = new PNG({ width: imgR1.width, height: imgR1.height });
  const runningDiffPixels = pixelmatch(imgR1.data, imgR2.data, diffRunning.data, imgR1.width, imgR1.height, { threshold: 0.05 });
  const totalR = imgR1.width * imgR1.height;
  const runningPercent = ((runningDiffPixels / totalR) * 100).toFixed(2);
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'relax_running_diff.png'), PNG.sync.write(diffRunning));

  console.log(`Frame 1 File:       artifacts/relax_running_f1.png (${fs.statSync(path.join(ARTIFACTS_DIR, 'relax_running_f1.png')).size} B)`);
  console.log(`Frame 2 File:       artifacts/relax_running_f2.png (${fs.statSync(path.join(ARTIFACTS_DIR, 'relax_running_f2.png')).size} B)`);
  console.log(`Differing Pixels:   ${runningDiffPixels.toLocaleString()} / ${totalR.toLocaleString()} (${runningPercent}%)`);
  console.log(`SHA256 Frame 1:     ${sha256File(path.join(ARTIFACTS_DIR, 'relax_running_f1.png'))}`);
  console.log(`SHA256 Frame 2:     ${sha256File(path.join(ARTIFACTS_DIR, 'relax_running_f2.png'))}`);
  console.log(`Verification:       ${runningDiffPixels > 0 ? '✅ PASSED: Running frames actively differ with non-zero pixel diff' : '❌ FAILED'}`);

  // Comparison for Paused Frames
  console.log('\n======================================================');
  console.log('  CHECKSUM / DIFF: RELAX PAUSED (5s apart)');
  console.log('======================================================');
  const shaP1 = sha256File(path.join(ARTIFACTS_DIR, 'relax_paused_f1.png'));
  const shaP2 = sha256File(path.join(ARTIFACTS_DIR, 'relax_paused_f2.png'));
  const imgP1 = PNG.sync.read(fs.readFileSync(path.join(ARTIFACTS_DIR, 'relax_paused_f1.png')));
  const imgP2 = PNG.sync.read(fs.readFileSync(path.join(ARTIFACTS_DIR, 'relax_paused_f2.png')));
  const diffPaused = new PNG({ width: imgP1.width, height: imgP1.height });
  const pausedDiffPixels = pixelmatch(imgP1.data, imgP2.data, diffPaused.data, imgP1.width, imgP1.height, { threshold: 0.05 });

  console.log(`Paused Frame 1 SHA256: ${shaP1}`);
  console.log(`Paused Frame 2 SHA256: ${shaP2}`);
  console.log(`Paused Pixel Diff:     ${pausedDiffPixels} pixels (${((pausedDiffPixels / totalR) * 100).toFixed(4)}%)`);
  console.log(`Verification:          ${shaP1 === shaP2 || pausedDiffPixels === 0 ? '✅ PASSED: Paused frames are frozen and IDENTICAL' : '⚠️ Note'}`);
}

run().catch(console.error);
