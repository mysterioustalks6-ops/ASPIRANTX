import puppeteer from 'puppeteer-core';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

function parseRgba(colorStr) {
  if (!colorStr) return [0, 0, 0, 1];
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return [0, 0, 0, 1];
  return [
    parseInt(match[1], 10),
    parseInt(match[2], 10),
    parseInt(match[3], 10),
    match[4] !== undefined ? parseFloat(match[4]) : 1
  ];
}

async function runDomAuditOnPage(page, screenName, theme) {
  const elementsAudit = await page.evaluate((themeName) => {
    function sRgbToLinear(c) {
      const v = c / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    }

    function getLuminance(r, g, b) {
      return 0.2126 * sRgbToLinear(r) + 0.7152 * sRgbToLinear(g) + 0.0722 * sRgbToLinear(b);
    }

    const _colorCanvas = document.createElement('canvas');
    _colorCanvas.width = 1;
    _colorCanvas.height = 1;
    const _colorCtx = _colorCanvas.getContext('2d', { willReadFrequently: true });

    function parseRgb(str) {
      if (!str || str === 'transparent' || str === 'none') return [0, 0, 0, 0];
      try {
        _colorCtx.clearRect(0, 0, 1, 1);
        _colorCtx.fillStyle = str;
        _colorCtx.fillRect(0, 0, 1, 1);
        const data = _colorCtx.getImageData(0, 0, 1, 1).data;
        return [data[0], data[1], data[2], data[3] / 255];
      } catch (e) {
        return [0, 0, 0, 1];
      }
    }

    function blendOver(fgRgba, bgRgba) {
      const alpha = fgRgba[3];
      return [
        Math.round(fgRgba[0] * alpha + bgRgba[0] * (1 - alpha)),
        Math.round(fgRgba[1] * alpha + bgRgba[1] * (1 - alpha)),
        Math.round(fgRgba[2] * alpha + bgRgba[2] * (1 - alpha)),
        1
      ];
    }

    function getEffectiveBg(el) {
      const defaultBg = themeName === 'light' ? [248, 250, 252, 1] : [18, 22, 31, 1];
      let cur = el;
      let layers = [];

      while (cur && cur !== document.documentElement) {
        const style = window.getComputedStyle(cur);
        const bg = parseRgb(style.backgroundColor);
        if (bg[3] > 0) {
          layers.unshift(bg);
          if (bg[3] === 1) break;
        }
        cur = cur.parentElement;
      }

      let result = defaultBg;
      for (const layer of layers) {
        result = blendOver(layer, result);
      }
      return result;
    }

    function getSelector(el) {
      if (el.id) return `#${el.id}`;
      let tag = el.tagName.toLowerCase();
      let cls = Array.from(el.classList || []).filter(c => !c.includes(':') && !c.includes('/') && !c.includes('[')).slice(0, 2).join('.');
      if (cls) tag += `.${cls}`;
      return tag;
    }

    const results = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    const seen = new Set();

    while ((node = walker.nextNode())) {
      const text = node.textContent?.trim();
      if (!text || text.length < 2) continue;

      const parent = node.parentElement;
      if (!parent || seen.has(parent)) continue;

      const rect = parent.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0 || rect.bottom < 0 || rect.top > window.innerHeight * 2) {
        continue;
      }

      const style = window.getComputedStyle(parent);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        continue;
      }

      seen.add(parent);

      const fgRgba = parseRgb(style.color);
      const bgRgba = getEffectiveBg(parent);
      const effectiveFg = fgRgba[3] < 1 ? blendOver(fgRgba, bgRgba) : fgRgba;

      const l1 = getLuminance(effectiveFg[0], effectiveFg[1], effectiveFg[2]);
      const l2 = getLuminance(bgRgba[0], bgRgba[1], bgRgba[2]);
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

      const fontSize = parseFloat(style.fontSize) || 14;
      const fontWeight = parseInt(style.fontWeight, 10) || 400;
      const isLarge = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700);
      const minRequired = isLarge ? 3.0 : 4.5;

      const isSizeFail = fontSize < 12;
      const isRatioFail = ratio < minRequired;
      const passed = !isSizeFail && !isRatioFail;

      results.push({
        selector: getSelector(parent),
        text: text.slice(0, 32),
        fontSize: Math.round(fontSize),
        ratio: Math.round(ratio * 100) / 100,
        minRequired,
        passed,
        isSizeFail,
        fgHex: `rgb(${effectiveFg[0]},${effectiveFg[1]},${effectiveFg[2]})`,
        bgHex: `rgb(${bgRgba[0]},${bgRgba[1]},${bgRgba[2]})`
      });
    }

    return results;
  }, theme);

  return elementsAudit;
}

