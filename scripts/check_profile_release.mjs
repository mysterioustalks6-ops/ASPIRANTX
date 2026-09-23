import 'dotenv/config';
import pg from 'pg';

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const userId = '64f3c1c7-9bfe-4a35-93d3-1e8b7534875b';
  const profileRes = await pool.query("SELECT * FROM public.user_profiles WHERE id = $1", [userId]);
  console.log('User Profile in Neon:', profileRes.rows);
  const userRes = await pool.query("SELECT id, email, raw_user_meta_data, created_at FROM auth.users WHERE id = $1", [userId]);
  console.log('User in auth.users:', userRes.rows);
  await pool.end();
}

main().catch(console.error);
