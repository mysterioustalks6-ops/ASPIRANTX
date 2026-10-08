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
  console.log('Connecting via Native WebSocket to:', wsUrl);

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  console.log('Connected to Android WebView CDP session!');

  // 1. DUMP LOCALSTORAGE AND HEADER TEXT FOR BUG 3A
  const phoneInfo = await cdpEval(ws, `
    (() => {
      const ls = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        ls[k] = localStorage.getItem(k);
      }

      const header = document.querySelector('header');
      const headerText = header ? header.innerText.trim() : 'No <header> element';

      const examCard = Array.from(document.querySelectorAll('*')).find(el => el.innerText && el.innerText.includes('EXAM TARGET'));

      return {
        headerText,
        examCardText: examCard ? examCard.innerText.trim() : 'No exam card',
        title: document.title,
        url: window.location.href,
        localStorage: ls
      };
    })()
  `);

  console.log('\n======================================================');
  console.log('  PHONE FRESH INSTALL STATE (BUG 3A VERIFICATION)');
  console.log('======================================================');
  console.log('URL:      ', phoneInfo.url);
  console.log('Document Title: ', phoneInfo.title);
  console.log('Header text:\n', phoneInfo.headerText);
  console.log('Exam Card text:\n', phoneInfo.examCardText);
  console.log('\n--- Relevant localStorage keys ---');
  for (const [k, v] of Object.entries(phoneInfo.localStorage)) {
    if (k.includes('exam') || k.includes('user') || k.includes('target') || k.includes('aspirantx') || k.includes('focus')) {
      console.log(`${k}:`);
      console.log(`  ${v}`);
    }
  }

  // 2. MEASURE TODAY'S SCREEN COMPUTED STYLES FOR REQUIREMENT 1
  const styles = await cdpEval(ws, `
    (() => {
      function getProps(selector, fallbackText) {
        let el = document.querySelector(selector);
        if (!el && fallbackText) {
          el = Array.from(document.querySelectorAll('*')).find(e => e.innerText && e.innerText.trim() === fallbackText);
        }
        if (!el) return null;
        const cs = window.getComputedStyle(el);
        return {
          element: el.tagName.toLowerCase(),
          sampleText: el.innerText.slice(0, 40).trim(),
          fontFamily: cs.fontFamily,
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          letterSpacing: cs.letterSpacing,
          textTransform: cs.textTransform,
          lineHeight: cs.lineHeight,
          color: cs.color
        };
      }

      return {
        screenTitle: getProps('h1, h2', 'Mechanics & Motion'),
        sectionLabel: getProps('*', '3-STOP JOURNEY') || getProps('*', 'MORE FOR TODAY') || getProps('*', 'AAJ KI RIDE'),
        body: getProps('p', 'Mechanics & Motion — High-Yield Mastery') || getProps('*', 'Mechanics & Motion — High-Yield Mastery'),
        chip: getProps('*', 'AAJ KI RIDE') || getProps('*', '0% Complete') || getProps('*', 'Physics'),
        button: getProps('button', 'START RIDE') || getProps('button', 'Practice Now')
      };
    })()
  `);

  console.log('\n======================================================');
  console.log('  TODAYS SCREEN COMPUTED STYLES (REQUIREMENT 1)');
  console.log('======================================================');
  console.log(JSON.stringify(styles, null, 2));

  ws.close();
}

run().catch(console.error);
