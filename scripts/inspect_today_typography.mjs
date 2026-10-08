import http from 'http';

function getWebSocketUrl() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const list = JSON.parse(data);
          const target = list.find(t => t.type === 'page');
          if (target && target.webSocketDebuggerUrl) {
            resolve(target.webSocketDebuggerUrl);
          } else {
            reject(new Error('No page target found'));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function cdpEval(ws, expression) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 100000);
    const handler = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        if (msg.error) reject(msg.error);
        else resolve(msg.result?.result?.value);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({
      id,
      method: 'Runtime.evaluate',
      params: {
        expression,
        returnByValue: true,
        awaitPromise: true
      }
    }));
  });
}

async function run() {
  const wsUrl = await getWebSocketUrl();
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  const styles = await cdpEval(ws, `
    (() => {
      function inspect(el) {
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        return {
          tagName: el.tagName.toLowerCase(),
          text: el.innerText.trim(),
          fontFamily: cs.fontFamily,
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          letterSpacing: cs.letterSpacing,
          textTransform: cs.textTransform,
          lineHeight: cs.lineHeight
        };
      }

      // Title: "Mechanics & Motion"
      const titleEl = Array.from(document.querySelectorAll('h1, h2, h3, div')).find(e => e.children.length === 0 && e.innerText && e.innerText.includes('Mechanics & Motion'));

      // Section label: "3-STOP JOURNEY" or "EXAM TARGET"
      const sectionEl = Array.from(document.querySelectorAll('div, span, p')).find(e => e.children.length === 0 && e.innerText && (e.innerText.includes('3-STOP JOURNEY') || e.innerText.includes('EXAM TARGET')));

      // Body: "Mechanics & Motion — High-Yield Mastery" or "207 Days Remaining"
      const bodyEl = Array.from(document.querySelectorAll('div, p, span')).find(e => e.children.length === 0 && e.innerText && e.innerText.includes('High-Yield Mastery'));

      // Chip: "Physics" or "0% Complete"
      const chipEl = Array.from(document.querySelectorAll('div, span, button')).find(e => e.children.length === 0 && e.innerText && e.innerText.trim() === 'Physics');

      // Button: "START RIDE"
      const btnEl = Array.from(document.querySelectorAll('button')).find(e => e.innerText && e.innerText.includes('START RIDE'));

      return {
        title: inspect(titleEl),
        sectionLabel: inspect(sectionEl),
        body: inspect(bodyEl),
        chip: inspect(chipEl),
        button: inspect(btnEl)
      };
    })()
  `);

  console.log(JSON.stringify(styles, null, 2));
  ws.close();
}

run().catch(console.error);
