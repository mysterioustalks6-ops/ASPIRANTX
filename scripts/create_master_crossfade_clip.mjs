import { execSync } from 'child_process';
import fs from 'fs';

const FFMPEG = '"C:\\Users\\AMBUJ YADAV\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe"';
const originalVideo = 'C:\\Users\\AMBUJ YADAV\\.gemini\\antigravity-ide\\brain\\8323361e-673a-4711-a9b1-90a4405edb1e\\.tempmediaStorage\\media_1791386482080.mp4';

console.log('Generating high-res master clip for Double-Buffer Crossfader...');

// We want a clean clip of cruising highway where the rider is cruising steadily.
// Start: 00:00:07.000 (rider is centered, cruising forward)
// End:   00:00:09.600 (rider is centered, cruising forward)
// Length = 2.6s (or 7.000 to 09.800 = 2.8s)
// Or concatenated 3 times to make a 8.4s clip so crossfades happen every ~8 seconds!
// Having an ~8-second clip with Double Buffer means:
// Player A plays for 7.6s, crossfades 0.4s to Player B, Player B plays for 7.6s, crossfades 0.4s to Player A!
// This gives a calm, long, cinematic cruise with seamless crossfade every 8 seconds!

const unitClip = 'artifacts/master_cruise_unit.mp4';
execSync(`${FFMPEG} -y -ss 00:00:07.000 -to 00:00:09.700 -i "${originalVideo}" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -profile:v high -level 4.1 -g 12 -bf 0 -movflags +faststart -an "${unitClip}"`, { stdio: 'inherit' });

// Concatenate 3 units for a generous 8.1s master track
const concatTxt = 'artifacts/master_concat.txt';
const absPath = fs.realpathSync(unitClip).replace(/\\/g, '/');
fs.writeFileSync(concatTxt, `file '${absPath}'\nfile '${absPath}'\nfile '${absPath}'\n`);

const finalOutput = 'public/assets/videos/relax_highway.mp4';
execSync(`${FFMPEG} -y -f concat -safe 0 -i "${concatTxt}" -c copy -movflags +faststart "${finalOutput}"`, { stdio: 'inherit' });

fs.copyFileSync(finalOutput, 'dist/assets/videos/relax_highway.mp4');
fs.copyFileSync(finalOutput, 'android/app/src/main/assets/public/assets/videos/relax_highway.mp4');

console.log('Created and copied master relax_highway.mp4 successfully!');
