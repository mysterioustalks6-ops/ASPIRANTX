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

async function migrate() {
  console.log('=== RUNNING MIGRATION FOR WALLETS AND UTR IN NEON ===');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Alter public.user_wallets
    console.log('1. Altering public.user_wallets...');
    await client.query(`
      ALTER TABLE public.user_wallets
        ADD COLUMN IF NOT EXISTS balance NUMERIC NOT NULL DEFAULT 0.0,
        ADD COLUMN IF NOT EXISTS coins INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS total_earned NUMERIC NOT NULL DEFAULT 0.0,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
    `);
    
    // Add check constraints if not exist
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_user_wallets_balance_nonneg') THEN
          ALTER TABLE public.user_wallets ADD CONSTRAINT chk_user_wallets_balance_nonneg CHECK (balance >= 0);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_user_wallets_coins_nonneg') THEN
          ALTER TABLE public.user_wallets ADD CONSTRAINT chk_user_wallets_coins_nonneg CHECK (coins >= 0);
        END IF;
      END $$;
    `);

    // 2. Alter public.utr_requests
    console.log('2. Altering public.utr_requests...');
    await client.query(`
      ALTER TABLE public.utr_requests
        ADD COLUMN IF NOT EXISTS utr TEXT,
        ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'monthly',
        ADD COLUMN IF NOT EXISTS amount NUMERIC NOT NULL DEFAULT 499,
        ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'PENDING',
        ADD COLUMN IF NOT EXISTS user_email TEXT,
        ADD COLUMN IF NOT EXISTS user_name TEXT,
        ADD COLUMN IF NOT EXISTS processed_by TEXT,
        ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;
    `);

    // Ensure UNIQUE constraint / index on utr
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_utr_requests_utr ON public.utr_requests(utr);
      CREATE INDEX IF NOT EXISTS idx_utr_requests_user_email ON public.utr_requests(user_email);
      CREATE INDEX IF NOT EXISTS idx_utr_requests_status ON public.utr_requests(status);
      CREATE INDEX IF NOT EXISTS idx_utr_requests_created_at ON public.utr_requests(created_at DESC);
    `);

    // 3. Alter public.wallet_transactions
    console.log('3. Altering public.wallet_transactions...');
    await client.query(`
      ALTER TABLE public.wallet_transactions
        ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'credit',
        ADD COLUMN IF NOT EXISTS amount NUMERIC NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed';
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON public.wallet_transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON public.wallet_transactions(created_at DESC);
    `);

    await client.query('COMMIT');
    console.log('Migration successfully applied and committed to Neon PostgreSQL!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed, rolled back:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
