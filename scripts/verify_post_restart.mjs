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
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'aspirantx_ultra_secure_jwt_secret_key_2026';
const DATABASE_URL = process.env.DATABASE_URL;

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function verifyRestart() {
  console.log('=== POST-RESTART API & NEON PERSISTENCE VERIFICATION ===');
  
  // 1. Task Verification for User A
  const userA_id = '6f5e0712-5be9-4036-a0ab-c8dadf00c811';
  const userA_token = jwt.sign(
    { sub: userA_id, email: 'userA_audit@example.com', role: 'STUDENT' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  const tasksApiRes = await fetch(`${BASE_URL}/api/user/tasks`, {
    headers: { 'Authorization': `Bearer ${userA_token}` }
  });
  const tasksApiData = await tasksApiRes.json();
  const taskInApi = (tasksApiData.tasks || []).find(t => t.id === 'probe_1790073566139');
  
  const taskInNeon = await pool.query(`SELECT id, user_id, title, created_at FROM public.user_tasks WHERE id = 'probe_1790073566139'`);

  console.log('1. TASK POST-RESTART:');
  console.log('  API HTTP Status:', tasksApiRes.status);
  console.log('  Found in API:', Boolean(taskInApi));
  console.log('  API Record:', taskInApi);
  console.log('  Found in Neon:', taskInNeon.rows.length > 0);
  console.log('  Neon Record:', taskInNeon.rows[0]);

  // 2. Flashcard Verification for User Flashcard
  const userFC_id = '1ea0fe34-0b66-4c5c-8279-ce2e71e90efd';
  const userFC_token = jwt.sign(
    { sub: userFC_id, email: 'userFC_audit@example.com', role: 'STUDENT' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const fcApiRes = await fetch(`${BASE_URL}/api/academic/flashcards?exam=UPSC`, {
    headers: { 'Authorization': `Bearer ${userFC_token}` }
  });
  const fcApiData = await fcApiRes.json();
  const cardInApi = (fcApiData.flashcards || []).find(c => c.id === 'fc_1790073572426_e2b77397');
  
  const cardInNeon = await pool.query(`SELECT id, user_id, question, answer FROM public.flashcards WHERE id = 'fc_1790073572426_e2b77397'`);
  const reviewInNeon = await pool.query(`SELECT id, card_id, leitner_box, review_count FROM public.flashcard_reviews WHERE card_id = 'fc_1790073572426_e2b77397'`);

  console.log('\n2. FLASHCARD POST-RESTART:');
  console.log('  API HTTP Status:', fcApiRes.status);
  console.log('  Found in API:', Boolean(cardInApi));
  console.log('  API Record:', cardInApi);
  console.log('  Found in Neon:', cardInNeon.rows.length > 0);
  console.log('  Neon Record:', cardInNeon.rows[0]);
  console.log('  Neon Review Record:', reviewInNeon.rows[0]);

  // 3. Reward Transaction Verification
  const rewardInNeon = await pool.query(`SELECT id, user_id, amount, reference_id, status FROM public.reward_transactions WHERE reference_id = 'adsess_1790073576475_87db47a6'`);
  const totalRewardsCount = await pool.query(`SELECT COUNT(*) FROM public.reward_transactions;`);

  console.log('\n3. REWARD TRANSACTION POST-RESTART:');
  console.log('  Found in Neon:', rewardInNeon.rows.length > 0);
  console.log('  Neon Row:', rewardInNeon.rows[0]);
  console.log('  Total Reward Transactions in Neon:', totalRewardsCount.rows[0].count);

  await pool.end();
}

verifyRestart().catch(console.error);
