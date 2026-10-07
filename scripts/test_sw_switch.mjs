import { createCdpClient } from './phone_cdp_controller.mjs';

async function main() {
  const cdp = await createCdpClient();
  const res = await cdp.evaluate(`(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const swBtn = btns.find(b => b.innerText.includes('Stopwatch'));
    if (swBtn) {
      swBtn.click();
      return 'Clicked Stopwatch button';
    }
    return 'Stopwatch button not found';
  })()`);
  console.log(res);
  await new Promise(r => setTimeout(r, 1000));
  const digits = await cdp.evaluate(`(() => {
    const all = Array.from(document.querySelectorAll('*'));
    const matched = all.filter(el => /^[0-9]{1,2}:[0-9]{2}$/.test(el.innerText?.trim()) && el.children.length === 0);
    return matched.map(el => el.innerText.trim());
  })()`);
  console.log('Stopwatch digits:', digits);
  cdp.close();
}

main().catch(console.error);
