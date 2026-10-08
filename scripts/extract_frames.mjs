import { execSync } from 'child_process';
import fs from 'fs';

const FFMPEG = '"C:\\Users\\AMBUJ YADAV\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe"';

if (!fs.existsSync('artifacts/frames')) {
  fs.mkdirSync('artifacts/frames', { recursive: true });
}

// Extract frames between 5.5s and 10.0s at 5 fps
console.log('Extracting frames between 5.5s and 10.0s...');
execSync(`${FFMPEG} -y -ss 00:00:05.500 -to 00:00:10.000 -i public/assets/videos/relax_highway.mp4 -vf fps=5 artifacts/frames/frame_%03d.png`, { stdio: 'inherit' });
console.log('Frames extracted to artifacts/frames/');
