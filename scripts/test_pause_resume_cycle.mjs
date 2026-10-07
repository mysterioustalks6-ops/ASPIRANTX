import { createCdpClient } from './phone_cdp_controller.mjs';

async function main() {
  const cdp = await createCdpClient();
  
  // 1. Click Start Focus Ride
  console.log('Clicking Start Focus Ride...');
  const started = await cdp.evaluate(`(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(b => b.innerText?.includes('Start Focus Ride'));
    if (b) { b.click(); return true; }
    return false;
  })()`);
  console.log('Started:', started);
  await new Promise(r => setTimeout(r, 2000));

  // Read time
  const t1 = await cdp.evaluate(`document.querySelector('.text-7xl')?.innerText`);
  console.log('T1 (running):', t1);

  // 2. Click Pause Ride
  console.log('Clicking Pause Ride...');
  const paused = await cdp.evaluate(`(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(b => b.innerText?.includes('Pause Ride'));
    if (b) { b.click(); return true; }
    return false;
  })()`);
  console.log('Paused:', paused);
  await new Promise(r => setTimeout(r, 2000));

  const t2 = await cdp.evaluate(`document.querySelector('.text-7xl')?.innerText`);
  console.log('T2 (paused):', t2);

  // 3. Click Resume Ride
  console.log('Clicking Resume Ride...');
  const resumed = await cdp.evaluate(`(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(b => b.innerText?.includes('Resume Ride'));
    if (b) { b.click(); return true; }
    return false;
  })()`);
  console.log('Resumed:', resumed);
  await new Promise(r => setTimeout(r, 2000));

  const t3 = await cdp.evaluate(`document.querySelector('.text-7xl')?.innerText`);
  console.log('T3 (resumed):', t3);

  cdp.close();
}

main().catch(console.error);
