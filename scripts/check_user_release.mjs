import 'dotenv/config';
import pg from 'pg';

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const res = await pool.query("SELECT id, email, created_at FROM auth.users WHERE email LIKE '%release_gate%' ORDER BY created_at DESC LIMIT 5");
  console.log('Found users in Neon:', res.rows);
  await pool.end();
}

main().catch(console.error);
