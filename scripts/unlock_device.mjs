import { runAdb, captureScreen } from './adb_helper.mjs';

console.log('Disabling lockscreen and waking device...');
try {
  runAdb(['shell', 'locksettings', 'set-disabled', 'true']);
  runAdb(['shell', 'settings', 'put', 'secure', 'lockscreen.disabled', '1']);
  runAdb(['shell', 'settings', 'put', 'system', 'screen_off_timeout', '2147483647']);
  runAdb(['shell', 'svc', 'power', 'stayon', 'true']);
  runAdb(['shell', 'input', 'keyevent', 'KEYCODE_WAKEUP']);
  runAdb(['shell', 'wm', 'dismiss-keyguard']);
  runAdb(['shell', 'input', 'keyevent', '82']); // MENU to unlock
  runAdb(['shell', 'input', 'swipe', '540', '2200', '540', '400', '150']); // Swipe up firmly
  
  const windowOut = runAdb(['shell', 'dumpsys', 'window']);
  const showing = windowOut.split('\n').filter(l => l.includes('isKeyguardShowing') || l.includes('mCurrentFocus'));
  console.log('Window status:', showing.join('; '));

  captureScreen('evidence_01_preview_opened.png');
} catch (err) {
  console.error('Error:', err);
}
