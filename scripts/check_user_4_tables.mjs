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
    // 1. Tables & Columns
    const tbls = await client.query(`
      SELECT table_name, count(column_name) as col_count
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name IN ('flashcards', 'flashcard_reviews', 'reward_transactions', 'user_tasks')
      GROUP BY table_name
      ORDER BY table_name;
    `);
    console.log('TABLES & COLUMNS:', tbls.rows);

    // 2. Indexes
    const idxs = await client.query(`
      SELECT tablename, indexname
      FROM pg_indexes
      WHERE schemaname = 'public' AND tablename IN ('flashcards', 'flashcard_reviews', 'reward_transactions', 'user_tasks')
      ORDER BY tablename, indexname;
    `);
    console.log('INDEXES:', idxs.rows);

    // 3. RLS Policies
    const pols = await client.query(`
      SELECT tablename, policyname, cmd
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename IN ('flashcards', 'flashcard_reviews', 'reward_transactions', 'user_tasks')
      ORDER BY tablename, policyname;
    `);
    console.log('RLS POLICIES:', pols.rows);

    // 4. Live Row Counts
    const r1 = await client.query('SELECT count(*) FROM public.flashcards');
    const r2 = await client.query('SELECT count(*) FROM public.flashcard_reviews');
    const r3 = await client.query('SELECT count(*) FROM public.reward_transactions');
    const r4 = await client.query('SELECT count(*) FROM public.user_tasks');
    console.log('LIVE ROW COUNTS:', {
      flashcards: r1.rows[0].count,
      flashcard_reviews: r2.rows[0].count,
      reward_transactions: r3.rows[0].count,
      user_tasks: r4.rows[0].count
    });
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
