import puppeteer from 'puppeteer-core';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\AMBUJ YADAV\\.gemini\\antigravity-ide\\brain\\58e0c542-e90b-490e-93d8-363b9e766b54';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function main() {
  console.log('Starting Phase 3 mobile verification capture...');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  
  // Set standard baseline mobile viewport (390x844, DPR 2)
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  console.log('Navigating to http://localhost:5173/...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 600));

  // Click Guest Demo button to enter app shell if on landing page
  const enteredGuest = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const guestBtn = buttons.find(b => b.textContent && (b.textContent.includes('Instant Guest') || b.textContent.includes('Guest Demo') || b.textContent.includes('Try Instant')));
    if (guestBtn) {
      guestBtn.click();
      return true;
    }
    return false;
  });
  if (enteredGuest) {
    console.log('Entered via Instant Guest Demo button...');
    await new Promise(r => setTimeout(r, 1200));
  }

  // 1. Capture Today Screen (390x844)
  console.log('Capturing Today tab (390x844)...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('#mobile-bottom-nav button'));
    if (buttons[0]) buttons[0].click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'today_390x844.png') });

  // 2. Capture Map Screen (390x844)
  console.log('Capturing Map tab (390x844)...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('#mobile-bottom-nav button'));
    if (buttons[1]) buttons[1].click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'map_390x844.png') });

  // 3. Capture Practice Screen (390x844)
  console.log('Capturing Practice tab (390x844)...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('#mobile-bottom-nav button'));
    if (buttons[2]) buttons[2].click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'practice_390x844.png') });

  // 4. Capture League Screen (390x844)
  console.log('Capturing League tab (390x844)...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('#mobile-bottom-nav button'));
    if (buttons[3]) buttons[3].click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'league_390x844.png') });

  // 5. Capture Me Screen (390x844)
  console.log('Capturing Me tab (390x844)...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('#mobile-bottom-nav button'));
    if (buttons[4]) buttons[4].click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'me_390x844.png') });

  // 6. Capture Exam Picker Sheet (390x844)
  console.log('Opening Exam Picker bottom sheet...');
  await page.evaluate(() => {
    const headerBtn = document.querySelector('header button[aria-label*="exam"]');
    if (headerBtn) headerBtn.click();
  });
  await new Promise(r => setTimeout(r, 700));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'exam_picker_390x844.png') });

  // Close Exam Picker Sheet
  await page.evaluate(() => {
    const closeBtn = document.querySelector('button[aria-label="Close sheet"]');
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // 7. Capture Search Bottom Sheet (390x844)
  console.log('Opening Global Search bottom sheet...');
  await page.evaluate(() => {
    const searchBtn = document.querySelector('header button[aria-label*="Search"]');
    if (searchBtn) searchBtn.click();
  });
  await new Promise(r => setTimeout(r, 700));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'search_sheet_390x844.png') });

  // Close Search Sheet
  await page.evaluate(() => {
    const escBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Esc'));
    if (escBtn) escBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));

  // 8. Capture Compact 360x800 Viewport
  console.log('Switching to 360x800 viewport...');
  await page.setViewport({ width: 360, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('#mobile-bottom-nav button'));
    if (buttons[0]) buttons[0].click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'today_360x800.png') });

  // 9. Capture Large 412x915 Viewport
  console.log('Switching to 412x915 viewport...');
  await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('#mobile-bottom-nav button'));
    if (buttons[4]) buttons[4].click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'me_412x915.png') });

  // 10. Capture 130% Font Scale Test
  console.log('Testing 130% Font Scale...');
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '130%';
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'today_font_130.png') });

  await browser.close();
  console.log('All Phase 3 mobile screenshots captured cleanly!');
}

main().catch(err => {
  console.error('Mobile capture error:', err);
  process.exit(1);
});
