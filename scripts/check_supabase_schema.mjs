import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const supabase = createClient(supabaseUrl, serviceKey);

async function checkTables() {
  const tables = [
    'flashcards',
    'flashcard_reviews',
    'podcasts',
    'ad_rewards',
    'reward_claims',
    'reward_transactions',
    'user_profiles'
  ];

  console.log('Checking Supabase tables...');
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      console.log(`Table '${t}': NOT FOUND or ERROR -> ${error.message} (code: ${error.code})`);
    } else {
      console.log(`Table '${t}': EXISTS (sample count: ${data.length})`);
    }
  }
}

checkTables();
