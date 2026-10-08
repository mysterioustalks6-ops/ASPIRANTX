import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const FFMPEG = '"C:\\Users\\AMBUJ YADAV\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe"';
const originalVideo = 'C:\\Users\\AMBUJ YADAV\\.gemini\\antigravity-ide\\brain\\8323361e-673a-4711-a9b1-90a4405edb1e\\.tempmediaStorage\\media_1791386482080.mp4';

console.log('--- Creating Pure Continuous Cruising Video (No transitions, Zero Stutter) ---');

// 1. Cut the exact continuous riding section: from 6.6s to 10.0s (3.4s)
// Use keyframe interval = 12 (0.5s), no B-frames (-bf 0) for instantaneous decoding on mobile!
const singleClip = 'artifacts/cruise_clean_single.mp4';
execSync(`${FFMPEG} -y -ss 00:00:06.600 -to 00:00:10.000 -i "${originalVideo}" -c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.0 -preset fast -crf 20 -g 12 -bf 0 -movflags +faststart -an "${singleClip}"`, { stdio: 'inherit' });

// 2. Concatenate the clean clip 6 times directly (NO TRANSITIONS, completely continuous forward stream)
// Total duration = 3.4s * 6 = ~20.4 seconds of uninterrupted, seamless cruising!
const concatList = 'artifacts/concat_continuous.txt';
const absPath = path.resolve(singleClip).replace(/\\/g, '/');
let listContent = '';
for (let i = 0; i < 6; i++) {
  listContent += `file '${absPath}'\n`;
}
fs.writeFileSync(concatList, listContent);

const outputVideo = 'public/assets/videos/relax_highway.mp4';
execSync(`${FFMPEG} -y -f concat -safe 0 -i "${concatList}" -c copy -movflags +faststart "${outputVideo}"`, { stdio: 'inherit' });

console.log('Output Video created:', outputVideo);
console.log('Size:', fs.statSync(outputVideo).size, 'bytes');

// Also copy directly to dist and android assets
fs.copyFileSync(outputVideo, 'dist/assets/videos/relax_highway.mp4');
fs.copyFileSync(outputVideo, 'android/app/src/main/assets/public/assets/videos/relax_highway.mp4');
console.log('Copied to dist and android assets successfully!');
