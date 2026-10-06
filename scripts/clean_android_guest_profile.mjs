import { execFile } from 'child_process';
import { promisify } from 'util';
import WebSocket from 'ws';

const execFileAsync = promisify(execFile);
const ADB_PATH = process.env.LOCALAPPDATA + '\\Android\\Sdk\\platform-tools\\adb.exe';
const SERIAL = '10BD570GL500057';

async function main() {
  const timeout = setTimeout(() => {
    console.error('Timed out after 45s');
    process.exit(1);
  }, 45000);

  let ws;
  try {
    await execFileAsync(ADB_PATH, ['-s', SERIAL, 'forward', 'tcp:9222', 'localabstract:webview_devtools_remote_15989']);
    const endpoints = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
    const page = endpoints.find(e => e.type === 'page');
    if (!page) {
      console.error('No page endpoint found');
      return;
    }

    ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise(r => ws.on('open', r));

    let id = 1;
    function evalCode(expr) {
      return new Promise((resolve, reject) => {
        const curId = id++;
        const handler = (data) => {
          const msg = JSON.parse(data.toString());
          if (msg.id === curId) {
            ws.off('message', handler);
            if (msg.error) reject(msg.error);
            else resolve(msg.result?.result?.value);
          }
        };
        ws.on('message', handler);
        ws.send(JSON.stringify({
          id: curId,
          method: 'Runtime.evaluate',
          params: { expression: expr, returnByValue: true, awaitPromise: true }
        }));
      });
    }

    const result = await evalCode(`(() => {
      // Clear previous cached guest profiles & egress caches to ensure pure offline parity
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.includes('profile') || k.includes('user') || k.includes('streak') || k.includes('auth') || k.includes('egress') || k.includes('avatar'))) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));

      // Clean offline-first guest profile with zero external placeholder URLs and targetYear derived from exam date
      const cleanGuest = {
        id: 'demo-guest-123',
        name: 'Aspirant',
        email: 'guest@studyride.in',
        avatar_url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100%' height='100%' rx='24' fill='%230284c7'/><text x='50%' y='55%' font-size='44' font-family='sans-serif' font-weight='bold' fill='%23ffffff' dominant-baseline='middle' text-anchor='middle'>A</text></svg>",
        exam: 'NEET_UG',
        targetYear: 2027, // Derived from NEET_UG canonical exam date: 2027-05-03
        streakDays: 1,
        isPremium: false,
        isGuest: true,
        studyHoursToday: 0,
        xp: 0,
        coins: 50,
        level: 1,
        role: 'USER',
        isProfileComplete: true
      };

      localStorage.setItem('aspirantx_auth_user', JSON.stringify(cleanGuest));
      localStorage.setItem('studyride_user', JSON.stringify(cleanGuest));
      localStorage.setItem('aspirantx_user_profile_v3_demo-guest-123', JSON.stringify(cleanGuest));
      localStorage.setItem('studyride_selected_exam_id', 'NEET_UG');
      localStorage.setItem('selectedExamId', 'NEET_UG');
      localStorage.setItem('studyride_demo_session_active', 'true');

      // Dispatch change event to notify app components
      window.dispatchEvent(new Event('storage'));
      return {
        success: true,
        clearedCount: keysToRemove.length,
        user: cleanGuest
      };
    })()`);

    console.log('Cleaned profile result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error cleaning Android profile:', err);
  } finally {
    clearTimeout(timeout);
    if (ws) ws.close();
  }
}

main();
