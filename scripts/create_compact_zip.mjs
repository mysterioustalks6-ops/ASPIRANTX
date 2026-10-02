import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const rootDir = process.cwd();
const stageDir = path.join(rootDir, '.compact_staging');
const outputZip = path.join(rootDir, 'AspirantX-FocusGalaxy-Compressed.zip');

if (fs.existsSync(stageDir)) {
  fs.rmSync(stageDir, { recursive: true, force: true });
}
fs.mkdirSync(stageDir, { recursive: true });

// Blacklist of directory names / path patterns to ignore
const ignoreExactDirs = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.gradle',
  '.turbo',
  'coverage',
  '.compact_staging',
  '.temp_staging'
]);

function shouldExclude(fullPath) {
  const rel = path.relative(rootDir, fullPath).replace(/\\/g, '/');
  const parts = rel.split('/');

  for (const part of parts) {
    if (ignoreExactDirs.has(part)) return true;
  }

  // Exclude android gradle build cache and intermediates
  if (rel.startsWith('android/app/build') || rel.startsWith('android/.gradle') || rel.startsWith('android/build')) {
    return true;
  }

  // Exclude root zip files
  if (rel.endsWith('.zip')) {
    return true;
  }

  return false;
}

function copyRecursive(src, dest) {
  if (shouldExclude(src)) return;

  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else if (stat.isFile()) {
    const parent = path.dirname(dest);
    if (!fs.existsSync(parent)) {
      fs.mkdirSync(parent, { recursive: true });
    }
    fs.copyFileSync(src, dest);
  }
}

console.log('--- Staging Clean Project Code & Android Native Structure ---');
const topEntries = fs.readdirSync(rootDir);
for (const entry of topEntries) {
  const full = path.join(rootDir, entry);
  const dest = path.join(stageDir, entry);
  copyRecursive(full, dest);
}

// Ensure RELEASE_ARTIFACTS is present with the signed AAB, APK, and Privacy Policy
const releaseDest = path.join(stageDir, 'RELEASE_ARTIFACTS');
if (!fs.existsSync(releaseDest)) {
  fs.mkdirSync(releaseDest, { recursive: true });
}

const aabSrc = path.join(rootDir, 'android', 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
const apkSrc = path.join(rootDir, 'public', 'aspirantx.apk');
const privacySrc = path.join(rootDir, 'public', 'privacy.html');
const guideSrc = path.join(rootDir, 'PLAY_STORE_RELEASE_GUIDE.md');

if (fs.existsSync(aabSrc)) fs.copyFileSync(aabSrc, path.join(releaseDest, 'app-release.aab'));
if (fs.existsSync(apkSrc)) fs.copyFileSync(apkSrc, path.join(releaseDest, 'aspirantx.apk'));
if (fs.existsSync(privacySrc)) fs.copyFileSync(privacySrc, path.join(releaseDest, 'privacy.html'));
if (fs.existsSync(guideSrc)) fs.copyFileSync(guideSrc, path.join(releaseDest, 'PLAY_STORE_RELEASE_GUIDE.md'));

// Calculate staged total uncompressed size
function getDirSize(dir) {
  let size = 0;
  for (const item of fs.readdirSync(dir)) {
    const p = path.join(dir, item);
    const s = fs.statSync(p);
    if (s.isDirectory()) size += getDirSize(p);
    else size += s.size;
  }
  return size;
}

const uncompressedMb = (getDirSize(stageDir) / (1024 * 1024)).toFixed(2);
console.log(`Clean staged uncompressed total size: ${uncompressedMb} MB`);

console.log('\n--- Creating Highly Compressed ZIP (Optimal Compression) ---');
if (fs.existsSync(outputZip)) {
  fs.unlinkSync(outputZip);
}

// Use powershell Compress-Archive with -CompressionLevel Optimal
execSync(
  `powershell -NoProfile -Command "Compress-Archive -Path '${stageDir}\\*' -DestinationPath '${outputZip}' -CompressionLevel Optimal -Force"`,
  { stdio: 'inherit' }
);

const zipSizeMb = (fs.statSync(outputZip).size / (1024 * 1024)).toFixed(2);
console.log(`\n>>> Highly Compressed ZIP Created: ${outputZip}`);
console.log(`>>> Compressed File Size: ${zipSizeMb} MB (Reduced from 307 MB!)`);

// Cleanup staging
fs.rmSync(stageDir, { recursive: true, force: true });
console.log('Temporary staging directory cleaned up.');
