import WebSocket from 'ws';
import { execFileSync } from 'child_process';

const ADB_PATH = process.env.LOCALAPPDATA + '\\Android\\Sdk\\platform-tools\\adb.exe';
const SERIAL = '10BD570GL500057';

async function main() {
  console.log('=== GATE-A AUTOMATED RAW VERIFICATION ===\n');

  // Discover webview socket
  const unixSockets = execFileSync(ADB_PATH, ['-s', SERIAL, 'shell', 'cat', '/proc/net/unix'], { encoding: 'utf8' });
  const socketMatch = unixSockets.match(/@webview_devtools_remote_(\d+)/);
  if (!socketMatch) {
    console.error('Could not find webview socket on device!');
    process.exit(1);
  }
  const socketName = 'localabstract:' + socketMatch[0].replace('@', '');
  console.log('Found webview socket:', socketName);
  execFileSync(ADB_PATH, ['-s', SERIAL, 'forward', 'tcp:9222', socketName]);
  console.log('Forwarded tcp:9222 to', socketName);
  const res = await fetch('http://127.0.0.1:9222/json');
  const targets = await res.json();
  const appTarget = targets.find(t => t.type === 'page' || (t.url && t.url.includes('localhost')));

  if (!appTarget) {
    console.error('Target not found:', targets);
    process.exit(1);
  }

  console.log('Connecting to target:', appTarget.title, appTarget.url);
  const ws = new WebSocket(appTarget.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
  });

  let msgIdCounter = 1;
  const evaluate = (expression) => {
    return new Promise((resolve, reject) => {
      const id = msgIdCounter++;
      const handler = (data) => {
        const parsed = JSON.parse(data.toString());
        if (parsed.id === id) {
          ws.off('message', handler);
          if (parsed.error) {
            reject(new Error(JSON.stringify(parsed.error)));
          } else if (parsed.result?.exceptionDetails) {
            reject(new Error(JSON.stringify(parsed.result.exceptionDetails)));
          } else {
            resolve(parsed.result?.result?.value);
          }
        }
      };
      ws.on('message', handler);
      ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression, returnByValue: true, awaitPromise: true } }));
    });
  };

  // Check what screen we're on
  const initialUrl = await evaluate('window.location.href');
  console.log('Initial URL:', initialUrl);

  // Check if guest button exists and click it through real UI
  const clicked = await evaluate(`(() => {
    const heroBtn = document.getElementById('hero-guest-btn');
    if (heroBtn) {
      heroBtn.click();
      return 'Clicked hero-guest-btn';
    }
    const navBtn = document.getElementById('landing-guest-demo-btn');
    if (navBtn) {
      navBtn.click();
      return 'Clicked landing-guest-demo-btn';
    }
    const emeraldBtn = document.querySelector('button.btn-3d-emerald');
    if (emeraldBtn) {
      emeraldBtn.click();
      return 'Clicked button.btn-3d-emerald';
    }
    return 'No guest button found (already in app?)';
  })()`);
  console.log('Guest button action:', clicked);

  // Wait 3 seconds for state to settle
  await new Promise(r => setTimeout(r, 3000));

  // 1. REBUILD: Check localStorage studyride_user
  console.log('\n--- 1. REBUILD RAW OUTPUT: localStorage studyride_user ---');
  const studyrideUserRaw = await evaluate(`localStorage.getItem('studyride_user')`);
  console.log(studyrideUserRaw);

  // 2. OFFLINE: navigator.onLine, failing fetch, airplane_mode_on
  console.log('\n--- 2. OFFLINE RAW OUTPUT ---');
  const onLine = await evaluate(`navigator.onLine`);
  console.log('navigator.onLine:', onLine);

  const fetchResult = await evaluate(`(async () => {
    try {
      const resp = await fetch('https://studyride.in/api/health', { signal: AbortSignal.timeout(3000) });
      return { success: true, status: resp.status };
    } catch (err) {
      return { success: false, error: err.name + ': ' + err.message };
    }
  })()`);
  console.log('Failing fetch():', JSON.stringify(fetchResult));

  const airplaneMode = execFileSync(ADB_PATH, ['-s', SERIAL, 'shell', 'settings', 'get', 'global', 'airplane_mode_on'], { encoding: 'utf8' }).trim();
  console.log('adb airplane_mode_on:', airplaneMode);

  // 6. TITLE BUG: document.title on phone
  console.log('\n--- 6. TITLE BUG RAW OUTPUT ---');
  const pageTitle = await evaluate(`document.title`);
  console.log('document.title:', pageTitle);

  // 5. SYLLABUS: Check syllabus on Android (topics, hours, buffer)
  console.log('\n--- 5. SYLLABUS & WORKLOAD RAW OUTPUT ON ANDROID ---');
  // Navigate to syllabus tab
  await evaluate(`window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'syllabus' }))`);
  await new Promise(r => setTimeout(r, 3000));

  const androidTitleInSyllabus = await evaluate(`document.title`);
  console.log('document.title in Syllabus tab:', androidTitleInSyllabus);

  const syllabusDomInfo = await evaluate(`(() => {
    const textNodes = document.body.innerText;
    // Look for topic count, hours, buffer
    const matchTopics = textNodes.match(/(\\d+)\\s*(?:topics|chapters|units)/i);
    const matchHours = textNodes.match(/(\\d+(?:\\.\\d+)?)\\s*(?:hrs|hours)/i);
    const matchBuffer = textNodes.match(/(\\d+(?:\\.\\d+)?)\\s*(?:days buffer|buffer days|buffer)/i);
    
    // Check syllabus list items count
    const topicCards = document.querySelectorAll('[data-topic-id], .topic-row, [role="treeitem"]');
    return {
      snippet: textNodes.slice(0, 500).replace(/\\n+/g, ' '),
      cardsCount: topicCards.length
    };
  })()`);
  console.log('Syllabus DOM summary:', syllabusDomInfo);

  ws.close();
  console.log('\nDone.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
