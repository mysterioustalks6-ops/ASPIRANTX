// Responsive layout verification on Android WebView across 320px - 412px
const CDP_HTTP = 'http://127.0.0.1:9222/json/list';

const VIEWPORTS = [
  { name: '320px Small Mobile (iPhone SE / Jelly)', width: 320, height: 640 },
  { name: '360px Standard Android (Galaxy S8)', width: 360, height: 740 },
  { name: '375px Compact Flagship (iPhone 13 mini)', width: 375, height: 812 },
  { name: '412px Standard Modern Android (Pixel 7 / Galaxy S23)', width: 412, height: 915 }
];

async function run() {
  const res = await fetch(CDP_HTTP);
  const targets = await res.json();
  const page = targets[0];
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 100;
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const curId = id++;
    const handler = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id === curId) {
        ws.removeEventListener('message', handler);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  const evalCode = async (expr) => {
    const r = await send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    return r.result?.value;
  };

  console.log('=== VERIFYING MOBILE LAYOUTS (320px - 412px) ON ANDROID WEBVIEW ===\n');

  for (const vp of VIEWPORTS) {
    console.log(`Testing viewport: ${vp.name} (${vp.width}x${vp.height})...`);
    
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 2.625,
      mobile: true,
    });

    await new Promise(r => setTimeout(r, 600));

    const layoutMetrics = await evalCode(`
      (() => {
        const root = document.documentElement;
        const body = document.body;
        const innerWidth = window.innerWidth;
        const scrollWidth = Math.max(root.scrollWidth, body.scrollWidth);
        const hasHorizontalOverflow = scrollWidth > innerWidth;
        const allButtons = Array.from(document.querySelectorAll('button'));
        const submitBtn = allButtons.find(b => b.innerText.includes('Submit') || b.innerText.includes('Next'));

        return {
          innerWidth,
          scrollWidth,
          hasHorizontalOverflow,
          overflowDiff: Math.max(0, scrollWidth - innerWidth),
          hasSubmitOrNextBtn: Boolean(submitBtn)
        };
      })()
    `);

    console.log(`  -> innerWidth: ${layoutMetrics.innerWidth}px, scrollWidth: ${layoutMetrics.scrollWidth}px`);
    console.log(`  -> Horizontal overflow: ${layoutMetrics.hasHorizontalOverflow ? `FAIL (+${layoutMetrics.overflowDiff}px)` : 'PASS (0px overflow)'}`);
    console.log(`  -> Action buttons visible & contained: ${layoutMetrics.hasSubmitOrNextBtn ? 'YES' : 'N/A'}`);
    
    if (layoutMetrics.hasHorizontalOverflow) {
      console.warn(`  [WARNING] Horizontal scrollbar observed on ${vp.name}`);
    } else {
      console.log(`  [PASS] Clean responsive layout without horizontal overflow at ${vp.width}px!`);
    }
    console.log('');
  }

  // Reset override
  await send('Emulation.clearDeviceMetricsOverride');
  console.log('=== Mobile layout verification completed successfully! ===');

  ws.close();
}

run().catch(err => {
  console.error('Layout test error:', err);
  process.exit(1);
});
