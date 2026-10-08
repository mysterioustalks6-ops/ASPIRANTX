import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';
import http from 'http';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const VIEWPORTS = [
  { name: '360x800', width: 360, height: 800 },
  { name: '390x844', width: 390, height: 844 },
  { name: '412x915', width: 412, height: 915 }
];

const PORT = 5199;
const URL = `http://localhost:${PORT}`;

function waitForServer(url, timeout = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http.get(url, (res) => {
        resolve();
      }).on('error', () => {
        if (Date.now() - start > timeout) {
          reject(new Error(`Timeout waiting for server at ${url}`));
        } else {
          setTimeout(check, 500);
        }
      });
    };
    check();
  });
}

async function main() {
  console.log('🚀 Starting Vite preview server for Phone Fit Verification...');
  const devServer = spawn('npx', ['vite', 'preview', '--port', String(PORT)], {
    shell: true,
    stdio: 'pipe'
  });

  devServer.stderr.on('data', (d) => process.stderr.write(d));
  devServer.stdout.on('data', (d) => {
    // console.log(d.toString());
  });

  try {
    await waitForServer(URL);
    console.log(`✅ Server ready at ${URL}`);

    const browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    let hasOverflowErrors = false;

    for (const vp of VIEWPORTS) {
      console.log(`\n========================================`);
      console.log(`📱 Checking Viewport: ${vp.name} (${vp.width}x${vp.height}) at font scale 1.3`);
      console.log(`========================================`);

      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto(URL, { waitUntil: 'domcontentloaded' });

      // Apply Font Scale 1.3
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '130%';
        const demoUser = {
          id: 'demo-guest-123',
          name: 'Aspirant',
          email: 'guest@studyride.in',
          exam: 'NEET_UG',
          isGuest: true,
          role: 'USER',
          isProfileComplete: true
        };
        localStorage.setItem('aspirantx_current_user', JSON.stringify(demoUser));
        localStorage.setItem('studyride_user', JSON.stringify(demoUser));
      });

      // Wait for splash dismissal
      await new Promise(r => setTimeout(r, 1500));

      const screens = ['timer', 'garage', 'my_rides', 'relax'];

      for (const screen of screens) {
        // Navigate or switch tab
        await page.evaluate((s) => {
          if (s === 'relax') {
            // First open timer
            window.location.hash = '#timer';
            // Click relax button if available
            const relaxBtn = document.querySelector('button[aria-label="Relax scenery"], button[title="Relax scenery"]');
            if (relaxBtn) relaxBtn.click();
          } else {
            window.location.hash = `#${s}`;
            // If app uses state navigation, try dispatching popstate or click tab
            const tabBtn = document.querySelector(`button[data-tab="${s}"]`);
            if (tabBtn) tabBtn.click();
          }
        }, screen);

        await new Promise(r => setTimeout(r, 800));

        // Evaluate right edge clipping and scrollWidth
        const result = await page.evaluate((vpWidth, screenName) => {
          const vw = window.innerWidth;
          const docScrollWidth = document.documentElement.scrollWidth;
          const bodyScrollWidth = document.body.scrollWidth;
          const clippingElements = [];

          const all = document.querySelectorAll('*');
          all.forEach(el => {
            const rect = el.getBoundingClientRect();
            // Check if element's right edge is greater than viewport width
            if (rect.width > 0 && rect.right > vw + 1) {
              // Check if el or any ancestor has overflow-x: hidden or overflow: hidden
              let isClippedByAncestor = false;
              let curr = el;
              while (curr && curr !== document.documentElement && curr !== document.body) {
                const s = window.getComputedStyle(curr);
                if (s.overflowX === 'hidden' || s.overflow === 'hidden' || s.display === 'none' || s.visibility === 'hidden') {
                  isClippedByAncestor = true;
                  break;
                }
                curr = curr.parentElement;
              }
              if (isClippedByAncestor) return;

              // Skip html/body
              if (el === document.documentElement || el === document.body) return;

              clippingElements.push({
                tag: el.tagName.toLowerCase(),
                className: (el.className && typeof el.className === 'string') ? el.className.slice(0, 100) : '',
                id: el.id || '',
                text: (el.innerText || '').slice(0, 40).trim(),
                parentTag: el.parentElement ? el.parentElement.tagName.toLowerCase() : '',
                parentClass: (el.parentElement?.className && typeof el.parentElement.className === 'string') ? el.parentElement.className.slice(0, 100) : '',
                snippet: el.outerHTML.slice(0, 150),
                rectRight: Math.round(rect.right),
                excess: Math.round(rect.right - vw)
              });
            }
          });

          return {
            vw,
            docScrollWidth,
            bodyScrollWidth,
            hasHorizontalScroll: docScrollWidth > vw || bodyScrollWidth > vw,
            clippingElements
          };
        }, vp.width, screen);

        if (result.hasHorizontalScroll || result.clippingElements.length > 0) {
          console.error(`❌ CLIPPING FAILURE on ${screen} at ${vp.name}!`);
          console.error(`   Viewport width: ${result.vw}px | Document scrollWidth: ${result.docScrollWidth}px`);
          if (result.clippingElements.length > 0) {
            console.error(`   Offending Elements:`);
            result.clippingElements.forEach(item => {
              console.error(`     - <${item.tag}> class="${item.className}" parent=<${item.parentTag} class="${item.parentClass}"> excess: +${item.excess}px`);
              console.error(`       HTML: ${item.snippet}`);
            });
          }
          hasOverflowErrors = true;
        } else {
          console.log(`  ✅ Screen [${screen}]: 0px overflow, fits viewport ${vp.width}px perfectly.`);
        }
      }
    }

    await browser.close();
    devServer.kill();

    if (hasOverflowErrors) {
      console.error('\n❌ Phone fit verification FAILED due to clipped elements!');
      process.exit(1);
    } else {
      console.log('\n🎉 ALL SCREENS PASSED PHONE FIT VERIFICATION at 360x800, 390x844, 412x915 and font scale 1.3!');
      process.exit(0);
    }
  } catch (err) {
    console.error('Error during verification:', err);
    devServer.kill();
    process.exit(1);
  }
}

main();
