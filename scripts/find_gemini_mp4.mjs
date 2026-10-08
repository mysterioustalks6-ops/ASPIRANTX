import fs from 'fs';
import path from 'path';

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      walk(full);
    } else if (item.name.endsWith('.mp4')) {
      const stat = fs.statSync(full);
      console.log(`MP4: ${full} (${stat.size} bytes)`);
    }
  }
}

const geminiDir = 'C:\\Users\\AMBUJ YADAV\\.gemini';
walk(geminiDir);
