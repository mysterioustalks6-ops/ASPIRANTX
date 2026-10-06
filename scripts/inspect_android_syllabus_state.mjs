import { execFile } from 'child_process';
import { promisify } from 'util';
import WebSocket from 'ws';

const execFileAsync = promisify(execFile);
const ADB_PATH = process.env.LOCALAPPDATA + '\\Android\\Sdk\\platform-tools\\adb.exe';
const SERIAL = '10BD570GL500057';

async function main() {
  const timeout = setTimeout(() => {
    console.error('Timed out after 45s');
    process.exit(1);
  }, 45000);

  let ws;
  try {
    // Forward port using execFile with args array
    await execFileAsync(ADB_PATH, ['-s', SERIAL, 'forward', 'tcp:9222', 'localabstract:webview_devtools_remote_15989']);
    console.log('Port 9222 forwarded to webview_devtools_remote_15989');

    const endpoints = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
    console.log('Endpoints found:', endpoints.map(e => ({ title: e.title, url: e.url, id: e.id })));
    const page = endpoints.find(e => e.type === 'page');
    if (!page) {
      console.error('No page endpoint found');
      return;
    }

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

    const state = await evalCode(`(() => {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        keys.push(localStorage.key(i));
      }
      const relevantKeys = keys.filter(k => 
        k.toLowerCase().includes('syllabus') || 
        k.toLowerCase().includes('neet') || 
        k.toLowerCase().includes('exam') || 
        k.toLowerCase().includes('track') ||
        k.toLowerCase().includes('user') ||
        k.toLowerCase().includes('auth') ||
        k.toLowerCase().includes('plan')
      );
      
      const keyValues = {};
      relevantKeys.forEach(k => {
        const val = localStorage.getItem(k);
        keyValues[k] = val && val.length > 200 ? val.slice(0, 200) + '... (len: ' + val.length + ')' : val;
      });

      return {
        url: window.location.href,
        relevantKeys,
        keyValues,
        auth_user: localStorage.getItem('aspirantx_auth_user'),
        selectedExam: localStorage.getItem('studyride_selected_exam_id') || localStorage.getItem('selectedExamId')
      };
    })()`);

    console.log('Android WebView State:\n', JSON.stringify(state, null, 2));

  } catch (err) {
    console.error('Error inspecting Android WebView:', err);
  } finally {
    clearTimeout(timeout);
    if (ws) ws.close();
  }
}

main();
