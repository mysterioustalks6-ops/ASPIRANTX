import WebSocket from 'ws';
import { execSync } from 'child_process';

const jsonRaw = execSync('curl.exe -s http://127.0.0.1:9223/json').toString();
const pages = JSON.parse(jsonRaw);
const page = pages.find(p => p.type === 'page');

if (!page) {
  console.error('No page found');
  process.exit(1);
}

const expression = process.argv[2] || 'document.title';

const ws = new WebSocket(page.webSocketDebuggerUrl);

ws.on('open', () => {
  const req = {
    id: 1,
    method: 'Runtime.evaluate',
    params: {
      expression,
      returnByValue: true,
      awaitPromise: true
    }
  };
  ws.send(JSON.stringify(req));
});

ws.on('message', (msg) => {
  const res = JSON.parse(msg.toString());
  if (res.id === 1) {
    console.log(JSON.stringify(res.result?.result?.value));
    ws.close();
    process.exit(0);
  }
});

ws.on('error', (err) => {
  console.error('WS Error:', err);
  process.exit(1);
});

setTimeout(() => {
  console.error('Timeout');
  process.exit(1);
}, 3000);
