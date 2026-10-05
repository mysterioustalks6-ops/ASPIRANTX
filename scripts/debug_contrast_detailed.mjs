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

  console.log('=== PART A: PRECISE ELEMENT CONTRAST AUDIT (elementFromPoint & in-box sampling) ===\n');

  const targetSpecs = [
    { name: '"AAJ KI RIDE" chip', screen: 'Today', tab: 'dashboard', text: 'AAJ KI RIDE' },
    { name: '"Learn"', screen: 'Today', tab: 'dashboard', text: 'Learn' },
    { name: '"Tutor"', screen: 'Me', tab: 'more_hub', text: 'Tutor' },
  ];

  for (const theme of ['light', 'dark']) {
    console.log(`\n================== THEME: ${theme.toUpperCase()} ==================`);
    await page.evaluate((th) => {
      document.documentElement.classList.remove('light', 'dark', 'night');
      document.documentElement.classList.add(th);
      localStorage.setItem('studyride_theme', th);
    }, theme);
    await new Promise(r => setTimeout(r, 300));

    for (const spec of targetSpecs) {
      await page.evaluate((tab) => {
        window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: tab }));
      }, spec.tab);
      await new Promise(r => setTimeout(r, 600));

      // Scroll into view & find visible element using elementFromPoint at center
      const elementData = await page.evaluate((specText, th) => {
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

        // Find candidate elements
        const all = Array.from(document.querySelectorAll('*'));
        const candidates = all.filter(el => {
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
          const directText = Array.from(el.childNodes)
            .filter(n => n.nodeType === Node.TEXT_NODE)
            .map(n => n.textContent.trim())
            .join(' ');
          return directText.includes(specText) || el.textContent.trim() === specText;
        });

        let targetEl = null;
        for (const el of candidates) {
          el.scrollIntoView({ block: 'center', inline: 'center' });
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) {
            const topEl = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            if (topEl && (topEl === el || el.contains(topEl) || topEl.contains(el))) {
              targetEl = el;
              break;
            }
          }
        }
        if (!targetEl && candidates.length > 0) targetEl = candidates[0];
        if (!targetEl) return null;

        targetEl.scrollIntoView({ block: 'center' });
        const rect = targetEl.getBoundingClientRect();
        const style = window.getComputedStyle(targetEl);
        const resolvedFg = parseRgb(style.color);

        // Composited background by climbing parent tree
        const defaultBg = th === 'light' ? [248, 250, 252, 1] : [18, 22, 31, 1];
        let cur = targetEl;
        const layers = [];
        const ancestors = [];
        while (cur && cur !== document.documentElement) {
          const s = window.getComputedStyle(cur);
          const bg = parseRgb(s.backgroundColor);
          ancestors.push({
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
          tag: targetEl.tagName.toLowerCase(),
          className: targetEl.className?.toString().slice(0, 80),
          resolvedFg: `rgba(${resolvedFg[0]}, ${resolvedFg[1]}, ${resolvedFg[2]}, ${resolvedFg[3].toFixed(2)})`,
          resolvedFgRaw: resolvedFg,
          ancestors,
          compositedBg: `rgba(${composited[0]}, ${composited[1]}, ${composited[2]}, 1)`,
          compositedBgRaw: composited,
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          fontSize: style.fontSize,
          fontWeight: style.fontWeight
        };
      }, spec.text, theme);

      if (!elementData) {
        console.log(`[FAIL] Element ${spec.name} not found!`);
        continue;
      }

      // Capture screenshot and sample INSIDE the element bounding box
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

            const dpr = 2;
            const cx = Math.round((r.x + r.width / 2) * dpr);
            const cy = Math.round((r.y + r.height / 2) * dpr);

            // Sample text at center, and sample background inside bounding box (offset by 6px inside from left edge)
            const textPix = ctx.getImageData(cx, cy, 1, 1).data;
            const bgX = Math.round((r.x + Math.min(8, r.width * 0.15)) * dpr);
            const bgY = Math.round((r.y + r.height / 2) * dpr);
            const bgPix = ctx.getImageData(bgX, bgY, 1, 1).data;

            resolve({
              sampleTextRgba: `rgba(${textPix[0]}, ${textPix[1]}, ${textPix[2]}, ${(textPix[3]/255).toFixed(2)})`,
              sampleBgRgba: `rgba(${bgPix[0]}, ${bgPix[1]}, ${bgPix[2]}, ${(bgPix[3]/255).toFixed(2)})`,
              textRaw: [textPix[0], textPix[1], textPix[2]],
              bgRaw: [bgPix[0], bgPix[1], bgPix[2]],
              bgSampleCoord: { x: bgX, y: bgY }
            });
          };
          img.src = 'data:image/png;base64,' + b64;
        });
      }, screenshotBase64, elementData.rect);

      const computedRatio = calcRatio(elementData.resolvedFgRaw, elementData.compositedBgRaw);
      const sampledRatio = calcRatio([...pixelSample.textRaw, 1], [...pixelSample.bgRaw, 1]);

      console.log(`Element: ${spec.name} (${spec.screen} screen)`);
      console.log(`  - Target tag/class: <${elementData.tag} class="${elementData.className}">`);
      console.log(`  - Resolved FG RGBA: ${elementData.resolvedFg}`);
      console.log(`  - Composited BG RGBA: ${elementData.compositedBg}`);
      console.log(`  - Computed Ratio: ${computedRatio.toFixed(2)}:1 (Font: ${elementData.fontSize}, Weight: ${elementData.fontWeight})`);
      console.log(`  - Screenshot In-Box Pixel Sample:`);
      console.log(`      Text Pixel (center): ${pixelSample.sampleTextRgba}`);
      console.log(`      BG Pixel (inside box): ${pixelSample.sampleBgRgba}`);
      console.log(`      Sampled Pixel Ratio: ${sampledRatio.toFixed(2)}:1`);
    }
  }

  // PART B: COMPREHENSIVE FULL-PAGE SCROLL & SCAN OF ALL NODES ACROSS SCREENS
  console.log('\n\n=== PART B: FULL-PAGE ALL-NODE CONTRAST AUDIT (NO OFFSCREEN SKIPS) ===\n');

  const screens = [
    { name: 'Today', tab: 'dashboard' },
    { name: 'Map (Territory)', tab: 'syllabus' },
    { name: 'Practice', tab: 'practice_hub' },
    { name: 'League', tab: 'leaderboard' },
    { name: 'Me', tab: 'more_hub' },
  ];

  for (const s of screens) {
    await page.evaluate((tab) => {
      window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: tab }));
    }, s.tab);
    await new Promise(r => setTimeout(r, 600));

    // Scroll through the entire page in increments so all dynamic elements/virtual lists mount
    await page.evaluate(async () => {
      const scrollStep = 400;
      const maxScroll = Math.max(document.body.scrollHeight, 2500);
      for (let y = 0; y <= maxScroll; y += scrollStep) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 50));
      }
      window.scrollTo(0, 0);
    });
    await new Promise(r => setTimeout(r, 400));

    const auditResult = await page.evaluate(() => {
      const _canvas = document.createElement('canvas');
      _canvas.width = 1; _canvas.height = 1;
      const _ctx = _canvas.getContext('2d', { willReadFrequently: true });
      function parseRgb(str) {
        if (!str || str === 'transparent' || str === 'none') return [0, 0, 0, 0];
        try {
          _ctx.clearRect(0, 0, 1, 1);
          _ctx.fillStyle = str;
          _ctx.fillRect(0, 0, 1, 1);
          const d = _ctx.getImageData(0, 0, 1, 1).data;
          return [d[0], d[1], d[2], d[3] / 255];
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
      function sRgbToLinear(c) {
        const v = c / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      }
      function getLum(r, g, b) {
        return 0.2126 * sRgbToLinear(r) + 0.7152 * sRgbToLinear(g) + 0.0722 * sRgbToLinear(b);
      }
      function getRatio(fg, bg) {
        const l1 = getLum(fg[0], fg[1], fg[2]);
        const l2 = getLum(bg[0], bg[1], bg[2]);
        return ((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05));
      }

      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      let totalTextNodes = 0;
      let scannedNodes = 0;
      const fails = [];
      const seenParents = new Set();

      while ((node = walker.nextNode())) {
        totalTextNodes++;
        const text = node.textContent?.trim();
        if (!text || text.length < 2) continue;

        const parent = node.parentElement;
        if (!parent || seenParents.has(parent)) continue;
        seenParents.add(parent);

        const style = window.getComputedStyle(parent);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
        if (parent.closest('aside') || parent.closest('#mobile-drawer')) continue; // Skip collapsed mobile drawer

        const fg = parseRgb(style.color);
        if (fg[3] === 0) continue;

        // Composite background
        let cur = parent;
        const defaultBg = document.documentElement.classList.contains('light') ? [248, 250, 252, 1] : [18, 22, 31, 1];
        const layers = [];
        while (cur && cur !== document.documentElement) {
          const s = window.getComputedStyle(cur);
          const bg = parseRgb(s.backgroundColor);
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

        const ratio = getRatio(fg, composited);
        scannedNodes++;

        const fontSize = parseFloat(style.fontSize) || 14;
        const fontWeight = parseInt(style.fontWeight) || 400;
        const isLarge = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700);
        const threshold = isLarge ? 3.0 : 4.5;

        if (ratio < threshold) {
          fails.push({
            text: text.slice(0, 40),
            tag: parent.tagName.toLowerCase(),
            className: parent.className?.toString().slice(0, 40) || '',
            fg: `rgba(${fg[0]},${fg[1]},${fg[2]},${fg[3]})`,
            bg: `rgb(${composited[0]},${composited[1]},${composited[2]})`,
            ratio: ratio.toFixed(2),
            threshold: `${threshold}:1`,
            fontSize: `${fontSize}px (${fontWeight})`
          });
        }
      }

      return {
        totalTextNodes,
        scannedNodes,
        passCount: scannedNodes - fails.length,
        failCount: fails.length,
        fails
      };
    });

    console.log(`Screen: ${s.name}`);
    console.log(`  Scanned: ${auditResult.scannedNodes} / ${auditResult.totalTextNodes} text nodes (Passed: ${auditResult.passCount}, Failed: ${auditResult.failCount})`);
    if (auditResult.fails.length > 0) {
      console.log(`  FAIL LIST (${auditResult.fails.length} items):`);
      auditResult.fails.forEach((f, idx) => {
        console.log(`    ${idx + 1}. "${f.text}" <${f.tag} class="${f.className}"> => Ratio: ${f.ratio}:1 (Need ${f.threshold}, FG: ${f.fg}, BG: ${f.bg})`);
      });
    } else {
      console.log(`  FAIL LIST: 0 items (100% WCAG AA compliant)`);
    }
    console.log('');
  }

  await browser.close();
}

main().catch(console.error);
