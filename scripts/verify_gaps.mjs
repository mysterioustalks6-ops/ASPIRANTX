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
  console.log('=== EXACT LIVE NEON SQL QUERIES FOR GAPS ===');

  const testUserId = '080b3031-3db1-46db-bf28-f6060775c68d';
  const testUtr = 'UTR1790074678362';
  const testUtrRecordId = 'utr_1790074680683_83v9';

  // 1. GAP 1: Study Coin Wallet
  const walletRows = await pool.query('SELECT * FROM public.user_wallets WHERE user_id = $1', [testUserId]);
  const walletCount = await pool.query('SELECT COUNT(*) FROM public.user_wallets');
  
  console.log('\n[GAP 1: STUDY COIN WALLET]');
  console.log('Query: SELECT * FROM public.user_wallets WHERE user_id = $1');
  console.log('Tested user_id:', testUserId);
  console.log('Rows returned:', walletRows.rows.length);
  console.log('Row content:', walletRows.rows[0] || 'NO_ROW_FOUND');
  console.log('Total table rows in public.user_wallets:', walletCount.rows[0].count);

  // 2. GAP 2: Premium UTR
  const utrRowsByUtr = await pool.query("SELECT * FROM public.utr_requests WHERE data->>'utr' = $1", [testUtr]);
  const utrRowsById = await pool.query('SELECT * FROM public.utr_requests WHERE id = $1', [testUtrRecordId]);
  const utrCount = await pool.query('SELECT COUNT(*) FROM public.utr_requests');

  console.log('\n[GAP 2: PREMIUM UTR PERSISTENCE]');
  console.log("Query 1: SELECT * FROM public.utr_requests WHERE data->>'utr' = $1");
  console.log('Tested UTR:', testUtr);
  console.log('Rows returned:', utrRowsByUtr.rows.length);
  console.log('Row content:', utrRowsByUtr.rows[0] || 'NO_ROW_FOUND');

  console.log('Query 2: SELECT * FROM public.utr_requests WHERE id = $1');
  console.log('Tested Record ID:', testUtrRecordId);
  console.log('Rows returned:', utrRowsById.rows.length);
  console.log('Row content:', utrRowsById.rows[0] || 'NO_ROW_FOUND');

  console.log('Total table rows in public.utr_requests:', utrCount.rows[0].count);

  await pool.end();
}

run().catch(console.error);
