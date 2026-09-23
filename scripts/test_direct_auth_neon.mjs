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
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'aspirantx_ultra_secure_jwt_secret_key_2026';
const DATABASE_URL = process.env.DATABASE_URL;

console.log('--- TESTING DIRECT NEON AUTH & USER CREATION ---');

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  try {
    const testEmail = `testuser_${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    const testName = 'Test Aspirant';

    console.log('1. Testing User Registration directly in Neon...');
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(testPassword, salt, 64).toString('hex');
    const passwordHash = `${salt}:${hash}`;
    const testUserId = crypto.randomUUID();

    // Insert into auth.users
    await client.query(
      'INSERT INTO auth.users (id, email, password_hash, created_at, raw_user_meta_data) VALUES ($1, $2, $3, NOW(), $4)',
      [testUserId, testEmail, passwordHash, JSON.stringify({ name: testName })]
    );
    console.log('✅ User inserted into auth.users in Neon successfully');

    // Insert into user_profiles with ON CONFLICT
    await client.query(
      'INSERT INTO user_profiles (id, xp, coins, level, is_premium, streak_days, updated_at) VALUES ($1, 100, 50, 1, false, 1, NOW()) ON CONFLICT (id) DO UPDATE SET updated_at = NOW()',
      [testUserId]
    );
    console.log('✅ User profile inserted into user_profiles in Neon successfully');

    // 2. Testing Password Verification (Login)
    console.log('2. Testing User Login...');
    const res = await client.query('SELECT id, email, password_hash FROM auth.users WHERE email = $1', [testEmail]);
    if (res.rows.length === 0) throw new Error('User not found');

    const [storedSalt, storedHash] = res.rows[0].password_hash.split(':');
    const verifyHash = crypto.scryptSync(testPassword, storedSalt, 64).toString('hex');
    if (verifyHash !== storedHash) throw new Error('Password mismatch');
    console.log('✅ Password verified with Neon successfully');

    // 3. Testing Internal JWT Issuance & Verification
    console.log('3. Testing JWT Issuance & Cryptographic Verification...');
    const token = jwt.sign(
      { sub: testUserId, email: testEmail, role: 'USER', isPremium: false, iss: 'protrack-auth-server' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.email !== testEmail || decoded.sub !== testUserId) throw new Error('JWT verification mismatch');
    console.log('✅ Internal JWT verified successfully:', { sub: decoded.sub, email: decoded.email, role: decoded.role });

    // Clean up test user
    await client.query('DELETE FROM user_profiles WHERE id = $1', [testUserId]);
    await client.query('DELETE FROM auth.users WHERE id = $1', [testUserId]);
    console.log('✅ Test user cleaned up');

    console.log('\n>>> ALL DIRECT NEON AUTH TESTS PASSED WITHOUT SUPABASE! <<<');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
