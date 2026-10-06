import puppeteer from 'puppeteer-core';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function test() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.stack || err.message));
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto('http://127.0.0.1:5173/?no_splash=1');
  await new Promise(r => setTimeout(r, 2000));
  await page.evaluate(() => {
    const b = document.querySelector('#hero-guest-btn');
    if (b) b.click();
  });
  await page.waitForSelector('#mobile-bottom-nav', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1000));

  // Navigate to Syllabus via hash and click
  console.log('Navigating to syllabus tab...');
  await page.evaluate(() => {
    window.location.hash = 'syllabus';
  });
  await page.waitForSelector('[data-screen="syllabus"]', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1000));

  // Click List
  await page.evaluate(() => {
    const listBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('List'));
    if (listBtn) listBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const layout = await page.evaluate(() => {
    const main = document.querySelector('main');
    const rects = Array.from(document.querySelectorAll('h1, h2, h3, button, span'))
      .map(el => ({
        tag: el.tagName,
        text: el.textContent?.trim().substring(0, 30),
        rect: {
          top: Math.round(el.getBoundingClientRect().top),
          left: Math.round(el.getBoundingClientRect().left),
          width: Math.round(el.getBoundingClientRect().width),
          height: Math.round(el.getBoundingClientRect().height)
        }
      }))
      .filter(x => x.rect.height > 0 && x.text)
      .slice(0, 25);

    return {
      mainRect: main ? {
        top: Math.round(main.getBoundingClientRect().top),
        height: Math.round(main.getBoundingClientRect().height),
        scrollTop: main.scrollTop,
        scrollHeight: main.scrollHeight
      } : null,
      rects
    };
  });
  console.log('LAYOUT:\n', JSON.stringify(layout, null, 2));

  await page.screenshot({ path: 'scratch/test_list_view.png' });
  console.log('Saved scratch/test_list_view.png');
  await browser.close();
}

test().catch(console.error);
