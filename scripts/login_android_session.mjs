import WebSocket from 'ws';
import http from 'http';

function getEndpoints() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve(JSON.parse(b)));
    }).on('error', reject);
  });
}

async function login() {
  const endpoints = await getEndpoints();
  const page = endpoints.find(e => e.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));

  const expression = `(() => {
    localStorage.setItem('aspirantx_session_v1', JSON.stringify({
      id: 'usr_local_test_1',
      name: 'Priya Sharma',
      role: 'student',
      exam: 'NEET_UG',
      level: 3,
      xp: 450,
      streakDays: 7,
      isGuest: false
    }));
    location.hash = '#dashboard';
    location.reload();
  })()`;

  ws.send(JSON.stringify({
    id: 1,
    method: 'Runtime.evaluate',
    params: { expression, returnByValue: true }
  }));

  await new Promise(r => setTimeout(r, 1500));
  ws.close();
}

login().catch(console.error);
