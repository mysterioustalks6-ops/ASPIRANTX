import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';

const ADB = path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk', 'platform-tools', 'adb.exe');
const DEVICE = '192.168.1.194:43391';
const OUTPUT_DIR = path.resolve('screenshots');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function getCdpSession() {
  const res = await fetch('http://127.0.0.1:9223/json');
  const targets = await res.json();
  const page = targets.find(t => t.type === 'page');
  if (!page) throw new Error('No page target found on 9223');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));

  let idCounter = 1;
  function evaluate(expr) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      const handler = (data) => {
        const msg = JSON.parse(data);
        if (msg.id === id) {
          ws.off('message', handler);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result?.result?.value);
        }
      };
      ws.on('message', handler);
      ws.send(JSON.stringify({
        id,
        method: 'Runtime.evaluate',
        params: { expression: expr, returnByValue: true, awaitPromise: true }
      }));
    });
  }

  return { ws, evaluate };
}

function captureScreencap(filename) {
  const targetPath = path.join(OUTPUT_DIR, filename);
  execSync(`"${ADB}" -s ${DEVICE} exec-out screencap -p > "${targetPath}"`, { stdio: 'pipe' });
  const stats = fs.statSync(targetPath);
  return { path: targetPath, size: stats.size };
}

async function run() {
  console.log('=== REAL PHYSICAL PHONE CAPTURE PIPELINE ===');
  console.log('Device:', DEVICE);

  const { ws, evaluate } = await getCdpSession();

  const captures = [];

  async function captureState(screenId, filename, setupFn) {
    if (setupFn) await setupFn();
    await new Promise(r => setTimeout(r, 1200));

    const meta = JSON.parse(await evaluate(`JSON.stringify({
      title: document.title,
      heading: (document.querySelector('h1, h2, [role="heading"], h3')?.innerText || '').trim(),
      screen: document.querySelector('[data-screen]')?.getAttribute('data-screen') || '${screenId}'
    })`));

    const fileInfo = captureScreencap(filename);

    if (fileInfo.size < 30000) {
      throw new Error(`File ${filename} size ${fileInfo.size} bytes is under 30 kB!`);
    }

    const record = {
      filename,
      sizeBytes: fileInfo.size,
      screenId: meta.screen,
      documentTitle: meta.title,
      headingText: meta.heading
    };
    captures.push(record);
    console.log(`[CAPTURED] ${filename} (${(fileInfo.size / 1024).toFixed(1)} KB) | Heading: "${meta.heading}"`);
  }

  // 1. Timer Idle
  await captureState('timer', 'timer_idle_dark_1080x2400.png', async () => {
    await evaluate(`window.location.hash = 'timer'`);
  });

  // 2. Timer Running
  await captureState('timer', 'timer_running_dark_1080x2400.png', async () => {
    // Click Start Ride button
    await evaluate(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const startBtn = btns.find(b => b.innerText.includes('Start Ride') || b.innerText.includes('Start Highway'));
      if (startBtn) startBtn.click();
    })()`);
  });

  // 3. Timer Paused
  await captureState('timer', 'timer_paused_dark_1080x2400.png', async () => {
    await new Promise(r => setTimeout(r, 2000));
    await evaluate(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const pauseBtn = btns.find(b => b.innerText.includes('Pause') || b.innerText.includes('Break') || b.innerText.includes('Take a Break'));
      if (pauseBtn) pauseBtn.click();
    })()`);
  });

  // 4. Garage Empty
  await captureState('garage', 'garage_empty_dark_1080x2400.png', async () => {
    await evaluate(`window.location.hash = 'garage'`);
  });

  // 5. Garage Partial (Simulate unlocked parts)
  await captureState('garage', 'garage_partial_dark_1080x2400.png', async () => {
    await evaluate(`(() => {
      // Toggle custom slots on canvas if present or navigate
      window.dispatchEvent(new CustomEvent('aspirantx_test_slot_unlock', { detail: 'wheels' }));
    })()`);
  });

  // 6. My Rides Empty
  await captureState('my_rides', 'my_rides_empty_dark_1080x2400.png', async () => {
    await evaluate(`window.location.hash = 'my_rides'`);
  });

  // 7. Offline banner state
  await captureState('offline_banner', 'offline_banner_dark_1080x2400.png', async () => {
    await evaluate(`(() => {
      window.dispatchEvent(new Event('offline'));
    })()`);
  });

  // Restore online state
  await evaluate(`(() => { window.dispatchEvent(new Event('online')); window.location.hash = 'timer'; })()`);

  ws.close();

  console.log('\n=== REAL PHONE CAPTURE SUMMARY TABLE ===');
  console.table(captures);
}

run().catch(err => {
  console.error('CAPTURE ERROR:', err);
  process.exit(1);
});
