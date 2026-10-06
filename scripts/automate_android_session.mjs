import WebSocket from 'ws';
import { execFileSync } from 'child_process';
import { resolve } from 'path';

console.log('=== AUTOMATING ANDROID WEBVIEW FOR SECTION B4 ===\n');

const ADB_PATH = process.env.LOCALAPPDATA + '\\Android\\Sdk\\platform-tools\\adb.exe';

function captureScreen(outFile) {
  const fullPath = resolve(outFile);
  const tempPath = '/sdcard/tmp_screen.png';
  console.log(`Capturing to ${tempPath} and pulling to ${fullPath}...`);
  execFileSync(ADB_PATH, ['shell', 'screencap', '-p', tempPath]);
  execFileSync(ADB_PATH, ['pull', tempPath, fullPath]);
}

const res = await fetch('http://127.0.0.1:9222/json');
const targets = await res.json();
const appTarget = targets.find(t => t.type === 'page' || t.url.includes('localhost'));

if (!appTarget) {
  console.error('No Android WebView page target found!');
  process.exit(1);
}

console.log(`Connecting to Android WebView at ${appTarget.webSocketDebuggerUrl}...`);
const ws = new WebSocket(appTarget.webSocketDebuggerUrl);

await new Promise((resolve, reject) => {
  ws.on('open', resolve);
  ws.on('error', reject);
});

let msgIdCounter = 1;
const evaluate = (expression) => {
  return new Promise((resolve) => {
    const id = msgIdCounter++;
    const handler = (data) => {
      const res = JSON.parse(data.toString());
      if (res.id === id) {
        ws.off('message', handler);
        resolve(res.result?.result?.value);
      }
    };
    ws.on('message', handler);
    ws.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression, returnByValue: true } }));
  });
};

// Check if on landing page and enter guest demo
const isLanding = await evaluate(`
  Boolean(document.querySelector('#hero-guest-btn') || document.querySelector('#landing-page-hero'))
`);
console.log('Is on landing page?', isLanding);

if (isLanding) {
  console.log('Clicking instant guest demo button on Android WebView...');
  await evaluate(`
    const btn = document.querySelector('#hero-guest-btn') || Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Guest Demo'));
    if (btn) btn.click();
  `);
  await new Promise(r => setTimeout(r, 2500));
}

// Ensure Today tab is active
console.log('\nNavigating to Today dashboard...');
await evaluate(`
  window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'dashboard' }));
`);
await new Promise(r => setTimeout(r, 2000));

// Check elements presence
const elementsCheck = await evaluate(`
  ({
    hasRideHero: Boolean(document.querySelector('[data-screen="dashboard"]') && document.body.innerText.includes('Aaj Ki Ride') || document.body.innerText.includes('Ride')),
    hasPaceTile: Boolean(document.body.innerText.includes('Pace') || document.body.innerText.includes('Ahead') || document.body.innerText.includes('On Track') || document.body.innerText.includes('Just starting')),
    hasRoute: Boolean(document.body.innerText.includes('Route') || document.body.innerText.includes('Stop') || document.body.innerText.includes('Road'))
  })
`);
console.log('Today elements check:', elementsCheck);

// Scroll so Ride hero, 3-stop road, and Pace tile are all in view
await evaluate(`
  window.scrollTo({ top: 160, behavior: 'instant' });
`);
await new Promise(r => setTimeout(r, 1500));

console.log('Capturing docs/screenshots/android_today.png...');
captureScreen('docs/screenshots/android_today.png');

// Step 2: Map (Territory)
console.log('\nNavigating to Map (Territory)...');
await evaluate(`
  window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'syllabus' }));
`);
await new Promise(r => setTimeout(r, 2000));
await evaluate(`
  window.scrollTo({ top: 0, behavior: 'instant' });
`);
await new Promise(r => setTimeout(r, 1000));

console.log('Capturing docs/screenshots/android_map_territory.png...');
captureScreen('docs/screenshots/android_map_territory.png');

// Step 3: Me Screen
console.log('\nNavigating to Me screen...');
await evaluate(`
  window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'more_hub' }));
`);
await new Promise(r => setTimeout(r, 2000));
await evaluate(`
  window.scrollTo({ top: 0, behavior: 'instant' });
`);
await new Promise(r => setTimeout(r, 1000));

console.log('Capturing docs/screenshots/android_me.png...');
captureScreen('docs/screenshots/android_me.png');

ws.close();
console.log('Done capturing all 3 Android screenshots!');
process.exit(0);
