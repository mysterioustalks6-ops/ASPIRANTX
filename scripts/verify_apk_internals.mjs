import fs from 'fs';
import crypto from 'crypto';

const apkPath = 'public/aspirantx.apk';
const buf = fs.readFileSync(apkPath);
const hash = crypto.createHash('sha256').update(buf).digest('hex');

console.log('APK Path:', apkPath);
console.log('APK Size:', buf.length, 'bytes');
console.log('SHA256:', hash.toUpperCase());

// Check if buffer contains bytecode class names
const str = buf.toString('latin1');
console.log('Contains AspirantXWallpaperService:', str.includes('AspirantXWallpaperService'));
console.log('Contains HabitEngine:', str.includes('HabitEngine'));
console.log('Contains NativeWallpaperBridge:', str.includes('NativeWallpaperBridge'));
console.log('Contains ACTION_CHANGE_LIVE_WALLPAPER:', str.includes('android.service.wallpaper.CHANGE_LIVE_WALLPAPER'));
console.log('Contains WallpaperManager:', str.includes('android/app/WallpaperManager'));
console.log('Contains mPendingUpdate:', str.includes('pendingUpdate') || str.includes('mPendingUpdate'));
console.log('Contains assets/public/index.html:', str.includes('assets/public/index.html'));
console.log('Contains assets/public/assets/index-Bys43xot.js:', str.includes('index-Bys43xot.js'));
