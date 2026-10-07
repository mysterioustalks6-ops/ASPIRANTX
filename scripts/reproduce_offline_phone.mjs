import { execSync } from 'child_process';
import path from 'path';

const ADB = path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk', 'platform-tools', 'adb.exe');
const DEVICE = '192.168.1.194:41229';

execSync(`"${ADB}" connect ${DEVICE}`, { stdio: 'pipe' });
execSync(`"${ADB}" -s ${DEVICE} forward tcp:9223 localabstract:webview_devtools_remote_28070`, { stdio: 'pipe' });

const res = await fetch('http://127.0.0.1:9223/json');
const targets = await res.json();
const pageTarget = targets.find(t => t.type === 'page');

const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);

let msgId = 1;
function call(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = msgId++;
    const handler = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.id === id) {
        ws.removeEventListener('message', handler);
        if (data.error) reject(new Error(data.error.message));
        else resolve(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

const consoleLogs = [];
const failedRequests = [];

ws.onmessage = (evt) => {
  const data = JSON.parse(evt.data);
  if (data.method === 'Runtime.consoleAPICalled') {
    const text = data.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
    consoleLogs.push(`[${data.params.type}] ${text}`);
  }
  if (data.method === 'Network.responseReceived') {
    const resp = data.params.response;
    if (resp.status >= 400) {
      failedRequests.push({ url: resp.url, status: resp.status, statusText: resp.statusText });
    }
  }
  if (data.method === 'Network.loadingFailed') {
    failedRequests.push({ url: data.params.requestId, error: data.params.errorText, canceled: data.params.canceled });
  }
};

await call('Runtime.enable');
await call('Network.enable');

console.log('Reloading page to capture full boot sequence...');
await call('Page.reload', { ignoreCache: true });

// Wait 4 seconds for boot network requests
await new Promise(r => setTimeout(r, 4500));

const evalRes = await call('Runtime.evaluate', {
  expression: `
    (async () => {
      let capConnected = null;
      try {
        const s = await window.Capacitor.Plugins.Network.getStatus();
        capConnected = s.connected;
      } catch (e) {
        capConnected = 'err:' + e.message;
      }
      return {
        navigatorOnLine: navigator.onLine,
        capConnected,
        bannerPresent: !!document.querySelector('[role="status"]')
      };
    })()
  `,
  awaitPromise: true,
  returnByValue: true
});

console.log('\n======================================================');
console.log('1. REPRODUCE ON PHONE: STATE AT BOOT');
console.log('======================================================');
console.log('navigator.onLine:', evalRes.result.value.navigatorOnLine);
console.log('Capacitor Network.getStatus().connected:', evalRes.result.value.capConnected);
console.log('Offline banner present:', evalRes.result.value.bannerPresent);

console.log('\n======================================================');
console.log('LAST FAILED REQUESTS (HTTP status >= 400 or loadingFailed):');
console.log('======================================================');
console.log(JSON.stringify(failedRequests, null, 2));

console.log('\n======================================================');
console.log('LAST 20 CONSOLE LINES:');
console.log('======================================================');
console.log(consoleLogs.slice(-20).join('\n'));

ws.close();
process.exit(0);
