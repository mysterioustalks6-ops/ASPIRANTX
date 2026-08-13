const { createClient } = require('@supabase/supabase-js');
const url = process.env.VITE_SUPABASE_URL || 'https://ixwpkzorjutnhpnybuvx.supabase.co';
const key = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4d3Brem9yanV0bmhwbnlidXZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NDIxMjIsImV4cCI6MjEwMTMxODEyMn0.0Km2xeSzdTznuSzNK8DyL4a_MfYFFnuEseV78oSx9zw';

const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.auth.getUser("some.fake.jwt");
  console.log("Error:", error?.message);
}
run();
