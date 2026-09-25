import fs from 'fs';
import path from 'path';

const rootDir = path.resolve();
const releaseApkPath = path.join(rootDir, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
const targets = [
  path.join(rootDir, 'public', 'studyride.apk'),
  path.join(rootDir, 'public', 'aspirantx.apk'),
  path.join(rootDir, 'public', 'protrack.apk'),
  path.join(rootDir, 'AspirantX-Latest-Release.apk'),
];

if (fs.existsSync(releaseApkPath)) {
  const stat = fs.statSync(releaseApkPath);
  console.log(`[RELEASE SYNC] Copying built APK (${(stat.size / 1024 / 1024).toFixed(2)} MB) to website public folder...`);
  for (const target of targets) {
    fs.copyFileSync(releaseApkPath, target);
    console.log(`  ✓ Synced -> ${path.relative(rootDir, target)}`);
  }
  console.log('[RELEASE SYNC] Complete! Website download links will immediately serve this new APK.');
} else {
  console.warn('[RELEASE SYNC] Note: release APK not found at: ' + releaseApkPath);
}
