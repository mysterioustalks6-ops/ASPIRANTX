import { execSync } from 'child_process';
import http from 'http';

const ADB = '"C:\\Users\\AMBUJ YADAV\\AppData\\Local\\Android\\Sdk\\platform-tools\\adb.exe" -s 10BD570GL500057';
const unix = execSync(`${ADB} shell cat /proc/net/unix`, { encoding: 'utf-8' });
const match = unix.match(/@(webview_devtools_remote_\d+)/);
console.log('Socket:', match ? match[1] : 'none');
if (match) {
  execSync(`${ADB} forward tcp:9222 localabstract:${match[1]}`);
  http.get('http://127.0.0.1:9222/json', (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => console.log('Pages:', d));
  });
}
