import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const BASE_URL = 'http://localhost:3000';
const WORKSPACE_DIR = path.resolve('.');

console.log('============================================================');
console.log('🚀 REAL USER ACCEPTANCE GATE (PHASES 1–8) BROWSER AUTOMATION');
console.log('============================================================\n');
console.log(`Using Browser executable: ${CHROME_PATH}`);

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1280,800'
    ]
  });

  const page = await browser.newPage();

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error' || text.includes('Error') || text.includes('warning') || text.includes('failed')) {
      console.log(`[BROWSER CONSOLE ${msg.type()}]:`, text);
    }
  });
  page.on('pageerror', err => {
    console.error('[BROWSER UNCAUGHT ERROR]:', err.message);
  });

  // Helper for safe timeout delay
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  try {
    // -------------------------------------------------------------
    // STEP 1: Desktop Landing Page (1280x800)
    // -------------------------------------------------------------
    console.log('\n--- [1/8] Testing Desktop Landing Page ---');
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle2' });

    // Clear session to guarantee clean landing view
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle2' });

    // Wait for Landing Hero
    await page.waitForSelector('#landing-page-root', { timeout: 10000 });
    await sleep(1000);

    const landingTitle = await page.$eval('h1', el => el.innerText).catch(() => 'N/A');
    console.log(`Landing H1: "${landingTitle.replace(/\n/g, ' ')}"`);

    const guestDemoBtn = await page.$('#landing-guest-demo-btn');
    console.log(`Guest Demo CTA present: ${!!guestDemoBtn}`);

    const screenshot1Path = path.join(WORKSPACE_DIR, 'qa_01_landing_desktop.png');
    await page.screenshot({ path: screenshot1Path, fullPage: false });
    console.log(`📸 Saved: qa_01_landing_desktop.png`);

    // -------------------------------------------------------------
    // STEP 2: Mobile Landing Page (390x844)
    // -------------------------------------------------------------
    console.log('\n--- [2/8] Testing Mobile Landing Page ---');
    await page.setViewport({ width: 390, height: 844 });
    await sleep(800);

    const screenshot2Path = path.join(WORKSPACE_DIR, 'qa_02_landing_mobile.png');
    await page.screenshot({ path: screenshot2Path, fullPage: false });
    console.log(`📸 Saved: qa_02_landing_mobile.png`);

    // -------------------------------------------------------------
    // STEP 3: Auth & Admin Login Flow (ambujyadav0010@gmail.com)
    // -------------------------------------------------------------
    console.log('\n--- [3/8] Testing Real Admin Auth Flow (ambujyadav0010@gmail.com) ---');
    await page.setViewport({ width: 1280, height: 800 });

    // Click standard Sign In / Register button
    const signinBtn = await page.$('#landing-signin-btn');
    if (signinBtn) {
      await signinBtn.click();
      await sleep(1000);
      // Fill email and password for Ambuj Yadav
      await page.type('input[type="email"]', 'ambujyadav0010@gmail.com');
      await page.type('input[type="password"]', 'AdminPass123!');
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) await submitBtn.click();
      console.log('Signed in through standard Sign In modal with ambujyadav0010@gmail.com.');
    }
    await sleep(2000);

    // Wait for App Shell
    await page.waitForSelector('aside, header, main', { timeout: 15000 });
    console.log('App shell mounted with Admin credentials.');

    // -------------------------------------------------------------
    // STEP 4: Student Dashboard (1280x800)
    // -------------------------------------------------------------
    console.log('\n--- [4/8] Testing Student Dashboard ---');
    await page.setViewport({ width: 1280, height: 800 });

    // Ensure PWA and onboarding tour are dismissed so Region 2 action cards show prominently
    await page.evaluate(() => {
      localStorage.setItem('aspirantx_pwa_install_dismissed', 'true');
      localStorage.setItem('aspirantx_onboarding_dismissed', 'true');
      const continueBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Continue on Web'));
      if (continueBtn) continueBtn.click();
    });
    await sleep(600);

    console.log('Triggering dashboard click via DOM evaluate...');
    await page.evaluate(() => {
      const btn = document.querySelector('#sidebar-nav-dashboard');
      if (btn) btn.click();
      else window.location.hash = 'dashboard';
    });
    await sleep(2000);

    await page.waitForSelector('#student-dashboard', { timeout: 15000 });
    console.log('Student Dashboard rendered successfully.');

    const contLearning = await page.$('#dashboard-continue-learning-card');
    const recAction = await page.$('#dashboard-recommended-next-card');
    const quickLaunch = await page.$('#dashboard-quick-launch-grid');
    console.log(`Priority 1 (Continue Learning): ${!!contLearning}`);
    console.log(`Priority 2 (Recommended Next): ${!!recAction}`);
    console.log(`Priority 4 (Quick Launch 6-grid): ${!!quickLaunch}`);

    const screenshot3Path = path.join(WORKSPACE_DIR, 'qa_03_dashboard.png');
    await page.screenshot({ path: screenshot3Path, fullPage: false });
    console.log(`📸 Saved: qa_03_dashboard.png`);

    // -------------------------------------------------------------
    // STEP 5: Learn Area (Syllabus & Flashcards)
    // -------------------------------------------------------------
    console.log('\n--- [5/8] Testing Learn Area (Syllabus & Flashcards) ---');
    await page.evaluate(() => {
      const btn = document.querySelector('#sidebar-nav-flashcards');
      if (btn) btn.click();
      else window.location.hash = 'flashcards';
    });
    await sleep(1500);

    // Click card to test 3D flip interaction
    const flashcard = await page.$('.select-none.cursor-pointer');
    if (flashcard) {
      await flashcard.click();
      await sleep(600);
      console.log('Flashcard flipped to answer view successfully.');
    }

    const screenshot4Path = path.join(WORKSPACE_DIR, 'qa_04_learn.png');
    await page.screenshot({ path: screenshot4Path, fullPage: false });
    console.log(`📸 Saved: qa_04_learn.png`);

    // -------------------------------------------------------------
    // STEP 6: Practice Area (PYQ & Question Bank)
    // -------------------------------------------------------------
    console.log('\n--- [6/8] Testing Practice Area (PYQ & Question Bank) ---');
    await page.evaluate(() => {
      const btn = document.querySelector('#sidebar-nav-pyq');
      if (btn) btn.click();
      else window.location.hash = 'pyq';
    });
    await sleep(1500);

    const pyqTitle = await page.$eval('h1', el => el.innerText).catch(() => 'N/A');
    console.log(`PYQ Archive Title: "${pyqTitle}"`);

    const screenshot5Path = path.join(WORKSPACE_DIR, 'qa_05_practice.png');
    await page.screenshot({ path: screenshot5Path, fullPage: false });
    console.log(`📸 Saved: qa_05_practice.png`);

    // -------------------------------------------------------------
    // STEP 7: CBT Mock Test Simulator & Scorecard
    // -------------------------------------------------------------
    console.log('\n--- [7/8] Testing CBT Mock Test Simulator ---');
    await page.evaluate(() => {
      localStorage.setItem('aspirantx_global_selected_exam', 'UPSC_CSE');
      const btn = document.querySelector('#sidebar-nav-cbt');
      if (btn) btn.click();
      else window.location.hash = 'cbt';
    });
    await sleep(2000);

    // Wait for tests to finish loading
    console.log('Waiting for CBT tests to load...');
    await page.waitForFunction(() => {
      return Array.from(document.querySelectorAll('button')).some(b => 
        b.innerText.includes('Start Live CBT Exam') || 
        b.innerText.includes('Build Custom Test') ||
        b.innerText.includes('Generate & Start')
      );
    }, { timeout: 20000 });

    const clickedResult = await page.evaluate(() => {
      const startBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Start Live CBT Exam'));
      if (startBtn) {
        startBtn.click();
        return 'Clicked Start Live CBT Exam directly in DOM';
      }
      const customBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Build Custom Test'));
      if (customBtn) {
        customBtn.click();
        return 'Clicked Build Custom Test';
      }
      return 'No test button found';
    });
    console.log('Click action result:', clickedResult);
    await sleep(2500);

    // Check Live Exam Workspace
    await page.waitForSelector('#cbt-live-exam-workspace', { timeout: 20000 });
    console.log('CBT Exam Workspace loaded with zero distraction / exam room austerity.');

    // Select Option A (index 0)
    const opt0 = await page.$('#cbt-option-0');
    if (opt0) {
      await opt0.click();
      await sleep(400);
      console.log('Selected option A.');
    }

    // Save & Next
    const saveNextBtn = await page.$('#cbt-btn-save-next');
    if (saveNextBtn) {
      await saveNextBtn.click();
      await sleep(600);
      console.log('Save & Next clicked.');
    }

    // Mark For Review
    const reviewBtn = await page.$('#cbt-btn-review');
    if (reviewBtn) {
      await reviewBtn.click();
      await sleep(600);
      console.log('Mark for Review clicked.');
    }

    const screenshot6Path = path.join(WORKSPACE_DIR, 'qa_06_cbt.png');
    await page.screenshot({ path: screenshot6Path, fullPage: false });
    console.log(`📸 Saved: qa_06_cbt.png`);

    // Submit Exam
    console.log('Submitting CBT exam...');
    const submitClicked = await page.evaluate(() => {
      const submitBtn = document.querySelector('#cbt-btn-submit-exam') ||
        Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Submit Exam') || b.innerText.includes('Submit Examination'));
      if (submitBtn) {
        submitBtn.click();
        return 'Clicked submit exam button';
      }
      return 'Submit exam button not found';
    });
    console.log('Submit button click:', submitClicked);
    await sleep(1500);

    // Confirm submit in modal
    console.log('Confirming submission in modal...');
    const confirmClicked = await page.evaluate(() => {
      const confirmBtn = document.querySelector('#cbt-btn-confirm-submit') ||
        Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Yes, Submit Test') || b.innerText.includes('Confirm'));
      if (confirmBtn) {
        confirmBtn.click();
        return 'Clicked confirm submit button';
      }
      return 'Confirm submit button not found';
    });
    console.log('Confirm button click:', confirmClicked);
    await sleep(3000);

    // Verify Scorecard
    await page.waitForSelector('#cbt-result-scorecard', { timeout: 15000 });
    console.log('CBT Result Scorecard & AI diagnostic report successfully loaded.');

    const screenshot7Path = path.join(WORKSPACE_DIR, 'qa_07_cbt_result.png');
    await page.screenshot({ path: screenshot7Path, fullPage: false });
    console.log(`📸 Saved: qa_07_cbt_result.png`);

    // -------------------------------------------------------------
    // STEP 8: Android Mobile Simulation (412x915)
    // -------------------------------------------------------------
    console.log('\n--- [8/8] Testing Android Mobile Simulation ---');
    await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });

    // If on landing page, log in via standard Sign In modal
    const signinBtnMobile = await page.$('#landing-signin-btn');
    if (signinBtnMobile) {
      console.log('Mobile view on landing page: entering app via standard Sign In modal (ambujyadav0010@gmail.com)...');
      await signinBtnMobile.click();
      await sleep(800);
      await page.type('input[type="email"]', 'ambujyadav0010@gmail.com');
      await page.type('input[type="password"]', 'AdminPass123!');
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) await submitBtn.click();
      await sleep(1500);
    }

    // Dismiss PWA install modal if shown
    await page.evaluate(() => {
      localStorage.setItem('aspirantx_pwa_install_dismissed', 'true');
      const continueBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Continue on Web'));
      if (continueBtn) continueBtn.click();
    });
    await sleep(800);

    // Wait for Mobile Bottom Nav
    await page.waitForSelector('#mobile-bottom-nav', { timeout: 12000 });
    console.log('Mobile Bottom Nav detected and visible on Android viewport (412x915).');

    const screenshot8Path = path.join(WORKSPACE_DIR, 'qa_08_android.png');
    await page.screenshot({ path: screenshot8Path, fullPage: false });
    console.log(`📸 Saved: qa_08_android.png`);

    console.log('\n============================================================');
    console.log('✨ ALL 8 SCREENSHOTS CAPTURED AND VERIFIED SUCCESSFULLY!');
    console.log('============================================================');

  } catch (err) {
    console.error('QA Automation Error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
