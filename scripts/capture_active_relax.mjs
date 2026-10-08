import http from 'http';
import { execSync } from 'child_process';

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
  const wsUrl = await getWebSocketUrl();
  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.onopen = r);

  // Click "Count it!" or "Discard" if modal is present
  await cdpEval(ws, `
    (() => {
      const countBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && (b.innerText.includes('Count it') || b.innerText.includes('Discard')));
      if (countBtn) countBtn.click();
      return true;
    })()
  `);
  await sleep(1000);

  // Go to #timer
  await cdpEval(ws, `
    (() => {
      window.location.hash = '#timer';
      return true;
    })()
  `);
  await sleep(1000);

  // Open relax
  await cdpEval(ws, `
    (() => {
      const inRelax = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Exit relax'));
      if (inRelax) return true;
      const relaxBtn = document.querySelector('button[aria-label="Relax scenery"], button[title="Relax scenery"]');
      if (relaxBtn) relaxBtn.click();
      return true;
    })()
  `);
  await sleep(1500);

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
  await sleep(2500);

  // Capture video playing frame 1
  adbExec('shell screencap -p /sdcard/relax_cruising_f1.png');
  adbExec('pull /sdcard/relax_cruising_f1.png artifacts/relax_cruising_f1.png');

  await sleep(4000);

  // Capture video playing frame 2 (continuous)
  adbExec('shell screencap -p /sdcard/relax_cruising_f2.png');
  adbExec('pull /sdcard/relax_cruising_f2.png artifacts/relax_cruising_f2.png');

  // Pause ride
  await cdpEval(ws, `
    (() => {
      const pauseBtn = Array.from(document.querySelectorAll('button')).find(b => 
        b.innerText && (b.innerText.includes('Pause ride') || b.innerText.includes('Pause'))
      );
      if (pauseBtn) pauseBtn.click();
      return true;
    })()
  `);
  await sleep(1500);

  // Capture frozen paused frame
  adbExec('shell screencap -p /sdcard/relax_cruising_paused.png');
  adbExec('pull /sdcard/relax_cruising_paused.png artifacts/relax_cruising_paused.png');

  console.log('Successfully captured all cruising frames!');
  ws.close();
}

run().catch(console.error);
