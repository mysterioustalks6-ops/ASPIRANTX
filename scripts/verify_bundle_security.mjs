import { readdirSync, readFileSync } from 'fs';
import path from 'path';

const distAssetsDir = path.resolve('dist/assets');
const files = readdirSync(distAssetsDir).filter(f => f.endsWith('.js'));

console.log(`Scanning ${files.length} JS production bundles for leaked secrets...`);

// We check for signature patterns of service_role keys, private keys, or server secrets
const patterns = [
  { name: 'Service Role Identifier in bundle', regex: /service_role/i },
  { name: 'Supabase Service Key header in bundle', regex: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.iwzdrhaN/ },
  { name: 'Database Secret Key pattern', regex: /SUPABASE_SECRET_KEY|serviceRoleKey/ },
  { name: 'Private Key header', regex: /-----BEGIN PRIVATE KEY-----/ }
];

let leaks = 0;

for (const file of files) {
  const content = readFileSync(path.join(distAssetsDir, file), 'utf8');
  for (const p of patterns) {
    if (p.regex.test(content)) {
      console.error(`🚨 SECURITY ALERT: Leaked pattern "${p.name}" found in ${file}!`);
      leaks++;
    }
  }
}

if (leaks === 0) {
  console.log('✅ GATE 12 SECURITY AUDIT PASSED: Zero private secrets or service-role keys found in production frontend bundles.');
} else {
  console.error(`❌ GATE 12 FAILED: ${leaks} secret leak(s) detected.`);
  process.exit(1);
}
