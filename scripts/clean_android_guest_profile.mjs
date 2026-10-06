import WebSocket from 'ws';

async function main() {
  const endpoints = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
  const page = endpoints.find(e => e.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));

  let id = 1;
  function evalCode(expr) {
    return new Promise(resolve => {
      const curId = id++;
      const handler = (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.id === curId) {
          ws.off('message', handler);
          resolve(msg.result?.result?.value);
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
    // Clear all previous profiles and caches
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.includes('profile') || k.includes('user') || k.includes('streak') || k.includes('auth'))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));

    const cleanGuest = {
      id: 'demo-guest-123',
      name: 'Aspirant',
      email: 'guest@studyride.in',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      exam: 'NEET_UG',
      targetYear: 2026,
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
    localStorage.setItem('aspirantx_user_profile_v3_guest', JSON.stringify(cleanGuest));
    localStorage.setItem('aspirantx_global_selected_exam', 'NEET_UG');
    localStorage.setItem('studyride_skip_splash', 'true');

    window.location.hash = 'dashboard';
    window.location.reload();
    return 'Guest profile set cleanly and reload triggered';
  })()`);

  console.log('Result:', result);
  await new Promise(r => setTimeout(r, 2000));
  ws.close();
}

main().catch(console.error);
