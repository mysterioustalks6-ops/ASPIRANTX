import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const BUNDLE_PATH = path.resolve('kage-bundle.json');

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function run() {
  const bundle = JSON.parse(fs.readFileSync(BUNDLE_PATH, 'utf8'));
  console.log(`Verifying registered source bundle: ${bundle.id}`);

  let verifiedCount = 0;
  let errorCount = 0;

  // 1. Process files
  for (const f of bundle.files) {
    const targetPath = path.resolve(f.path);

    // If file doesn't exist, try copying from node_modules/@designcodeio/threeui/lib-dist/assets
    if (!fs.existsSync(targetPath)) {
      if (f.code) {
        ensureDir(targetPath);
        fs.writeFileSync(targetPath, f.code, 'utf8');
      } else {
        const fallbackPath = path.resolve('node_modules/@designcodeio/threeui/lib-dist/assets', f.path.replace(/^public\//, ''));
        if (fs.existsSync(fallbackPath)) {
          ensureDir(targetPath);
          fs.writeFileSync(targetPath, fs.readFileSync(fallbackPath));
        }
      }
    }

    if (!fs.existsSync(targetPath)) {
      console.error(`[FILE MISSING] ${f.path}`);
      errorCount++;
      continue;
    }

    const data = fs.readFileSync(targetPath);
    const hash = sha256(data);
    if (hash === f.sha256) {
      console.log(`[FILE OK] ${f.path} (SHA-256: ${hash})`);
      verifiedCount++;
    } else {
      console.error(`[FILE HASH MISMATCH] ${f.path}`);
      console.error(`  Expected: ${f.sha256}`);
      console.error(`  Got:      ${hash}`);
      errorCount++;
    }
  }

  // 2. Process binary assets
  for (const a of bundle.assets) {
    const targetPath = path.resolve(a.path);

    if (!fs.existsSync(targetPath)) {
      const fallbackPath = path.resolve('node_modules/@designcodeio/threeui/lib-dist/assets', a.path.replace(/^public\//, ''));
      if (fs.existsSync(fallbackPath)) {
        ensureDir(targetPath);
        fs.writeFileSync(targetPath, fs.readFileSync(fallbackPath));
      }
    }

    if (!fs.existsSync(targetPath)) {
      console.error(`[ASSET MISSING] ${a.path}`);
      errorCount++;
      continue;
    }

    const data = fs.readFileSync(targetPath);
    const hash = sha256(data);
    if (hash === a.sha256 && data.length === a.bytes) {
      console.log(`[ASSET OK] ${a.path} (${data.length} bytes, SHA-256: ${hash})`);
      verifiedCount++;
    } else {
      console.error(`[ASSET ERROR] ${a.path}: got ${hash} (${data.length} bytes), expected ${a.sha256} (${a.bytes} bytes)`);
      errorCount++;
    }
  }

  console.log(`\nVerification finished: ${verifiedCount} verified, ${errorCount} errors.`);
  if (errorCount > 0) {
    process.exit(1);
  }
}

run();
