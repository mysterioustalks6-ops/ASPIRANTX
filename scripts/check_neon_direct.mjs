import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

try {
  const tables = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name ILIKE '%utr%'"
  );
  console.log('UTR Tables found:', tables.rows.map(r => r.table_name));

  const reqCount = await pool.query('SELECT count(*) FROM public.utr_requests');
  console.log('Total in public.utr_requests:', reqCount.rows[0].count);

  const recent = await pool.query('SELECT id, utr, plan, amount, user_email, status, created_at FROM public.utr_requests ORDER BY created_at DESC LIMIT 5');
  console.log('Recent 5 utr_requests:');
  console.log(JSON.stringify(recent.rows, null, 2));

  if (tables.rows.some(r => r.table_name === 'utr_submissions')) {
    const subCount = await pool.query('SELECT count(*) FROM public.utr_submissions');
    console.log('Total in public.utr_submissions:', subCount.rows[0].count);
  }
} catch (err) {
  console.error('Error querying Neon:', err);
} finally {
  await pool.end();
}
