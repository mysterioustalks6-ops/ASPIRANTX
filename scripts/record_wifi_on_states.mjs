import WebSocket from 'ws';

async function run() {
  const res = await fetch('http://127.0.0.1:9223/json');
  const targets = await res.json();
  const page = targets.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
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

  async function sample(sec) {
    const raw = await evaluate(`(async () => {
      let capStatus = 'unknown';
      try {
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Network) {
          const s = await window.Capacitor.Plugins.Network.getStatus();
          capStatus = JSON.stringify(s);
        }
      } catch (e) {
        capStatus = 'err: ' + e.message;
      }
      const banner = !!document.querySelector('[data-testid="offline-banner"], .bg-amber-950, .text-amber-100');
      return JSON.stringify({
        timeSec: ${sec},
        timestamp: new Date().toISOString(),
        navigatorOnLine: navigator.onLine,
        networkStatus: capStatus,
        bannerShown: banner
      });
    })()`);
    return JSON.parse(raw);
  }

  console.log('Sampling Wi-Fi ON state at 0s...');
  const s0 = await sample(0);
  console.log('Sample 0s:', s0);

  console.log('Waiting 30s...');
  await new Promise(r => setTimeout(r, 30000));
  const s30 = await sample(30);
  console.log('Sample 30s:', s30);

  console.log('Waiting another 30s...');
  await new Promise(r => setTimeout(r, 30000));
  const s60 = await sample(60);
  console.log('Sample 60s:', s60);

  console.log('\n=== WI-FI ON VERIFICATION TABLE ===');
  console.table([s0, s30, s60]);

  ws.close();
}

run().catch(console.error);
