import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
const defaultLookup = dns.lookup;
dns.lookup = (hostname, options, callback) => {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  dns.resolve4(hostname, (err, addresses) => {
    if (!err && addresses && addresses.length > 0) {
      if (options && options.all) {
        return callback(null, addresses.map(a => ({ address: a, family: 4 })));
      }
      return callback(null, addresses[0], 4);
    }
    defaultLookup(hostname, options, callback);
  });
};

import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const TARGET_TABLES = [
  'user_profiles',
  'user_tasks',
  'user_syllabus_progress',
  'cbt_results',
  'flashcards',
  'flashcard_reviews',
  'user_pomodoro_sessions',
  'community_posts',
  'community_comments',
  'community_groups',
  'user_wallets',
  'reward_transactions',
  'utr_requests',
  'notifications',
  'teacher_classes',
  'class_assignments',
  'assignment_submissions',
  'educators',
  'admin_users',
  'podcasts',
  'books_library',
  'blog_posts',
  'pyqs',
  'question_bank'
];

async function main() {
  const client = await pool.connect();
  try {
    console.log('=== DEEP TABLE AUDIT ===');
    for (const table of TARGET_TABLES) {
      try {
        const countRes = await client.query(`SELECT COUNT(*) as count FROM public.${table};`);
        const count = countRes.rows[0].count;
        const colRes = await client.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position;
        `, [table]);
        const cols = colRes.rows.map(c => `${c.column_name} (${c.data_type})`).join(', ');
        console.log(`\nTable: public.${table} | Count: ${count}`);
        console.log(`Columns: ${cols}`);
        if (parseInt(count, 10) > 0) {
          const sample = await client.query(`SELECT * FROM public.${table} LIMIT 1;`);
          console.log(`Sample Row:`, JSON.stringify(sample.rows[0], null, 2));
        }
      } catch (err) {
        console.log(`Table public.${table} ERROR: ${err.message}`);
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
