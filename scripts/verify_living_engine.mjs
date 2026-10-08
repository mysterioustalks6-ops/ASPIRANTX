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
        resolve(msg.result?.result?.value);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({
      id,
      method: 'Runtime.evaluate',
      params: { expression, returnByValue: true, awaitPromise: true }
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
  await sleep(1200);

  // Open Relax Scenery
  await cdpEval(ws, `
    (() => {
      const relaxBtn = document.querySelector('button[aria-label="Relax scenery"], button[title="Relax scenery"]');
      if (relaxBtn) relaxBtn.click();
      return true;
    })()
  `);
  await sleep(1200);

  // Start focus ride
  await cdpEval(ws, `
    (() => {
      const startBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.innerText && (b.innerText.includes('Start focus ride') || b.innerText.includes('Start ride') || b.innerText.includes('Resume ride'))
      );
      if (startBtn) startBtn.click();
      return true;
    })()
  `);
  await sleep(1500);

  // Check canvas presence and dimensions
  const engineState = await cdpEval(ws, `
    (() => {
      const canvas = document.querySelector('canvas');
      const img = document.querySelector('img[alt*="Himalayan"]');
      return {
        canvasFound: !!canvas,
        canvasW: canvas?.width,
        canvasH: canvas?.height,
        backdropFound: !!img,
        backdropSrc: img?.src,
        videoCount: document.querySelectorAll('video').length
      };
    })()
  `);
  console.log('Living Engine State:', engineState);

  // Wait 2 seconds and capture live phone screenshot
  await sleep(2000);
  execSync(`${ADB} shell screencap -p /sdcard/relax_living_engine.png`);
  execSync(`${ADB} pull /sdcard/relax_living_engine.png artifacts/relax_living_engine.png`);
  console.log('Captured screenshot to artifacts/relax_living_engine.png');

  ws.close();
}

run().catch(console.error);
