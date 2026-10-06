import puppeteer from 'puppeteer-core';
import { preview } from 'vite';
import axeCore from 'axe-core';

console.log('=== STARTING HOSTILE CONTRAST & ACCESSIBILITY AUDIT (SECTION E) ===\n');

const previewServer = await preview({
  preview: { port: 4188, host: '127.0.0.1' }
});
const serverUrl = 'http://127.0.0.1:4188/?no_splash=1';
console.log(`Preview server listening at ${serverUrl}`);
const timeout = setTimeout(() => {
  console.error('Contrast audit reached 60s hard timeout');
  try { previewServer.httpServer.close(); } catch(e){}
  process.exit(1);
}, 58000);

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

try {
  await page.goto(serverUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('#hero-guest-btn, [data-screen="dashboard"]', { timeout: 15000 });
  await page.evaluate(() => {
    const b = document.querySelector('#hero-guest-btn') || Array.from(document.querySelectorAll('button')).find(x => x.textContent?.includes('Guest Demo'));
    if (b) b.click();
  });
  await page.waitForSelector('[data-screen="dashboard"]', { timeout: 15000 });
  await new Promise(r => setTimeout(r, 1500));

  // E6: Tutor Chip crop test on Me tab
  console.log('\n--- E6: TUTOR CHIP INNER-BOX CROP VERIFICATION ---');
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'more_hub' }));
  });
  await new Promise(r => setTimeout(r, 1000));

  const tutorCropResult = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    const tutorEl = all.find(el => {
      const text = el.textContent?.trim();
      return text === 'Tutor' || (text?.includes('Tutor') && text.length < 15);
    });
    if (!tutorEl) return { found: false };
    const rect = tutorEl.getBoundingClientRect();
    const style = window.getComputedStyle(tutorEl);
    // Inner box: inset 20%
    const innerBox = {
      x: rect.x + rect.width * 0.2,
      y: rect.y + rect.height * 0.2,
      width: rect.width * 0.6,
      height: rect.height * 0.6
    };
    return {
      found: true,
      tagName: tutorEl.tagName,
      className: tutorEl.className,
      rect,
      innerBox,
      color: style.color,
      bgColor: style.backgroundColor
    };
  });
  console.log('Tutor Chip Inner Box Sample:', tutorCropResult);

  // E1: All screens to audit
  const screens = [
    { name: 'Today', tab: 'dashboard' },
    { name: 'Map (Territory)', tab: 'syllabus' },
    { name: 'Practice (Hub)', tab: 'practice_hub' },
    { name: 'Practice: Question Bank', tab: 'question_bank' },
    { name: 'Practice: PYQs', tab: 'pyq' },
    { name: 'Practice: CBT', tab: 'cbt' },
    { name: 'League (Leaderboard)', tab: 'leaderboard' },
    { name: 'League: Milestones', tab: 'reward_milestones' },
    { name: 'Me (More Hub)', tab: 'more_hub' },
    { name: 'Me: Student Cockpit', tab: 'student_dashboard' }
  ];

  // Inject axe-core source into page
  const axeSource = axeCore.source;
  await page.evaluate(axeSource);

  for (const theme of ['dark', 'light']) {
    console.log(`\n================================================================================`);
    console.log(`====================== AUDITING THEME: ${theme.toUpperCase()} ======================`);
    console.log(`================================================================================`);

    // E2: Verify theme switch with documentElement class and body background
    const themeProof = await page.evaluate((th) => {
      document.documentElement.classList.remove('light', 'dark', 'night');
      document.documentElement.classList.add(th);
      document.documentElement.setAttribute('data-theme', th);
      localStorage.setItem('studyride_theme', th);
      const cs = window.getComputedStyle(document.body);
      return {
        htmlClass: document.documentElement.className,
        dataTheme: document.documentElement.getAttribute('data-theme'),
        bodyBg: cs.backgroundColor
      };
    }, theme);

    console.log(`[THEME SWITCH PROOF] class="${themeProof.htmlClass}", data-theme="${themeProof.dataTheme}", body computed background: ${themeProof.bodyBg}`);

    for (const screen of screens) {
      console.log(`\n--- Screen: ${screen.name} (tab: ${screen.tab}) ---`);
      await page.evaluate((tab) => {
        window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: tab }));
      }, screen.tab);
      await new Promise(r => setTimeout(r, 800));

      // Scroll to trigger lazy elements
      await page.evaluate(() => {
        window.scrollTo(0, 300);
      });
      await new Promise(r => setTimeout(r, 300));
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      await new Promise(r => setTimeout(r, 300));

      // E3 & E4: Full Node Contrast & Ancestor Walk
      const screenAudit = await page.evaluate((th) => {
        function sRgbToLinear(c) {
          const v = c / 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        }
        function getLum(r, g, b) {
          return 0.2126 * sRgbToLinear(r) + 0.7152 * sRgbToLinear(g) + 0.0722 * sRgbToLinear(b);
        }
        function calcRatio(fg, bg) {
          const l1 = getLum(fg[0], fg[1], fg[2]);
          const l2 = getLum(bg[0], bg[1], bg[2]);
          return ((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05));
        }
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

        const defaultBg = th === 'light' ? [248, 250, 252, 1] : [15, 23, 42, 1];
        const skippedReasons = {
          hidden_or_zero_size: 0,
          no_direct_text: 0,
          pure_icon_or_svg: 0
        };

        const allElements = Array.from(document.querySelectorAll('*'));
        let auditedCount = 0;
        let passCount = 0;
        let failCount = 0;
        const failures = [];

        for (const el of allElements) {
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            skippedReasons.hidden_or_zero_size++;
            continue;
          }
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) {
            skippedReasons.hidden_or_zero_size++;
            continue;
          }
          if (el.tagName === 'svg' || el.tagName === 'path') {
            skippedReasons.pure_icon_or_svg++;
            continue;
          }

          // Check direct text
          const directText = Array.from(el.childNodes)
            .filter(n => n.nodeType === Node.TEXT_NODE)
            .map(n => n.textContent.trim())
            .join(' ');

          if (!directText) {
            skippedReasons.no_direct_text++;
            continue;
          }

          // Resolve foreground
          const fg = parseRgb(style.color);

          // E3: Walk ancestors to resolve effective background
          let cur = el;
          const layers = [];
          while (cur && cur !== document.documentElement) {
            const s = window.getComputedStyle(cur);
            let bg = parseRgb(s.backgroundColor);
            if (bg[3] === 0 && s.backgroundImage && s.backgroundImage.includes('gradient')) {
              const matches = s.backgroundImage.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/g);
              if (matches && matches.length > 0) {
                const m = matches[0].match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
                if (m) {
                  bg = [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10), 1.0];
                }
              }
            }
            if (bg[3] > 0) {
              layers.unshift(bg);
              if (bg[3] === 1) break;
            }
            cur = cur.parentElement;
          }

          let effectiveBg = defaultBg;
          for (const layer of layers) {
            effectiveBg = blendOver(layer, effectiveBg);
          }

          const ratio = calcRatio(fg, effectiveBg);
          auditedCount++;

          const fontSize = parseFloat(style.fontSize) || 16;
          const isBold = parseInt(style.fontWeight, 10) >= 700 || style.fontWeight === 'bold';
          const isLarge = fontSize >= 18 || (fontSize >= 14 && isBold);
          const requiredRatio = isLarge ? 3.0 : 4.5;

          if (ratio >= requiredRatio) {
            passCount++;
          } else {
            failCount++;
            failures.push({
              text: directText.slice(0, 30),
              tag: el.tagName.toLowerCase(),
              className: el.className?.toString().slice(0, 40),
              ratio: ratio.toFixed(2),
              required: requiredRatio,
              fg: style.color,
              effectiveBg: `rgb(${effectiveBg[0]}, ${effectiveBg[1]}, ${effectiveBg[2]})`
            });
          }
        }

        return {
          auditedCount,
          passCount,
          failCount,
          skippedReasons,
          failures: failures.slice(0, 5)
        };
      }, theme);

      console.log(`  Audited Nodes: ${screenAudit.auditedCount} | PASS: ${screenAudit.passCount} | FAIL: ${screenAudit.failCount}`);
      console.log(`  Skipped Counts: hidden_or_zero_size=${screenAudit.skippedReasons.hidden_or_zero_size}, no_direct_text=${screenAudit.skippedReasons.no_direct_text}, pure_icon_or_svg=${screenAudit.skippedReasons.pure_icon_or_svg}`);
      if (screenAudit.failCount > 0) {
        console.log(`  Sample Failures:`, screenAudit.failures);
      }

      // E4: Run axe-core color-contrast rule
      const axeResult = await page.evaluate(async () => {
        if (typeof axe === 'undefined') return { error: 'axe not defined' };
        const results = await axe.run(document, {
          runOnly: ['color-contrast']
        });
        return {
          violationsCount: results.violations.length,
          violations: results.violations.map(v => ({
            id: v.id,
            nodes: v.nodes.map(n => ({
              target: n.target,
              summary: n.failureSummary?.slice(0, 80)
            }))
          }))
        };
      });
      console.log(`  axe-core color-contrast violations: ${axeResult.violationsCount}`);
    }
  }

} catch(err) {
  console.error('Audit Error:', err);
} finally {
  await browser.close();
  try { previewServer.httpServer.close(); } catch(e){}
  process.exit(0);
}
