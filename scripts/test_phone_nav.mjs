import WebSocket from 'ws';

async function run() {
  const res = await fetch('http://127.0.0.1:9223/json');
  const targets = await res.json();
  const target = targets.find(t => t.type === 'page');
  console.log('Target found:', target?.title, target?.url);

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));

  let reqId = 1;
  function evaluate(expr) {
    return new Promise((resolve, reject) => {
      const id = reqId++;
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

  // Navigate to timer tab
  console.log('Navigating to #timer on phone...');
  await evaluate(`window.location.hash = 'timer'`);
  await new Promise(r => setTimeout(r, 1500));

  const state = await evaluate(`JSON.stringify({
    hash: window.location.hash,
    title: document.title,
    h1: document.querySelector('h1')?.innerText,
    h2: document.querySelector('h2')?.innerText,
    screen: document.querySelector('[data-screen]')?.getAttribute('data-screen'),
    bodySample: document.body.innerText.slice(0, 200).replace(/\\n/g, ' ')
  })`);

  console.log('Phone state after navigating to #timer:\n', JSON.parse(state));
  ws.close();
}

run().catch(console.error);
