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

  const user = await evalCode(`(() => {
    const raw = localStorage.getItem('aspirantx_auth_user') || localStorage.getItem('studyride_user');
    return raw ? JSON.parse(raw) : null;
  })()`);

  console.log('USER PROFILE ON PHYSICAL DEVICE:');
  console.log(JSON.stringify(user, null, 2));

  // If user has fake streak or Priya Sharma, reset to clean guest mode
  if (user && (user.name?.includes('Priya') || user.streakDays > 1 || !user.isGuest)) {
    console.log('Resetting user profile to genuine guest mode (1d streak, Aspirant)...');
    await evalCode(`(() => {
      const u = JSON.parse(localStorage.getItem('aspirantx_auth_user') || localStorage.getItem('studyride_user') || '{}');
      u.id = 'demo-guest-123';
      u.name = 'Aspirant';
      u.email = 'guest@studyride.in';
      u.isGuest = true;
      u.streakDays = 1;
      u.exam = 'NEET_UG';
      localStorage.setItem('aspirantx_auth_user', JSON.stringify(u));
      localStorage.setItem('studyride_user', JSON.stringify(u));
      window.location.reload();
      return 'Reset OK';
    })()`);
    console.log('Reset complete, page reloaded.');
  }

  ws.close();
}

main().catch(console.error);
