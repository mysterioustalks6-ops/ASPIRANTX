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

  const expression = `(() => {
    const btn = document.querySelector('#hero-guest-btn') || Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Guest'));
    if (btn) {
      btn.click();
      return 'Clicked guest demo button';
    }
    return 'Button not found';
  })()`;

  ws.send(JSON.stringify({
    id: 1,
    method: 'Runtime.evaluate',
    params: { expression, returnByValue: true }
  }));

  const res = await new Promise((resolve) => {
    ws.on('message', (msg) => {
      const parsed = JSON.parse(msg.toString());
      if (parsed.id === 1) {
        resolve(parsed.result?.result?.value);
      }
    });
  });

  console.log('Result:', res);
  await new Promise(r => setTimeout(r, 2000));
  ws.close();
}

run().catch(console.error);
