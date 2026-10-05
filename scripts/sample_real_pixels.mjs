import puppeteer from 'puppeteer-core';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

function sRgbToLinear(c) {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
function getLuminance(r, g, b) {
  return 0.2126 * sRgbToLinear(r) + 0.7152 * sRgbToLinear(g) + 0.0722 * sRgbToLinear(b);
}
function getContrastRatio(rgb1, rgb2) {
  const l1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
  const l2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto('http://localhost:5173/?no_splash=1', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    const b = document.querySelector('#hero-guest-btn') || Array.from(document.querySelectorAll('button')).find(x => x.textContent?.includes('Guest Demo'));
    if (b) b.click();
  });
  await page.waitForSelector('#student-dashboard', { timeout: 15000 });

  for (const theme of ['dark', 'light']) {
    console.log(`\n================ REAL PIXEL SAMPLING: ${theme.toUpperCase()} ================`);
    await page.evaluate((th) => {
      document.documentElement.classList.remove('light', 'dark', 'night');
      document.documentElement.classList.add(th);
      localStorage.setItem('studyride_theme', th);
    }, theme);
    await new Promise(r => setTimeout(r, 600));

    // Nav Today
    await page.evaluate(() => {
      const btn = document.querySelectorAll('#mobile-bottom-nav button')[0];
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const todayScreenshot = await page.screenshot({ encoding: 'base64' });

    // Sample Today elements: AAJ KI RIDE chip, Learn (Stop 1)
    const todaySamples = await page.evaluate(async (base64) => {
      const img = new Image();
      await new Promise(res => { img.onload = res; img.src = 'data:image/png;base64,' + base64; });
      const cvs = document.createElement('canvas');
      cvs.width = img.width;
      cvs.height = img.height;
      const ctx = cvs.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const dsf = 2; // deviceScaleFactor

      function sample(el, text) {
        const rect = el.getBoundingClientRect();
        // Sample background near top-left inside element padding
        const bgData = ctx.getImageData(Math.round((rect.x + 4) * dsf), Math.round((rect.y + 4) * dsf), 1, 1).data;
        // Sample text near center
        const fgData = ctx.getImageData(Math.round((rect.x + rect.width / 2) * dsf), Math.round((rect.y + rect.height / 2) * dsf), 1, 1).data;
        return {
          text,
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          sampledBg: [bgData[0], bgData[1], bgData[2]],
          sampledFg: [fgData[0], fgData[1], fgData[2]]
        };
      }

      const aajChip = Array.from(document.querySelectorAll('span')).find(s => s.textContent.includes('AAJ KI RIDE'));
      const learnLabel = Array.from(document.querySelectorAll('span')).find(s => s.textContent.trim() === 'Learn');

      return {
        aaj: aajChip ? sample(aajChip, 'AAJ KI RIDE') : null,
        learn: learnLabel ? sample(learnLabel, 'Learn') : null
      };
    }, todayScreenshot);

    console.log('AAJ KI RIDE sampled:', todaySamples.aaj);
    if (todaySamples.aaj) {
      const ratio = getContrastRatio(todaySamples.aaj.sampledFg, todaySamples.aaj.sampledBg);
      console.log(`AAJ KI RIDE ratio from real pixels: ${ratio.toFixed(2)}:1`);
    }

    console.log('Learn sampled:', todaySamples.learn);
    if (todaySamples.learn) {
      const ratio = getContrastRatio(todaySamples.learn.sampledFg, todaySamples.learn.sampledBg);
      console.log(`Learn ratio from real pixels: ${ratio.toFixed(2)}:1`);
    }

    // Now test Tutor on Me tab
    await page.evaluate(() => {
      const btn = document.querySelectorAll('#mobile-bottom-nav button')[4];
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const meScreenshot = await page.screenshot({ encoding: 'base64' });

    const meSamples = await page.evaluate(async (base64) => {
      const img = new Image();
      await new Promise(res => { img.onload = res; img.src = 'data:image/png;base64,' + base64; });
      const cvs = document.createElement('canvas');
      cvs.width = img.width;
      cvs.height = img.height;
      const ctx = cvs.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const dsf = 2;

      function sample(el, text) {
        const rect = el.getBoundingClientRect();
        const bgData = ctx.getImageData(Math.round((rect.x + 4) * dsf), Math.round((rect.y + 4) * dsf), 1, 1).data;
        const fgData = ctx.getImageData(Math.round((rect.x + rect.width / 2) * dsf), Math.round((rect.y + rect.height / 2) * dsf), 1, 1).data;
        return {
          text,
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          sampledBg: [bgData[0], bgData[1], bgData[2]],
          sampledFg: [fgData[0], fgData[1], fgData[2]]
        };
      }

      const tutor = Array.from(document.querySelectorAll('span')).find(s => s.textContent.trim() === 'Tutor');
      return tutor ? sample(tutor, 'Tutor') : null;
    }, meScreenshot);

    console.log('Tutor sampled:', meSamples);
    if (meSamples) {
      const ratio = getContrastRatio(meSamples.sampledFg, meSamples.sampledBg);
      console.log(`Tutor ratio from real pixels: ${ratio.toFixed(2)}:1`);
    }
  }

  await browser.close();
}

main().catch(console.error);
