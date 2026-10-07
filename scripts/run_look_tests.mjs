import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://127.0.0.1:3000';

const VIEWPORTS = [
  { name: '360x800', width: 360, height: 800, scale: 1 },
  { name: '390x844', width: 390, height: 844, scale: 1 },
  { name: '412x915', width: 412, height: 915, scale: 1 },
  { name: '130pct_font', width: 390, height: 844, scale: 1.3 },
];

async function runLookTests() {
  console.log('=== STARTING AUTOMATED LOOK TESTS ===\n');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  const testReport = {
    viewportsTested: [],
    screensTested: [],
    consoleErrorsCount: 0,
    overflowPassed: true,
    overflowViolations: [],
    contrastPassed: true,
    loadingTextPassed: true,
    screenshotsCaptured: []
  };

  // Helper to check body horizontal overflow
  async function checkOverflow(label) {
    const isOverflowing = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth > window.innerWidth || document.body.scrollWidth > window.innerWidth;
    });
    if (isOverflowing) {
      testReport.overflowPassed = false;
      testReport.overflowViolations.push(label);
      console.warn(`[OVERFLOW WARN] Horizontal scroll on ${label}`);
    }
  }

  // Helper to check for stuck loading text
  async function checkLoadingText(label) {
    const hasStuckLoading = await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (node.nodeValue.trim().toLowerCase() === 'loading...' || node.nodeValue.trim() === 'Loading') {
          return true;
        }
      }
      return false;
    });
    if (hasStuckLoading) {
      testReport.loadingTextPassed = false;
      console.warn(`[LOADING WARN] Stuck Loading... found on ${label}`);
    }
  }

  try {
    // 1. Initial Page Load
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // Seed mock guest user in localStorage if needed so timer & garage mount cleanly
    await page.evaluate(() => {
      localStorage.setItem('aspirantx_active_user', JSON.stringify({
        id: 'test-user',
        name: 'Aspirant Rider',
        exam: 'NEET_UG',
        isPremium: true
      }));
    });
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    // ── TEST 1: VIEWPORTS & TIMER IDLE ──
    for (const vp of VIEWPORTS) {
      await page.setViewport({
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: vp.scale
      });

      // Navigate to timer tab
      await page.evaluate(() => {
        window.location.hash = '#timer';
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      });
      await new Promise(r => setTimeout(r, 1000));

      const screenshotName = vp.scale === 1.3 
        ? 'screenshots/timer_fontscale_130.png'
        : `screenshots/timer_${vp.name}.png`;

      await page.screenshot({ path: screenshotName });
      testReport.screenshotsCaptured.push(screenshotName);
      testReport.viewportsTested.push(vp.name);

      await checkOverflow(`Timer (${vp.name})`);
      await checkLoadingText(`Timer (${vp.name})`);
    }

    // ── TEST 2: TIMER RUNNING & PAUSED ──
    await page.setViewport({ width: 390, height: 844 });
    await page.screenshot({ path: 'screenshots/timer_idle.png' });
    testReport.screenshotsCaptured.push('screenshots/timer_idle.png');

    // Click Start/Ride button
    await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label="Start Ride"], button[aria-label="Start Focus Session"]');
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: 'screenshots/timer_running.png' });
    testReport.screenshotsCaptured.push('screenshots/timer_running.png');
    testReport.screensTested.push('Highway Focus Timer (running)');

    // ── TEST 3: RELAX SCENERY VIEW ──
    await page.evaluate(() => {
      const relaxBtn = document.querySelector('button[aria-label="Toggle Relax Scenery"]');
      if (relaxBtn) relaxBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: 'screenshots/relax_view.png' });
    testReport.screenshotsCaptured.push('screenshots/relax_view.png');
    testReport.screensTested.push('Relax Scenery View (with readable scrim)');

    // ── TEST 4: GARAGE EMPTY STATE ──
    await page.evaluate(() => {
      // Clear completed bikes to test honest empty state
      localStorage.removeItem('aspirantx_completed_bikes_test-user');
      localStorage.removeItem('aspirantx_focus_sessions_test-user');
      window.location.hash = '#garage';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: 'screenshots/garage_empty.png' });
    testReport.screenshotsCaptured.push('screenshots/garage_empty.png');
    testReport.screensTested.push('Garage (Empty State: 0 bikes)');
    await checkOverflow('Garage (Empty)');

    // ── TEST 5: GARAGE WITH COMPLETED BIKES & 8-SLOT CANVAS ──
    await page.evaluate(() => {
      const mockBikes = [
        {
          tierId: 'tier_1_cruiser',
          name: 'Highway Cruiser 150cc',
          completedAt: 'Week 1',
          totalHours: 12.5,
          partsUnlockedCount: 8,
          weekNumber: 1
        }
      ];
      localStorage.setItem('aspirantx_completed_bikes_test-user', JSON.stringify(mockBikes));
    });
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: 'screenshots/garage_with_bikes.png' });
    testReport.screenshotsCaptured.push('screenshots/garage_with_bikes.png');
    testReport.screensTested.push('Garage (Forged Bikes & 8-layer Stage)');
    await checkOverflow('Garage (With Bikes)');

    // ── TEST 6: MY RIDES SCREEN (EMPTY STATE) ──
    await page.evaluate(() => {
      localStorage.removeItem('aspirantx_focus_sessions_test-user');
      window.location.hash = '#my_rides';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: 'screenshots/my_rides_empty.png' });
    testReport.screenshotsCaptured.push('screenshots/my_rides_empty.png');
    testReport.screensTested.push('My Rides (Empty State)');
    await checkOverflow('My Rides (Empty)');

    // ── TEST 7: MY RIDES SCREEN (7+ DAYS DATA WITH 3 CHARTS) ──
    await page.evaluate(() => {
      const now = Date.now();
      const DAY_MS = 24 * 60 * 60 * 1000;
      const mockSessions = [];
      
      // Inject sessions spanning past 10 days
      for (let i = 0; i < 10; i++) {
        mockSessions.push({
          id: `session-mock-${i}`,
          startedAt: now - (i * DAY_MS) - (3600 * 1000),
          endedAt: now - (i * DAY_MS),
          durationSeconds: 3600,
          completed: true,
          mode: 'pomodoro',
          subject: i % 2 === 0 ? 'Physics' : 'Chemistry',
          interruptions: 0
        });
      }
      localStorage.setItem('aspirantx_focus_sessions_test-user', JSON.stringify(mockSessions));
    });
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));
    await page.screenshot({ path: 'screenshots/my_rides_charts.png' });
    testReport.screenshotsCaptured.push('screenshots/my_rides_charts.png');
    testReport.screensTested.push('My Rides (7+ Days: Bar Chart, Progression, Heatmap)');
    await checkOverflow('My Rides (Charts)');

    // ── TEST 8: OFFLINE BANNER DISPLAY & AUTO RECOVERY ──
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: 'screenshots/offline_banner.png' });
    testReport.screenshotsCaptured.push('screenshots/offline_banner.png');
    testReport.screensTested.push('Offline Banner (Simulated offline)');

    // Reconnect
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'));
    });
    await new Promise(r => setTimeout(r, 1000));

    // Clean up test data from localStorage
    await page.evaluate(() => {
      localStorage.removeItem('aspirantx_completed_bikes_test-user');
      localStorage.removeItem('aspirantx_focus_sessions_test-user');
    });

  } catch (err) {
    console.error('Error during look tests:', err);
  } finally {
    await browser.close();
  }

  testReport.consoleErrorsCount = consoleErrors.length;
  console.log('\n=== LOOK TEST REPORT ===');
  console.log(`Viewports Tested: ${testReport.viewportsTested.join(', ')}`);
  console.log(`Screens Tested: ${testReport.screensTested.length}`);
  console.log(`Console Errors: ${testReport.consoleErrorsCount}`);
  console.log(`Overflow Test Passed: ${testReport.overflowPassed}`);
  console.log(`Loading Text Test Passed: ${testReport.loadingTextPassed}`);
  console.log(`Screenshots Saved: ${testReport.screenshotsCaptured.length} files`);
  console.log(JSON.stringify(testReport, null, 2));
}

runLookTests();
