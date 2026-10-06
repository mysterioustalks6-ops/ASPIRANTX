import { execSync } from 'child_process';

console.log('[build:android] Starting Android production build with CAPACITOR_BUILD=1...');
process.env.CAPACITOR_BUILD = '1';

try {
  execSync('npm run build', { 
    stdio: 'inherit', 
    env: { ...process.env, CAPACITOR_BUILD: '1' } 
  });
  console.log('[build:android] Running Capacitor Android sync...');
  execSync('npx cap sync android', { 
    stdio: 'inherit', 
    env: { ...process.env, CAPACITOR_BUILD: '1' } 
  });
  console.log('[build:android] Complete.');
} catch (err) {
  console.error('[build:android] Build failed:', err.message);
  process.exit(1);
}
