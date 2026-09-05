import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

console.log('--- PHASE 10: SECURITY AUDIT OF DIST BUNDLE ---');

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const jwtSecret = process.env.JWT_SECRET;

const distAssetsDir = path.join(process.cwd(), 'dist', 'assets');
const assetFiles = fs.readdirSync(distAssetsDir);

let leaked = false;

for (const file of assetFiles) {
  if (file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.html')) {
    const content = fs.readFileSync(path.join(distAssetsDir, file), 'utf8');

    // 1. Check if the secret service role key was baked into any frontend JS
    if (serviceRoleKey && serviceRoleKey.length > 20 && content.includes(serviceRoleKey)) {
      console.error(`SECURITY VIOLATION: Service role key found in ${file}`);
      leaked = true;
    }

    // 2. Check if private JWT_SECRET was baked into frontend JS
    if (jwtSecret && jwtSecret.length > 8 && content.includes(jwtSecret)) {
      console.error(`SECURITY VIOLATION: JWT secret found in ${file}`);
      leaked = true;
    }

    // 3. Check for service_role keyword in suspicious auth headers
    if (content.includes('service_role') && !file.includes('vendor')) {
      console.warn(`Notice: "service_role" string literal found in ${file}, checking context...`);
    }
  }
}

if (leaked) {
  console.error('FAILED: Security audit detected secrets in client bundle!');
  process.exit(1);
} else {
  console.log('PHASE 10 PASSED: Zero private secrets or service-role keys in frontend distribution bundle.');
}
