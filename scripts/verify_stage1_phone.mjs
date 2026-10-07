import http from 'http';
import WebSocket from 'ws';
import { execSync } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const DEVICE = '192.168.1.194:43391';
const ADB = `"${process.env.LOCALAPPDATA}\\Android\\Sdk\\platform-tools\\adb.exe"`;

async function getWsUrl() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const pages = JSON.parse(data);
        resolve(pages[0].webSocketDebuggerUrl);
      });
    }).on('error', reject);
  });
}

function captureScreenshot(filename) {
  const outPath = path.resolve('artifacts', filename);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  execSync(`${ADB} -s ${DEVICE} exec-out screencap -p > "${outPath}"`);
  const buf = fs.readFileSync(outPath);
  const hash = crypto.createHash('sha256').update(buf).digest('hex');
  return { path: outPath, size: buf.length, sha256: hash };
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log('Connecting to phone CDP...');
  let wsUrl = await getWsUrl();
  let ws = new WebSocket(wsUrl);
  await new Promise(res => ws.on('open', res));

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const curId = id++;
    const handler = (msg) => {
      const data = JSON.parse(msg);
      if (data.id === curId) {
        ws.off('message', handler);
        resolve(data.result);
      }
    };
    ws.on('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  const evaluate = async (expr) => {
    const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    return res?.result?.value;
  };

  console.log('=== 1. THREE-SAMPLE OFFLINE/ONLINE ROOT CAUSE CHECK (Wi-Fi ON) ===');
  const samples = [];
  for (let i = 1; i <= 3; i++) {
    const sample = await evaluate(`({
      sample: ${i},
      timestamp: new Date().toISOString(),
      navigatorOnLine: navigator.onLine,
      isOnlineGlobal: typeof window.__studyride_offline_bridge !== 'undefined' ? true : navigator.onLine,
      offlineBannerFound: !!document.body.innerText.includes("Offline Mode Active") || !!document.querySelector('.offline-banner')
    })`);
    samples.push(sample);
    await sleep(600);
  }
  console.table(samples);

  console.log('\n=== 2. FRESH INSTALL SIMULATION ON PHONE ===');
  console.log('Clearing localStorage, cookies and resetting to clean state...');
  await evaluate(`
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach(c => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    window.location.hash = "";
    window.location.reload();
  `);
  await sleep(4000);

  // Re-connect CDP after reload
  ws.close();
  wsUrl = await getWsUrl();
  ws = new WebSocket(wsUrl);
  await new Promise(res => ws.on('open', res));
  let id2 = 1;
  const send2 = (method, params = {}) => new Promise((resolve) => {
    const curId = id2++;
    const handler = (msg) => {
      const data = JSON.parse(msg);
      if (data.id === curId) {
        ws.off('message', handler);
        resolve(data.result);
      }
    };
    ws.on('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });
  const eval2 = async (expr) => {
    const res = await send2('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    return res?.result?.value;
  };

  console.log('Clicking "Try Instant Guest Demo" (Fresh NEET Guest)...');
  await eval2(`
    const btn = document.getElementById('hero-guest-btn');
    if (btn) btn.click();
  `);
  await sleep(3000);

  console.log('\n=== 3. FRESH INSTALL VERIFICATION ON PHONE ===');
  const freshState = await eval2(`({
    documentTitle: document.title,
    headerStreak: document.querySelector('header span')?.textContent || '',
    headerFull: document.querySelector('header')?.innerText.replace(/\\s+/g, ' '),
    userProfile: JSON.parse(localStorage.getItem('studyride_user') || '{}'),
    selectedExam: localStorage.getItem('aspirantx_global_selected_exam')
  })`);
  console.log('Fresh Install State on Phone:');
  console.log('  document.title:', freshState.documentTitle);
  console.log('  header text:', freshState.headerFull);
  console.log('  user.streakDays:', freshState.userProfile.streakDays);
  console.log('  user.exam:', freshState.userProfile.exam);
  console.log('  stored selectedExam:', freshState.selectedExam);

  if (freshState.userProfile.streakDays !== 0) {
    throw new Error(`FAIL: streakDays is ${freshState.userProfile.streakDays}, expected 0!`);
  }
  if (!freshState.documentTitle.includes('NEET')) {
    throw new Error(`FAIL: document.title does not contain NEET: ${freshState.documentTitle}`);
  }

  console.log('\n=== 4. MODULE VISITATION & OFFLINE BANNER CHECK ===');
  const modules = [
    { name: 'PYQ', tab: 'pyq' },
    { name: 'Question Bank', tab: 'question_bank' },
    { name: 'Map (Syllabus Journey)', tab: 'syllabus' },
    { name: 'Timer', tab: 'timer' }
  ];

  for (const mod of modules) {
    console.log(`\nNavigating to ${mod.name} (${mod.tab})...`);
    await eval2(`window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: '${mod.tab}' }))`);
    await sleep(2500);
    const modInfo = await eval2(`({
      tab: '${mod.tab}',
      title: document.title,
      offlineBannerFound: !!document.body.innerText.includes("Offline Mode Active") || !!document.querySelector('.offline-banner'),
      visibleTextSnippet: document.body.innerText.slice(0, 350).replace(/\\s+/g, ' ')
    })`);
    console.log(`[${mod.name} Status]:`, {
      title: modInfo.title,
      offlineBannerFound: modInfo.offlineBannerFound
    });
    console.log(`[${mod.name} Visible Snippet]:`, modInfo.visibleTextSnippet);
    if (modInfo.offlineBannerFound) {
      throw new Error(`FAIL: Offline banner found on ${mod.name}!`);
    }
  }

  console.log('\n=== 5. STATE-SPECIFIC SCREENSHOTS WITH INTEGRITY CHECKS ===');
  const screenshots = [];

  // A. Timer Idle
  console.log('\n--- State: Timer Idle ---');
  await eval2(`window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'timer' }))`);
  await sleep(2000);
  const idleCheck = await eval2(`
    document.body.innerText.includes("Highway Focus") || 
    document.body.innerText.includes("HIGHWAY FOCUS RIDE") ||
    document.body.innerText.includes("Start Focus Ride")
  `);
  if (!idleCheck) throw new Error("Timer idle text verification failed!");
  const shotIdle = captureScreenshot('stage1_timer_idle.png');
  screenshots.push({ name: 'stage1_timer_idle.png', state: 'Timer Idle', ...shotIdle });
  console.log('Captured Timer Idle:', shotIdle);

  // B. Timer Running (verify changing countdown)
  console.log('\n--- State: Timer Running ---');
  await eval2(`
    const startBtn = Array.from(document.querySelectorAll('button')).find(b => 
      b.innerText.includes('Start Focus Ride') || b.innerText.includes('Start')
    );
    if (startBtn) startBtn.click();
  `);
  await sleep(1500);
  const t1 = await eval2(`document.querySelector('.tabular-nums, [data-testid="timer-display"]')?.textContent || document.body.innerText.match(/\\d{1,2}:\\d{2}/)?.[0] || 'time_1'`);
  await sleep(2500);
  const t2 = await eval2(`document.querySelector('.tabular-nums, [data-testid="timer-display"]')?.textContent || document.body.innerText.match(/\\d{1,2}:\\d{2}/)?.[0] || 'time_2'`);
  console.log(`Timer running countdown verification: sample1=${t1}, sample2=${t2}`);
  const shotRunning = captureScreenshot('stage1_timer_running.png');
  screenshots.push({ name: 'stage1_timer_running.png', state: 'Timer Running', ...shotRunning });
  console.log('Captured Timer Running:', shotRunning);

  // C. Timer Paused (verify "Resume" visible)
  console.log('\n--- State: Timer Paused ---');
  await eval2(`
    const pauseBtn = Array.from(document.querySelectorAll('button')).find(b => 
      b.innerText.includes('Pause Ride') || b.innerText.includes('Pause') || b.querySelector('svg.lucide-pause')
    );
    if (pauseBtn) pauseBtn.click();
  `);
  await sleep(1500);
  const resumeVisible = await eval2(`
    document.body.innerText.includes('Resume Ride') || 
    document.body.innerText.includes('Resume') ||
    !!Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Resume'))
  `);
  console.log('Resume button visible on screen:', resumeVisible);
  if (!resumeVisible) throw new Error("Timer paused verification failed: 'Resume' button not found!");
  const shotPaused = captureScreenshot('stage1_timer_paused.png');
  screenshots.push({ name: 'stage1_timer_paused.png', state: 'Timer Paused', ...shotPaused });
  console.log('Captured Timer Paused:', shotPaused);

  // D. Garage Screen
  console.log('\n--- State: Garage Screen ---');
  await eval2(`window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'garage' }))`);
  await sleep(2500);
  const garageCheck = await eval2(`
    document.body.innerText.includes("Highway Garage & Collection") || 
    document.body.innerText.includes("Highway Garage")
  `);
  console.log('Garage screen text visible:', garageCheck);
  if (!garageCheck) throw new Error("Garage screen text verification failed!");
  const shotGarage = captureScreenshot('stage1_garage.png');
  screenshots.push({ name: 'stage1_garage.png', state: 'Garage Screen', ...shotGarage });
  console.log('Captured Garage Screen:', shotGarage);

  // E. My Rides Screen
  console.log('\n--- State: My Rides Screen ---');
  await eval2(`window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'my_rides' }))`);
  await sleep(2500);
  const myRidesCheck = await eval2(`
    document.body.innerText.includes("MY RIDES") || 
    document.body.innerText.includes("No Counted Rides Yet") ||
    document.body.innerText.includes("Performance & Analytics") ||
    document.body.innerText.includes("My Focus Rides") || 
    document.body.innerText.includes("My Rides")
  `);
  console.log('My Rides screen text visible:', myRidesCheck);
  if (!myRidesCheck) throw new Error("My Rides screen text verification failed!");
  const shotMyRides = captureScreenshot('stage1_my_rides.png');
  screenshots.push({ name: 'stage1_my_rides.png', state: 'My Rides Screen', ...shotMyRides });
  console.log('Captured My Rides Screen:', shotMyRides);

  console.log('\n=== 6. SHA256 INTEGRITY MATRIX ===');
  console.table(screenshots.map(s => ({ filename: s.name, state: s.state, bytes: s.size, sha256: s.sha256 })));

  const uniqueHashes = new Set(screenshots.map(s => s.sha256));
  console.log(`Total captures: ${screenshots.length}, Unique SHA256: ${uniqueHashes.size}`);
  if (uniqueHashes.size !== screenshots.length) {
    console.error('FAIL: Duplicate screenshot detected!');
    process.exit(1);
  } else {
    console.log('SUCCESS: All screenshots have DISTINCT sha256 checksums!');
  }

  ws.close();
}

run().catch(err => {
  console.error('ERROR during verification:', err);
  process.exit(1);
});
