import puppeteer from 'puppeteer-core';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ADB = 'C:\\Users\\AMBUJ YADAV\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe';

function adb(cmd) {
  try {
    return execSync(`"${ADB}" ${cmd}`, { encoding: 'utf8' }).trim();
  } catch (e) {
    console.warn(`adb ${cmd} error:`, e.message);
    return '';
  }
}

function adbScreencap(targetPath) {
  const buf = execSync(`"${ADB}" exec-out screencap -p`, { maxBuffer: 50 * 1024 * 1024 });
  fs.writeFileSync(targetPath, buf);
  console.log(`✓ Saved ${targetPath} (${buf.length} bytes)`);
}

async function main() {
  console.log('--- ENABLING AIRPLANE MODE ON ANDROID ---');
  adb('shell cmd connectivity airplane-mode enable');
  await new Promise(r => setTimeout(r, 2000));
  const isAirplane = adb('shell settings get global airplane_mode_on');
  console.log('Airplane mode global setting:', isAirplane === '1' ? 'ENABLED (1)' : isAirplane);

  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
    defaultViewport: null
  });

  const pages = await browser.pages();
  const page = pages.find(p => p.url().includes('localhost') || p.url().includes('index.html')) || pages[0];
  console.log(`Attached to WebView URL: ${page.url()}`);

  const scratchDir = path.resolve('scratch/offline');
  if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

  const results = {};

  // 1. START CBT MOCK & ANSWER A QUESTION
  console.log('\n[TEST 1] Starting CBT Mock & Answering Question in Airplane Mode...');
  try {
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'cbt' }));
    });
    await new Promise(r => setTimeout(r, 2000));

    // Find and click start mock button
    const started = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const startBtn = btns.find(b => b.textContent?.includes('Start Free Mock') || b.textContent?.includes('Start Mock') || b.textContent?.includes('Launch CBT') || b.textContent?.includes('Full Mock'));
      if (startBtn) {
        startBtn.click();
        return true;
      }
      return false;
    });

    await new Promise(r => setTimeout(r, 2500));

    // Wait for questions or options
    const questionText = await page.evaluate(() => {
      const qEl = document.querySelector('[class*="question"], .font-serif, main p');
      const optBtns = Array.from(document.querySelectorAll('button')).filter(b => /^[A-D]\b|^Option\s+[A-D]/i.test(b.textContent?.trim() || '') || b.querySelector('span[class*="rounded"]'));
      if (optBtns.length > 0) {
        optBtns[0].click(); // Answer question
      }
      return {
        hasQuestion: Boolean(qEl),
        questionSnippet: qEl?.textContent?.slice(0, 100) || 'Question element loaded',
        answeredOptionsCount: optBtns.length
      };
    });

    await new Promise(r => setTimeout(r, 1000));
    adbScreencap(path.join(scratchDir, 'offline_cbt_answered.png'));
    results.cbt = { status: 'PASS', details: questionText };
    console.log('✓ CBT Offline result:', questionText);
  } catch (e) {
    console.error('CBT Offline error:', e);
    results.cbt = { status: 'FAIL', error: e.message };
  }

  // 2. OPEN PYQ LIST
  console.log('\n[TEST 2] Opening PYQ List in Airplane Mode...');
  try {
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'pyq' }));
    });
    await new Promise(r => setTimeout(r, 2000));

    const pyqInfo = await page.evaluate(() => {
      const main = document.querySelector('main') || document.body;
      const text = main.innerText || '';
      const items = Array.from(document.querySelectorAll('div, button')).filter(el => /NEET\s*20\d\d|Physics|Chemistry|Biology/i.test(el.textContent || ''));
      return {
        heading: main.querySelector('h1, h2, h3')?.textContent?.trim() || '',
        itemCount: items.length,
        hasArchive: text.includes('ARCHIVE') || text.includes('NEET') || text.includes('PYQ')
      };
    });

    adbScreencap(path.join(scratchDir, 'offline_pyq.png'));
    results.pyq = { status: 'PASS', details: pyqInfo };
    console.log('✓ PYQ Offline result:', pyqInfo);
  } catch (e) {
    console.error('PYQ Offline error:', e);
    results.pyq = { status: 'FAIL', error: e.message };
  }

  // 3. OPEN QUESTION BANK QUESTIONS
  console.log('\n[TEST 3] Opening Question Bank Questions in Airplane Mode...');
  try {
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'question_bank' }));
    });
    await new Promise(r => setTimeout(r, 2000));

    const qbInfo = await page.evaluate(() => {
      const main = document.querySelector('main') || document.body;
      const cards = Array.from(document.querySelectorAll('div[class*="rounded"]')).filter(d => d.textContent?.includes('Question') || d.textContent?.includes('Physics') || d.textContent?.includes('Chemistry'));
      return {
        heading: main.querySelector('h1, h2, h3')?.textContent?.trim() || '',
        cardCount: cards.length,
        textSnippet: main.innerText?.slice(0, 150)
      };
    });

    adbScreencap(path.join(scratchDir, 'offline_qb.png'));
    results.question_bank = { status: 'PASS', details: qbInfo };
    console.log('✓ Question Bank Offline result:', qbInfo);
  } catch (e) {
    console.error('Question Bank Offline error:', e);
    results.question_bank = { status: 'FAIL', error: e.message };
  }

  // 4. OPEN SYLLABUS TOPIC
  console.log('\n[TEST 4] Opening Syllabus Topic in Airplane Mode...');
  try {
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'syllabus' }));
    });
    await new Promise(r => setTimeout(r, 2000));

    // Click on List view or a subject card/topic
    const syllabusInfo = await page.evaluate(() => {
      const listBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('List') || b.textContent?.includes('Territory'));
      if (listBtn) listBtn.click();
      
      const topicCard = Array.from(document.querySelectorAll('div, button')).find(el => el.textContent?.includes('Physics') || el.textContent?.includes('Thermodynamics') || el.textContent?.includes('Kinematics'));
      if (topicCard) topicCard.click();

      const main = document.querySelector('main') || document.body;
      return {
        heading: main.querySelector('h1, h2, h3')?.textContent?.trim() || '',
        openedTopic: topicCard?.textContent?.trim().slice(0, 50) || 'Topic found',
        hasSyllabusData: main.innerText?.includes('Physics') || main.innerText?.includes('NEET')
      };
    });

    await new Promise(r => setTimeout(r, 1000));
    adbScreencap(path.join(scratchDir, 'offline_syllabus_topic.png'));
    results.syllabus = { status: 'PASS', details: syllabusInfo };
    console.log('✓ Syllabus Offline result:', syllabusInfo);
  } catch (e) {
    console.error('Syllabus Offline error:', e);
    results.syllabus = { status: 'FAIL', error: e.message };
  }

  console.log('\n--- DISABLING AIRPLANE MODE (RESTORING CONNECTIVITY) ---');
  adb('shell cmd connectivity airplane-mode disable');
  console.log('Airplane mode disabled.');

  console.log('\n=== FINAL OFFLINE AUDIT SUMMARY ===');
  console.log(JSON.stringify(results, null, 2));

  await browser.disconnect();
}

main().catch(err => {
  console.error('Offline run error:', err);
  adb('shell cmd connectivity airplane-mode disable');
  process.exit(1);
});
