import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export const ADB = 'C:\\Users\\AMBUJ YADAV\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe';
export const ARTIFACTS_DIR = 'C:\\Users\\AMBUJ YADAV\\.gemini\\antigravity-ide\\brain\\c6087c99-a424-4d59-aab1-22a8df407a2d';

export function runAdb(args, options = {}) {
  return execFileSync(ADB, args, { encoding: 'utf8', timeout: 10000, ...options }).trim();
}

export function captureScreen(fileName) {
  const targetPath = path.isAbsolute(fileName) ? fileName : path.join(ARTIFACTS_DIR, fileName);
  try {
    runAdb(['shell', 'screencap', '-p', '/sdcard/tmp_screen.png']);
    runAdb(['pull', '/sdcard/tmp_screen.png', targetPath]);
    runAdb(['shell', 'rm', '-f', '/sdcard/tmp_screen.png']);
    const stats = fs.statSync(targetPath);
    console.log(`Saved screenshot to: ${targetPath} (${stats.size} bytes)`);
    return targetPath;
  } catch (err) {
    console.error('captureScreen error:', err.message);
    return null;
  }
}

export function getResumedActivity() {
  const out = runAdb(['shell', 'dumpsys', 'activity', 'activities']);
  const lines = out.split('\n').filter(l => l.includes('ResumedActivity') || l.includes('topResumedActivity'));
  return lines.join('\n');
}

export function getUiDump() {
  try {
    runAdb(['shell', 'uiautomator', 'dump', '/data/local/tmp/uidump.xml']);
    return runAdb(['shell', 'cat', '/data/local/tmp/uidump.xml']);
  } catch (err) {
    console.error('uiautomator dump error:', err.message);
    return '';
  }
}
