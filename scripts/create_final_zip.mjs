import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const rootDir = process.cwd();
const releaseDir = path.join(rootDir, 'RELEASE_ARTIFACTS');
const zipReleaseOnly = path.join(rootDir, 'AspirantX-FocusGalaxy-PlayStore-Bundle.zip');
const zipCompleteProject = path.join(rootDir, 'AspirantX-FocusGalaxy-Production-Source.zip');

console.log('--- Creating RELEASE_ARTIFACTS Directory ---');
if (!fs.existsSync(releaseDir)) {
  fs.mkdirSync(releaseDir, { recursive: true });
}

// Files to copy into RELEASE_ARTIFACTS
const artifacts = [
  {
    src: path.join(rootDir, 'android', 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab'),
    dest: path.join(releaseDir, 'app-release.aab')
  },
  {
    src: path.join(rootDir, 'public', 'aspirantx.apk'),
    dest: path.join(releaseDir, 'aspirantx.apk')
  },
  {
    src: path.join(rootDir, 'public', 'privacy.html'),
    dest: path.join(releaseDir, 'privacy.html')
  },
  {
    src: path.join(rootDir, 'PLAY_STORE_RELEASE_GUIDE.md'),
    dest: path.join(releaseDir, 'PLAY_STORE_RELEASE_GUIDE.md')
  }
];

for (const item of artifacts) {
  if (fs.existsSync(item.src)) {
    fs.copyFileSync(item.src, item.dest);
    const sizeMb = (fs.statSync(item.dest).size / (1024 * 1024)).toFixed(2);
    console.log(`Copied: ${path.basename(item.dest)} (${sizeMb} MB)`);
  } else {
    console.warn(`Missing source: ${item.src}`);
  }
}

console.log('\n--- Creating PlayStore Release Artifacts ZIP ---');
if (fs.existsSync(zipReleaseOnly)) {
  fs.unlinkSync(zipReleaseOnly);
}

// Use powershell Compress-Archive for the release artifacts
try {
  execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${releaseDir}\\*' -DestinationPath '${zipReleaseOnly}' -Force"`, {
    stdio: 'inherit'
  });
  const zipSize = (fs.statSync(zipReleaseOnly).size / (1024 * 1024)).toFixed(2);
  console.log(`Successfully created: AspirantX-FocusGalaxy-PlayStore-Bundle.zip (${zipSize} MB)`);
} catch (e) {
  console.error('Failed to create PlayStore zip:', e.message);
}

console.log('\n--- Preparing Clean Project Snapshot for Source ZIP ---');
// Stage source files excluding huge directories (node_modules, .git, .next, dist, android/app/build/intermediates, android/.gradle)
const stageDir = path.join(rootDir, '.temp_staging');
if (fs.existsSync(stageDir)) {
  fs.rmSync(stageDir, { recursive: true, force: true });
}
fs.mkdirSync(stageDir, { recursive: true });

const excludeDirs = new Set([
  'node_modules',
  '.git',
  '.next',
  '.temp_staging',
  'build',
  '.gradle',
  '.turbo',
  'coverage'
]);

function copyDirRecursive(src, dest) {
  const base = path.basename(src);
  if (excludeDirs.has(base)) return;
  
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (excludeDirs.has(entry.name)) continue;
    // Skip large zip files in root
    if (entry.name.endsWith('.zip')) continue;

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // For android/app/build, skip everything except outputs/bundle/release and outputs/apk/release
      if (srcPath.includes(path.join('android', 'app', 'build'))) {
        continue;
      }
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy source project
console.log('Staging files...');
copyDirRecursive(rootDir, stageDir);

// Copy RELEASE_ARTIFACTS into staging directory as well
copyDirRecursive(releaseDir, path.join(stageDir, 'RELEASE_ARTIFACTS'));

console.log('\n--- Creating Full Production Source ZIP ---');
if (fs.existsSync(zipCompleteProject)) {
  fs.unlinkSync(zipCompleteProject);
}

try {
  execSync(`powershell -NoProfile -Command "Compress-Archive -Path '${stageDir}\\*' -DestinationPath '${zipCompleteProject}' -Force"`, {
    stdio: 'inherit'
  });
  const fullZipSize = (fs.statSync(zipCompleteProject).size / (1024 * 1024)).toFixed(2);
  console.log(`Successfully created: AspirantX-FocusGalaxy-Production-Source.zip (${fullZipSize} MB)`);
} catch (e) {
  console.error('Failed to create complete project zip:', e.message);
} finally {
  // Clean up temp staging directory
  if (fs.existsSync(stageDir)) {
    fs.rmSync(stageDir, { recursive: true, force: true });
  }
}

console.log('\n--- ALL PACKAGING COMPLETED SUCCESSFULLY ---');
