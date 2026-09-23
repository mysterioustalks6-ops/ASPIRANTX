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
import jwt from 'jsonwebtoken';
import { readFileSync, writeFileSync } from 'fs';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const BASE_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

const mode = process.argv[2] || 'pre'; // 'pre' or 'post'

async function run() {
  if (mode === 'pre') {
    console.log('=== PHASE 1: PRE-RESTART DATA CREATION ===');
    const testUser = {
      id: `usr_restart_test_${Date.now()}`,
      email: `restart_${Date.now()}@aspirant.dev`,
      role: 'USER'
    };
    const token = createToken({ sub: testUser.id, email: testUser.email, role: testUser.role });
    const adminToken = createToken({ sub: 'admin_1', email: 'admin@aspirant.dev', role: 'ADMIN' });

    // 1. Create wallet via API
    const wRes = await fetch(`${BASE_URL}/api/wallet/${testUser.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const wData = await wRes.json();
    console.log('Pre-restart wallet created:', wData);

    // 2. Submit UTR via API
    const testUtr = `RESTARTUTR${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;
    const uRes = await fetch(`${BASE_URL}/api/payments/utr-submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        utr: testUtr,
        plan: 'monthly',
        amount: 499,
        userEmail: testUser.email,
        userName: 'Restart Test User'
      })
    });
    const uData = await uRes.json();
    console.log('Pre-restart UTR submitted:', uData);

    // 3. Verify Neon rows exist
    const dbWallet = await pool.query('SELECT * FROM public.user_wallets WHERE user_id = $1', [testUser.id]);
    const dbUtr = await pool.query('SELECT * FROM public.utr_requests WHERE utr = $1', [testUtr]);

    console.log('Direct Neon wallet rows:', dbWallet.rows.length);
    console.log('Direct Neon UTR rows:', dbUtr.rows.length);

    // Save checkpoint
    const checkpoint = {
      testUser,
      token,
      adminToken,
      testUtr,
      walletRow: dbWallet.rows[0],
      utrRow: dbUtr.rows[0]
    };
    writeFileSync('scripts/restart_checkpoint.json', JSON.stringify(checkpoint, null, 2));
    console.log('Checkpoint saved to scripts/restart_checkpoint.json.');
  } else if (mode === 'post') {
    console.log('=== PHASE 2: POST-RESTART VERIFICATION ===');
    const checkpoint = JSON.parse(readFileSync('scripts/restart_checkpoint.json', 'utf8'));

    // 1. Read wallet through API after restart
    const wRes = await fetch(`${BASE_URL}/api/wallet/${checkpoint.testUser.id}`, {
      headers: { Authorization: `Bearer ${checkpoint.token}` }
    });
    const wData = await wRes.json();
    console.log('Post-restart wallet API response:', wData);

    // 2. Read UTR through admin API after restart
    const uRes = await fetch(`${BASE_URL}/api/admin/utr/requests`, {
      headers: { Authorization: `Bearer ${checkpoint.adminToken}` }
    });
    const uData = await uRes.json();
    const foundUtr = (uData.requests || []).find(r => r.utr === checkpoint.testUtr);
    console.log('Post-restart UTR in Admin API:', foundUtr);

    // 3. Direct Neon SQL verification
    const dbWallet = await pool.query('SELECT * FROM public.user_wallets WHERE user_id = $1', [checkpoint.testUser.id]);
    const dbUtr = await pool.query('SELECT * FROM public.utr_requests WHERE utr = $1', [checkpoint.testUtr]);

    const walletMatches = 
      wData.success === true &&
      wData.data.userId === checkpoint.testUser.id &&
      Number(wData.data.balance) === Number(checkpoint.walletRow.balance) &&
      Number(wData.data.coins) === Number(checkpoint.walletRow.coins);

    const utrMatches = 
      foundUtr !== undefined &&
      foundUtr.utr === checkpoint.testUtr &&
      foundUtr.id === checkpoint.utrRow.id &&
      foundUtr.status === checkpoint.utrRow.status;

    console.log('\n--- RESTART PERSISTENCE AUDIT SUMMARY ---');
    console.log(`Wallet data survives restart identically: ${walletMatches}`);
    console.log(`UTR data survives restart identically: ${utrMatches}`);
    console.log(`Neon direct wallet row verified: ${dbWallet.rows.length === 1}`);
    console.log(`Neon direct UTR row verified: ${dbUtr.rows.length === 1}`);

    const allPassed = walletMatches && utrMatches && dbWallet.rows.length === 1 && dbUtr.rows.length === 1;
    console.log(`\nALL RESTART PERSISTENCE TESTS PASSED: ${allPassed}`);
    if (!allPassed) process.exit(1);
  }

  await pool.end();
}

run().catch(err => {
  console.error('Restart test error:', err);
  process.exit(1);
});
