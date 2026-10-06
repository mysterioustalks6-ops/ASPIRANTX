import puppeteer from 'puppeteer-core';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DIST_DIR = path.resolve('dist');

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

function startStaticServer(port = 4173) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url.split('?')[0];
      if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
      let filePath = path.join(DIST_DIR, reqPath);
      
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(DIST_DIR, 'index.html');
      }

      const ext = path.extname(filePath);
      const contentType = MIME[ext] || 'application/octet-stream';

      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      });
    });

    server.listen(port, () => {
      console.log(`Static server running at http://localhost:${port}`);
      resolve(server);
    });
  });
}

async function main() {
  console.log('=== WEB GATE-A2 EVIDENCE RUNNER ===');
  const server = await startStaticServer(4173);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });

  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });

  // Wait for #hero-guest-btn
  await page.waitForSelector('#hero-guest-btn');
  console.log('Clicking #hero-guest-btn...');
  await page.click('#hero-guest-btn');

  // Wait for dashboard or mobile navigation to load
  await new Promise(r => setTimeout(r, 2000));

  // Switch to Syllabus Map tab
  await page.evaluate(() => {
    const bottomBtns = Array.from(document.querySelectorAll('#mobile-bottom-nav button, nav button'));
    const mapBtn = bottomBtns.find(b => b.textContent?.includes('Map') || b.textContent?.includes('Syllabus'));
    if (mapBtn) {
      mapBtn.click();
    } else {
      window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: 'syllabus' }));
    }
  });

  await new Promise(r => setTimeout(r, 2000));

  // Switch to List view
  await page.evaluate(() => {
    const listBtn = Array.from(document.querySelectorAll('button')).find(b => 
      b.textContent?.includes('List View') || b.textContent?.includes('List')
    );
    if (listBtn) listBtn.click();
  });

  await new Promise(r => setTimeout(r, 1500));

  // Extract DOM data
  const webDOM = await page.evaluate(() => {
    const title = document.title;
    const online = navigator.onLine;
    const userStr = localStorage.getItem('studyride_user');
    const user = userStr ? JSON.parse(userStr) : null;

    const unverifiedNotice = document.querySelector('.bg-amber-500\\/10, [class*="amber"]')?.textContent?.trim() || '';
    const bodyText = document.body.innerText;

    const statCards = Array.from(document.querySelectorAll('[class*="rounded"]'))
      .map(el => el.innerText?.trim())
      .filter(t => t && (t.includes('Topics') || t.includes('Est. Hours') || t.includes('Buffer') || t.includes('Curriculum') || t.includes('WORKLOAD')));

    return {
      title,
      online,
      userAvatar: user?.avatar_url,
      userExam: user?.exam,
      userTargetYear: user?.targetYear,
      unverifiedNotice,
      statCards: statCards.slice(0, 8),
      bodySnippet: bodyText.slice(0, 1000)
    };
  });

  console.log('\n--- WEB DOM EVIDENCE ---');
  console.log(JSON.stringify(webDOM, null, 2));

  // Take screenshot
  const outPath = path.resolve('docs/screenshots/web_list_gate_a2.png');
  await page.screenshot({ path: outPath });
  console.log('Saved Web screenshot to docs/screenshots/web_list_gate_a2.png');

  await browser.close();
  server.close();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
