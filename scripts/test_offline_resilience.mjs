import { execFile } from 'child_process';
import { promisify } from 'util';
import WebSocket from 'ws';

const execFileAsync = promisify(execFile);
const ADB_PATH = process.env.LOCALAPPDATA + '\\Android\\Sdk\\platform-tools\\adb.exe';
const SERIAL = '10BD570GL500057';

async function main() {
  const timeout = setTimeout(() => {
    console.error('Offline test timed out after 30s');
    process.exit(1);
  }, 30000);

  let ws;
  try {
    // 1. Ensure phone is awake & app is focused
    await execFileAsync(ADB_PATH, ['-s', SERIAL, 'shell', 'input keyevent 224; wm dismiss-keyguard; am start -n com.aspirantx.app/.MainActivity']);
    await new Promise(r => setTimeout(r, 1000));

    // 2. Forward tcp:9222
    await execFileAsync(ADB_PATH, ['-s', SERIAL, 'forward', 'tcp:9222', 'localabstract:webview_devtools_remote_15989']);
    
    // 3. Get page endpoint
    const endpoints = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
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

    console.log('=== ANDROID WEBVIEW OFFLINE RESILIENCE AUDIT ===');
    console.log('Target Device:', SERIAL);
    console.log('Target Page:', page.title, '| URL:', page.url);

    // Evaluate navigator.onLine and execute live failing fetch
    const evalResult = await sendCommand('Runtime.evaluate', {
      expression: `(async () => {
        const isOnline = window.navigator.onLine;

        // Probe 1: Guaranteed failing fetch (unreachable offline endpoint)
        let guaranteedFailingFetch = {};
        try {
          await fetch('https://offline-unreachable.studyride.local/api/test-offline', {
            cache: 'no-store',
            signal: AbortSignal.timeout(1500)
          });
        } catch (err) {
          guaranteedFailingFetch = {
            ok: false,
            errorName: err.name,
            errorMessage: err.message
          };
        }

        // Probe 2: Live endpoint (to detect current network / airplane mode state)
        let liveEndpointFetch = {};
        try {
          const res = await fetch('https://studyride.in/api/academic/syllabus/stats?exam=NEET_UG&_test=' + Date.now(), {
            cache: 'no-store',
            signal: AbortSignal.timeout(2000)
          });
          liveEndpointFetch = {
            ok: res.ok,
            status: res.status
          };
        } catch (err) {
          liveEndpointFetch = {
            ok: false,
            errorName: err.name,
            errorMessage: err.message
          };
        }

        return JSON.stringify({
          navigatorOnLine: isOnline,
          guaranteedFailingFetch,
          liveEndpointFetch,
          domHealth: {
            appContainerMounted: !!document.getElementById('root'),
            currentRoute: window.location.hash || window.location.pathname,
            bodyVisibleTextLength: (document.body.innerText || '').length,
            errorOverlayPresent: !!document.querySelector('.error-boundary')
          }
        });
      })()`,
      awaitPromise: true,
      returnByValue: true
    });

    const parsed = JSON.parse(evalResult.result.value);
    console.log('\n--- RAW AUDIT OUTPUT ---');
    console.log('1. navigator.onLine:', parsed.navigatorOnLine);
    console.log('2. Offline Failing fetch() outcome:', JSON.stringify(parsed.guaranteedFailingFetch, null, 2));
    console.log('3. Live endpoint fetch() outcome:', JSON.stringify(parsed.liveEndpointFetch, null, 2));
    console.log('4. App DOM health (zero crash under offline):', JSON.stringify(parsed.domHealth, null, 2));

  } catch (err) {
    console.error('Offline test execution error:', err);
    process.exit(1);
  } finally {
    clearTimeout(timeout);
    if (ws) ws.close();
  }
}

main();
