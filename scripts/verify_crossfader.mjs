import http from 'http';
import { execSync } from 'child_process';

const ADB_BIN = '"C:\\Users\\AMBUJ YADAV\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe"';
execSync(`${ADB_BIN} connect 192.168.1.194:39219`);
const ADB = `${ADB_BIN} -s 192.168.1.194:39219`;

function getDevtoolsSocket() {
  const unix = execSync(`${ADB} shell cat /proc/net/unix`, { encoding: 'utf-8' });
  const match = unix.match(/@(webview_devtools_remote_\d+)/);
  if (match) return match[1];
  return 'webview_devtools_remote_5914';
}

function getWebSocketUrl() {
  return new Promise((resolve, reject) => {
    const socket = getDevtoolsSocket();
    execSync(`${ADB} forward tcp:9222 localabstract:${socket}`);
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

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  console.log('Connecting to device over CDP...');
  await sleep(1500);

  const wsUrl = await getWebSocketUrl();
  console.log('Connected to CDP at:', wsUrl);
  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.onopen = r);

  // Navigate to #timer
  await cdpEval(ws, `window.location.hash = '#timer'; true;`);
  await sleep(1000);

  // Open Relax Scenery
  await cdpEval(ws, `
    (() => {
      const relaxBtn = document.querySelector('button[aria-label="Relax scenery"], button[title="Relax scenery"]');
      if (relaxBtn) relaxBtn.click();
      return true;
    })()
  `);
  await sleep(1200);

  // Start focus ride if not running
  await cdpEval(ws, `
    (() => {
      const startBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.innerText && (b.innerText.includes('Start focus ride') || b.innerText.includes('Start ride') || b.innerText.includes('Resume ride'))
      );
      if (startBtn) startBtn.click();
      return true;
    })()
  `);
  await sleep(2000);

  // Check both video elements
  const playersState = await cdpEval(ws, `
    (() => {
      const videos = Array.from(document.querySelectorAll('video'));
      return {
        videoCount: videos.length,
        players: videos.map((v, i) => ({
          index: i,
          src: v.src,
          currentTime: v.currentTime,
          duration: v.duration,
          paused: v.paused,
          opacity: window.getComputedStyle(v).opacity
        }))
      };
    })()
  `);
  console.log('Initial Double Buffer State:', JSON.stringify(playersState, null, 2));

  // Let's test jump Player A close to loop point (e.g., duration - 1s) to observe the live handover to Player B
  console.log('Testing Handover from Player A to Player B...');
  await cdpEval(ws, `
    (() => {
      const videos = document.querySelectorAll('video');
      if (videos.length >= 2) {
        videos[0].currentTime = Math.max(0, videos[0].duration - 0.8);
      }
      return true;
    })()
  `);

  // Wait 1 second for handover
  await sleep(1000);

  const handoverState = await cdpEval(ws, `
    (() => {
      const videos = Array.from(document.querySelectorAll('video'));
      return {
        players: videos.map((v, i) => ({
          index: i,
          currentTime: v.currentTime,
          paused: v.paused,
          opacity: window.getComputedStyle(v).opacity
        }))
      };
    })()
  `);
  console.log('Handover State (After Crossfade):', JSON.stringify(handoverState, null, 2));

  // Capture phone screenshot
  execSync(`${ADB} shell screencap -p /sdcard/relax_cinematic_doublebuffer.png`);
  execSync(`${ADB} pull /sdcard/relax_cinematic_doublebuffer.png artifacts/relax_cinematic_doublebuffer.png`);
  console.log('Screenshot captured to artifacts/relax_cinematic_doublebuffer.png');

  ws.close();
}

run().catch(console.error);
