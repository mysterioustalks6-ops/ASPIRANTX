import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const BASE_URL = 'http://localhost:3000';
const OUTPUT_DIR = 'C:\\Users\\AMBUJ YADAV\\.gemini\\antigravity-ide\\brain\\21fde404-24d4-46b1-a805-5f1fcdef739d\\screenshots';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('============================================================');
console.log('📸 CAPTURING 15 BEST FEATURES OF ASPIRANTX IN HIGH RESOLUTION');
console.log('============================================================\n');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1440,900',
      '--force-device-scale-factor=1.5'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });

  // -------------------------------------------------------------
  // 1. LANDING PAGE & APP HERO
  // -------------------------------------------------------------
  console.log('[1/15] Capturing Landing Page...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForSelector('#landing-page-root', { timeout: 15000 });
  await sleep(1200);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_landing_page.png'), fullPage: false });
  console.log('✓ Saved: 01_landing_page.png');

  // -------------------------------------------------------------
  // SIGN IN TO APP AS AMBUJ YADAV
  // -------------------------------------------------------------
  console.log('Authenticating for in-app features...');
  const signinBtn = await page.$('#landing-signin-btn');
  if (signinBtn) {
    await signinBtn.click();
    await sleep(800);
    await page.type('input[type="email"]', 'ambujyadav0010@gmail.com');
    await page.type('input[type="password"]', 'AdminPass123!');
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) await submitBtn.click();
    await sleep(2000);
  }

  // Dismiss PWA and tour overlays
  await page.evaluate(() => {
    localStorage.setItem('aspirantx_pwa_install_dismissed', 'true');
    localStorage.setItem('aspirantx_onboarding_dismissed', 'true');
    localStorage.setItem('aspirantx_global_selected_exam', 'UPSC_CSE');
  });

  // -------------------------------------------------------------
  // 2. STUDENT DASHBOARD & PERFORMANCE METER
  // -------------------------------------------------------------
  console.log('[2/15] Capturing Student Dashboard...');
  await page.evaluate(() => { window.location.hash = 'dashboard'; });
  await sleep(2000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_student_dashboard.png'), fullPage: false });
  console.log('✓ Saved: 02_student_dashboard.png');

  // -------------------------------------------------------------
  // 3. SYLLABUS TRACKER & HIERARCHY TREE
  // -------------------------------------------------------------
  console.log('[3/15] Capturing Syllabus Tracker...');
  await page.evaluate(() => { window.location.hash = 'syllabus'; });
  await sleep(2000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_syllabus_tracker.png'), fullPage: false });
  console.log('✓ Saved: 03_syllabus_tracker.png');

  // -------------------------------------------------------------
  // 4. CBT MOCK EXAM SIMULATOR
  // -------------------------------------------------------------
  console.log('[4/15] Capturing CBT Mock Exam Simulator...');
  await page.evaluate(() => { window.location.hash = 'cbt'; });
  await sleep(2500);

  // Click start live CBT exam or custom test to enter simulated room
  await page.evaluate(() => {
    const startBtn = Array.from(document.querySelectorAll('button')).find(b => 
      b.innerText.includes('Start Live CBT Exam') || 
      b.innerText.includes('Build Custom Test') || 
      b.innerText.includes('Generate & Start') ||
      b.innerText.includes('Attempt')
    );
    if (startBtn) startBtn.click();
  });
  await sleep(2500);

  // If live exam workspace opened, select an option to show real interactive exam
  const opt0 = await page.$('#cbt-option-0');
  if (opt0) {
    await opt0.click();
    await sleep(400);
  }
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04_cbt_exam_simulator.png'), fullPage: false });
  console.log('✓ Saved: 04_cbt_exam_simulator.png');

  // Exit exam if currently inside one
  await page.evaluate(() => {
    const exitBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Exit Exam') || b.innerText.includes('Exit'));
    if (exitBtn) exitBtn.click();
  });
  await sleep(1000);

  // -------------------------------------------------------------
  // 5. PREVIOUS YEAR QUESTIONS (PYQ) ENGINE
  // -------------------------------------------------------------
  console.log('[5/15] Capturing PYQ Archive Engine...');
  await page.evaluate(() => { window.location.hash = 'pyq'; });
  await sleep(2000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '05_pyq_archive_engine.png'), fullPage: false });
  console.log('✓ Saved: 05_pyq_archive_engine.png');

  // -------------------------------------------------------------
  // 6. QUESTION BANK ENGINE & ADAPTIVE PRACTICE
  // -------------------------------------------------------------
  console.log('[6/15] Capturing Question Bank Practice...');
  await page.evaluate(() => { window.location.hash = 'question_bank'; });
  await sleep(2000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '06_question_bank_practice.png'), fullPage: false });
  console.log('✓ Saved: 06_question_bank_practice.png');

  // -------------------------------------------------------------
  // 7. AI STUDY MENTOR & CHAT
  // -------------------------------------------------------------
  console.log('[7/15] Capturing AI Study Mentor...');
  await page.evaluate(() => { window.location.hash = 'chat'; });
  await sleep(2000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '07_ai_study_mentor.png'), fullPage: false });
  console.log('✓ Saved: 07_ai_study_mentor.png');

  // -------------------------------------------------------------
  // 8. POMODORO FOCUS TIMER
  // -------------------------------------------------------------
  console.log('[8/15] Capturing Pomodoro Focus Timer...');
  await page.evaluate(() => { window.location.hash = 'timer'; });
  await sleep(2000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '08_pomodoro_focus_timer.png'), fullPage: false });
  console.log('✓ Saved: 08_pomodoro_focus_timer.png');

  // -------------------------------------------------------------
  // 9. FOREST STUDY GARDEN & HABIT TRACKER
  // -------------------------------------------------------------
  console.log('[9/15] Capturing Forest Study Garden...');
  await page.evaluate(() => {
    const forestTabBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Focus Forest') || b.innerText.includes('Forest'));
    if (forestTabBtn) forestTabBtn.click();
  });
  await sleep(1500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '09_forest_study_garden.png'), fullPage: false });
  console.log('✓ Saved: 09_forest_study_garden.png');

  // -------------------------------------------------------------
  // 10. SPACED-REPETITION FLASHCARD ENGINE
  // -------------------------------------------------------------
  console.log('[10/15] Capturing Spaced-Repetition Flashcards...');
  await page.evaluate(() => { window.location.hash = 'flashcards'; });
  await sleep(2000);
  const flashcard = await page.$('.select-none.cursor-pointer');
  if (flashcard) {
    await flashcard.click();
    await sleep(600);
  }
  await page.screenshot({ path: path.join(OUTPUT_DIR, '10_flashcard_engine.png'), fullPage: false });
  console.log('✓ Saved: 10_flashcard_engine.png');

  // -------------------------------------------------------------
  // 11. AI WEAKNESS DETECTOR & READINESS RADAR
  // -------------------------------------------------------------
  console.log('[11/15] Capturing Weakness Detector...');
  await page.evaluate(() => { window.location.hash = 'weakness'; });
  await sleep(2000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '11_weakness_detector.png'), fullPage: false });
  console.log('✓ Saved: 11_weakness_detector.png');

  // -------------------------------------------------------------
  // 12. COMMUNITY PLATFORM & PEER STUDY
  // -------------------------------------------------------------
  console.log('[12/15] Capturing Community Platform...');
  await page.evaluate(() => { window.location.hash = 'community'; });
  await sleep(2000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '12_community_platform.png'), fullPage: false });
  console.log('✓ Saved: 12_community_platform.png');

  // -------------------------------------------------------------
  // 13. STATE & NATIONAL LEADERBOARD
  // -------------------------------------------------------------
  console.log('[13/15] Capturing Leaderboard Rankings...');
  await page.evaluate(() => { window.location.hash = 'leaderboard'; });
  await sleep(2000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '13_leaderboard_rankings.png'), fullPage: false });
  console.log('✓ Saved: 13_leaderboard_rankings.png');

  // -------------------------------------------------------------
  // 14. DIGITAL LIBRARY & NOTES
  // -------------------------------------------------------------
  console.log('[14/15] Capturing Digital Resource Library...');
  await page.evaluate(() => { window.location.hash = 'library'; });
  await sleep(2000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '14_digital_library.png'), fullPage: false });
  console.log('✓ Saved: 14_digital_library.png');

  // -------------------------------------------------------------
  // 15. DYNAMIC STREAK WALLPAPER GENERATOR
  // -------------------------------------------------------------
  console.log('[15/15] Capturing Streak Live Wallpaper Generator...');
  await page.evaluate(() => { window.location.hash = 'wallpaper'; });
  await sleep(2000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '15_streak_wallpaper_widget.png'), fullPage: false });
  console.log('✓ Saved: 15_streak_wallpaper_widget.png');

  await browser.close();
  console.log('\n🎉 ALL 15 FEATURE SCREENSHOTS CAPTURED SUCCESSFULLY!');
}

capture().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
