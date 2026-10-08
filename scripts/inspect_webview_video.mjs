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

async function run() {
  const wsUrl = await getWebSocketUrl();
  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.onopen = r);

  const vInfo = await cdpEval(ws, `
    (() => {
      const v = document.querySelector('video');
      if (!v) return 'No video found';
      return {
        currentSrc: v.currentSrc,
        readyState: v.readyState,
        networkState: v.networkState,
        paused: v.paused,
        currentTime: v.currentTime,
        duration: v.duration,
        error: v.error ? { code: v.error.code, message: v.error.message } : null,
        videoWidth: v.videoWidth,
        videoHeight: v.videoHeight
      };
    })()
  `);
  console.log('Video detailed status:', vInfo);
  ws.close();
}

run().catch(console.error);
