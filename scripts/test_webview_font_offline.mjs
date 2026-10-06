import http from 'http';

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

const targets = await getJson('http://localhost:9222/json/list');
console.log('Available WebView targets:', targets.map(t => ({ title: t.title, url: t.url, ws: t.webSocketDebuggerUrl })));

const pageTarget = targets.find(t => t.type === 'page' || t.url.includes('localhost'));
if (!pageTarget) {
  console.error('No page target found!');
  process.exit(1);
}

// Connect via WebSocket
const WebSocket = (await import('ws')).default || (await import('ws'));
const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

ws.on('open', () => {
  let id = 1;
  const send = (method, params = {}) => {
    return new Promise((resolve) => {
      const msgId = id++;
      const handler = (data) => {
        const res = JSON.parse(data.toString());
        if (res.id === msgId) {
          ws.off('message', handler);
          resolve(res.result);
        }
      };
      ws.on('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  };

  (async () => {
    // 1. Check fonts
    const fontRes = await send('Runtime.evaluate', {
      expression: `JSON.stringify({
        fontFamily: getComputedStyle(document.body).fontFamily,
        nunitoRegularCheck: document.fonts.check('16px "Nunito"'),
        nunitoBoldCheck: document.fonts.check('bold 16px "Nunito"'),
        fontFaces: Array.from(document.fonts).map(f => ({
          family: f.family,
          weight: f.weight,
          status: f.status
        }))
      })`,
      returnByValue: true
    });
    console.log('\n--- B3 FONT EVALUATION RESULT ---');
    console.log(JSON.parse(fontRes.result.value));

    // 2. Check offline status and fetch test
    await send('Network.enable');
    await send('Network.emulateNetworkConditions', {
      offline: true,
      latency: 0,
      downloadThroughput: 0,
      uploadThroughput: 0
    });

    const offlineRes = await send('Runtime.evaluate', {
      expression: `(async () => {
        let fetchError = null;
        try {
          await fetch('https://example.com', { signal: AbortSignal.timeout(2000) });
        } catch (e) {
          fetchError = e.message;
        }
        return JSON.stringify({
          navigatorOnLine: navigator.onLine,
          externalFetchResult: fetchError ? 'Failed as expected (' + fetchError + ')' : 'Unexpected success'
        });
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('\n--- C1 OFFLINE STATUS & FETCH PROOF ---');
    console.log(JSON.parse(offlineRes.result.value));

    ws.close();
  })();
});
