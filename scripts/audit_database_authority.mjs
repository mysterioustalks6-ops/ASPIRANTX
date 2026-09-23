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

async function main() {
  const client = await pool.connect();
  try {
    console.log('=== NEON POSTGRESQL AUTHORITY AUDIT ===');
    
    // Check all public tables
    const allTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log(`Total Public Tables in Neon: ${allTables.rows.length}`);

    const targetTables = [
      'user_profiles',
      'user_tasks',
      'flashcards',
      'flashcard_reviews',
      'user_wallets',
      'reward_transactions',
      'utr_requests',
      'cbt_results',
      'cbt_tests',
      'user_syllabus_progress',
      'classes',
      'class_assignments',
      'assignment_submissions',
      'educators',
      'community_posts',
      'community_groups',
      'community_votes',
      'notifications',
      'pomodoro_sessions',
      'podcasts'
    ];

    for (const t of targetTables) {
      const colRes = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [t]);

      if (colRes.rows.length === 0) {
        console.log(`[MISSING TABLE] public.${t} DOES NOT EXIST in Neon!`);
      } else {
        const countRes = await client.query(`SELECT count(*) as cnt FROM public.${t};`);
        const sampleRes = await client.query(`SELECT * FROM public.${t} LIMIT 1;`);
        console.log(`[TABLE FOUND] public.${t}: ${colRes.rows.length} columns, ${countRes.rows[0].cnt} rows`);
        console.log(`   Columns: ${colRes.rows.map(r => r.column_name).join(', ')}`);
        if (sampleRes.rows.length > 0) {
          console.log(`   Sample Keys: ${Object.keys(sampleRes.rows[0]).join(', ')}`);
        }
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
