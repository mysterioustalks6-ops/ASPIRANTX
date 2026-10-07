import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const SRC_IMAGE = 'C:/Users/AMBUJ YADAV/.gemini/antigravity-ide/brain/3fc6a120-a4e1-424f-a3e4-12fe899fc95a/.user_uploaded/media_1791342744818.png';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const imgBase64 = fs.readFileSync(SRC_IMAGE).toString('base64');

  const processedDataUrl = await page.evaluate(async (base64) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Flood fill from corners to only remove outer background (prevent clearing whites of eyes or helmet reflection)
        const w = canvas.width;
        const h = canvas.height;
        const visited = new Uint8Array(w * h);
        const queue = [];

        // Check if pixel at (x, y) is near-white background
        function isBg(idx) {
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          return r > 240 && g > 240 && b > 240;
        }

        // Push border pixels
        for (let x = 0; x < w; x++) {
          queue.push(x, 0);
          queue.push(x, h - 1);
        }
        for (let y = 0; y < h; y++) {
          queue.push(0, y);
          queue.push(w - 1, y);
        }

        let minX = w, maxX = 0, minY = h, maxY = 0;

        let qHead = 0;
        while (qHead < queue.length) {
          const x = queue[qHead++];
          const y = queue[qHead++];
          if (x < 0 || x >= w || y < 0 || y >= h) continue;
          const pos = y * w + x;
          if (visited[pos]) continue;
          visited[pos] = 1;

          const idx = pos * 4;
          if (isBg(idx)) {
            // Make transparent
            data[idx + 3] = 0;

            queue.push(x + 1, y);
            queue.push(x - 1, y);
            queue.push(x, y + 1);
            queue.push(x, y - 1);
          }
        }

        // Find bounding box of non-transparent content
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            if (data[idx + 3] > 10) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        // Write modified pixels back
        ctx.putImageData(imgData, 0, 0);

        // Crop to bounding box with small padding
        const pad = 4;
        const cropX = Math.max(0, minX - pad);
        const cropY = Math.max(0, minY - pad);
        const cropW = Math.min(w - cropX, (maxX - minX) + pad * 2);
        const cropH = Math.min(h - cropY, (maxY - minY) + pad * 2);

        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = cropW;
        cropCanvas.height = cropH;
        const cropCtx = cropCanvas.getContext('2d');
        cropCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

        resolve(cropCanvas.toDataURL('image/png'));
      };
      img.src = 'data:image/png;base64,' + base64;
    });
  }, imgBase64);

  await browser.close();

  // Save to public assets and src assets
  const outDirs = [
    path.resolve('public/assets/characters'),
    path.resolve('src/assets/characters')
  ];

  for (const dir of outDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const base64Data = processedDataUrl.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync('public/assets/characters/rider.png', base64Data, 'base64');
  fs.writeFileSync('src/assets/characters/rider.png', base64Data, 'base64');

  // Also save original uncropped in public
  fs.copyFileSync(SRC_IMAGE, 'public/assets/characters/rider_raw.png');

  console.log('Successfully saved transparent cropped Rider character to:');
  console.log('- public/assets/characters/rider.png');
  console.log('- src/assets/characters/rider.png');
}

main().catch(console.error);
