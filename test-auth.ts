import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const url = process.env.VITE_SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(url, key);

async function run() {
  const email = 'test_' + Date.now() + '@gmail.com';
  console.log('Signing up', email);
  const { data, error } = await supabase.auth.signUp({ email, password: 'password123' });
  if (error) { console.error('Signup error', error); return; }
  
  const token = data.session?.access_token;
  console.log('Token:', token ? token.substring(0,20) + '...' : 'none');
  
  const res = await fetch('http://localhost:3000/api/auth/token', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Status:', res.status);
  console.log('Body:', await res.text());
}
run();
