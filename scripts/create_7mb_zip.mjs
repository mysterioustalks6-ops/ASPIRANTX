import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const root = process.cwd();
const stage = path.join(root, '.tar_stage');

if (fs.existsSync(stage)) {
  fs.rmSync(stage, { recursive: true, force: true });
}
fs.mkdirSync(stage, { recursive: true });

const excludeDirs = new Set([
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
  'scratch_orig_zip'
]);

function copyClean(src, dest) {
  const base = path.basename(src);
  if (excludeDirs.has(base)) return;
  if (src.endsWith('.apk') || src.endsWith('.aab') || src.endsWith('.zip')) return;
  if (base === 'server.js') return; // 28MB bundle
  if (src.includes(path.join('android', 'app', 'src', 'main', 'assets', 'public'))) return; // synced web duplicates
  if (src.includes(path.join('android', 'app', 'build'))) return;
  if (src.includes(path.join('android', '.gradle'))) return;
  if (src.includes(path.join('android', 'build'))) return;

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

console.log('--- Staging Clean Source Code ---');
for (const entry of fs.readdirSync(root)) {
  copyClean(path.join(root, entry), path.join(stage, entry));
}

const zipOut = path.join(root, 'AspirantX-FocusGalaxy-Final.zip');
if (fs.existsSync(zipOut)) {
  fs.unlinkSync(zipOut);
}

console.log('--- Compressing with tar.exe (Zip format with optimal deflate) ---');
execSync(`tar -a -c -f "${zipOut}" -C "${stage}" .`, { stdio: 'inherit' });

const finalZipSize = (fs.statSync(zipOut).size / (1024 * 1024)).toFixed(2);
console.log(`\n🎉 Success! Target ZIP created at: ${zipOut}`);
console.log(`📦 Final Compressed Size: ${finalZipSize} MB`);

fs.rmSync(stage, { recursive: true, force: true });
console.log('Cleaned up staging folder.');
