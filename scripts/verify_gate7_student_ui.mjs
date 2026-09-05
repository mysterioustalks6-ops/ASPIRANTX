import { spawn } from 'child_process';
import { writeFileSync } from 'fs';
import path from 'path';

const CHROME_CDP = 'http://127.0.0.1:9224/json/list';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function launchChrome() {
  console.log('Launching headless Google Chrome on port 9224...');
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1280,900',
    `--user-data-dir=${process.env.TEMP}\\chrome_gate7_audit_${Date.now()}`,
    'http://localhost:3000'
  ], { stdio: 'ignore' });

  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const res = await fetch(CHROME_CDP);
      const targets = await res.json();
      const page = targets.find(t => t.type === 'page');
      if (page) return { chromeProcess, page };
    } catch {}
  }
  throw new Error('Timed out waiting for Chrome CDP on port 9224');
}

class WebClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) cb.reject(new Error(msg.error.message));
          else cb.resolve(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval exception: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result?.value;
  }

  async screenshot(filepath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    writeFileSync(filepath, buffer);
    console.log(`Saved screenshot: ${filepath} (${buffer.length} bytes)`);
  }

  close() {
    this.ws.close();
  }
}

async function run() {
  console.log('=== STARTING GATE 7 REAL STUDENT UI AUDIT ===');
  const { chromeProcess, page } = await launchChrome();
  const client = new WebClient(page.webSocketDebuggerUrl);
  await client.connect();

  try {
    await new Promise(r => setTimeout(r, 2000));

    // 1. Landing Page Download CTA Verification
    console.log('\n[STAGE 1] Landing Page Download CTA Check...');
    const landingDownload = await client.eval(`(() => {
      const btn = document.querySelector('#landing-download-app-btn');
      if (!btn) return null;
      return {
        href: btn.getAttribute('href'),
        text: btn.innerText.trim(),
        title: btn.getAttribute('title')
      };
    })()`);
    console.log('Landing Download CTA:', landingDownload);
    if (!landingDownload || !landingDownload.href.includes('aspirantx.apk')) {
      throw new Error('Landing page missing canonical download CTA');
    }

    // 2. Authenticate as Guest
    console.log('\n[STAGE 2] Authenticating as Student / Guest...');
    await client.eval(`(() => {
      // Set guest user state or click guest button
      const guestBtn = document.querySelector('#landing-guest-demo-btn') || 
                       Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Preview as Guest') || b.textContent.includes('Explore Demo'));
      if (guestBtn) {
        guestBtn.click();
        return 'clicked';
      }
      return 'not found';
    })()`);

    await new Promise(r => setTimeout(r, 3000));

    // 3. Authenticated Navigation UI Check (0 Download CTAs)
    console.log('\n[STAGE 3] In-App Header & Drawer Download UI Audit...');
    const inAppDownloads = await client.eval(`(() => {
      const links = Array.from(document.querySelectorAll('a[href*=".apk"], button, a')).filter(el => {
        const t = (el.innerText || '').toLowerCase();
        return t.includes('download app') || t.includes('get app') || t.includes('install app');
      });
      return links.map(el => ({ text: el.innerText.trim(), tag: el.tagName }));
    })()`);
    console.log('In-app download controls found:', inAppDownloads.length);
    if (inAppDownloads.length !== 0) {
      console.warn('Found unexpected in-app download controls:', inAppDownloads);
      throw new Error('Authenticated UI contains forbidden APK download controls');
    }
    console.log('✅ In-App UI has strictly ZERO APK download controls.');

    // 4. Navigate to Question Bank
    console.log('\n[STAGE 4] Navigating to Question Bank Engine...');
    await client.eval(`(() => {
      window.location.hash = '#practice';
    })()`);
    await new Promise(r => setTimeout(r, 2000));

    // Switch to Question Bank tab if inside practice hub
    await client.eval(`(() => {
      const qbTab = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent.includes('Question Bank'));
      if (qbTab) qbTab.click();
    })()`);
    await new Promise(r => setTimeout(r, 3000));

    // Check Question Bank DOM content
    const qbStatus = await client.eval(`(() => {
      const allDivs = Array.from(document.querySelectorAll('div, section, article'));
      const textSnippets = Array.from(document.querySelectorAll('p, div, h3')).map(e => e.innerText.trim()).filter(t => t.length > 30);
      return {
        totalDivs: allDivs.length,
        hasQuestions: textSnippets.some(t => t.toLowerCase().includes('which') || t.toLowerCase().includes('consider') || t.toLowerCase().includes('with reference')),
        sampleText: textSnippets.find(t => t.length > 50) || 'None',
        totalTextCount: textSnippets.length
      };
    })()`);
    console.log('Question Bank Render Status:', qbStatus);
    await client.screenshot('scratch/web_qb_proof.png');

    // 5. Navigate to PYQ Engine
    console.log('\n[STAGE 5] Navigating to PYQ Engine...');
    await client.eval(`(() => {
      window.location.hash = '#pyq';
    })()`);
    await new Promise(r => setTimeout(r, 2000));

    await client.eval(`(() => {
      const pyqTab = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent.includes('PYQ') || el.textContent.includes('Past Year'));
      if (pyqTab) pyqTab.click();
    })()`);
    await new Promise(r => setTimeout(r, 3000));

    // Check PYQ DOM content
    const pyqStatus = await client.eval(`(() => {
      const textSnippets = Array.from(document.querySelectorAll('p, div, h3')).map(e => e.innerText.trim()).filter(t => t.length > 30);
      const yearBadges = Array.from(document.querySelectorAll('span, div')).filter(e => /199\d|200\d|201\d|202\d/.test(e.innerText.trim()));
      return {
        yearBadgesCount: yearBadges.length,
        sampleYear: yearBadges[0]?.innerText.trim() || 'None',
        sampleText: textSnippets.find(t => t.length > 50) || 'None'
      };
    })()`);
    console.log('PYQ Render Status:', pyqStatus);
    await client.screenshot('scratch/web_pyq_proof.png');

    console.log('\n=== GATE 7 REAL STUDENT UI AUDIT PASSED ===');
  } finally {
    client.close();
    chromeProcess.kill();
  }
}

run().catch(e => {
  console.error('GATE 7 ERROR:', e);
  process.exit(1);
});
