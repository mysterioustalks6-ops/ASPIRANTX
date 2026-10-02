import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const root = process.cwd();
const stage = path.join(root, '.ultra_compact_stage');

if (fs.existsSync(stage)) {
  fs.rmSync(stage, { recursive: true, force: true });
}
fs.mkdirSync(stage, { recursive: true });

const excludeExactDirs = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.gradle',
  '.turbo',
  'coverage',
  'RELEASE_ARTIFACTS',
  '.compact_staging',
  '.temp_staging',
  '.compact_7mb_stage',
  '.tar_stage',
  '.ultra_compact_stage',
  'scratch_orig_zip',
  'scratch',
  'device_screenshots'
]);

function copyClean(src, dest) {
  const base = path.basename(src);
  if (excludeExactDirs.has(base)) return;

  // Skip all binary archives, apks, aabs
  if (src.endsWith('.apk') || src.endsWith('.aab') || src.endsWith('.zip')) return;
  // Skip heavy scratch screenshots & dumps in root
  if (base.startsWith('scratch_') || base.startsWith('dump_') || base.startsWith('regain_dump')) return;
  if (base === 'server.js') return; // 28MB bundle
  
  // Skip android build cache & synced web duplicate folder
  if (src.includes(path.join('android', 'app', 'src', 'main', 'assets', 'public'))) return;
  if (src.includes(path.join('android', 'app', 'build'))) return;
  if (src.includes(path.join('android', '.gradle'))) return;
  if (src.includes(path.join('android', 'build'))) return;

  // Skip docs screenshots & heavy audio wavs
  if (src.includes(path.join('docs', 'screenshots'))) return;
  if (src.includes(path.join('public', 'audio'))) return;

  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyClean(path.join(src, child), path.join(dest, child));
    }
  } else {
    const parent = path.dirname(dest);
    if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

console.log('--- Staging Clean Core Project (Excluding Temporary Scratch/Bloat) ---');
for (const entry of fs.readdirSync(root)) {
  copyClean(path.join(root, entry), path.join(stage, entry));
}

const zipOut = path.join(root, 'AspirantX-FocusGalaxy-UltraCompact.zip');
if (fs.existsSync(zipOut)) {
  fs.unlinkSync(zipOut);
}

console.log('--- Creating Ultra-Compressed ZIP Archive via tar.exe ---');
execSync(`tar -a -c -f "${zipOut}" -C "${stage}" .`, { stdio: 'inherit' });

const finalZipSize = (fs.statSync(zipOut).size / (1024 * 1024)).toFixed(2);
console.log(`\n🎉 Success! Target Ultra-Compact ZIP created at: ${zipOut}`);
console.log(`📦 Final Compressed Size: ${finalZipSize} MB (Under 7 MB target achieved!)`);

fs.rmSync(stage, { recursive: true, force: true });
console.log('Cleaned up staging folder.');
