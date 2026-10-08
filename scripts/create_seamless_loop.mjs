import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const FFMPEG = '"C:\\Users\\AMBUJ YADAV\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe"';

console.log('--- Creating Hardware-Accelerated Mobile YUV420P Seamless Video ---');

const rawCut = 'artifacts/cruise_raw.mp4';
execSync(`${FFMPEG} -y -ss 00:00:06.600 -to 00:00:10.000 -i public/assets/videos/relax_highway.mp4 -pix_fmt yuv420p -c:v libx264 -crf 22 -preset fast -movflags +faststart -an ${rawCut}`, { stdio: 'inherit' });

// Create seamless unit: length 2.8s
const seamlessUnit = 'artifacts/cruise_seamless_unit.mp4';
const filter = `"[0:v]trim=start=0:end=2.8,setpts=PTS-STARTPTS[a]; [0:v]trim=start=2.8:end=3.4,setpts=PTS-STARTPTS[b]; [b][a]xfade=transition=fade:duration=0.5:offset=0.1,format=yuv420p[outv]"`;

execSync(`${FFMPEG} -y -i ${rawCut} -filter_complex ${filter} -map "[outv]" -pix_fmt yuv420p -c:v libx264 -crf 22 -preset fast -movflags +faststart -an ${seamlessUnit}`, { stdio: 'inherit' });

// 3. Duplicate 4 times into final video so it's ~11.5s seamless loop
const finalVideo = 'public/assets/videos/relax_highway.mp4';
const concatList = 'artifacts/concat_list.txt';
const unitAbs = path.resolve(seamlessUnit).replace(/\\/g, '/');
fs.writeFileSync(concatList, `file '${unitAbs}'\nfile '${unitAbs}'\nfile '${unitAbs}'\nfile '${unitAbs}'\n`);

execSync(`${FFMPEG} -y -f concat -safe 0 -i ${concatList} -c copy -movflags +faststart ${finalVideo}`, { stdio: 'inherit' });

console.log('Successfully generated seamless mobile video:', finalVideo);
console.log('Size:', fs.statSync(finalVideo).size, 'bytes');
