// Helper to communicate with Android WebView via Chrome DevTools Protocol
import { writeFileSync } from 'fs';

export async function getCDP() {
  const res = await fetch('http://localhost:9222/json');
  const targets = await res.json();
  const page = targets.find(t => t.type === 'page');
  if (!page) throw new Error('No page target found');
  
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  
  let msgId = 1;
  const pending = new Map();
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  const send = (method, params = {}) => {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  const evaluate = async (expression) => {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (res.exceptionDetails) {
      console.error('CDP Eval Exception:', res.exceptionDetails);
      throw new Error(res.exceptionDetails.text || 'Eval failed');
    }
    return res.result?.value;
  };

  const captureScreenshot = async (filename) => {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    writeFileSync(filename, buffer);
    console.log(`Saved screenshot to ${filename} (${buffer.length} bytes)`);
  };

  const close = () => ws.close();

  return { send, evaluate, captureScreenshot, close };
}

// If run directly:
if (process.argv[1]?.endsWith('cdp_helper.mjs')) {
  const cdp = await getCDP();
  const info = await cdp.evaluate(`({
    title: document.title,
    href: window.location.href,
    buttons: Array.from(document.querySelectorAll('button, nav a, [role=tab]')).map(e => e.innerText.trim()).filter(Boolean).slice(0, 30)
  })`);
  console.log('Page state:', JSON.stringify(info, null, 2));
  await cdp.captureScreenshot('C:/Users/AMBUJ YADAV/.gemini/antigravity-ide/brain/194c0ac9-4b3d-4740-971c-500df82e3719/webview_screen.png');
  cdp.close();
}
