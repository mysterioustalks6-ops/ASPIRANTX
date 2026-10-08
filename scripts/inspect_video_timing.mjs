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

async function run() {
  const wsUrl = await getWebSocketUrl();
  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.onopen = r);

  // Push video file to phone storage if needed, or check via webview
  adbExec('push public/assets/videos/relax_highway.mp4 /sdcard/relax_highway.mp4');

  const meta = await cdpEval(ws, `
    new Promise((resolve) => {
      const v = document.createElement('video');
      v.src = 'https://localhost/assets/videos/relax_highway.mp4';
      v.preload = 'metadata';
      v.onloadedmetadata = () => {
        resolve({
          duration: v.duration,
          videoWidth: v.videoWidth,
          videoHeight: v.videoHeight
        });
      };
      v.onerror = (e) => resolve({ error: 'failed to load' });
    })
  `);
  console.log('Video Metadata:', meta);
  ws.close();
}

run().catch(console.error);
