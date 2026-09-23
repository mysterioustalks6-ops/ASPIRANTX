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

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fix() {
  console.log('Inspecting columns for public.user_wallets...');
  const cols = await pool.query(`
    SELECT column_name, is_nullable, column_default 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_wallets';
  `);
  console.log('Columns user_wallets:', cols.rows);

  console.log('Fixing constraints on public.user_wallets...');
  await pool.query(`
    ALTER TABLE public.user_wallets ALTER COLUMN data DROP NOT NULL;
    ALTER TABLE public.user_wallets ALTER COLUMN data SET DEFAULT '{}'::jsonb;
  `);

  console.log('Fixing constraints on public.wallet_transactions...');
  await pool.query(`
    ALTER TABLE public.wallet_transactions ALTER COLUMN data DROP NOT NULL;
    ALTER TABLE public.wallet_transactions ALTER COLUMN data SET DEFAULT '{}'::jsonb;
  `);

  console.log('Fixing constraints on public.utr_requests...');
  await pool.query(`
    ALTER TABLE public.utr_requests ALTER COLUMN data DROP NOT NULL;
    ALTER TABLE public.utr_requests ALTER COLUMN data SET DEFAULT '{}'::jsonb;
  `);

  console.log('Schema constraints updated successfully.');
  await pool.end();
}

fix().catch(err => {
  console.error('Error fixing schema:', err);
  process.exit(1);
});
