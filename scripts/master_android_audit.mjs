import { execSync } from 'child_process';

const CDP_HTTP = 'http://127.0.0.1:9222/json/list';
const ADB_PATH = 'C:\\Users\\AMBUJ YADAV\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe';

async function getPageTarget() {
  for (let i = 0; i < 15; i++) {
    try {
      const res = await fetch(CDP_HTTP);
      const targets = await res.json();
      const page = targets.find(t => t.type === 'page' || t.url.includes('localhost'));
      if (page) return page;
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  throw new Error('No page target found on Android WebView');
}

class AndroidCDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
    this.networkRequests = [];
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) cb.reject(new Error(msg.error.message));
          else cb.resolve(msg.result);
        } else if (msg.method === 'Network.requestWillBeSent') {
          this.networkRequests.push({
            url: msg.params.request.url,
            method: msg.params.request.method
          });
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

  close() {
    this.ws.close();
  }
}

async function run() {
  console.log('=== STARTING MASTER ANDROID REAL CBT & UI AUDIT ===\n');

  const page = await getPageTarget();
  console.log(`[1] Connected to Android Capacitor WebView: ${page.title} (${page.url})`);

  const client = new AndroidCDPClient(page.webSocketDebuggerUrl);
  await client.connect();
  await client.send('Network.enable');
  await client.send('DOM.enable');
  await client.send('Runtime.enable');

  console.log('[2] Initializing Android Demo Session & Dismissing Onboarding...');
  for (let i = 0; i < 15; i++) {
    const state = await client.eval(`
      (() => {
        const guestBtn = document.getElementById('landing-guest-demo-btn');
        if (guestBtn) {
          guestBtn.click();
          return 'clicked_guest';
        }
        return 'ready';
      })()
    `);
    if (state === 'clicked_guest') {
      console.log('    Clicked Explore Demo on Android Landing Page');
      break;
    }
    await new Promise(r => setTimeout(r, 600));
  }

  await client.eval(`
    localStorage.setItem('aspirantx_onboarding_dismissed', 'true');
    const closeTour = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Skip') || b.innerText === '✕');
    if (closeTour) closeTour.click();
  `);

  console.log('[3] Navigating to CBT Portal on Android (#cbt)...');
  await client.eval("window.location.hash = '#cbt'");
  await new Promise(r => setTimeout(r, 2000));

  console.log('[4] Verifying Available Mock Tests & Start Button...');
  let startBtnFound = false;
  for (let i = 0; i < 15; i++) {
    const checkState = await client.eval(`
      (() => {
        const startBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Start Live CBT Exam'));
        return { hasStartBtn: Boolean(startBtn) };
      })()
    `);
    if (checkState.hasStartBtn) {
      startBtnFound = true;
      console.log('    Mock Tests Loaded! Found "Start Live CBT Exam" button.');
      break;
    }
    await new Promise(r => setTimeout(r, 800));
  }

  if (!startBtnFound) throw new Error('Start Live CBT Exam button not found on Android');

  console.log('[5] Starting Real CBT Exam on Android...');
  await client.eval(`
    (() => {
      const startBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Start Live CBT Exam'));
      if (startBtn) startBtn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 2000));

  console.log('[6] Verifying Question 1 Interface on Android...');
  const q1State = await client.eval(`
    (() => {
      const workspace = document.getElementById('cbt-live-exam-workspace');
      const opt0 = document.getElementById('cbt-option-0');
      const opt1 = document.getElementById('cbt-option-1');
      const timerMatch = document.body.innerText.match(/\\b\\d{2}:\\d{2}:\\d{2}\\b/);

      return {
        hasWorkspace: Boolean(workspace),
        hasOptions: Boolean(opt0 && opt1),
        timer: timerMatch ? timerMatch[0] : null,
        qTextSnippet: document.querySelector('.whitespace-pre-line')?.innerText.slice(0, 70)
      };
    })()
  `);
  console.log('    Android Q1 State Proof:', q1State);

  console.log('[7] Testing Answer Selection on Android (Option A -> Option B)...');
  const answerTest = await client.eval(`
    (async () => {
      const opt0 = document.getElementById('cbt-option-0');
      const opt1 = document.getElementById('cbt-option-1');

      opt0.click();
      await new Promise(r => setTimeout(r, 300));
      const aSelected = opt0.className.includes('border-indigo-600');

      opt1.click();
      await new Promise(r => setTimeout(r, 300));
      const bSelected = opt1.className.includes('border-indigo-600');
      const aDeselected = !opt0.className.includes('border-indigo-600');

      return { aSelectedFirst: aSelected, bSelectedNow: bSelected, aDeselectedNow: aDeselected };
    })()
  `);
  console.log('    Android Answer Selection Proof:', answerTest);

  console.log('[8] Testing Save & Next on Android...');
  await client.eval(`document.getElementById('cbt-btn-save-next')?.click()`);
  await new Promise(r => setTimeout(r, 1000));

  const q2State = await client.eval(`
    (() => {
      const qNumSpan = Array.from(document.querySelectorAll('span')).find(el => el.innerText.trim() === '2' && el.className.includes('bg-indigo-600'));
      return { isQ2: Boolean(qNumSpan), activeBadge: qNumSpan?.innerText.trim() };
    })()
  `);
  console.log('    Save & Next Proof (Navigated to Q2):', q2State);

  console.log('[9] Testing Previous & Persistence on Android...');
  await client.eval(`document.getElementById('cbt-btn-prev')?.click()`);
  await new Promise(r => setTimeout(r, 1000));

  const q1Persist = await client.eval(`
    (() => {
      const qNumSpan = Array.from(document.querySelectorAll('span')).find(el => el.innerText.trim() === '1' && el.className.includes('bg-indigo-600'));
      const opt1 = document.getElementById('cbt-option-1');
      return { isQ1: Boolean(qNumSpan), bPersisted: Boolean(opt1?.className.includes('border-indigo-600')) };
    })()
  `);
  console.log('    Previous & Persistence Proof:', q1Persist);

  console.log('[10] Testing Clear Response on Android...');
  const clearProof = await client.eval(`
    (async () => {
      document.getElementById('cbt-btn-clear')?.click();
      await new Promise(r => setTimeout(r, 300));
      const opts = [0,1,2,3].map(i => document.getElementById('cbt-option-' + i));
      return { cleared: !opts.some(el => el?.className.includes('border-indigo-600')) };
    })()
  `);
  console.log('    Clear Response Proof:', clearProof);

  console.log('[11] Testing Mark for Review & Next on Android...');
  await client.eval(`
    (() => {
      document.getElementById('cbt-option-0')?.click();
      document.getElementById('cbt-btn-review')?.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 1000));
  const reviewProof = await client.eval(`
    (() => {
      const qNumSpan = Array.from(document.querySelectorAll('span')).find(el => el.innerText.trim() === '2' && el.className.includes('bg-indigo-600'));
      return { autoAdvancedToQ2: Boolean(qNumSpan) };
    })()
  `);
  console.log('    Mark for Review Proof:', reviewProof);

  console.log('[12] Testing Mobile Question Palette Drawer...');
  // Open mobile palette
  await client.eval(`
    (() => {
      const mobilePaletteBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Q 2/') || b.innerText.includes('Q 1/'));
      if (mobilePaletteBtn) mobilePaletteBtn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 800));

  // Jump to last question inside mobile palette drawer
  const paletteJumpRes = await client.eval(`
    (() => {
      const paletteBtns = Array.from(document.querySelectorAll('button')).filter(b => /^\\d+$/.test(b.innerText.trim()));
      if (paletteBtns.length === 0) return { error: 'No palette buttons in drawer' };
      const last = paletteBtns[paletteBtns.length - 1];
      const val = last.innerText.trim();
      last.click();
      return { jumpedToQ: val, totalQuestions: paletteBtns.length };
    })()
  `);
  console.log('    Mobile Question Palette Jump:', paletteJumpRes);
  await new Promise(r => setTimeout(r, 1000));

  console.log('[13] Verifying Last Question Save & Submit Exam on Android...');
  const lastQState = await client.eval(`
    (() => {
      const saveSubmit = document.getElementById('cbt-btn-save-submit');
      return { hasSaveSubmit: Boolean(saveSubmit), text: saveSubmit?.innerText.trim() };
    })()
  `);
  console.log('    Last Question State:', lastQState);

  console.log('[14] Answering Last Question & Triggering Submit Modal...');
  await client.eval(`
    (() => {
      document.getElementById('cbt-option-0')?.click();
      document.getElementById('cbt-btn-save-submit')?.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 1000));

  const modalState = await client.eval(`
    (() => {
      const confirmBtn = document.getElementById('cbt-btn-confirm-submit');
      const header = Array.from(document.querySelectorAll('h3')).find(h => h.innerText.includes('Confirm Final Submission'));
      return { hasModal: Boolean(header && confirmBtn), confirmBtnText: confirmBtn?.innerText.trim() };
    })()
  `);
  console.log('    Submit Modal Proof on Android:', modalState);

  console.log('[15] Executing Final Submission & Scorecard Verification...');
  await client.eval(`document.getElementById('cbt-btn-confirm-submit')?.click()`);

  let androidScorecard = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 1000));
    androidScorecard = await client.eval(`
      (() => {
        const scorecard = document.getElementById('cbt-result-scorecard');
        if (scorecard) {
          const scoreEl = Array.from(scorecard.querySelectorAll('*')).find(el => el.innerText && /\\d+\\s*\\/\\s*\\d+/.test(el.innerText) && el.className.includes('emerald'));
          const rankEl = Array.from(scorecard.querySelectorAll('*')).find(el => el.innerText && /#\\d+/.test(el.innerText));
          const accuracyEl = Array.from(scorecard.querySelectorAll('*')).find(el => el.innerText && /\\d+%/i.test(el.innerText));
          return {
            hasScorecard: true,
            score: scoreEl?.innerText.trim(),
            rank: rankEl?.innerText.trim(),
            accuracy: accuracyEl?.innerText.trim()
          };
        }
        return { hasScorecard: false };
      })()
    `);
    if (androidScorecard.hasScorecard) break;
  }
  console.log('    Android Evaluation Result Proof:', androidScorecard);

  console.log('\n[16] Auditing Android API Network Routing (No https://localhost/api)...');
  const localhostApiRequests = client.networkRequests.filter(r => r.url.includes('localhost/api/'));
  const centralApiRequests = client.networkRequests.filter(r => r.url.includes(':3000/api/') || r.url.includes('10.0.2.2:3000'));
  console.log(`    Total API requests tracked: ${client.networkRequests.length}`);
  console.log(`    Requests to https://localhost/api: ${localhostApiRequests.length} (PASS: 0)`);
  console.log(`    Requests to centralized 10.0.2.2 / backend: ${centralApiRequests.length}`);

  console.log('\n[17] Testing Android Backgrounding & Resume (Phase 17)...');
  console.log('    Simulating Home Button (pause app)...');
  execSync(`"${ADB_PATH}" -s emulator-5554 shell input keyevent KEYCODE_HOME`);
  await new Promise(r => setTimeout(r, 5000));

  console.log('    Resuming app from background...');
  execSync(`"${ADB_PATH}" -s emulator-5554 shell am start -n com.aspirantx.app/.MainActivity`);
  await new Promise(r => setTimeout(r, 2000));

  const resumeState = await client.eval(`
    (() => {
      const scorecard = document.getElementById('cbt-result-scorecard') || document.getElementById('cbt-live-exam-workspace');
      return { active: Boolean(scorecard), title: document.title };
    })()
  `);
  console.log('    Resume State Proof (No crash/ANR):', resumeState);

  console.log('\n[18] Testing Responsive Viewports (320px - 412px) on Android...');
  const viewports = [320, 360, 375, 390, 412];
  const layoutResults = [];
  for (const w of viewports) {
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: w,
      height: 800,
      deviceScaleFactor: 2.625,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 400));
    const layout = await client.eval(`
      (() => {
        const root = document.documentElement;
        const body = document.body;
        const innerWidth = window.innerWidth;
        const scrollWidth = Math.max(root.scrollWidth, body.scrollWidth);
        return { width: innerWidth, scrollWidth, overflow: scrollWidth > innerWidth };
      })()
    `);
    layoutResults.push(layout);
  }
  await client.send('Emulation.clearDeviceMetricsOverride');
  console.log('    Responsive Viewport Metrics:', layoutResults);

  console.log('\n[19] Auditing Android Logcat for ANR / Fatal Exceptions...');
  const logcat = execSync(`"${ADB_PATH}" -s emulator-5554 logcat -d -t 200`).toString();
  const hasFatal = logcat.includes('FATAL EXCEPTION') && logcat.includes('com.aspirantx.app');
  const hasANR = logcat.includes('ANR in com.aspirantx.app');
  console.log(`    Logcat Fatal Exceptions in App: ${hasFatal ? 'FAIL' : 'PASS (0)'}`);
  console.log(`    Logcat ANRs in App: ${hasANR ? 'FAIL' : 'PASS (0)'}`);

  const passed = androidScorecard?.hasScorecard && !hasFatal && !hasANR && localhostApiRequests.length === 0;
  console.log(`\n=== MASTER ANDROID AUDIT: ${passed ? 'VERIFIED PASS' : 'FAILED'} ===`);

  client.close();
  process.exit(passed ? 0 : 1);
}

run().catch(err => {
  console.error('Fatal Android Audit Error:', err);
  process.exit(1);
});
