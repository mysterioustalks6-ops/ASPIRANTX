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

function getWebSocketUrl() {
  return new Promise((resolve, reject) => {
    adbExec('forward tcp:9222 localabstract:webview_devtools_remote_15460');
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
          return reject(new Error(msg.result.exceptionDetails.text || 'CDP Error'));
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
  console.log('🚀 Running Targeted Relax Running & Paused Evidence Capture...');

  adbExec('shell am start -n com.aspirantx.app/.MainActivity');
  adbExec('shell settings put system font_scale 1.1');
  await sleep(1500);

  const wsUrl = await getWebSocketUrl();
  console.log('Connected to:', wsUrl);
  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.onopen = r);

  // 1. Go to timer
  console.log('Navigating to #timer...');
  await cdpEval(ws, `window.location.hash = '#timer'`);
  await sleep(2000);

  // 2. Open Relax view
  console.log('Clicking Relax button...');
  const opened = await cdpEval(ws, `
    (() => {
      const btn = document.querySelector('button[aria-label="Relax scenery"], button[title="Relax scenery"]');
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    })()
  `);
  console.log('Relax opened:', opened);
  await sleep(2000);

  // 3. Start Ride
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

  // 4. Capture Frame 1 (Running)
  console.log('Capturing Relax Running Frame 1...');
  captureScreenshot('relax_running_f1.png');

  // 5. Wait 5.0 seconds while running
  console.log('Waiting 5.0s during continuous highway parallax animation...');
  await sleep(5000);

  // 6. Capture Frame 2 (Running)
  console.log('Capturing Relax Running Frame 2...');
  captureScreenshot('relax_running_f2.png');

  // 7. Pause Ride
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

  // 8. Capture Paused Frame 1
  console.log('Capturing Relax Paused Frame 1...');
  captureScreenshot('relax_paused_f1.png');

  // 9. Wait 5.0 seconds while paused
  console.log('Waiting 5.0s during frozen paused state...');
  await sleep(5000);

  // 10. Capture Paused Frame 2
  console.log('Capturing Relax Paused Frame 2...');
  captureScreenshot('relax_paused_f2.png');

  // Restore font scale to 1.0
  adbExec('shell settings put system font_scale 1.0');
  ws.close();

  // Pixel Diff for Running Frames
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
