import { execSync } from 'child_process';
import path from 'path';
import { createCdpClient } from './phone_cdp_controller.mjs';

const ADB = path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk', 'platform-tools', 'adb.exe');
const DEVICE = '192.168.1.194:43391';

async function main() {
  const cdp = await createCdpClient();

  // Read current time
  const tBefore = await cdp.evaluate(`document.querySelector('.text-7xl')?.innerText`);
  console.log('Time before background:', tBefore);

  // Send to background
  console.log('Sending to background...');
  execSync(`"${ADB}" -s ${DEVICE} shell input keyevent KEYCODE_HOME`, { stdio: 'pipe' });

  // Wait 10 seconds in background
  console.log('Waiting 10s in background...');
  await new Promise(r => setTimeout(r, 10000));

  // Bring to foreground
  console.log('Restoring to foreground...');
  execSync(`"${ADB}" -s ${DEVICE} shell am start -n com.aspirantx.app/.MainActivity --activity-single-top`, { stdio: 'pipe' });
  await new Promise(r => setTimeout(r, 1500));

  const tAfter = await cdp.evaluate(`document.querySelector('.text-7xl')?.innerText`);
  console.log('Time after foreground:', tAfter);

  cdp.close();
}

main().catch(console.error);
