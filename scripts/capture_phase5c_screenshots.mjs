import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9222;
const BASE_URL = 'http://localhost:4173';
const OUTPUT_DIR = path.resolve('screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getWsUrl() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) {
        const data = await res.json();
        return data.webSocketDebuggerUrl;
      }
    } catch (e) {}
    await wait(500);
  }
  throw new Error('Chrome remote debugging port not responding');
}

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.msgId = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { res, rej } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) rej(new Error(msg.error.message));
          else res(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      this.callbacks.set(id, { res: resolve, rej: reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function run() {
  console.log('Launching headless Chrome...');
  const chromeProc = spawn(
    CHROME_PATH,
    [
      `--remote-debugging-port=${PORT}`,
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--user-data-dir=C:\\Users\\AMBUJ YADAV\\Documents\\Aspirantx\\.temp_chrome_profile'
    ],
    { stdio: 'ignore' }
  );

  try {
    const wsUrl = await getWsUrl();
    console.log('Connected to Chrome CDP at:', wsUrl);

    // Get existing page target or browser target
    const listRes = await fetch(`http://127.0.0.1:${PORT}/json/list`);
    const pages = await listRes.json();
    let pageWsUrl = pages.find((p) => p.type === 'page')?.webSocketDebuggerUrl;

    if (!pageWsUrl) {
      const browserCdp = new CdpClient(wsUrl);
      await browserCdp.connect();
      const { targetId } = await browserCdp.send('Target.createTarget', { url: BASE_URL });
      pageWsUrl = `ws://127.0.0.1:${PORT}/devtools/page/${targetId}`;
      browserCdp.close();
    }

    const cdp = new CdpClient(pageWsUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');

    async function setViewport(width, height, deviceScaleFactor = 2) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor,
        mobile: true
      });
    }

    async function evalCode(expression) {
      return await cdp.send('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true
      });
    }

    async function takeScreenshot(fileName) {
      await wait(1000);
      const res = await cdp.send('Page.captureScreenshot', { format: 'png' });
      const filePath = path.join(OUTPUT_DIR, fileName);
      fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
      console.log(`Saved screenshot: ${fileName}`);
    }

    // Prepare demo state
    await setViewport(390, 844);
    await cdp.send('Page.navigate', { url: `${BASE_URL}/` });
    await wait(1500);

    // Seed mock clean new user state with streak 0 and profile complete
    await evalCode(`(() => {
      const user = {
        id: 'aspirant_user_1',
        name: 'Arjun Verma',
        email: 'arjun@aspirantx.in',
        exam: 'UPSC',
        targetYear: 2027,
        streakDays: 0,
        level: 1,
        xp: 0,
        coins: 100,
        isPremium: false,
        isProfileComplete: true,
        studyHoursToday: 0
      };
      localStorage.setItem('studyride_user', JSON.stringify(user));
      localStorage.setItem('aspirantx_auth_user', JSON.stringify(user));
      localStorage.setItem('studyride_skip_splash', 'true');
      localStorage.setItem('aspirantx_welcome_dialog_seen', 'true');
      localStorage.setItem('studyride_sessions_aspirant_user_1', JSON.stringify([]));
      localStorage.removeItem('aspirantx_bike_target_hours_aspirant_user_1');
    })()`);

    // Reload page to let AppContent mount with the seeded user
    await cdp.send('Page.navigate', { url: `${BASE_URL}/#dashboard` });
    await wait(3000);

    // 1. Garage Empty State
    console.log('Capturing Garage Empty State...');
    await evalCode(`(() => {
      localStorage.setItem('studyride_sessions_aspirant_user_1', JSON.stringify([]));
      localStorage.removeItem('aspirantx_bike_target_hours_aspirant_user_1');
      window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'garage' }));
    })()`);
    await wait(2500);
    await takeScreenshot('garage_empty.png');

    // 2. Timer Idle State
    console.log('Capturing Timer Idle State...');
    await evalCode(`window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'timer' }));`);
    await wait(2500);
    await takeScreenshot('timer_idle.png');

    // Multi-viewport captures for Timer
    console.log('Capturing Timer 360x800...');
    await setViewport(360, 800);
    await wait(500);
    await takeScreenshot('timer_360x800.png');

    console.log('Capturing Timer 390x844...');
    await setViewport(390, 844);
    await wait(500);
    await takeScreenshot('timer_390x844.png');

    console.log('Capturing Timer 412x915...');
    await setViewport(412, 915);
    await wait(500);
    await takeScreenshot('timer_412x915.png');

    // 130% Font Scale capture
    console.log('Capturing Timer with 130% font scale...');
    await evalCode(`document.documentElement.style.fontSize = '130%';`);
    await wait(500);
    await takeScreenshot('timer_fontscale_130.png');
    await evalCode(`document.documentElement.style.fontSize = '';`);

    // 3. Timer Running State
    console.log('Starting timer session for Running State...');
    await setViewport(390, 844);
    // Click Start Ride button (contains "START FOCUS RIDE" or similar)
    await evalCode(`(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const startBtn = buttons.find(b => b.textContent && b.textContent.includes('START FOCUS RIDE'));
      if (startBtn) startBtn.click();
    })()`);
    await wait(2000);
    await takeScreenshot('timer_running.png');

    // 4. Relax View
    console.log('Opening Relax View...');
    await evalCode(`(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const relaxBtn = buttons.find(b => b.textContent && b.textContent.includes('Relax View'));
      if (relaxBtn) relaxBtn.click();
    })()`);
    await wait(2000);
    await takeScreenshot('relax_view.png');

    // Close relax view
    await evalCode(`(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const backBtn = buttons.find(b => b.textContent && b.textContent.includes('Back to Dashboard'));
      if (backBtn) backBtn.click();
    })()`);
    await wait(1000);

    // Stop active timer session to clean up
    await evalCode(`(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const stopBtn = buttons.find(b => b.textContent && (b.textContent.includes('STOP') || b.textContent.includes('END')));
      if (stopBtn) stopBtn.click();
    })()`);
    await wait(1000);

    // 5. Garage With Completed Bikes and Progress
    console.log('Seeding completed week for Garage with Bikes...');
    await evalCode(`(() => {
      const userId = 'aspirant_user_1';
      localStorage.setItem('aspirantx_bike_target_hours_' + userId, '10');
      // Create completed sessions
      const sessions = [
        {
          id: 'prev_w_1',
          startedAt: '2026-09-28T08:00:00Z',
          endedAt: '2026-09-28T12:00:00Z',
          mode: 'pomodoro',
          plannedMinutes: 120,
          actualSeconds: 7200,
          type: 'focus',
          completed: true
        },
        {
          id: 'prev_w_2',
          startedAt: '2026-09-29T08:00:00Z',
          endedAt: '2026-09-29T12:00:00Z',
          mode: 'pomodoro',
          plannedMinutes: 120,
          actualSeconds: 7200,
          type: 'focus',
          completed: true
        },
        {
          id: 'prev_w_3',
          startedAt: '2026-09-30T08:00:00Z',
          endedAt: '2026-09-30T14:00:00Z',
          mode: 'pomodoro',
          plannedMinutes: 120,
          actualSeconds: 7200,
          type: 'focus',
          completed: true
        },
        {
          id: 'prev_w_4',
          startedAt: '2026-10-01T08:00:00Z',
          endedAt: '2026-10-01T14:00:00Z',
          mode: 'pomodoro',
          plannedMinutes: 120,
          actualSeconds: 7200,
          type: 'focus',
          completed: true
        },
        {
          id: 'prev_w_5',
          startedAt: '2026-10-02T08:00:00Z',
          endedAt: '2026-10-02T14:00:00Z',
          mode: 'pomodoro',
          plannedMinutes: 120,
          actualSeconds: 7200,
          type: 'focus',
          completed: true
        },
        // Current week sessions
        {
          id: 'cur_w_1',
          startedAt: new Date(Date.now() - 86400000).toISOString(),
          endedAt: new Date(Date.now() - 86400000 + 7200000).toISOString(),
          mode: 'pomodoro',
          plannedMinutes: 120,
          actualSeconds: 7200,
          type: 'focus',
          completed: true
        }
      ];
      localStorage.setItem('studyride_sessions_' + userId, JSON.stringify(sessions));
      window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'garage' }));
    })()`);

    console.log('Capturing Garage with Bikes...');
    await wait(2500);
    await takeScreenshot('garage_with_bikes.png');

    // 6. Highway Path Map
    console.log('Capturing Highway Path Map...');
    await evalCode(`window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'syllabus' }));`);
    await wait(3000);
    await takeScreenshot('highway_path.png');

    // 7. Profile / Me with Streak 0 for New User
    console.log('Capturing Profile / Me Screen...');
    await evalCode(`(() => {
      const userId = 'clean_new_user';
      const user = {
        id: userId,
        name: 'New Aspirant',
        email: 'newuser@aspirantx.in',
        exam: 'UPSC',
        targetYear: 2027,
        streakDays: 0,
        level: 1,
        xp: 0,
        coins: 100,
        isPremium: false,
        isProfileComplete: true,
        studyHoursToday: 0
      };
      localStorage.setItem('studyride_user', JSON.stringify(user));
      localStorage.setItem('aspirantx_auth_user', JSON.stringify(user));
      localStorage.setItem('studyride_sessions_' + userId, JSON.stringify([]));
      window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'more_hub' }));
    })()`);
    await wait(2500);
    await takeScreenshot('profile_new_user.png');

    cdp.close();
    console.log('All screenshots captured successfully!');
  } finally {
    chromeProc.kill();
  }
}

run().catch((err) => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
