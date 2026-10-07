import WebSocket from 'ws';

export async function createCdpClient() {
  const res = await fetch('http://127.0.0.1:9223/json');
  const targets = await res.json();
  const target = targets.find(t => t.type === 'page');
  if (!target) throw new Error('No page target found on port 9223');

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));

  let reqId = 1;
  function evaluate(expression) {
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
        params: { expression, returnByValue: true, awaitPromise: true }
      }));
    });
  }

  return {
    evaluate,
    close: () => ws.close()
  };
}
