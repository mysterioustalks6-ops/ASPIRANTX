import WebSocket from 'ws';
import http from 'http';
import { execFileSync } from 'child_process';
import path from 'path';

const ADB = path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk', 'platform-tools', 'adb.exe');
const DEVICE_ID = process.env.ANDROID_SERIAL || '10BD570GL500057';
const COMMIT_DIR = path.resolve('docs/screenshots');
const REVIEW_DIR = path.resolve('scratch/review');

function assert(cond, msg) {
  if (!cond) throw new Error(`[ASSERTION FAILED] ${msg}`);
}

function adb(args) {
  return execFileSync(ADB, ['-s', DEVICE_ID, ...args]);
}

function captureAndroid(outPath) {
  adb(['shell', 'screencap', '-p', '/sdcard/screen.png']);
  adb(['pull', '/sdcard/screen.png', outPath]);
  console.log(`  ✓ Pulled screenshot: ${path.basename(outPath)}`);
}

async function main() {
  console.log(`=== Android Verification & Capture Pipeline via CDP (Device: ${DEVICE_ID}) ===\n`);

  let ws;
  const scriptTimeout = setTimeout(() => {
    console.error('FATAL: Android CDP script reached 55s timeout!');
    process.exit(1);
  }, 55000);

  try {
    // Dismiss any OS dialogs
    try {
      adb(['shell', 'input', 'keyevent', '4']);
    } catch (e) {}
    await new Promise(r => setTimeout(r, 400));

    console.log('Fetching DevTools targets from 127.0.0.1:9222/json...');
    const endpoints = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
    const pageTarget = endpoints.find(e => e.type === 'page');
    assert(pageTarget, 'No page target found on Android WebView DevTools!');

    console.log(`Connecting CDP to ${pageTarget.webSocketDebuggerUrl}...`);
    ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise(r => ws.on('open', r));

    let msgId = 0;
    function sendCdp(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = ++msgId;
        const handler = (data) => {
          try {
            const msg = JSON.parse(data.toString());
            if (msg.id === id) {
              ws.off('message', handler);
              if (msg.error) reject(new Error(msg.error.message));
              else resolve(msg.result);
            }
          } catch (e) {
            reject(e);
          }
        };
        ws.on('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    async function evalCode(expression) {
      const res = await sendCdp('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true
      });
      return res.result?.value;
    }

    const consoleErrors = [];
    ws.on('message', data => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.method === 'Runtime.consoleAPICalled' && msg.params?.type === 'error') {
          const errText = msg.params.args.map(a => a.value || a.description || '').join(' ');
          if (!errText.includes('adsbygoogle') && !errText.includes('googleads') && !errText.includes('pagead') && !errText.includes('404') && !errText.includes('ERR_NAME_NOT_RESOLVED') && !errText.includes('net::ERR_')) {
            consoleErrors.push(errText);
            console.error(`  [ANDROID CONSOLE ERROR] ${errText}`);
          }
        }
      } catch (e) {}
    });

    await sendCdp('Runtime.enable');

    // 1. Audit user profile in localStorage (Requirement 6: Real Guest Mode)
    const userProfile = await evalCode(`(() => {
      try {
        const raw = localStorage.getItem('aspirantx_auth_user') || localStorage.getItem('studyride_user');
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return { parseError: e.message };
      }
    })()`);

    console.log('[USER PROFILE AUDIT]', JSON.stringify(userProfile, null, 2));
    assert(userProfile, 'User profile not found in localStorage!');
    assert(!userProfile.name?.includes('Priya'), `Fake user detected! Name: ${userProfile.name}`);
    assert(userProfile.streakDays <= 1, `Fake streak detected! Streak: ${userProfile.streakDays}`);
    assert(userProfile.isGuest === true, `Expected isGuest === true, got: ${userProfile.isGuest}`);
    console.log('✓ Confirmed Android app is in genuine guest mode (no fake test data).\n');

    // =========================================================================
    // STEP A: LIST VIEW VERIFICATION (Requirement 3)
    // =========================================================================
    console.log('--- Step A: Testing Android List View ---');
    await evalCode(`(() => {
      window.location.hash = 'syllabus';
      window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'syllabus' }));
    })()`);
    await new Promise(r => setTimeout(r, 1200));

    // Click List button in segmented control
    await evalCode(`(() => {
      const listBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('List'));
      if (listBtn) listBtn.click();
    })()`);
    // Regression test: Poll up to 10s for real content and ensure no "Loading" text remains
    const startListWait = Date.now();
    let listContentAudit;
    while (Date.now() - startListWait < 10000) {
      listContentAudit = await evalCode(`(() => {
        const text = document.body.innerText || '';
        const hasMyPlan = text.includes('My Plan') || text.includes('Custom Plan');
        const hasImport = Array.from(document.querySelectorAll('button')).some(b => 
          /Import|Refresh|Reset/i.test(b.textContent || '')
        );
        const examTitle = document.querySelector('h1, h2, h3, select, button')?.textContent || '';
        const hasLoadingText = /Loading Syllabus Checklist|Loading\.\.\./i.test(text);
        return { 
          textSnippet: text.substring(0, 250), 
          hasMyPlan, 
          hasImport, 
          examTitle, 
          hasLoadingText 
        };
      })()`);
      if (!listContentAudit.hasLoadingText && listContentAudit.hasMyPlan) break;
      await new Promise(r => setTimeout(r, 400));
    }

    console.log('[ANDROID LIST VIEW AUDIT]', JSON.stringify(listContentAudit, null, 2));
    assert(!listContentAudit.hasLoadingText, `REGRESSION FAILURE: Android List view still contains "Loading" text after 10 seconds! Snippet: ${listContentAudit.textSnippet}`);
    assert(listContentAudit.hasMyPlan, 'REGRESSION FAILURE: Android List view missing "My Plan" content after 10 seconds!');
    console.log('✓ Confirmed List view renders real syllabus content on Android build.');

    // Save proof screenshot to scratch/review/android_map_list.png
    captureAndroid(path.join(REVIEW_DIR, 'android_map_list.png'));

    // =========================================================================
    // STEP B: CAPTURE COMMITTED ANDROID SCREENS (Territory, Today, Me)
    // =========================================================================
    console.log('\n--- Step B: Capturing Committed Android Screens ---');

    // B1: Android Map (Territory)
    console.log('1. Switching to Territory mode...');
    await evalCode(`(() => {
      const terrBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Territory'));
      if (terrBtn) terrBtn.click();
    })()`);
    await new Promise(r => setTimeout(r, 1200));
    captureAndroid(path.join(COMMIT_DIR, 'android_map_territory.png'));

    // B2: Android Today
    console.log('2. Navigating to Today tab...');
    await evalCode(`(() => {
      window.location.hash = 'today';
      window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'today' }));
    })()`);
    await new Promise(r => setTimeout(r, 1200));
    captureAndroid(path.join(COMMIT_DIR, 'android_today.png'));

    // B3: Android Me
    console.log('3. Navigating to Me tab...');
    await evalCode(`(() => {
      window.location.hash = 'me';
      window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'me' }));
    })()`);
    await new Promise(r => setTimeout(r, 1200));
    captureAndroid(path.join(COMMIT_DIR, 'android_me.png'));

    // Assert zero console errors
    assert(consoleErrors.length === 0, `Android Console Errors: ${JSON.stringify(consoleErrors)}`);

    console.log('\n✓ ALL ANDROID VERIFICATIONS & SCREENSHOTS COMPLETED SUCCESSFULLY!');
  } finally {
    clearTimeout(scriptTimeout);
    if (ws) ws.close();
  }
}

main().catch(err => {
  console.error('\n❌ ANDROID CDP CAPTURE FAILED:', err);
  process.exit(1);
});
