import WebSocket from 'ws';
import http from 'http';

function getEndpoints() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve(JSON.parse(b)));
    }).on('error', reject);
  });
}

async function run() {
  const endpoints = await getEndpoints();
  const page = endpoints.find(e => e.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));

  const code = `(() => {
    const nav = document.querySelector('#mobile-bottom-nav');
    const spans = nav ? Array.from(nav.querySelectorAll('span')).map(s => ({
      text: s.innerText,
      font: getComputedStyle(s).fontFamily
    })) : [];
    return {
      navExists: !!nav,
      spans,
      dashboard: !!document.querySelector('#student-dashboard'),
      url: location.href
    };
  })()`;

  ws.send(JSON.stringify({
    id: 1,
    method: 'Runtime.evaluate',
    params: { expression: code, returnByValue: true }
  }));

  const res = await new Promise((resolve) => {
    ws.on('message', (msg) => {
      const parsed = JSON.parse(msg.toString());
      if (parsed.id === 1) {
        resolve(parsed.result?.result?.value);
      }
    });
  });

  console.log(JSON.stringify(res, null, 2));
  ws.close();
}

run().catch(console.error);
