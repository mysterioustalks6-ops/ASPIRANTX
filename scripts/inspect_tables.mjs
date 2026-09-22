import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
const origLookup = dns.lookup;
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
    origLookup(hostname, options, callback);
  });
};

import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  for (const table of ['user_wallets', 'wallet_transactions', 'utr_requests']) {
    const cols = await pool.query(`
      SELECT column_name, data_type, column_default, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position;
    `, [table]);
    console.log(`\n=== Table: ${table} ===`);
    console.log(cols.rows);

    const idx = await pool.query(`
      SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename = $1;
    `, [table]);
    console.log(`Indexes for ${table}:`, idx.rows);
  }
  await pool.end();
}

run().catch(console.error);
