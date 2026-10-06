import { execFile } from 'child_process';
import { promisify } from 'util';
import WebSocket from 'ws';

const execFileAsync = promisify(execFile);
const ADB_PATH = process.env.LOCALAPPDATA + '\\Android\\Sdk\\platform-tools\\adb.exe';
const SERIAL = '10BD570GL500057';

async function main() {
  const timeout = setTimeout(() => {
    console.error('Probe timed out after 55s');
    process.exit(1);
  }, 55000);

  let ws;
  try {
    // 1. Ensure phone is awake & app is focused
    await execFileAsync(ADB_PATH, ['-s', SERIAL, 'shell', 'input keyevent 224; wm dismiss-keyguard; am start -n com.aspirantx.app/.MainActivity']);
    await new Promise(r => setTimeout(r, 1000));

    // 2. Discover socket dynamically
    const { stdout: unixOut } = await execFileAsync(ADB_PATH, ['-s', SERIAL, 'shell', 'cat', '/proc/net/unix']);
    const match = unixOut.match(/@webview_devtools_remote_(\d+)/);
    let socketName;
    if (match) {
      socketName = match[0].replace('@', '');
    } else {
      const { stdout: pidOut } = await execFileAsync(ADB_PATH, ['-s', SERIAL, 'shell', 'pidof', 'com.aspirantx.app']);
      const pid = pidOut.trim();
      if (!pid) throw new Error('com.aspirantx.app process not found on device');
      socketName = `webview_devtools_remote_${pid}`;
    }
    console.log(`[DYNAMIC SOCKET] ${socketName}`);

    // 3. Forward tcp:9222
    await execFileAsync(ADB_PATH, ['-s', SERIAL, 'forward', 'tcp:9222', `localabstract:${socketName}`]);

    // 4. Get page endpoint
    const res = await fetch('http://127.0.0.1:9222/json');
    const endpoints = await res.json();
    const page = endpoints.find(e => e.type === 'page');
    if (!page) {
      throw new Error('No page endpoint found on device');
    }

    ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.on('open', resolve);
      ws.on('error', reject);
    });

    let msgId = 1;
    function sendCommand(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        const onMessage = (buf) => {
          const msg = JSON.parse(buf.toString());
          if (msg.id === id) {
            ws.off('message', onMessage);
            if (msg.error) reject(msg.error);
            else resolve(msg.result);
          }
        };
        ws.on('message', onMessage);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    console.log('[PROBE] Evaluating on phone: navigator.onLine, fetch, document.title...');

    const probeCode = `
      (async () => {
        const online = navigator.onLine;
        const title = document.title;
        let fetchStatus = '';
        let fetchError = '';
        try {
          const res = await fetch('https://studyride.in/api/academic/syllabus/stats?exam=NEET_UG&_test=' + Date.now(), {
            signal: AbortSignal.timeout(3000)
          });
          fetchStatus = 'HTTP ' + res.status + ' ' + res.statusText;
        } catch (e) {
          fetchError = e.name + ': ' + e.message;
        }

        const localUser = localStorage.getItem('studyride_user');
        const activeExam = localStorage.getItem('studyride_active_exam');
        const guestExam = localStorage.getItem('aspirantx_guest_exam');
        const curExam = localStorage.getItem('aspirantx_current_exam');

        return {
          navigatorOnLine: online,
          documentTitle: title,
          fetchStatus,
          fetchError,
          localStorageState: {
            studyride_user: localUser,
            studyride_active_exam: activeExam,
            aspirantx_guest_exam: guestExam,
            aspirantx_current_exam: curExam
          }
        };
      })()
    `;

    const evalResult = await sendCommand('Runtime.evaluate', {
      expression: probeCode,
      awaitPromise: true,
      returnByValue: true
    });

    console.log('[RAW EVAL RESULT]:', JSON.stringify(evalResult.result.value, null, 2));

  } catch (err) {
    console.error('Probe error:', err);
    process.exit(1);
  } finally {
    if (ws) {
      try { ws.close(); } catch {}
    }
    clearTimeout(timeout);
  }
}

main();
