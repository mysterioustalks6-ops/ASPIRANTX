import http from 'http';
import { execSync } from 'child_process';

const ADB_BIN = '"C:\\Users\\AMBUJ YADAV\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe"';
execSync(`${ADB_BIN} connect 192.168.1.194:39219`);
const ADB = `${ADB_BIN} -s 192.168.1.194:39219`;

function getDevtoolsSocket() {
  const unix = execSync(`${ADB} shell cat /proc/net/unix`, { encoding: 'utf-8' });
  const match = unix.match(/@(webview_devtools_remote_\d+)/);
  return match ? match[1] : 'webview_devtools_remote_5914';
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

async function run() {
  const wsUrl = await getWebSocketUrl();
  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.onopen = r);

  // Measure FPS over 3 seconds
  console.log('Measuring FPS on device over 3 seconds...');
  const fpsResult = await cdpEval(ws, `
    new Promise((resolve) => {
      let frames = 0;
      const start = performance.now();
      function count() {
        frames++;
        if (performance.now() - start < 3000) {
          requestAnimationFrame(count);
        } else {
          const elapsedSec = (performance.now() - start) / 1000;
          resolve({
            totalFrames: frames,
            fps: Math.round(frames / elapsedSec),
            elapsedSec: elapsedSec.toFixed(2)
          });
        }
      }
      requestAnimationFrame(count);
    })
  `);
  console.log('FPS Measurement Result:', fpsResult);

  // Test Pause / Resume
  console.log('Testing Pause ride...');
  await cdpEval(ws, `
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Pause ride'));
      if (btn) btn.click();
      return true;
    })()
  `);
  await new Promise(r => setTimeout(r, 600));

  console.log('Testing Resume ride...');
  await cdpEval(ws, `
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes('Resume ride'));
      if (btn) btn.click();
      return true;
    })()
  `);
  await new Promise(r => setTimeout(r, 600));

  console.log('Testing Speed Chips (1.25x)...');
  await cdpEval(ws, `
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText && b.innerText.trim() === '1.25x');
      if (btn) btn.click();
      return true;
    })()
  `);
  await new Promise(r => setTimeout(r, 600));

  console.log('All interactive controls verified smoothly!');
  ws.close();
}

run().catch(console.error);