async function main() {
  console.log('=== RUNNING REAL DOM WCAG CONTRAST & TYPOGRAPHY AUDIT ===');
  console.log('Scanning all rendered text nodes vs their computed effective backgrounds\n');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  await page.goto('http://localhost:5173/?no_splash=1', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1200));

  await page.evaluate(() => {
    const b = document.querySelector('#hero-guest-btn') || Array.from(document.querySelectorAll('button')).find(x => x.textContent?.includes('Guest Demo'));
    if (b) b.click();
  });

  await page.waitForSelector('#mobile-bottom-nav', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 1000));

  const setTheme = async (th) => {
    await page.evaluate((theme) => {
      document.documentElement.classList.remove('light', 'dark', 'night');
      document.documentElement.classList.add(theme);
      localStorage.setItem('studyride_theme', theme);
    }, th);
    await new Promise(r => setTimeout(r, 400));
  };

  const navTab = async (idx) => {
    await page.evaluate((i) => {
      const btn = document.querySelectorAll('#mobile-bottom-nav button')[i];
      if (btn) btn.click();
    }, idx);
    await new Promise(r => setTimeout(r, 600));
  };

  const openExamSheet = async () => {
    await page.evaluate(() => {
      const headerBtn = document.querySelector('header button:first-child');
      if (headerBtn) headerBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));
  };

  const closeExamSheet = async () => {
    await page.evaluate(() => {
      const closeBtn = document.querySelector('button[aria-label="Close sheet"]');
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));
  };

  const openSearchSheet = async () => {
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('studyride:open-search'));
    });
    await new Promise(r => setTimeout(r, 600));
  };

  const closeSearchSheet = async () => {
    await page.evaluate(() => {
      const closeBtn = document.querySelector('button[aria-label="Close search sheet"]');
      if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));
  };

  const screens = [
    { name: 'Today', action: () => navTab(0) },
    { name: 'Map', action: () => navTab(1) },
    { name: 'Practice', action: () => navTab(2) },
    { name: 'League', action: () => navTab(3) },
    { name: 'Me', action: () => navTab(4) },
    { name: 'Exam Sheet', action: async () => { await openExamSheet(); } },
    { name: 'Search Sheet', action: async () => { await closeExamSheet(); await openSearchSheet(); } }
  ];

  const allSummary = [];

  for (const theme of ['dark', 'light']) {
    console.log(`\n===============================================================`);
    console.log(`              THEME: ${theme.toUpperCase()}`);
    console.log(`===============================================================`);
    await setTheme(theme);

    for (const screen of screens) {
      await screen.action();
      await new Promise(r => setTimeout(r, 500));

      const audits = await runDomAuditOnPage(page, screen.name, theme);
      const passed = audits.filter(a => a.passed);
      const failed = audits.filter(a => !a.passed);

      console.log(`\nScreen: ${screen.name} (${theme.toUpperCase()}) — ${audits.length} text elements audited (${passed.length} PASS, ${failed.length} FAIL)`);

      // Print individual node pass/fail items
      audits.slice(0, 15).forEach((item) => {
        const status = item.passed ? 'PASS' : 'FAIL';
        const failReason = item.isSizeFail ? ` (<12px: ${item.fontSize}px)` : '';
        console.log(`  [${status}] ${item.selector.padEnd(28)} | "${item.text.padEnd(20)}" | Ratio: ${item.ratio.toFixed(2)}:1 (Min: ${item.minRequired}:1)${failReason}`);
      });

      if (screen.name === 'Search Sheet') {
        await closeSearchSheet();
      } else if (screen.name === 'Exam Sheet') {
        await closeExamSheet();
      }

      allSummary.push({ theme, screen: screen.name, total: audits.length, pass: passed.length, fail: failed.length, failures: failed });
    }
  }

  await browser.close();

  console.log('\n===============================================================');
  console.log('                 FINAL DOM AUDIT SUMMARY');
  console.log('===============================================================');
  let grandTotal = 0;
  let grandPass = 0;
  let grandFail = 0;
  for (const row of allSummary) {
    grandTotal += row.total;
    grandPass += row.pass;
    grandFail += row.fail;
    console.log(`Theme: ${row.theme.padEnd(6)} | Screen: ${row.screen.padEnd(14)} | Scanned: ${String(row.total).padStart(3)} | PASS: ${String(row.pass).padStart(3)} | FAIL: ${row.fail}`);
  }
  console.log('---------------------------------------------------------------');
  console.log(`GRAND TOTAL: ${grandTotal} text nodes scanned | PASS: ${grandPass} | FAIL: ${grandFail}`);
  console.log('===============================================================\n');
}

main().catch(err => {
  console.error('Audit runner error:', err);
  process.exit(1);
});
