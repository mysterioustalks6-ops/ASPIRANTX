import puppeteer from 'puppeteer-core';
import fs from 'fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

function sRgbToLinear(c) {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
function getLuminance(r, g, b) {
  return 0.2126 * sRgbToLinear(r) + 0.7152 * sRgbToLinear(g) + 0.0722 * sRgbToLinear(b);
}
function calcRatio(fg, bg) {
  const l1 = getLuminance(fg[0], fg[1], fg[2]);
  const l2 = getLuminance(bg[0], bg[1], bg[2]);
  return ((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05));
}

async function main() {
  const browser = await puppeteer.launch({ executablePath: EDGE_PATH, headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto('http://localhost:5173/?no_splash=1', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  // Enter guest mode if hero guest button exists
  await page.evaluate(() => {
    const b = document.querySelector('#hero-guest-btn') || Array.from(document.querySelectorAll('button')).find(x => x.textContent?.includes('Guest Demo'));
    if (b) b.click();
  });
  await page.waitForSelector('#mobile-bottom-nav', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 1000));

  const targetSpecs = [
    { name: '"AAJ KI RIDE" chip', screen: 'Today', tab: 'dashboard', text: 'AAJ KI RIDE' },
    { name: '"Learn"', screen: 'Today', tab: 'dashboard', text: 'Learn' },
    { name: '"Tutor"', screen: 'Me', tab: 'more_hub', text: 'Tutor' },
  ];

  console.log('=== PART A: CONTRAST DEBUG FOR 3 TARGET ELEMENTS ===\n');

  for (const theme of ['light', 'dark']) {
    console.log(`--- THEME: ${theme.toUpperCase()} ---`);
    await page.evaluate((th) => {
      document.documentElement.classList.remove('light', 'dark', 'night');
      document.documentElement.classList.add(th);
      localStorage.setItem('studyride_theme', th);
    }, theme);
    await new Promise(r => setTimeout(r, 400));

    for (const spec of targetSpecs) {
      // Navigate to screen
      await page.evaluate((tab) => {
        window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: tab }));
      }, spec.tab);
      await new Promise(r => setTimeout(r, 800));

      const debugInfo = await page.evaluate((specText, th) => {
        const _canvas = document.createElement('canvas');
        _canvas.width = 1; _canvas.height = 1;
        const _ctx = _canvas.getContext('2d', { willReadFrequently: true });
        function parseRgb(str) {
          if (!str || str === 'transparent' || str === 'none') return [0, 0, 0, 0];
          try {
            _ctx.clearRect(0, 0, 1, 1);
            _ctx.fillStyle = str;
            _ctx.fillRect(0, 0, 1, 1);
            const data = _ctx.getImageData(0, 0, 1, 1).data;
            return [data[0], data[1], data[2], data[3] / 255];
          } catch(e) { return [0, 0, 0, 1]; }
        }
        function blendOver(fg, bg) {
          const a = fg[3];
          return [
            Math.round(fg[0] * a + bg[0] * (1 - a)),
            Math.round(fg[1] * a + bg[1] * (1 - a)),
            Math.round(fg[2] * a + bg[2] * (1 - a)),
            1
          ];
        }

        const elements = Array.from(document.querySelectorAll('*')).filter(el => {
          const directText = Array.from(el.childNodes)
            .filter(n => n.nodeType === Node.TEXT_NODE)
            .map(n => n.textContent.trim())
            .join(' ');
          return directText.includes(specText) || el.textContent.trim() === specText;
        });

        // Pick the most specific element (smallest bounding rect or exact match, ignoring hidden aside)
        let el = elements.find(e => e.textContent.trim() === specText && !e.closest('aside')) || elements[0];
        if (!el) return null;

        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const resolvedFg = parseRgb(style.color);

        // Ancestors bg
        const ancestorBgs = [];
        let cur = el;
        const defaultBg = th === 'light' ? [248, 250, 252, 1] : [18, 22, 31, 1]; // #f8fafc vs #12161f
        let layers = [];
        while (cur && cur !== document.documentElement) {
          const s = window.getComputedStyle(cur);
          const bg = parseRgb(s.backgroundColor);
          ancestorBgs.push({
            tag: cur.tagName.toLowerCase(),
            class: cur.className?.toString().slice(0, 50),
            bgRgba: `rgba(${bg[0]}, ${bg[1]}, ${bg[2]}, ${bg[3].toFixed(2)})`
          });
          if (bg[3] > 0) {
            layers.unshift(bg);
            if (bg[3] === 1) break;
          }
          cur = cur.parentElement;
        }

        let composited = defaultBg;
        for (const layer of layers) {
          composited = blendOver(layer, composited);
        }

        return {
          resolvedFg: `rgba(${resolvedFg[0]}, ${resolvedFg[1]}, ${resolvedFg[2]}, ${resolvedFg[3].toFixed(2)})`,
          resolvedFgRaw: resolvedFg,
          ancestorBgs,
          compositedBg: `rgba(${composited[0]}, ${composited[1]}, ${composited[2]}, 1)`,
          compositedBgRaw: composited,
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          fontSize: style.fontSize,
          fontWeight: style.fontWeight
        };
      }, spec.text, theme);

      if (!debugInfo) {
        console.log(`Element ${spec.name} not found!`);
        continue;
      }

      const ratio = calcRatio(debugInfo.resolvedFgRaw, debugInfo.compositedBgRaw);

      // Now sample real screenshot pixels at rect
      const screenshotBase64 = await page.screenshot({ encoding: 'base64' });
      const pixelSample = await page.evaluate((b64, r) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            // devicePixelRatio is 2 in our viewport
            const dpr = 2;
            const cx = Math.round((r.x + r.width / 2) * dpr);
            const cy = Math.round((r.y + r.height / 2) * dpr);

            // Sample center text pixel and corner bg pixel
            const textPix = ctx.getImageData(cx, cy, 1, 1).data;
            const bgPix = ctx.getImageData(Math.round((r.x + 2) * dpr), Math.round((r.y + 2) * dpr), 1, 1).data;

            resolve({
              sampleTextRgba: `rgba(${textPix[0]}, ${textPix[1]}, ${textPix[2]}, ${(textPix[3]/255).toFixed(2)})`,
              sampleBgRgba: `rgba(${bgPix[0]}, ${bgPix[1]}, ${bgPix[2]}, ${(bgPix[3]/255).toFixed(2)})`,
              textRaw: [textPix[0], textPix[1], textPix[2]],
              bgRaw: [bgPix[0], bgPix[1], bgPix[2]]
            });
          };
          img.src = 'data:image/png;base64,' + b64;
        });
      }, screenshotBase64, debugInfo.rect);

      const sampledRatio = calcRatio([...pixelSample.textRaw, 1], [...pixelSample.bgRaw, 1]);

      console.log(`\nElement: ${spec.name} (${spec.screen} screen)`);
      console.log(`  - Resolved FG RGBA: ${debugInfo.resolvedFg}`);
      console.log(`  - Ancestor BGs:`);
      debugInfo.ancestorBgs.forEach(a => {
        console.log(`      <${a.tag} class="${a.class}"> -> ${a.bgRgba}`);
      });
      console.log(`  - Composited BG RGBA: ${debugInfo.compositedBg}`);
      console.log(`  - Computed Ratio: ${ratio.toFixed(2)}:1 (Font: ${debugInfo.fontSize}, Weight: ${debugInfo.fontWeight})`);
      console.log(`  - Screenshot Pixel-Sample:`);
      console.log(`      Text Pixel (center): ${pixelSample.sampleTextRgba}`);
      console.log(`      BG Pixel (corner):   ${pixelSample.sampleBgRgba}`);
      console.log(`      Sampled Pixel Ratio: ${sampledRatio.toFixed(2)}:1`);
    }
  }

  // PART B: Screen node counts and skipped node breakdown
  console.log('\n=== PART B: TOTAL NODE COUNT & SKIPPED BREAKDOWN PER SCREEN ===\n');
  const screens = [
    { name: 'Today', tab: 'dashboard' },
    { name: 'Map', tab: 'syllabus' },
    { name: 'Practice', tab: 'practice_hub' },
    { name: 'League', tab: 'leaderboard' },
    { name: 'Me', tab: 'more_hub' },
  ];

  for (const s of screens) {
    await page.evaluate((tab) => {
      window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: tab }));
    }, s.tab);
    await new Promise(r => setTimeout(r, 800));

    const stats = await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      let totalTextNodes = 0;
      let scanned = 0;
      let skippedEmpty = 0;
      let skippedHidden = 0;
      let skippedZeroSize = 0;
      let skippedGradientOrComplex = 0;
      const seen = new Set();

      while ((node = walker.nextNode())) {
        totalTextNodes++;
        const text = node.textContent?.trim();
        if (!text || text.length < 2) {
          skippedEmpty++;
          continue;
        }
        const parent = node.parentElement;
        if (!parent || seen.has(parent)) continue;
        seen.add(parent);

        const rect = parent.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0 || rect.bottom < 0 || rect.top > window.innerHeight * 2) {
          skippedZeroSize++;
          continue;
        }
        const style = window.getComputedStyle(parent);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
          skippedHidden++;
          continue;
        }
        if (style.backgroundImage && style.backgroundImage.includes('gradient')) {
          skippedGradientOrComplex++;
        }
        scanned++;
      }
      return {
        totalElements: document.querySelectorAll('*').length,
        totalTextNodes,
        scannedNodes: scanned,
        skippedEmpty,
        skippedZeroSize,
        skippedHidden,
        skippedGradientOrComplex
      };
    });

    console.log(`Screen: ${s.name}`);
    console.log(`  Total DOM elements: ${stats.totalElements}`);
    console.log(`  Total text nodes:   ${stats.totalTextNodes}`);
    console.log(`  Scanned for a11y:   ${stats.scannedNodes}`);
    console.log(`  Skipped empty/short text (<2 chars): ${stats.skippedEmpty}`);
    console.log(`  Skipped offscreen / zero-size:       ${stats.skippedZeroSize}`);
    console.log(`  Skipped display:none / hidden:       ${stats.skippedHidden}`);
    console.log(`  With gradient background:            ${stats.skippedGradientOrComplex}`);
  }

  await browser.close();
}

main().catch(console.error);
