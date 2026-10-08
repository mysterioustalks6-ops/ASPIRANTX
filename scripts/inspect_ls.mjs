import http from 'http';

import { execSync } from 'child_process';

function getWebSocketUrl() {
  return new Promise((resolve, reject) => {
    try {
      execSync('"C:\\\\Users\\\\AMBUJ YADAV\\\\AppData\\\\Local\\\\Android\\\\Sdk\\\\platform-tools\\\\adb.exe" -s 10BD570GL500057 forward tcp:9222 localabstract:webview_devtools_remote_15460');
    } catch (e) {}
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

async function run() {
  const wsUrl = await getWebSocketUrl();
  const ws = new WebSocket(wsUrl);
  await new Promise(r => ws.onopen = r);

  ws.send(JSON.stringify({
    id: 1,
    method: 'Runtime.evaluate',
    params: {
      expression: `(() => {
        const keys = {};
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k.includes('exam') || k.includes('user') || k.includes('profile')) {
            keys[k] = localStorage.getItem(k);
          }
        }
        return JSON.stringify(keys, null, 2);
      })()`,
      returnByValue: true
    }
  }));

  ws.onmessage = (evt) => {
    const res = JSON.parse(evt.data);
    console.log(res.result?.result?.value);
    ws.close();
  };
}

run().catch(console.error);
