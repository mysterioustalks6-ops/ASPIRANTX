import WebSocket from 'ws';
import http from 'http';

function getEndpoints() {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    }).on('error', reject);
  });
}

async function run() {
  const endpoints = await getEndpoints();
  const page = endpoints.find(e => e.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.on('open', r));

  const expression = `(() => {
    const negativeControl = document.fonts.check('16px "NoSuchFont"');
    const fontEntries = Array.from(document.fonts).map(f => ({
      family: f.family,
      weight: f.weight,
      status: f.status
    }));

    const bodyFont = getComputedStyle(document.body).fontFamily;
    const h1El = document.querySelector('h1, h2, h3');
    const h1Font = h1El ? getComputedStyle(h1El).fontFamily : 'no-heading';
    const navLabelEl = document.querySelector('#mobile-bottom-nav span') || document.querySelector('nav span');
    const navLabelFont = navLabelEl ? getComputedStyle(navLabelEl).fontFamily : 'no-nav';
    const buttonEl = document.querySelector('button');
    const buttonFont = buttonEl ? getComputedStyle(buttonEl).fontFamily : 'no-btn';
    const cardEl = document.querySelector('[class*="rounded-3xl"], [class*="rounded-2xl"], div');
    const cardFont = cardEl ? getComputedStyle(cardEl).fontFamily : 'no-card';

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const testString = 'The quick brown fox jumps over the lazy dog 12345';
    ctx.font = '16px "Nunito"';
    const nunitoWidth = ctx.measureText(testString).width;
    ctx.font = '16px "Roboto"';
    const robotoWidth = ctx.measureText(testString).width;
    ctx.font = '16px sans-serif';
    const sansWidth = ctx.measureText(testString).width;

    const span = document.createElement('span');
    span.textContent = testString;
    span.style.fontSize = '16px';
    span.style.visibility = 'hidden';
    span.style.position = 'absolute';
    document.body.appendChild(span);
    const renderedWidth = span.getBoundingClientRect().width;
    document.body.removeChild(span);

    return {
      negativeControl,
      fontEntries,
      computed: { bodyFont, h1Font, navLabelFont, buttonFont, cardFont },
      measurements: {
        testString,
        nunitoWidth,
        robotoWidth,
        sansWidth,
        renderedWidth
      }
    };
  })()`;

  ws.send(JSON.stringify({
    id: 1,
    method: 'Runtime.evaluate',
    params: { expression, returnByValue: true }
  }));

  const res = await new Promise((resolve) => {
    ws.on('message', (msg) => {
      const parsed = JSON.parse(msg.toString());
      if (parsed.id === 1) {
        resolve(parsed.result?.result?.value);
      }
    });
  });

  console.log(JSON.stringify(res, null, 2));
  ws.close();
}

run().catch(console.error);
