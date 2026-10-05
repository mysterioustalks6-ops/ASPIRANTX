import puppeteer from 'puppeteer-core';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function main() {
  console.log('=== MULTI-SCREEN CANONICAL EXAM DAYS-LEFT EQUALITY VERIFICATION ===\n');

  const browser = await puppeteer.launch({ 
    executablePath: EDGE_PATH, 
    headless: true, 
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto('http://localhost:5173/?no_splash=1', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  // Enter guest mode
  await page.evaluate(() => {
    const b = document.querySelector('#hero-guest-btn') || Array.from(document.querySelectorAll('button')).find(x => x.textContent?.includes('Guest Demo'));
    if (b) b.click();
  });
  await page.waitForSelector('#mobile-bottom-nav', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 1000));

  const results = {};

  // 1. TODAY SCREEN
  await page.evaluate(() => {
    const btn = document.querySelectorAll('#mobile-bottom-nav button')[0];
    if (btn) btn.click();
    else window.location.hash = '#dashboard';
  });
  await new Promise(r => setTimeout(r, 800));

  const todayData = await page.evaluate(() => {
    // Find text containing 'Days Left' or 'Days Remaining' on Today screen
    const all = Array.from(document.querySelectorAll('*'));
    const pill = all.find(el => {
      const t = el.textContent?.trim() || '';
      return /^\d+\s*Days\s*(Left|Remaining)$/i.test(t);
    });
    return {
      rawText: pill ? pill.textContent.trim() : null,
      daysNumber: pill ? parseInt(pill.textContent.match(/\d+/)[0], 10) : null
    };
  });
  results['Today'] = todayData;
  console.log(`[Screen: Today] Rendered Days-Left Badge: "${todayData.rawText}" -> Parsed Value: ${todayData.daysNumber}`);

  // 2. MAP (TERRITORY VIEW)
  await page.evaluate(() => {
    const btn = document.querySelectorAll('#mobile-bottom-nav button')[1];
    if (btn) btn.click();
    else window.location.hash = '#syllabus';
  });
  await page.waitForFunction(() => {
    return Array.from(document.querySelectorAll('button')).some(b => b.textContent?.trim() === 'Territory');
  }, { timeout: 10000 });
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    const tBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Territory');
    if (tBtn) tBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  const territoryData = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    const pill = all.find(el => {
      const t = el.textContent?.trim() || '';
      return /^\d+\s*days\s*left$/i.test(t);
    });
    return {
      rawText: pill ? pill.textContent.trim() : null,
      daysNumber: pill ? parseInt(pill.textContent.match(/\d+/)[0], 10) : null
    };
  });
  results['Territory'] = territoryData;
  console.log(`[Screen: Territory] Rendered Days-Left Badge: "${territoryData.rawText}" -> Parsed Value: ${territoryData.daysNumber}`);

  // 3. MAP (LIST VIEW)
  await page.evaluate(() => {
    const listBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === 'List');
    if (listBtn) listBtn.click();
  });
  await page.waitForFunction(() => {
    return Array.from(document.querySelectorAll('*')).some(el => /\d+\s*days\s*left/i.test(el.textContent?.trim() || ''));
  }, { timeout: 10000 });
  await new Promise(r => setTimeout(r, 500));

  const listData = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    const countdownChip = all.find(el => {
      const t = el.textContent?.trim() || '';
      return /\d+\s*days\s*left/i.test(t) && el.closest('.grid');
    });
    const headerDateText = all.find(el => {
      const t = el.textContent?.trim() || '';
      return t.includes('Exam:') && t.includes('Target Finish:');
    });
    return {
      rawText: countdownChip ? countdownChip.textContent.trim().replace(/\s+/g, ' ') : null,
      headerSummary: headerDateText ? headerDateText.textContent.trim().replace(/\s+/g, ' ') : null,
      daysNumber: countdownChip ? parseInt(countdownChip.textContent.match(/\d+/)[0], 10) : null
    };
  });
  results['List'] = listData;
  console.log(`[Screen: List] Rendered Countdown Chip: "${listData.rawText}" (Header: "${listData.headerSummary}") -> Parsed Value: ${listData.daysNumber}`);

  // 4. MAP (PATH VIEW)
  await page.evaluate(() => {
    const pathBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Path');
    if (pathBtn) pathBtn.click();
  });
  await page.waitForFunction(() => {
    return Array.from(document.querySelectorAll('*')).some(el => /SECTION\s*1\s*•\s*UNIT/i.test(el.textContent || ''));
  }, { timeout: 10000 });
  await new Promise(r => setTimeout(r, 600));

  const pathData = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    const pill = all.find(el => {
      const t = el.textContent?.trim() || '';
      return /^\d+\s*days\s*left$/i.test(t);
    });
    return {
      rawText: pill ? pill.textContent.trim() : null,
      daysNumber: pill ? parseInt(pill.textContent.match(/\d+/)[0], 10) : null
    };
  });
  results['Path'] = pathData;
  console.log(`[Screen: Path] Rendered Days-Left Badge: "${pathData.rawText}" -> Parsed Value: ${pathData.daysNumber}`);

  console.log('\n--- EQUALITY ASSERTIONS ---');
  const values = Object.entries(results).map(([screen, data]) => ({ screen, days: data.daysNumber }));
  const targetVal = values[0].days;
  let allEqual = true;

  for (const v of values) {
    const eq = v.days === targetVal && typeof v.days === 'number' && v.days > 0;
    console.log(`  Assertion [${v.screen} === Canonical ${targetVal}d]: ${eq ? 'PASSED' : 'FAILED'} (Got: ${v.days})`);
    if (!eq) allEqual = false;
  }

  console.log(`\nOverall Screen Equality Status: ${allEqual ? 'ALL 4 SCREENS MATCH CANONICAL EXAM COUNTDOWN' : 'MISMATCH DETECTED'}`);

  await browser.close();
  if (!allEqual) process.exit(1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
