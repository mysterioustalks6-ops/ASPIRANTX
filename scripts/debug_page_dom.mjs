import puppeteer from 'puppeteer-core';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function test() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('ERROR:', err.message));

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto('http://127.0.0.1:5173/#syllabus', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  // If guest button is there, click it
  const clickedGuest = await page.evaluate(() => {
    const splash = document.querySelector('[class*="z-[9999]"]');
    if (splash) splash.click();
    const btn = document.querySelector('#hero-guest-btn');
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('Clicked guest button:', clickedGuest);
  await new Promise(r => setTimeout(r, 2000));

  const state = await page.evaluate(() => {
    const main = document.querySelector('main');
    const bottomNav = document.querySelector('#mobile-bottom-nav');
    return {
      bodyTextSnippet: document.body.innerText.substring(0, 300),
      mainInnerHtmlLength: main ? main.innerHTML.length : 0,
      mainTextSnippet: main ? main.innerText.substring(0, 200) : null,
      bottomNavVisible: !!bottomNav,
      buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(Boolean).slice(0, 15)
    };
  });
  console.log('STATE:', JSON.stringify(state, null, 2));

  await browser.close();
}

test().catch(console.error);
