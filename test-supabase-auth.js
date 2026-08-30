const { createClient } = require('@supabase/supabase-js');
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function test() {
  console.log('Signing up test user...');
  const { data, error } = await supabase.auth.signUp({
    email: 'test_auth_' + Date.now() + '@example.com',
    password: 'password123'
  });
  if (error) {
    console.error('Signup error:', error);
    return;
  }
  
  const token = data.session.access_token;
  console.log('Got access token:', token.substring(0, 20) + '...');
  
  console.log('Testing getUser(token)...');
  const { data: user, error: getUserError } = await supabase.auth.getUser(token);
  if (getUserError) {
    console.error('getUser error:', getUserError);
  } else {
    console.log('getUser success:', user.user.email);
  }
}
test();
