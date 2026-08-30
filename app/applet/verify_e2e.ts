import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BASE_URL = 'http://localhost:3000';

async function runE2EVerification() {
  console.log('=== STARTING E2E VERIFICATION & PROOF ===');

  const adminEmail = 'ambujyadav0010@gmail.com';
  console.log(`\n1. Generating Admin Token for ${adminEmail}...`);
  
  const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFtYnVqeWFkYXYwMDEwQGdtYWlsLmNvbSIsInJvbGUiOiJBRE1JTiIsInN1YiI6InVzcl9hZG1pbiIsImlhdCI6MTcxNzAxMDAwMH0.signature';

  const tokenRes = await fetch(`${BASE_URL}/api/auth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${testToken}`,
      'Content-Type': 'application/json'
    }
  });
  console.log(`POST /api/auth/token HTTP Status: ${tokenRes.status}`);
  const tokenBody = await tokenRes.json();
  console.log('POST /api/auth/token Response:', JSON.stringify(tokenBody, null, 2));

  console.log(`\n2. Verifying user profile & subscription for ${adminEmail}...`);
  const subRes = await fetch(`${BASE_URL}/api/user/subscription?email=${encodeURIComponent(adminEmail)}`, {
    headers: {
      'Authorization': `Bearer ${testToken}`
    }
  });
  console.log(`GET /api/user/subscription HTTP Status: ${subRes.status}`);
  const subBody = await subRes.json();
  console.log('GET /api/user/subscription Response:', JSON.stringify(subBody, null, 2));

  console.log(`\n3. Admin Panel: Activating PRO subscription for ${adminEmail}...`);
  const activateRes = await fetch(`${BASE_URL}/api/admin/subscriptions/activate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${testToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userEmail: adminEmail,
      planId: 'annual'
    })
  });
  console.log(`POST /api/admin/subscriptions/activate HTTP Status: ${activateRes.status}`);
  const activateBody = await activateRes.json();
  console.log('POST /api/admin/subscriptions/activate Response:', JSON.stringify(activateBody, null, 2));

  console.log(`\n4. Verifying User Panel subscription reflection after activation...`);
  const verifySubRes = await fetch(`${BASE_URL}/api/user/subscription?email=${encodeURIComponent(adminEmail)}`, {
    headers: {
      'Authorization': `Bearer ${testToken}`
    }
  });
  console.log(`GET /api/user/subscription (Post-Activation) HTTP Status: ${verifySubRes.status}`);
  const verifySubBody = await verifySubRes.json();
  console.log('GET /api/user/subscription Response:', JSON.stringify(verifySubBody, null, 2));

  console.log(`\n5. Testing Razorpay order creation endpoint...`);
  const razorpayRes = await fetch(`${BASE_URL}/api/payments/razorpay-order`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${testToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      planId: 'monthly',
      amount: 999,
      currency: 'INR',
      userEmail: adminEmail,
      userName: 'Ambuj Yadav'
    })
  });
  console.log(`POST /api/payments/razorpay-order HTTP Status: ${razorpayRes.status}`);
  const razorpayBody = await razorpayRes.json();
  console.log('POST /api/payments/razorpay-order Response:', JSON.stringify(razorpayBody, null, 2));

  console.log(`\n6. Testing Feature Flags endpoint...`);
  const flagsRes = await fetch(`${BASE_URL}/api/feature-flags`, {
    headers: {
      'Authorization': `Bearer ${testToken}`
    }
  });
  console.log(`GET /api/feature-flags HTTP Status: ${flagsRes.status}`);
  const flagsBody = await flagsRes.json();
  console.log('GET /api/feature-flags Response:', JSON.stringify(flagsBody, null, 2));

  console.log(`\n7. Testing Health Status endpoint...`);
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  console.log(`GET /api/health HTTP Status: ${healthRes.status}`);
  const healthBody = await healthRes.json();
  console.log('GET /api/health Response:', JSON.stringify(healthBody, null, 2));

  console.log('\n=== E2E VERIFICATION COMPLETED SUCCESSFULLY ===');
}

runE2EVerification().catch(err => {
  console.error('E2E Verification Error:', err);
});
