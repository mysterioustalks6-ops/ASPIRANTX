import puppeteer from 'puppeteer-core';
import { preview } from 'vite';

console.log('=== PRODUCTION REACHABILITY AUDIT (DEV-ONLY TABS) ===');

const previewServer = await preview({
  preview: {
    port: 4173,
    strictPort: true,
  }
});
const testUrl = previewServer.resolvedUrls.local[0] + '?no_splash=1';
console.log(`Preview server listening at ${testUrl}`);

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  args: ['--no-sandbox', '--disable-setuid-sandbox']
});

const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

try {
  await page.goto(testUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 1000));

  const guestBtn = await page.$('#hero-guest-btn');
  if (guestBtn) await guestBtn.click();
  await page.waitForSelector('[data-screen="dashboard"]', { timeout: 10000 });

  const devTabs = ['debug_galaxy', 'figma_preview', 'design_system'];

  for (const tabId of devTabs) {
    console.log(`\nNavigating to dev tab "${tabId}" in production build...`);
    await page.evaluate((id) => {
      window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: id }));
    }, tabId);
    await new Promise(r => setTimeout(r, 1000));

    const result = await page.evaluate((id) => {
      const el = document.querySelector(`[data-screen="${id}"]`);
      if (!el) {
        return { reachable: false, reason: 'Element [data-screen="' + id + '"] not rendered in DOM (blocked)' };
      }
      const text = el.innerText || '';
      const isBlockedNotice = text.includes('Unavailable in Production') || text.includes('Developer');
      return {
        reachable: !isBlockedNotice,
        reason: isBlockedNotice ? `Blocked in production: "${text.trim().replace(/\s+/g, ' ')}"` : `Rendered content: "${text.slice(0, 40)}"`
      };
    }, tabId);

    console.log(`Result for ${tabId}: ${result.reachable ? 'REACHABLE (FAIL)' : 'NOT REACHABLE (PASS)'} -> ${result.reason}`);
  }
} catch (err) {
  console.error('Error during prod reachability test:', err.message);
} finally {
  await browser.close();
  try { previewServer.httpServer.close(); } catch(e){}
  process.exit(0);
}
