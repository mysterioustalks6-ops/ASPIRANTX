import fs from 'fs';
import path from 'path';

function findFiles(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      findFiles(full);
    } else {
      const stat = fs.statSync(full);
      if (stat.size > 2000000 && stat.size < 10000000) {
        console.log(`Found candidate: ${full} (${stat.size} bytes)`);
      }
    }
  }
}

console.log('Searching .git/lost-found...');
findFiles('.git/lost-found');
console.log('Searching .git/objects...');
findFiles('.git/objects');
console.log('Done.');
