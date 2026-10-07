import http from 'http';
import WebSocket from 'ws';

async function getWsUrl() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const pages = JSON.parse(data);
        resolve(pages[0].webSocketDebuggerUrl);
      });
    }).on('error', reject);
  });
}

async function run() {
  const wsUrl = await getWsUrl();
  const ws = new WebSocket(wsUrl);

  await new Promise(res => ws.on('open', res));
  let id = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const curId = id++;
    const handler = (msg) => {
      const data = JSON.parse(msg);
      if (data.id === curId) {
        ws.off('message', handler);
        resolve(data.result);
      }
    };
    ws.on('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  const evaluate = async (expr) => {
    const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    return res?.result?.value;
  };

  console.log('--- CURRENT STATE BEFORE RESET ---');
  const lsKeys = await evaluate(`Object.keys(localStorage).map(k => [k, localStorage.getItem(k)])`);
  console.log('localStorage keys:', lsKeys);

  const curTitle = await evaluate(`document.title`);
  console.log('document.title:', curTitle);

  const onlineState = await evaluate(`({
    navigatorOnLine: navigator.onLine,
    isOnlineFn: typeof window.__studyride_isOnline === 'function' ? window.__studyride_isOnline() : 'not_exposed'
  })`);
  console.log('Online state:', onlineState);

  ws.close();
}

run().catch(console.error);
