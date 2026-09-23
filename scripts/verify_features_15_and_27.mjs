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

async function runTests() {
  console.log('=== STARTING LIVE VERIFICATION FOR FEATURES 15 & 27 ===');

  const results = {
    wallet: {},
    utr: {}
  };

  const testUserA = {
    id: `usr_test_wallet_${Date.now()}_a`,
    email: `wallet_test_a_${Date.now()}@aspirant.dev`,
    role: 'USER'
  };
  const tokenA = createToken({ sub: testUserA.id, email: testUserA.email, role: testUserA.role });

  const testUserB = {
    id: `usr_test_wallet_${Date.now()}_b`,
    email: `wallet_test_b_${Date.now()}@aspirant.dev`,
    role: 'USER'
  };
  const tokenB = createToken({ sub: testUserB.id, email: testUserB.email, role: testUserB.role });

  const adminUser = {
    id: `usr_admin_${Date.now()}`,
    email: 'admin@aspirant.dev',
    role: 'ADMIN'
  };
  const adminToken = createToken({ sub: adminUser.id, email: adminUser.email, role: adminUser.role });

  // -------------------------------------------------------------
  // FEATURE 15: STUDY COIN WALLET
  // -------------------------------------------------------------
  console.log('\n--- [FEATURE 15] STUDY COIN WALLET TESTS ---');

  // Test 15.1: Negative - Unauthenticated read
  console.log('15.1 Testing unauthenticated read...');
  const unauthRes = await fetch(`${BASE_URL}/api/wallet/${testUserA.id}`);
  const unauthData = await unauthRes.json();
  console.log(`Unauth status: ${unauthRes.status}, Expected: 401`);
  results.wallet.unauth = { status: unauthRes.status, passed: unauthRes.status === 401, data: unauthData };

  // Test 15.2: Negative - Cross-user read (User B accessing User A's wallet)
  console.log('15.2 Testing cross-user forbidden read (User B -> User A)...');
  const crossRes = await fetch(`${BASE_URL}/api/wallet/${testUserA.id}`, {
    headers: { Authorization: `Bearer ${tokenB}` }
  });
  const crossData = await crossRes.json();
  console.log(`Cross-user status: ${crossRes.status}, Expected: 403`);
  results.wallet.crossUser = { status: crossRes.status, passed: crossRes.status === 403, data: crossData };

  // Test 15.3: Concurrency - 10 concurrent initialization requests for User A
  console.log('15.3 Testing concurrent wallet initialization for User A (10 concurrent requests)...');
  const concurrentPromises = Array.from({ length: 10 }).map(() =>
    fetch(`${BASE_URL}/api/wallet/${testUserA.id}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    }).then(r => r.json())
  );
  const concurrentResponses = await Promise.all(concurrentPromises);
  const allSuccess = concurrentResponses.every(r => r.success === true);
  console.log(`Concurrent wallet requests all success: ${allSuccess}`);

  // Query Neon directly to verify EXACTLY 1 row exists
  const dbWalletRes = await pool.query('SELECT * FROM public.user_wallets WHERE user_id = $1', [testUserA.id]);
  console.log(`Neon public.user_wallets row count for User A: ${dbWalletRes.rows.length}`);
  const directNeonRowA = dbWalletRes.rows[0];
  console.log('Direct Neon Row A:', directNeonRowA);

  results.wallet.concurrency = {
    allSuccess,
    neonRowCount: dbWalletRes.rows.length,
    passed: allSuccess && dbWalletRes.rows.length === 1,
    row: directNeonRowA
  };

  // Test 15.4: Owner read matches direct Neon SQL
  console.log('15.4 Testing owner authenticated read and matching with Neon SQL...');
  const ownerRes = await fetch(`${BASE_URL}/api/wallet/${testUserA.id}`, {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  const ownerData = await ownerRes.json();
  console.log('API Wallet Response:', ownerData);
  const matchesNeon = 
    ownerData.success === true &&
    ownerData.data.userId === directNeonRowA.user_id &&
    Number(ownerData.data.balance) === Number(directNeonRowA.balance) &&
    Number(ownerData.data.coins) === Number(directNeonRowA.coins) &&
    Number(ownerData.data.totalEarned) === Number(directNeonRowA.total_earned);
  console.log(`API response matches direct Neon values: ${matchesNeon}`);
  results.wallet.ownerRead = {
    status: ownerRes.status,
    passed: matchesNeon && ownerRes.status === 200,
    apiData: ownerData,
    neonRow: directNeonRowA
  };

  // Test 15.5: Total row count in public.user_wallets
  const totalWalletsRes = await pool.query('SELECT COUNT(*) as cnt FROM public.user_wallets');
  console.log(`Total rows in public.user_wallets: ${totalWalletsRes.rows[0].cnt}`);
  results.wallet.totalCount = Number(totalWalletsRes.rows[0].cnt);

  // -------------------------------------------------------------
  // FEATURE 27: PREMIUM UTR SUBMISSIONS
  // -------------------------------------------------------------
  console.log('\n--- [FEATURE 27] PREMIUM UTR SUBMISSION TESTS ---');

  const testUtr = `TESTUTR${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;
  const duplicateUtr = `DUPUTR${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;

  // Test 27.1: Negative - Malformed UTR
  console.log('27.1 Testing malformed UTR submission...');
  const malformedRes = await fetch(`${BASE_URL}/api/payments/utr-submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`
    },
    body: JSON.stringify({
      utr: 'short',
      plan: 'monthly',
      amount: 499,
      userEmail: testUserA.email
    })
  });
  const malformedData = await malformedRes.json();
  console.log(`Malformed status: ${malformedRes.status}, Expected: 400`);
  results.utr.malformed = { status: malformedRes.status, passed: malformedRes.status === 400, data: malformedData };

  // Test 27.2: Negative - Invalid plan
  console.log('27.2 Testing invalid plan submission...');
  const invalidPlanRes = await fetch(`${BASE_URL}/api/payments/utr-submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`
    },
    body: JSON.stringify({
      utr: 'VALIDUTR12345678',
      plan: 'free_trial_infinity',
      amount: 499,
      userEmail: testUserA.email
    })
  });
  console.log(`Invalid plan status: ${invalidPlanRes.status}, Expected: 400`);
  results.utr.invalidPlan = { status: invalidPlanRes.status, passed: invalidPlanRes.status === 400 };

  // Test 27.3: Negative - Invalid amount
  console.log('27.3 Testing invalid amount submission...');
  const invalidAmountRes = await fetch(`${BASE_URL}/api/payments/utr-submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`
    },
    body: JSON.stringify({
      utr: 'VALIDUTR12345678',
      plan: 'monthly',
      amount: -100,
      userEmail: testUserA.email
    })
  });
  console.log(`Invalid amount status: ${invalidAmountRes.status}, Expected: 400`);
  results.utr.invalidAmount = { status: invalidAmountRes.status, passed: invalidAmountRes.status === 400 };

  // Test 27.4: Valid authenticated UTR submission
  console.log(`27.4 Submitting valid unique UTR: ${testUtr}...`);
  const validSubmitRes = await fetch(`${BASE_URL}/api/payments/utr-submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`
    },
    body: JSON.stringify({
      utr: testUtr,
      plan: 'monthly',
      amount: 499,
      userEmail: testUserA.email,
      userName: 'Test User A'
    })
  });
  const validSubmitData = await validSubmitRes.json();
  console.log(`Valid submission HTTP status: ${validSubmitRes.status}`);
  console.log('Submit response:', validSubmitData);

  // Direct Neon SQL query by UTR
  const directNeonUtr = await pool.query('SELECT * FROM public.utr_requests WHERE utr = $1', [testUtr]);
  console.log(`Neon public.utr_requests query by UTR row count: ${directNeonUtr.rows.length}`);
  const utrRow = directNeonUtr.rows[0];
  console.log('Direct Neon UTR Row:', utrRow);

  // Direct Neon SQL query by ID
  const directNeonUtrById = await pool.query(
    'SELECT id, utr, plan, amount, status FROM public.utr_requests WHERE id = $1',
    [utrRow?.id]
  );
  console.log('Direct Neon UTR Query by ID:', directNeonUtrById.rows[0]);

  results.utr.validSubmit = {
    status: validSubmitRes.status,
    passed: validSubmitRes.status === 200 && directNeonUtr.rows.length === 1 && utrRow.status === 'PENDING',
    apiResponse: validSubmitData,
    neonRow: utrRow,
    neonRowById: directNeonUtrById.rows[0]
  };

  // Test 27.5: Concurrency - Concurrent duplicate submissions using duplicateUtr
  console.log(`27.5 Testing concurrent duplicate submissions for UTR: ${duplicateUtr}...`);
  const concurrentUtrPromises = Array.from({ length: 6 }).map(() =>
    fetch(`${BASE_URL}/api/payments/utr-submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        utr: duplicateUtr,
        plan: 'annual',
        amount: 3999,
        userEmail: testUserA.email,
        userName: 'Test User A'
      })
    }).then(r => r.json())
  );
  const concurrentUtrResults = await Promise.all(concurrentUtrPromises);
  console.log('Concurrent UTR response statuses:', concurrentUtrResults.map(r => ({ success: r.success, idempotent: r.idempotent })));

  // Direct Neon SQL count for duplicateUtr
  const dupCheck = await pool.query('SELECT COUNT(*) as cnt FROM public.utr_requests WHERE utr = $1', [duplicateUtr]);
  console.log(`Neon row count for concurrent duplicate UTR: ${dupCheck.rows[0].cnt}`);
  results.utr.concurrency = {
    neonRowCount: Number(dupCheck.rows[0].cnt),
    passed: Number(dupCheck.rows[0].cnt) === 1
  };

  // Test 27.6: Admin Read & Approval flow directly in Neon
  console.log('27.6 Testing Admin list UTRs and approve flow...');
  const adminListRes = await fetch(`${BASE_URL}/api/admin/utr/requests`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const adminListData = await adminListRes.json();
  const foundInAdmin = (adminListData.requests || []).some(r => r.utr === testUtr);
  console.log(`UTR ${testUtr} found in admin list from Neon: ${foundInAdmin}`);

  console.log(`Admin approving UTR ${testUtr} (ID: ${utrRow.id})...`);
  const approveRes = await fetch(`${BASE_URL}/api/admin/utr/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      utrId: utrRow.id,
      action: 'APPROVE'
    })
  });
  const approveData = await approveRes.json();
  console.log('Admin approve response:', approveData);

  // Direct Neon verification of updated status
  const postApproveDb = await pool.query('SELECT id, utr, status, processed_by, processed_at FROM public.utr_requests WHERE id = $1', [utrRow.id]);
  console.log('Neon row after approval:', postApproveDb.rows[0]);

  results.utr.adminFlow = {
    foundInAdmin,
    approveStatus: approveRes.status,
    postApproveNeonStatus: postApproveDb.rows[0]?.status,
    passed: foundInAdmin && approveRes.status === 200 && postApproveDb.rows[0]?.status === 'APPROVED'
  };

  await pool.end();
  console.log('\n=== VERIFICATION COMPLETE ===');
  console.log(JSON.stringify(results, null, 2));
}

runTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
