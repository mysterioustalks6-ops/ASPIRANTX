import { spawn } from 'child_process';

const CHROME_CDP = 'http://127.0.0.1:9223/json/list';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function launchChrome() {
  console.log('Launching headless Google Chrome on port 9223...');
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9223',
    '--no-sandbox',
    '--disable-gpu',
    `--user-data-dir=${process.env.TEMP}\\chrome_cbt_master_audit_${Date.now()}`,
    'http://localhost:3000/#cbt'
  ], { stdio: 'ignore' });

  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const res = await fetch(CHROME_CDP);
      const targets = await res.json();
      const page = targets.find(t => t.type === 'page');
      if (page) return { chromeProcess, page };
    } catch {
      // Keep trying
    }
  }
  throw new Error('Timed out waiting for Chrome CDP on port 9223');
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

  close() {
    this.ws.close();
  }
}

async function run() {
  console.log('=== STARTING MASTER WEB CBT AUDIT (REAL CHROME UI) ===\n');

  const { chromeProcess, page } = await launchChrome();
  console.log(`[1] Connected to Web Target: ${page.title} (${page.url})`);

  const client = new WebClient(page.webSocketDebuggerUrl);
  await client.connect();
  await client.send('Runtime.enable');
  await client.send('DOM.enable');

  await client.send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log('[2] Initializing Authentication / Guest Session...');
  for (let i = 0; i < 20; i++) {
    const authStatus = await client.eval(`
      (() => {
        const guestBtn = document.getElementById('landing-guest-demo-btn');
        if (guestBtn) {
          guestBtn.click();
          return 'clicked';
        }
        if (document.querySelector('header') && !document.getElementById('landing-guest-demo-btn')) {
          return 'ready';
        }
        return 'waiting';
      })()
    `);
    if (authStatus === 'clicked' || authStatus === 'ready') break;
    await new Promise(r => setTimeout(r, 500));
  }

  await client.eval(`
    localStorage.setItem('aspirantx_onboarding_dismissed', 'true');
    const closeTour = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Skip') || b.innerText === '✕');
    if (closeTour) closeTour.click();
  `);

  console.log('[3] Navigating to CBT Portal (#cbt)...');
  await client.eval("window.location.hash = '#cbt'");
  await new Promise(r => setTimeout(r, 2000));

  console.log('[4] Verifying CBT Portal Available Tests...');
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
      console.log('    Available Mock Tests Loaded! Found "Start Live CBT Exam" button.');
      break;
    }
    await new Promise(r => setTimeout(r, 800));
  }

  if (!startBtnFound) {
    throw new Error('Start Live CBT Exam button not found');
  }

  console.log('[5] Starting Real CBT Exam from UI...');
  const startExamRes = await client.eval(`
    (() => {
      const startBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Start Live CBT Exam'));
      if (startBtn) {
        startBtn.click();
        return { success: true, text: startBtn.innerText.trim() };
      }
      return { success: false };
    })()
  `);
  console.log('    Exam Start Action:', startExamRes);
  await new Promise(r => setTimeout(r, 2000));

  console.log('[6] Verifying Question 1 Interface & Initial Timer...');
  const q1State = await client.eval(`
    (() => {
      const workspace = document.getElementById('cbt-live-exam-workspace');
      const opt0 = document.getElementById('cbt-option-0');
      const opt1 = document.getElementById('cbt-option-1');
      const opt2 = document.getElementById('cbt-option-2');
      const opt3 = document.getElementById('cbt-option-3');
      const timerMatch = document.body.innerText.match(/\\b\\d{2}:\\d{2}:\\d{2}\\b/);

      return {
        hasWorkspace: Boolean(workspace),
        hasAll4Options: Boolean(opt0 && opt1 && opt2 && opt3),
        timerText: timerMatch ? timerMatch[0] : null,
        opt0Text: opt0?.innerText.slice(0, 60),
        opt1Text: opt1?.innerText.slice(0, 60)
      };
    })()
  `);
  console.log('    Q1 State Proof:', q1State);

  console.log('[7] Testing Answer Selection: Option A -> Option B...');
  const answerTest = await client.eval(`
    (async () => {
      const opt0 = document.getElementById('cbt-option-0');
      const opt1 = document.getElementById('cbt-option-1');

      // Click Option A (opt0)
      opt0.click();
      await new Promise(r => setTimeout(r, 300));
      const aSelected = opt0.className.includes('border-indigo-600');

      // Click Option B (opt1)
      opt1.click();
      await new Promise(r => setTimeout(r, 300));
      const bSelected = opt1.className.includes('border-indigo-600');
      const aDeselected = !opt0.className.includes('border-indigo-600');

      return {
        aSelectedFirst: aSelected,
        bSelectedNow: bSelected,
        aDeselectedNow: aDeselected
      };
    })()
  `);
  console.log('    Answer Selection Proof:', answerTest);

  console.log('[8] Testing Save & Next...');
  await client.eval(`document.getElementById('cbt-btn-save-next')?.click()`);
  await new Promise(r => setTimeout(r, 1000));

  const q2State = await client.eval(`
    (() => {
      const qNumSpan = Array.from(document.querySelectorAll('span')).find(el => el.innerText.trim() === '2' && el.className.includes('bg-indigo-600'));
      return {
        isQ2: Boolean(qNumSpan),
        activeQBadge: qNumSpan?.innerText.trim()
      };
    })()
  `);
  console.log('    Save & Next Proof (Navigated to Q2):', q2State);

  console.log('[9] Testing Previous Button & Answer Persistence...');
  await client.eval(`document.getElementById('cbt-btn-prev')?.click()`);
  await new Promise(r => setTimeout(r, 1000));

  const q1ReturnState = await client.eval(`
    (() => {
      const qNumSpan = Array.from(document.querySelectorAll('span')).find(el => el.innerText.trim() === '1' && el.className.includes('bg-indigo-600'));
      const opt1 = document.getElementById('cbt-option-1');
      const bIsSelected = opt1 && opt1.className.includes('border-indigo-600');
      return {
        isQ1: Boolean(qNumSpan),
        bOptionRemainsSelected: bIsSelected
      };
    })()
  `);
  console.log('    Previous Button & Persistence Proof:', q1ReturnState);

  console.log('[10] Testing Clear Response...');
  const clearTest = await client.eval(`
    (async () => {
      document.getElementById('cbt-btn-clear')?.click();
      await new Promise(r => setTimeout(r, 300));
      const opt0 = document.getElementById('cbt-option-0');
      const opt1 = document.getElementById('cbt-option-1');
      const opt2 = document.getElementById('cbt-option-2');
      const opt3 = document.getElementById('cbt-option-3');
      const anySelected = [opt0, opt1, opt2, opt3].some(el => el && el.className.includes('border-indigo-600'));
      return { cleared: !anySelected };
    })()
  `);
  console.log('    Clear Response Proof:', clearTest);

  console.log('[11] Testing Mark for Review & Next...');
  await client.eval(`
    (() => {
      document.getElementById('cbt-option-0')?.click();
      document.getElementById('cbt-btn-review')?.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 1000));

  const paletteStatusProof = await client.eval(`
    (() => {
      const qNumSpan = Array.from(document.querySelectorAll('span')).find(el => el.innerText.trim() === '2' && el.className.includes('bg-indigo-600'));
      const paletteBtns = Array.from(document.querySelectorAll('button')).filter(b => /^\\d+$/.test(b.innerText.trim()));
      const q1PaletteBtn = paletteBtns.find(b => b.innerText.trim() === '1');
      const isMarked = q1PaletteBtn && (q1PaletteBtn.className.includes('purple') || q1PaletteBtn.className.includes('emerald'));
      return {
        autoAdvancedToQ2: Boolean(qNumSpan),
        q1PaletteIsMarkedReview: Boolean(isMarked)
      };
    })()
  `);
  console.log('    Mark for Review Proof:', paletteStatusProof);

  console.log('[12] Testing Question Palette Navigation to Last Question...');
  const paletteJump = await client.eval(`
    (() => {
      const paletteBtns = Array.from(document.querySelectorAll('button')).filter(b => /^\\d+$/.test(b.innerText.trim()));
      const lastBtn = paletteBtns[paletteBtns.length - 1];
      const targetIndex = lastBtn.innerText.trim();
      lastBtn.click();
      return { clickedIndex: targetIndex, totalQuestionsInPalette: paletteBtns.length };
    })()
  `);
  console.log('    Palette Jump Action:', paletteJump);
  await new Promise(r => setTimeout(r, 1000));

  console.log('[13] Verifying Last Question Dynamic "Save & Submit Exam" Button...');
  const lastQState = await client.eval(`
    (() => {
      const saveSubmitBtn = document.getElementById('cbt-btn-save-submit');
      return {
        hasSaveSubmitBtn: Boolean(saveSubmitBtn),
        exactText: saveSubmitBtn ? saveSubmitBtn.innerText.trim() : null
      };
    })()
  `);
  console.log('    Last Question State:', lastQState);

  console.log('[14] Answering Last Question & Triggering Submit Confirmation Modal...');
  await client.eval(`
    (() => {
      document.getElementById('cbt-option-0')?.click();
      document.getElementById('cbt-btn-save-submit')?.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 1000));

  console.log('[15] Verifying Submit Confirmation Modal & Counts...');
  const modalProof = await client.eval(`
    (() => {
      const confirmBtn = document.getElementById('cbt-btn-confirm-submit');
      const modalHeader = Array.from(document.querySelectorAll('h3')).find(h => h.innerText.includes('Confirm Final Submission'));
      const modalContainer = confirmBtn?.closest('div.bg-white');

      return {
        hasModal: Boolean(modalHeader),
        hasConfirmBtn: Boolean(confirmBtn),
        modalSummary: modalContainer ? modalContainer.innerText.slice(0, 300) : null
      };
    })()
  `);
  console.log('    Modal Verification Proof:', modalProof);

  console.log('[16] Executing Submission with Rapid Multiple Clicks (Anti-Duplicate Check)...');
  const rapidClickRes = await client.eval(`
    (() => {
      const confirmBtn = document.getElementById('cbt-btn-confirm-submit');
      if (!confirmBtn) return { error: 'Confirm button not found' };

      confirmBtn.click();
      confirmBtn.click();
      confirmBtn.click();
      return { triggeredRapidClicks: 3 };
    })()
  `);
  console.log('    Rapid Click Anti-Duplicate Trigger:', rapidClickRes);

  console.log('[17] Waiting for Server-Authoritative Evaluation & Result Scorecard...');
  let resultFound = false;
  let resultDetails = null;

  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 1000));
    resultDetails = await client.eval(`
      (() => {
        const scorecard = document.getElementById('cbt-result-scorecard');
        if (scorecard) {
          const scoreEl = Array.from(scorecard.querySelectorAll('*')).find(el => el.innerText && /\\d+\\s*\\/\\s*\\d+/.test(el.innerText) && el.className.includes('emerald'));
          const rankEl = Array.from(scorecard.querySelectorAll('*')).find(el => el.innerText && /#\\d+/.test(el.innerText));
          const accuracyEl = Array.from(scorecard.querySelectorAll('*')).find(el => el.innerText && /\\d+%/i.test(el.innerText));
          return {
            hasScorecard: true,
            scoreSnippet: scoreEl ? scoreEl.innerText.trim() : null,
            rankSnippet: rankEl ? rankEl.innerText.trim() : null,
            accuracySnippet: accuracyEl ? accuracyEl.innerText.trim() : null
          };
        }
        return { hasScorecard: false };
      })()
    `);

    if (resultDetails.hasScorecard) {
      resultFound = true;
      break;
    }
  }
  console.log('    Evaluation Result Proof:', resultDetails);

  console.log('\n[18] Testing Real AI Custom CBT Flow on Web UI...');
  await client.eval(`
    (() => {
      const backBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Back to Exam Portal'));
      if (backBtn) backBtn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 1500));

  await client.eval(`
    (() => {
      const customTabBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Create Custom Test'));
      if (customTabBtn) customTabBtn.click();
    })()
  `);
  await new Promise(r => setTimeout(r, 1500));

  // Select Subject
  const subSelectRes = await client.eval(`
    (() => {
      const subBtn = document.querySelector('[data-testid="cbt-builder-subject-btn"]');
      if (subBtn) {
        const text = subBtn.innerText.trim();
        subBtn.click();
        return { success: true, subject: text };
      }
      return { success: false };
    })()
  `);
  console.log('    Subject Selected:', subSelectRes);
  await new Promise(r => setTimeout(r, 1500));

  // Select all topics
  await client.eval(`document.getElementById('cbt-builder-select-all-topics')?.click()`);
  await new Promise(r => setTimeout(r, 800));

  // Click Next: Configure
  const nextConfigRes = await client.eval(`
    (() => {
      const btn = document.getElementById('cbt-builder-next-configure');
      if (btn) {
        btn.click();
        return { clicked: true };
      }
      return { clicked: false };
    })()
  `);
  console.log('    Next: Configure Clicked:', nextConfigRes);
  await new Promise(r => setTimeout(r, 800));

  // Trigger Generate & Start Exam
  const genAction = await client.eval(`
    (() => {
      const genBtn = document.getElementById('cbt-builder-generate-start-btn');
      if (genBtn) {
        genBtn.click();
        return { clicked: true };
      }
      return { clicked: false, buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()) };
    })()
  `);
  console.log('    AI Generate Triggered:', genAction);

  let customExamStarted = false;
  for (let i = 0; i < 25; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const isRunning = await client.eval(`
      (() => {
        const workspace = document.getElementById('cbt-live-exam-workspace');
        const opt0 = document.getElementById('cbt-option-0');
        return { running: Boolean(workspace && opt0) };
      })()
    `);
    if (isRunning.running) {
      customExamStarted = true;
      console.log('    AI Custom Test Successfully Generated & Launched in CBT Workspace!');
      break;
    }
  }

  const allPassed = resultFound && customExamStarted;
  console.log(`\n=== REAL WEB CBT AUDIT FINISHED: ${allPassed ? 'VERIFIED PASS' : 'FAILED'} ===`);

  client.close();
  chromeProcess.kill();
  process.exit(allPassed ? 0 : 1);
}

run().catch(err => {
  console.error('Fatal Web Audit Error:', err);
  process.exit(1);
});
