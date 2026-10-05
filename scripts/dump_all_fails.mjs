import puppeteer from 'puppeteer-core';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function main() {
  const browser = await puppeteer.launch({ executablePath: EDGE_PATH, headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto('http://localhost:5173/?no_splash=1', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    const b = document.querySelector('#hero-guest-btn') || Array.from(document.querySelectorAll('button')).find(x => x.textContent?.includes('Guest Demo'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  for (const screenName of ['Today', 'Map', 'Practice', 'League', 'Me', 'Exam Sheet', 'Search Sheet']) {
    for (const theme of ['dark', 'light']) {
      await page.evaluate((th) => {
        document.documentElement.classList.remove('light', 'dark', 'night');
        document.documentElement.classList.add(th);
        localStorage.setItem('studyride_theme', th);
      }, theme);
      await new Promise(r => setTimeout(r, 300));

      // Navigate to screen
      if (screenName === 'Today') {
        await page.evaluate(() => document.querySelectorAll('#mobile-bottom-nav button')[0]?.click());
      } else if (screenName === 'Map') {
        await page.evaluate(() => document.querySelectorAll('#mobile-bottom-nav button')[1]?.click());
      } else if (screenName === 'Practice') {
        await page.evaluate(() => document.querySelectorAll('#mobile-bottom-nav button')[2]?.click());
      } else if (screenName === 'League') {
        await page.evaluate(() => document.querySelectorAll('#mobile-bottom-nav button')[3]?.click());
      } else if (screenName === 'Me') {
        await page.evaluate(() => document.querySelectorAll('#mobile-bottom-nav button')[4]?.click());
      } else if (screenName === 'Exam Sheet') {
        await page.evaluate(() => document.querySelector('header button:first-child')?.click());
      } else if (screenName === 'Search Sheet') {
        await page.evaluate(() => {
          document.querySelector('button[aria-label="Close sheet"]')?.click();
          window.dispatchEvent(new CustomEvent('studyride:open-search'));
        });
      }
      await new Promise(r => setTimeout(r, 600));

      const report = await page.evaluate((th) => {
        function sRgbToLinear(c) {
          const v = c / 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        }
        function getLuminance(r, g, b) {
          return 0.2126 * sRgbToLinear(r) + 0.7152 * sRgbToLinear(g) + 0.0722 * sRgbToLinear(b);
        }
        const _colorCanvas = document.createElement('canvas');
        _colorCanvas.width = 1; _colorCanvas.height = 1;
        const _colorCtx = _colorCanvas.getContext('2d', { willReadFrequently: true });
        function parseRgb(str) {
          if (!str || str === 'transparent' || str === 'none') return [0, 0, 0, 0];
          try {
            _colorCtx.clearRect(0, 0, 1, 1);
            _colorCtx.fillStyle = str;
            _colorCtx.fillRect(0, 0, 1, 1);
            const data = _colorCtx.getImageData(0, 0, 1, 1).data;
            return [data[0], data[1], data[2], data[3] / 255];
          } catch (e) { return [0, 0, 0, 1]; }
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
          const defaultBg = th === 'light' ? [248, 250, 252, 1] : [18, 22, 31, 1];
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

        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node;
        const fails = [];
        const seen = new Set();
        while ((node = walker.nextNode())) {
          const text = node.textContent?.trim();
          if (!text || text.length < 2) continue;
          const parent = node.parentElement;
          if (!parent || seen.has(parent)) continue;
          const rect = parent.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0 || rect.bottom < 0 || rect.top > window.innerHeight * 2) continue;
          const style = window.getComputedStyle(parent);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
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

          if (isSizeFail || isRatioFail) {
            fails.push({
              text: text.slice(0, 40),
              selector: parent.tagName.toLowerCase() + (parent.className ? '.' + Array.from(parent.classList).slice(0, 2).join('.') : ''),
              fontSize: Math.round(fontSize),
              ratio: Math.round(ratio * 100) / 100,
              minRequired,
              isSizeFail,
              isRatioFail,
              fg: style.color,
              bg: `rgb(${bgRgba[0]},${bgRgba[1]},${bgRgba[2]})`
            });
          }
        }
        return fails;
      }, theme);

      if (report.length > 0) {
        console.log(`\n=== ${screenName} (${theme.toUpperCase()}) FAILS: ${report.length} ===`);
        report.forEach(r => {
          console.log(`  [FAIL] "${r.text}" | fontSize: ${r.fontSize}px | ratio: ${r.ratio}:1 (min ${r.minRequired}:1) | ${r.isSizeFail ? 'SIZE_FAIL' : ''} ${r.isRatioFail ? 'RATIO_FAIL' : ''} | fg: ${r.fg} | bg: ${r.bg}`);
        });
      } else {
        console.log(`\n=== ${screenName} (${theme.toUpperCase()}): ALL PASS ===`);
      }

      if (screenName === 'Search Sheet') {
        await page.evaluate(() => document.querySelector('button[aria-label="Close search sheet"]')?.click());
      } else if (screenName === 'Exam Sheet') {
        await page.evaluate(() => document.querySelector('button[aria-label="Close sheet"]')?.click());
      }
    }
  }

  await browser.close();
}

main().catch(console.error);
