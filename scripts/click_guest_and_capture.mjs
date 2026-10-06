import WebSocket from 'ws';
import { execSync } from 'child_process';
import { resolve } from 'path';

console.log('=== AUTOMATING CLEAN ANDROID GUEST LOGIN AND SCREENSHOTS ===\n');

const ADB_PATH = process.env.LOCALAPPDATA + '\\Android\\Sdk\\platform-tools\\adb.exe';

function captureScreen(outFile) {
  const fullPath = resolve(outFile);
  const tempPath = '/sdcard/tmp_screenshot.png';
  console.log(`Executing screencap to ${tempPath} and pulling to ${fullPath}...`);
  execSync(`"${ADB_PATH}" shell screencap -p ${tempPath}`);
  execSync(`"${ADB_PATH}" pull ${tempPath} "${fullPath}"`);
}

// 1. Dismiss any system dialogs
try {
  console.log('Tapping to dismiss any System UI dialog...');
  execSync(`"${ADB_PATH}" shell input tap 350 1340`);
  execSync(`"${ADB_PATH}" shell input keyevent 4`);
} catch(e){}

// 2. Connect to WebView
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

// 3. Click Guest Demo if on Landing page
console.log('Checking current screen and clicking Guest Demo if needed...');
const currentUrl = await evaluate(`window.location.href`);
console.log('Current URL/Hash:', currentUrl);

await evaluate(`
  const btn = document.getElementById('landing-guest-demo-btn');
  if (btn) {
    btn.click();
    'Clicked landing-guest-demo-btn';
  } else {
    'Button not found or already logged in';
  }
`);

// Wait for dashboard to load
await new Promise(r => setTimeout(r, 3000));

// Step 1: Clean Today screen
console.log('\n--- 1. TODAY SCREEN (SCROLLED TO RIDE HERO, 3-STOP ROAD, PACE TILE) ---');
await evaluate(`
  window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'dashboard' }));
`);
await new Promise(r => setTimeout(r, 2500));

// Scroll down smoothly so full Ride hero, 3-stop road, and Pace tile are visible
await evaluate(`
  window.scrollTo({ top: 320, behavior: 'instant' });
`);
await new Promise(r => setTimeout(r, 1500));

captureScreen('docs/screenshots/android_today.png');

// Step 2: Map (Territory)
console.log('\n--- 2. MAP (TERRITORY) SCREEN ---');
await evaluate(`
  window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'syllabus' }));
`);
await new Promise(r => setTimeout(r, 2500));
await evaluate(`
  window.scrollTo({ top: 0, behavior: 'instant' });
`);
await new Promise(r => setTimeout(r, 1500));

captureScreen('docs/screenshots/android_map_territory.png');

// Step 3: Me Screen
console.log('\n--- 3. ME SCREEN ---');
await evaluate(`
  window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'more_hub' }));
`);
await new Promise(r => setTimeout(r, 2500));
await evaluate(`
  window.scrollTo({ top: 0, behavior: 'instant' });
`);
await new Promise(r => setTimeout(r, 1500));

captureScreen('docs/screenshots/android_me.png');

console.log('\nDisconnecting from Android WebView...');
ws.close();
console.log('All 3 Android screenshots successfully updated!');
process.exit(0);
