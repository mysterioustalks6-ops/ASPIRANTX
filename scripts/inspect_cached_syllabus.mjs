import WebSocket from 'ws';
import { execFileSync } from 'child_process';

const ADB_PATH = process.env.LOCALAPPDATA + '\\Android\\Sdk\\platform-tools\\adb.exe';
const SERIAL = '10BD570GL500057';

async function run() {
  const unixSockets = execFileSync(ADB_PATH, ['-s', SERIAL, 'shell', 'cat', '/proc/net/unix'], { encoding: 'utf8' });
  const socketMatch = unixSockets.match(/@webview_devtools_remote_(\d+)/);
  const socketName = 'localabstract:' + socketMatch[0].replace('@', '');
  execFileSync(ADB_PATH, ['-s', SERIAL, 'forward', 'tcp:9222', socketName]);
  const res = await fetch('http://127.0.0.1:9222/json');
  const targets = await res.json();
  const t = targets.find(t => t.type === 'page' || t.url.includes('localhost'));
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));
  let id = 1;
  function send(exp) {
    return new Promise(r => {
      const curId = id++;
      const h = (data) => {
        const p = JSON.parse(data.toString());
        if (p.id === curId) { ws.off('message', h); r(p.result?.result?.value); }
      };
      ws.on('message', h);
      ws.send(JSON.stringify({ id: curId, method: 'Runtime.evaluate', params: { expression: exp, returnByValue: true } }));
    });
  }

  const cached = await send('localStorage.getItem("aspirantx_egress_cache_official_syllabus_NEET_UG")');
  console.log('cached length:', cached ? cached.length : null);
  if (cached) {
    const parsed = JSON.parse(cached);
    console.log('parsed type/length:', Array.isArray(parsed?.data) ? parsed.data.length : parsed);
  }
  ws.close();
}

run().catch(console.error);
