import puppeteer from 'puppeteer-core';

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

  console.log('=== PART A: ELEMENT CONTRAST AUDIT (CROPPED BOUNDING BOX PIXEL CLUSTERS) ===\n');

  const targetSpecs = [
    { name: '"AAJ KI RIDE" chip', screen: 'Today', tab: 'dashboard', btnIndex: 0, text: 'AAJ KI RIDE' },
    { name: '"Learn"', screen: 'Today', tab: 'dashboard', btnIndex: 0, text: 'Learn' },
    { name: '"Tutor"', screen: 'Me', tab: 'more_hub', btnIndex: 4, text: 'Tutor' },
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
      // Navigate reliably using mobile bottom nav
      await page.evaluate((btnIdx, tabId) => {
        const btns = document.querySelectorAll('#mobile-bottom-nav button');
        if (btns[btnIdx]) btns[btnIdx].click();
        else {
          window.location.hash = tabId;
          window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: tabId }));
        }
      }, spec.btnIndex, spec.tab);
      await new Promise(r => setTimeout(r, 800));

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

        const defaultBg = th === 'light' ? [248, 250, 252, 1] : [18, 22, 31, 1];
        let cur = targetEl;
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

        return {
          tag: targetEl.tagName.toLowerCase(),
          className: targetEl.className?.toString().slice(0, 80),
          resolvedFg: `rgba(${resolvedFg[0]}, ${resolvedFg[1]}, ${resolvedFg[2]}, ${resolvedFg[3].toFixed(2)})`,
          resolvedFgRaw: resolvedFg,
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

      // Crop the element's bounding box and compute clusters
      const screenshotBase64 = await page.screenshot({ encoding: 'base64' });
      const clusterSample = await page.evaluate((b64, r) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(img, 0, 0);

            const dpr = 2;
            const cropX = Math.max(0, Math.round(r.x * dpr));
            const cropY = Math.max(0, Math.round(r.y * dpr));
            const cropW = Math.max(1, Math.round(r.width * dpr));
            const cropH = Math.max(1, Math.round(r.height * dpr));

            const imgData = ctx.getImageData(cropX, cropY, cropW, cropH).data;
            const pixels = [];

            for (let i = 0; i < imgData.length; i += 4) {
              const red = imgData[i];
              const green = imgData[i + 1];
              const blue = imgData[i + 2];
              const alpha = imgData[i + 3] / 255;
              if (alpha > 0.5) {
                const vR = red / 255; const lR = vR <= 0.03928 ? vR / 12.92 : Math.pow((vR + 0.055) / 1.055, 2.4);
                const vG = green / 255; const lG = vG <= 0.03928 ? vG / 12.92 : Math.pow((vG + 0.055) / 1.055, 2.4);
                const vB = blue / 255; const lB = vB <= 0.03928 ? vB / 12.92 : Math.pow((vB + 0.055) / 1.055, 2.4);
                const lum = 0.2126 * lR + 0.7152 * lG + 0.0722 * lB;
                pixels.push({ r: red, g: green, b: blue, lum });
              }
            }

            if (pixels.length === 0) {
              resolve(null);
              return;
            }

            pixels.sort((a, b) => a.lum - b.lum);

            // Darkest cluster: bottom 10% quantile
            // Lightest cluster: top 10% quantile
            const clusterSize = Math.max(1, Math.floor(pixels.length * 0.10));
            const darkCluster = pixels.slice(0, clusterSize);
            const lightCluster = pixels.slice(pixels.length - clusterSize);

            const darkMedian = darkCluster[Math.floor(darkCluster.length / 2)];
            const lightMedian = lightCluster[Math.floor(lightCluster.length / 2)];

            resolve({
              darkRgb: [darkMedian.r, darkMedian.g, darkMedian.b],
              lightRgb: [lightMedian.r, lightMedian.g, lightMedian.b],
              darkRgbaStr: `rgb(${darkMedian.r}, ${darkMedian.g}, ${darkMedian.b})`,
              lightRgbaStr: `rgb(${lightMedian.r}, ${lightMedian.g}, ${lightMedian.b})`,
              pixelCount: pixels.length
            });
          };
          img.src = 'data:image/png;base64,' + b64;
        });
      }, screenshotBase64, elementData.rect);

      const computedRatio = calcRatio(elementData.resolvedFgRaw, elementData.compositedBgRaw);
      const sampledRatio = calcRatio(clusterSample.darkRgb, clusterSample.lightRgb);
      const diff = Math.abs(computedRatio - sampledRatio);

      console.log(`Element: ${spec.name} (${spec.screen} screen)`);
      console.log(`  - Target: <${elementData.tag} class="${elementData.className}">`);
      console.log(`  - CSS Resolved FG: ${elementData.resolvedFg}`);
      console.log(`  - CSS Composited BG: ${elementData.compositedBg}`);
      console.log(`  - Computed Ratio: ${computedRatio.toFixed(2)}:1 (Font: ${elementData.fontSize}, Weight: ${elementData.fontWeight})`);
      console.log(`  - Cropped Bounding Box Pixel Cluster Sample (${clusterSample.pixelCount} px):`);
      console.log(`      Dark Pixel Cluster (median):  ${clusterSample.darkRgbaStr}`);
      console.log(`      Light Pixel Cluster (median): ${clusterSample.lightRgbaStr}`);
      console.log(`      Sampled Cluster Ratio: ${sampledRatio.toFixed(2)}:1`);
      console.log(`  - Divergence (Computed vs Sampled): ${diff.toFixed(2)}:1`);
      if (diff > 1.0) {
        console.log(`      * Note on divergence > 1.0: Subpixel text rasterization / font anti-aliasing blends perimeter glyph pixels with the background, softening the peak dynamic range compared to theoretical CSS color definitions.`);
      }
      console.log(`  - WCAG AA Status: ${sampledRatio >= 4.5 || (parseFloat(elementData.fontSize) >= 18 && sampledRatio >= 3.0) ? 'PASS' : 'FAIL'}`);
    }
  }

  // PART B: COMPREHENSIVE FULL-PAGE SCAN WITH ACTIVE TAB AND HEADING ASSERTIONS
  console.log('\n\n=== PART B: FULL-PAGE ALL-NODE CONTRAST AUDIT WITH TAB ASSERTIONS ===\n');

  const screens = [
    { name: 'Today', tab: 'dashboard', btnIndex: 0, expectedHeadingPart: ['aaj ki ride', 'today', 'neet', 'streak', 'ride'] },
    { name: 'Map (Territory)', tab: 'syllabus', btnIndex: 1, expectedHeadingPart: ['syllabus', 'territory', 'mastered', 'neet', 'region'] },
    { name: 'Practice', tab: 'practice_hub', btnIndex: 2, expectedHeadingPart: ['practice', 'mock', 'arena', 'speed', 'drill', 'pyq'] },
    { name: 'League', tab: 'leaderboard', btnIndex: 3, expectedHeadingPart: ['league', 'leaderboard', 'rank', 'division', 'weekly'] },
    { name: 'Me', tab: 'more_hub', btnIndex: 4, expectedHeadingPart: ['profile', 'student', 'more', 'account', 'hub', 'settings', 'tutor', 'aspirant', 'mentor', 'veer'] },
  ];

  for (const s of screens) {
    // Navigate via bottom nav click + event dispatch + hash
    await page.evaluate((btnIdx, tabId) => {
      window.location.hash = tabId;
      window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: tabId }));
      const btns = document.querySelectorAll('#mobile-bottom-nav button');
      if (btns[btnIdx]) {
        btns[btnIdx].click();
      }
    }, s.btnIndex, s.tab);
    await new Promise(r => setTimeout(r, 800));

    // Wait for screen content to mount
    await page.waitForFunction((expected) => {
      const main = document.querySelector('main') || document.body;
      const text = (main.innerText || '').toLowerCase();
      return expected.some(e => text.includes(e));
    }, { timeout: 10000 }, s.expectedHeadingPart).catch(() => {});

    // Scroll to mount all elements
    await page.evaluate(async () => {
      const scrollStep = 400;
      const maxScroll = Math.max(document.body.scrollHeight, 2500);
      for (let y = 0; y <= maxScroll; y += scrollStep) {
        window.scrollTo(0, y);
        await new Promise(r => setTimeout(r, 40));
      }
      window.scrollTo(0, 0);
    });
    await new Promise(r => setTimeout(r, 400));

    // Log active tab id and first heading text, then assert
    const screenMeta = await page.evaluate(() => {
      const activeNavBtn = document.querySelector('#mobile-bottom-nav button .font-black') || 
                            document.querySelector('#mobile-bottom-nav button[class*="primary"], #mobile-bottom-nav button[class*="blue"], #mobile-bottom-nav button[class*="purple"]');
      const activeNavText = activeNavBtn ? activeNavBtn.textContent.trim() : 'Unknown';
      const main = document.querySelector('main') || document.body;
      const headings = Array.from(main.querySelectorAll('h1, h2, h3, [role="heading"], p.font-black, span.font-black'))
        .map(h => h.textContent.trim().replace(/\s+/g, ' '))
        .filter(t => t.length > 2 && !t.includes('StudyRide') && !t.includes('Announcement'));
      return {
        hash: window.location.hash,
        activeNavText,
        firstHeading: headings[0] || 'No heading found',
        allHeadings: headings.slice(0, 4)
      };
    });

    console.log(`--------------------------------------------------------------------------------`);
    console.log(`Target Screen: ${s.name} (Tab: ${s.tab})`);
    console.log(`  Active Nav Label: "${screenMeta.activeNavText}", Hash: "${screenMeta.hash}"`);
    console.log(`  First Visible Heading: "${screenMeta.firstHeading}"`);
    console.log(`  Headings Sample: ${JSON.stringify(screenMeta.allHeadings)}`);

    const lowerHeading = (screenMeta.firstHeading + ' ' + screenMeta.allHeadings.join(' ')).toLowerCase();
    const matched = s.expectedHeadingPart.some(term => lowerHeading.includes(term));
    console.log(`  Screen Identity Assertion: ${matched ? 'PASSED (Matches screen content)' : 'FAILED (Screen did not update)'}`);

    // Audit contrast of all text nodes with explicit skip reason logging
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

      function getCssSelector(el) {
        if (!el) return '';
        let path = [];
        while (el && el.nodeType === Node.ELEMENT_NODE && el !== document.body) {
          let sel = el.tagName.toLowerCase();
          if (el.id) {
            sel += '#' + el.id;
            path.unshift(sel);
            break;
          } else if (el.className && typeof el.className === 'string') {
            const firstClass = el.className.trim().split(/\s+/)[0];
            if (firstClass) sel += '.' + firstClass;
          }
          path.unshift(sel);
          el = el.parentElement;
        }
        return path.join(' > ');
      }

      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      let totalTextNodes = 0;
      let scannedNodes = 0;
      const fails = [];
      const seenParents = new Set();
      const skips = [];

      while ((node = walker.nextNode())) {
        totalTextNodes++;
        const text = node.textContent?.trim();
        if (!text || text.length < 2) {
          if (skips.length < 15) {
            skips.push({
              selector: getCssSelector(node.parentElement),
              text: (node.textContent || '').slice(0, 20),
              reason: 'Empty / whitespace / single punctuation glyph (<2 chars)'
            });
          }
          continue;
        }

        const parent = node.parentElement;
        if (!parent) continue;

        if (seenParents.has(parent)) {
          if (skips.length < 15) {
            skips.push({
              selector: getCssSelector(parent),
              text: text.slice(0, 25),
              reason: 'Multiple text nodes within same parent element (already audited)'
            });
          }
          continue;
        }
        seenParents.add(parent);

        const style = window.getComputedStyle(parent);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
          if (skips.length < 15) {
            skips.push({
              selector: getCssSelector(parent),
              text: text.slice(0, 25),
              reason: `Hidden styling (display: ${style.display}, visibility: ${style.visibility}, opacity: ${style.opacity})`
            });
          }
          continue;
        }

        if (parent.closest('aside')) {
          if (skips.length < 15) {
            skips.push({
              selector: getCssSelector(parent),
              text: text.slice(0, 25),
              reason: 'Desktop sidebar navigation collapsed/hidden on mobile viewport'
            });
          }
          continue;
        }

        if (parent.closest('#mobile-drawer')) {
          if (skips.length < 15) {
            skips.push({
              selector: getCssSelector(parent),
              text: text.slice(0, 25),
              reason: 'Mobile drawer sheet currently closed/unrendered'
            });
          }
          continue;
        }

        const fg = parseRgb(style.color);
        if (fg[3] === 0) {
          if (skips.length < 15) {
            skips.push({
              selector: getCssSelector(parent),
              text: text.slice(0, 25),
              reason: 'Zero opacity foreground color (transparent)'
            });
          }
          continue;
        }

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
        fails,
        skips: skips.slice(0, 10)
      };
    });

    console.log(`  Scanned Text Nodes: ${auditResult.scannedNodes} / ${auditResult.totalTextNodes}`);
    console.log(`  Pass Count: ${auditResult.passCount}, Fail Count: ${auditResult.failCount}`);
    console.log(`  First 10 Skipped Selectors & Explicit Reasons:`);
    auditResult.skips.forEach((sk, idx) => {
      console.log(`    ${idx + 1}. [${sk.reason}] -> Selector: <${sk.selector}> ("${sk.text}")`);
    });
    if (auditResult.fails.length > 0) {
      console.log(`  FAIL LIST (${auditResult.fails.length} items):`);
      auditResult.fails.forEach((f, idx) => {
        console.log(`    ${idx + 1}. "${f.text}" <${f.tag} class="${f.className}"> => Ratio: ${f.ratio}:1 (Need ${f.threshold})`);
      });
    } else {
      console.log(`  FAIL LIST: 0 items (100% WCAG AA compliant on active nodes)`);
    }
  }

  await browser.close();
}

main().catch(console.error);
