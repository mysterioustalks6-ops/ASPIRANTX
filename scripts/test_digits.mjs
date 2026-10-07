import { createCdpClient } from './phone_cdp_controller.mjs';

async function main() {
  const cdp = await createCdpClient();
  await cdp.evaluate("window.location.hash = 'timer'");
  await new Promise(r => setTimeout(r, 1000));
  const res = await cdp.evaluate(`(() => {
    const all = Array.from(document.querySelectorAll('*'));
    const matched = all.filter(el => /^[0-9]{1,2}:[0-9]{2}$/.test(el.innerText?.trim()) && el.children.length === 0);
    return matched.map(el => ({ tag: el.tagName, text: el.innerText.trim(), class: el.className }));
  })()`);
  console.log('Digits found:', res);
  cdp.close();
}

main().catch(console.error);
