import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function main() {
  const timeoutId = setTimeout(() => {
    console.error('Test timed out after 45s!');
    process.exit(1);
  }, 45000);

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: EDGE_PATH,
      headless: true,
      args: ['--no-sandbox']
    });

    const page = await browser.newPage();
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const t = msg.text();
        // Ignore Google AdSense network/tracking block errors
        if (!t.includes('adsbygoogle') && !t.includes('googleads') && !t.includes('pagead') && !t.includes('404')) {
          errors.push(t);
        }
      }
    });
    page.on('pageerror', err => errors.push(err.stack || err.message));

    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.goto('http://127.0.0.1:5173/?no_splash=1');
    await new Promise(r => setTimeout(r, 2000));

    // Wait for either mobile bottom nav or hero guest button
    await page.waitForFunction(() => {
      return !!document.querySelector('#mobile-bottom-nav') || !!document.querySelector('#hero-guest-btn');
    }, { timeout: 15000 });

    await page.evaluate(() => {
      const b = document.querySelector('#hero-guest-btn');
      if (b) b.click();
    });
    await page.waitForSelector('#mobile-bottom-nav', { timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));

    // Navigate to syllabus tab via custom event and location hash
    await page.evaluate(() => {
      window.location.hash = 'syllabus';
      window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'syllabus' }));
    });
    await page.waitForSelector('[data-screen="syllabus"]', { timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));

    // Switch to List view
    await page.evaluate(() => {
      const listBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('List'));
      if (listBtn) listBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    // Check for "Loading" text
    const pageText = await page.evaluate(() => document.body.innerText);
    const hasLoading = pageText.includes('Loading Syllabus Checklist...') || pageText.includes('Loading enterprise view');
    const hasContent = pageText.includes('OFFICIAL') || pageText.includes('My Plan') || pageText.includes('Velocity');

    console.log('--- List View Test Results ---');
    console.log('Has Loading:', hasLoading);
    console.log('Has Content:', hasContent);
    console.log('Captured Errors:', errors);

    if (errors.length > 0) {
      throw new Error(`Console errors detected: ${JSON.stringify(errors)}`);
    }
    if (hasLoading) {
      throw new Error('Screen stuck on Loading text!');
    }
    if (!hasContent) {
      throw new Error(`Screen missing expected content! Snippet: ${pageText.substring(0, 200)}`);
    }

    const testImgPath = path.resolve('scratch/review/web_list_verified.png');
    await page.screenshot({ path: testImgPath });
    console.log(`✓ Successfully verified and saved ${testImgPath}`);
  } finally {
    clearTimeout(timeoutId);
    if (browser) await browser.close();
  }
}

main().catch(err => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
