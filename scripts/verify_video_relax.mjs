import http from 'http';
import { execSync } from 'child_process';
import path from 'path';

const ADB = '"C:\\Users\\AMBUJ YADAV\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe" -s 10BD570GL500057';

function adbExec(cmd) {
  return execSync(`${ADB} ${cmd}`, { encoding: 'utf-8' });
}

function getDevtoolsSocket() {
  const unix = adbExec('shell cat /proc/net/unix');
  const match = unix.match(/@(webview_devtools_remote_\d+)/);
  if (match) return match[1];
  return 'webview_devtools_remote_5914';
}

function getWebSocketUrl() {
  return new Promise((resolve, reject) => {
    const socket = getDevtoolsSocket();
    adbExec(`forward tcp:9222 localabstract:${socket}`);
    http.get('http://127.0.0.1:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const list = JSON.parse(data);
        resolve(list[0].webSocketDebuggerUrl);
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

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log('Testing Relax Video on phone...');
  await sleep(1500);

  const wsUrl = await getWebSocketUrl();
  console.log('Connected to CDP at:', wsUrl);
  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.onopen = r);

  // Navigate to #timer and open relax
  await cdpEval(ws, `
    (() => {
      window.location.hash = '#timer';
      return true;
    })()
  `);
  await sleep(1500);

  // Click relax button if not in relax
  await cdpEval(ws, `
    (() => {
      const relaxBtn = document.querySelector('button[aria-label="Relax scenery"], button[title="Relax scenery"]');
      if (relaxBtn) relaxBtn.click();
      return true;
    })()
  `);
  await sleep(1500);

  // Check video state
  const videoState1 = await cdpEval(ws, `
    (() => {
      const v = document.querySelector('video');
      if (!v) return { found: false };
      return {
        found: true,
        src: v.src,
        currentTime: v.currentTime,
        duration: v.duration,
        paused: v.paused,
        videoWidth: v.videoWidth,
        videoHeight: v.videoHeight
      };
    })()
  `);
  console.log('Initial Video State:', videoState1);

  // Start ride
  await cdpEval(ws, `
    (() => {
      const startBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.innerText && (b.innerText.includes('Start focus ride') || b.innerText.includes('Start ride') || b.innerText.includes('Resume ride'))
      );
      if (startBtn) startBtn.click();
      return true;
    })()
  `);
  await sleep(3000);

  const videoState2 = await cdpEval(ws, `
    (() => {
      const v = document.querySelector('video');
      if (!v) return { found: false };
      return {
        found: true,
        currentTime: v.currentTime,
        paused: v.paused,
        playbackRate: v.playbackRate
      };
    })()
  `);
  console.log('Playing Video State after 3s:', videoState2);

  // Capture screenshot of video playing on phone
  adbExec('shell screencap -p /sdcard/relax_video_playing.png');
  adbExec('pull /sdcard/relax_video_playing.png artifacts/relax_video_playing.png');
  console.log('Captured artifacts/relax_video_playing.png');

  ws.close();
}

run().catch(console.error);
