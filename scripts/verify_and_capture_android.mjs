import puppeteer from 'puppeteer-core';
import { execFileSync } from 'child_process';
import path from 'path';

const ADB = path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk', 'platform-tools', 'adb.exe');
const COMMIT_DIR = path.resolve('docs/screenshots');
const REVIEW_DIR = path.resolve('scratch/review');

function assert(cond, msg) {
  if (!cond) throw new Error(`[ASSERTION FAILED] ${msg}`);
}

function captureAndroid(outPath) {
  execFileSync(ADB, ['shell', 'screencap', '-p', '/sdcard/screen.png']);
  execFileSync(ADB, ['pull', '/sdcard/screen.png', outPath]);
  console.log(`  ✓ Pulled screenshot: ${path.basename(outPath)}`);
}

async function main() {
  console.log('=== Android Verification & Capture Pipeline (Fixed 10) ===\n');

  let browser;
  const scriptTimeout = setTimeout(() => {
    console.error('FATAL: Android capture reached 58s timeout!');
    process.exit(1);
  }, 58000);

  try {
    // Dismiss any OS dialogs
    execFileSync(ADB, ['shell', 'input', 'keyevent', '4']);
    await new Promise(r => setTimeout(r, 400));

    console.log('Connecting to Android WebView DevTools on 127.0.0.1:9222...');
    browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
    const pages = await browser.pages();
    const page = pages[0];

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('adsbygoogle') && !text.includes('googleads') && !text.includes('pagead') && !text.includes('404') && !text.includes('ERR_NAME_NOT_RESOLVED') && !text.includes('net::ERR_')) {
          consoleErrors.push(text);
          console.error(`  [ANDROID CONSOLE ERROR] ${text}`);
        }
      }
    });

    page.on('pageerror', err => {
      consoleErrors.push(err.stack || err.message);
      console.error(`  [ANDROID UNCAUGHT ERROR] ${err.message}`);
    });

    // If on landing page, click hero guest button
    await page.evaluate(() => {
      const btn = document.querySelector('#hero-guest-btn');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 500));

    // 1. Audit user profile in localStorage (Requirement 6: Real Guest Mode)
    const userProfile = await page.evaluate(() => {
      try {
        const raw = localStorage.getItem('aspirantx_auth_user') || localStorage.getItem('studyride_user');
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return { parseError: e.message };
      }
    });

    console.log('[USER PROFILE AUDIT]', JSON.stringify(userProfile, null, 2));
    assert(userProfile, 'User profile not found in localStorage!');
    assert(!userProfile.name?.includes('Priya'), `Fake user detected! Name: ${userProfile.name}`);
    assert(userProfile.streakDays <= 1, `Fake streak detected! Streak: ${userProfile.streakDays}`);
    assert(userProfile.isGuest === true, `Expected isGuest === true, got: ${userProfile.isGuest}`);
    console.log('✓ Confirmed Android app is in genuine guest mode (no fake test data).\n');

    // Helper to assert screen readiness
    async function assertAndroidScreen(screenName) {
      const startTime = Date.now();
      let state;
      while (Date.now() - startTime < 10000) {
        state = await page.evaluate(() => {
          const text = document.body.innerText || '';
          const hasLoading = /Loading Syllabus Checklist|Loading syllabus topics|Loading Question Bank|Syncing Study Telemetry/i.test(text);
          return { textSnippet: text.substring(0, 150), hasLoading };
        });
        if (!state.hasLoading) break;
        await new Promise(r => setTimeout(r, 250));
      }
      assert(!state.hasLoading, `Android screen "${screenName}" stuck on loading! ${state.textSnippet}`);
      console.log(`  ✓ Screen assertion passed for [${screenName}]`);
    }

    // =========================================================================
    // STEP A: LIST VIEW VERIFICATION (Requirement 3)
    // =========================================================================
    console.log('--- Step A: Testing Android List View ---');
    await page.evaluate(() => {
      window.location.hash = 'syllabus';
      window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'syllabus' }));
    });
    await new Promise(r => setTimeout(r, 1200));

    // Click List button in segmented control
    await page.evaluate(() => {
      const listBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('List'));
      if (listBtn) listBtn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Audit List view content on Android
    const listContentAudit = await page.evaluate(() => {
      const text = document.body.innerText || '';
      const hasMyPlan = text.includes('My Plan') || text.includes('Custom Plan');
      const hasImport = Array.from(document.querySelectorAll('button')).some(b => 
        /Import|Refresh|Reset/i.test(b.textContent || '')
      );
      const examTitle = document.querySelector('h1, h2, h3, select, button')?.textContent || '';
      const hasLoadingText = /Loading Syllabus Checklist/i.test(text);
      return { 
        textSnippet: text.substring(0, 250), 
        hasMyPlan, 
        hasImport, 
        examTitle, 
        hasLoadingText 
      };
    });

    console.log('[ANDROID LIST VIEW AUDIT]', JSON.stringify(listContentAudit, null, 2));
    assert(!listContentAudit.hasLoadingText, 'Android List view still contains "Loading Syllabus Checklist"!');
    assert(listContentAudit.hasMyPlan, 'Android List view missing "My Plan" content!');
    console.log('✓ Confirmed List view renders real syllabus content on Android build.');

    // Save proof screenshot to scratch/review/android_map_list.png
    captureAndroid(path.join(REVIEW_DIR, 'android_map_list.png'));

    // =========================================================================
    // STEP B: CAPTURE COMMITTED ANDROID SCREENS (Today, Territory, Me)
    // =========================================================================
    console.log('\n--- Step B: Capturing Committed Android Screens ---');

    // B1: Android Map (Territory)
    console.log('1. Switching to Territory mode...');
    await page.evaluate(() => {
      const terrBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Territory'));
      if (terrBtn) terrBtn.click();
    });
    await new Promise(r => setTimeout(r, 1200));
    await assertAndroidScreen('Android Map Territory');
    captureAndroid(path.join(COMMIT_DIR, 'android_map_territory.png'));

    // B2: Android Today
    console.log('2. Navigating to Today tab...');
    await page.evaluate(() => {
      window.location.hash = 'today';
      window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'today' }));
    });
    await new Promise(r => setTimeout(r, 1200));
    await assertAndroidScreen('Android Today');
    captureAndroid(path.join(COMMIT_DIR, 'android_today.png'));

    // B3: Android Me
    console.log('3. Navigating to Me tab...');
    await page.evaluate(() => {
      window.location.hash = 'me';
      window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'me' }));
    });
    await new Promise(r => setTimeout(r, 1200));
    await assertAndroidScreen('Android Me');
    captureAndroid(path.join(COMMIT_DIR, 'android_me.png'));

    // Assert zero console errors
    assert(consoleErrors.length === 0, `Android Console Errors: ${JSON.stringify(consoleErrors)}`);

    console.log('\n✓ ALL ANDROID VERIFICATIONS & SCREENSHOTS COMPLETED SUCCESSFULLY!');
  } finally {
    clearTimeout(scriptTimeout);
    if (browser) await browser.disconnect();
  }
}

main().catch(err => {
  console.error('\n❌ ANDROID CAPTURE FAILED:', err);
  process.exit(1);
});
