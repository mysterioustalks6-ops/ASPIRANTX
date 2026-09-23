import fs from 'fs';
import path from 'path';

const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.git', 'dist'].includes(entry.name)) walk(full);
    } else if (/\.(ts|tsx|js|mjs|sql)$/.test(entry.name)) {
      files.push(full);
    }
  }
}
walk('.');

const tables = new Set();
for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  const matches = content.matchAll(/\.from\(['"]([a-zA-Z0-9_]+)['"]\)/g);
  for (const m of matches) {
    tables.add(m[1]);
  }
}

console.log('ALL REFERENCED TABLES (' + tables.size + '):');
console.log(JSON.stringify(Array.from(tables).sort(), null, 2));
