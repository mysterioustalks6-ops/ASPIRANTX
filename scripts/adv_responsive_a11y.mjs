import puppeteer from 'puppeteer-core';
import fs from 'fs';

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const VIEWPORTS = [320, 360, 375, 390, 412, 430, 768, 1024, 1366, 1920];
const TABS_TO_CHECK = ['#dashboard', '#cbt', '#tasks', '#syllabus', '#pyq', '#library', '#flashcards', '#leaderboard', '#community', '#admin'];

async function runResponsiveAndA11yAudit() {
  console.log('=== STARTING ADVERSARIAL RESPONSIVE (10 VIEWPORTS) & ACCESSIBILITY AUDIT ===\n');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  page.on('dialog', async d => await d.accept());

  const responsiveResults = {};
  const a11yResults = {};

  try {
    // 1. Login first
    console.log('[1] Logging into application...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Login
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const emailBtn = btns.find(b => b.textContent?.includes('Sign In') || b.textContent?.includes('Email'));
      if (emailBtn) emailBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"]');
      const passInput = document.querySelector('input[type="password"]');
      if (emailInput && passInput) {
        emailInput.value = 'ambujyadav0010@gmail.com';
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        passInput.value = '637881@Am';
        passInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    });
    await new Promise(r => setTimeout(r, 3000));

    // 2. Test 10 Viewports for Horizontal Blowout
    console.log('\n[2] Checking 10 Screen Viewports for Horizontal Overflow...');
    for (const width of VIEWPORTS) {
      await page.setViewport({ width, height: 800 });
      await new Promise(r => setTimeout(r, 300));

      const tabBlowouts = {};
      for (const tab of TABS_TO_CHECK) {
        await page.evaluate((t) => { window.location.hash = t; }, tab);
        await new Promise(r => setTimeout(r, 400));

        const isBlowout = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });

        const overflowPixels = await page.evaluate(() => {
          return document.documentElement.scrollWidth - window.innerWidth;
        });

        tabBlowouts[tab] = {
          hasOverflow: isBlowout,
          overflowDeltaPx: Math.max(0, overflowPixels)
        };
      }

      const totalOverflowingTabs = Object.values(tabBlowouts).filter(t => t.hasOverflow).length;
      responsiveResults[`${width}px`] = {
        viewportWidth: width,
        clean: totalOverflowingTabs === 0,
        overflowingTabsCount: totalOverflowingTabs,
        details: tabBlowouts
      };
      console.log(`Viewport ${width}px: ${totalOverflowingTabs === 0 ? 'CLEAN (0 overflow)' : `OVERFLOW in ${totalOverflowingTabs} tabs`}`);
    }

    // 3. Accessibility Checks
    console.log('\n[3] Checking Keyboard Navigation, Focus & Touch Target Dimensions...');
    await page.setViewport({ width: 1280, height: 800 });
    await page.evaluate(() => { window.location.hash = '#dashboard'; });
    await new Promise(r => setTimeout(r, 500));

    const interactiveCheck = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a[href], input, select, textarea'));
      let missingAccessibleName = 0;
      let smallTouchTargets = 0;

      for (const el of buttons) {
        const rect = el.getBoundingClientRect();
        // Check if visible
        if (rect.width > 0 && rect.height > 0) {
          // Touch target size
          if (rect.width < 28 || rect.height < 28) {
            smallTouchTargets++;
          }
          // Accessible label
          const name = el.getAttribute('aria-label') || el.getAttribute('title') || el.innerText || el.value;
          if (!name || !name.trim()) {
            missingAccessibleName++;
          }
        }
      }

      return {
        totalVisibleInteractiveElements: buttons.length,
        missingAccessibleName,
        smallTouchTargets
      };
    });

    // Test Escape key closes modal (e.g. Global Search Modal)
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyK');
    await page.keyboard.up('Control');
    await new Promise(r => setTimeout(r, 500));

    const modalOpened = await page.evaluate(() => {
      return !!document.querySelector('input[placeholder*="Search"]');
    });

    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 500));

    const modalClosedAfterEscape = await page.evaluate(() => {
      return !document.querySelector('input[placeholder*="Search"]');
    });

    a11yResults['interactiveElements'] = interactiveCheck;
    a11yResults['keyboardShortcutCtrlK'] = modalOpened;
    a11yResults['escapeClosesModal'] = modalClosedAfterEscape;
    console.log('A11y Results:', a11yResults);

  } catch (err) {
    console.error('Audit Exception:', err);
  } finally {
    await browser.close();
  }

  console.log('\n=== RESPONSIVE SUMMARY ===');
  console.log(JSON.stringify(responsiveResults, null, 2));
}

runResponsiveAndA11yAudit();
