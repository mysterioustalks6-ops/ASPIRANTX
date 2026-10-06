import { execFile } from 'child_process';
import { promisify } from 'util';
import WebSocket from 'ws';

const execFileAsync = promisify(execFile);
const ADB_PATH = process.env.LOCALAPPDATA + '\\Android\\Sdk\\platform-tools\\adb.exe';
const SERIAL = '10BD570GL500057';

async function main() {
  const timeout = setTimeout(() => { process.exit(1); }, 20000);
  let ws;
  try {
    await execFileAsync(ADB_PATH, ['-s', SERIAL, 'forward', 'tcp:9222', 'localabstract:webview_devtools_remote_15989']);
    const endpoints = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
    const page = endpoints.find(e => e.type === 'page');
    ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise(r => ws.on('open', r));

    let id = 1;
    function evalCode(expr) {
      return new Promise((resolve, reject) => {
        const curId = id++;
        const handler = (data) => {
          const msg = JSON.parse(data.toString());
          if (msg.id === curId) {
            ws.off('message', handler);
            if (msg.error) reject(msg.error);
            else resolve(msg.result?.result?.value);
          }
        };
        ws.on('message', handler);
        ws.send(JSON.stringify({
          id: curId,
          method: 'Runtime.evaluate',
          params: { expression: expr, returnByValue: true, awaitPromise: true }
        }));
      });
    }

    const data = await evalCode(`(() => {
      const raw = localStorage.getItem('aspirantx_egress_cache_official_syllabus_NEET_UG');
      if (!raw) return { error: 'No cached official syllabus for NEET_UG' };
      const parsed = JSON.parse(raw);
      const items = parsed.data || [];
      const chapters = [...new Set(items.map(i => i.subject + ' :: ' + i.chapter))];
      const totalHours = items.reduce((acc, i) => acc + (i.estimatedHours || 0), 0);
      return {
        itemCount: items.length,
        chaptersCount: chapters.length,
        chapters,
        totalHours,
        sample: items.slice(0, 3)
      };
    })()`);

    console.log('Cached NEET_UG syllabus:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    clearTimeout(timeout);
    if (ws) ws.close();
  }
}
main();
