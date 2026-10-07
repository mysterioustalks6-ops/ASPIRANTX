import { execSync } from 'child_process';
import path from 'path';
import { createCdpClient } from './phone_cdp_controller.mjs';

const ADB = path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk', 'platform-tools', 'adb.exe');
const DEVICE = '192.168.1.194:43391';

function formatMMSS(totalSecs) {
  const m = Math.floor(totalSecs / 60).toString().padStart(2, '0');
  const s = (totalSecs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

async function run() {
  console.log('=== STARTING 5-MINUTE LIVE STOPWATCH BENCHMARK ON PHYSICAL PHONE ===');
  console.log('Device:', DEVICE);

  const cdp = await createCdpClient();

  // Reset to clean state: click End Ride or refresh if currently running
  await cdp.evaluate(`(() => {
    window.location.hash = 'timer';
    const btns = Array.from(document.querySelectorAll('button'));
    const endBtn = btns.find(b => b.innerText?.includes('End Ride'));
    if (endBtn) endBtn.click();
  })()`);
  await new Promise(r => setTimeout(r, 1000));

  // Confirm modal if open
  await cdp.evaluate(`(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const confirm = btns.find(b => b.innerText?.includes('Discard') || b.innerText?.includes('End Session') || b.innerText?.includes('Confirm'));
    if (confirm) confirm.click();
  })()`);
  await new Promise(r => setTimeout(r, 1000));

  // Ensure Highway Stopwatch mode is selected
  await cdp.evaluate(`(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const swBtn = btns.find(b => b.innerText?.includes('Highway Stopwatch') || b.innerText?.includes('Stopwatch'));
    if (swBtn) swBtn.click();
  })()`);
  await new Promise(r => setTimeout(r, 1000));

  async function getDisplayedTime() {
    return await cdp.evaluate(`(() => {
      const el = document.querySelector('.text-7xl, .text-8xl, .text-9xl');
      return el?.innerText?.trim() || '00:00';
    })()`);
  }

  async function clickButton(labelMatch) {
    return await cdp.evaluate(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText?.includes('${labelMatch}'));
      if (btn) { btn.click(); return true; }
      return false;
    })()`);
  }

  const logs = [];

  // Start stopwatch
  const started = await clickButton('Start Focus Ride');
  console.log('Start button clicked:', started);

  const startEpoch = Date.now();
  let pausedEpoch = null;
  let totalPausedMs = 0;
  let isCurrentlyPaused = false;

  function getReferenceElapsedSecs() {
    const now = Date.now();
    if (isCurrentlyPaused && pausedEpoch) {
      return Math.floor(((pausedEpoch - startEpoch) - totalPausedMs) / 1000);
    }
    return Math.floor(((now - startEpoch) - totalPausedMs) / 1000);
  }

  async function record(label) {
    const now = new Date();
    const refSecs = getReferenceElapsedSecs();
    const refDisplay = formatMMSS(refSecs);
    const phoneDisplay = await getDisplayedTime();

    const [pm, ps] = phoneDisplay.split(':').map(Number);
    const phoneSecs = (pm || 0) * 60 + (ps || 0);
    const driftSecs = phoneSecs - refSecs;

    const row = {
      timestamp: now.toTimeString().split(' ')[0],
      phase: label,
      externalTimer: refDisplay,
      phoneDisplay: phoneDisplay,
      drift: `${driftSecs >= 0 ? '+' : ''}${driftSecs}s`
    };
    logs.push(row);
    console.log(`[${row.timestamp}] ${row.phase.padEnd(20)} | External: ${row.externalTimer} | Phone: ${row.phoneDisplay} | Drift: ${row.drift}`);
  }

  await record('Start (0:00)');

  // 1. Run for 45s
  await new Promise(r => setTimeout(r, 45000));
  await record('Running (0:45)');

  // 2. Run until 1m30s
  await new Promise(r => setTimeout(r, 45000));
  await record('Pre-Pause (1:30)');

  // 3. Pause
  console.log('>>> Triggering PAUSE on phone...');
  await clickButton('Pause Ride');
  isCurrentlyPaused = true;
  pausedEpoch = Date.now();
  await new Promise(r => setTimeout(r, 1000));
  await record('Paused (1:30)');

  // Wait 45s in paused state
  await new Promise(r => setTimeout(r, 45000));
  await record('Mid-Pause (frozen)');

  // 4. Resume
  console.log('>>> Triggering RESUME on phone...');
  totalPausedMs += (Date.now() - pausedEpoch);
  pausedEpoch = null;
  isCurrentlyPaused = false;
  await clickButton('Resume Ride');
  await new Promise(r => setTimeout(r, 1000));
  await record('Post-Resume (no jump)');

  // 5. Run until ~3m00s
  await new Promise(r => setTimeout(r, 45000));
  await record('Running (2:15)');

  // 6. Background for 60s
  console.log('>>> Sending app to BACKGROUND via ADB KEYCODE_HOME...');
  execSync(`"${ADB}" -s ${DEVICE} shell input keyevent KEYCODE_HOME`, { stdio: 'pipe' });
  await record('App Backgrounded');

  // Wait 60s in background
  await new Promise(r => setTimeout(r, 60000));

  // 7. Restore from background
  console.log('>>> Restoring app from BACKGROUND via single-top...');
  execSync(`"${ADB}" -s ${DEVICE} shell am start -n com.aspirantx.app/.MainActivity --activity-single-top`, { stdio: 'pipe' });
  await new Promise(r => setTimeout(r, 2000));
  await record('Foreground Restored');

  // 8. Run final 45s to complete 5m
  await new Promise(r => setTimeout(r, 45000));
  await record('Final Benchmark (5:00)');

  console.log('\n=== COMPLETE 5-MINUTE STOPWATCH COMPARISON TABLE ===');
  console.table(logs);

  cdp.close();
}

run().catch(err => {
  console.error('ERROR in 5-min benchmark:', err);
  process.exit(1);
});
