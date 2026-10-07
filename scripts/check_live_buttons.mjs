import { createCdpClient } from './phone_cdp_controller.mjs';

async function main() {
  const cdp = await createCdpClient();
  const btns = await cdp.evaluate(`(() => {
    return Array.from(document.querySelectorAll('button')).map(b => ({
      text: b.innerText?.trim(),
      html: b.innerHTML.slice(0, 60)
    }));
  })()`);
  console.log('Buttons:', btns);
  cdp.close();
}

main().catch(console.error);
