import dotenv from 'dotenv';
dotenv.config();

console.log('--- PHASE 1: SERVER CREDENTIAL AUDIT ---');

const hasUrl = Boolean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY);
const viteServiceRole = Boolean(process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SECRET_KEY);

console.log('SUPABASE_URL present:', hasUrl);
console.log('SUPABASE_SERVICE_ROLE_KEY present:', hasServiceRole);
console.log('VITE service-role credential leaked in env:', viteServiceRole);

if (!hasUrl || !hasServiceRole) {
  console.error('FAILED: Server credentials missing');
  process.exit(1);
}

if (viteServiceRole) {
  console.error('FAILED: VITE prefix leaks service role to client!');
  process.exit(1);
}

console.log('PHASE 1 PASSED: Legitimate server-only service-role credential configured securely.');
