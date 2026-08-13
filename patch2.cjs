const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  `app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',`,
  `app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    supabaseUrl: Boolean(process.env.VITE_SUPABASE_URL),
    supabaseKey: Boolean(process.env.VITE_SUPABASE_ANON_KEY),
    isSupabaseDbConfigured,
    supabaseServerExists: Boolean(supabaseServer),`
);

fs.writeFileSync('server.ts', code);
console.log('Patched health');
