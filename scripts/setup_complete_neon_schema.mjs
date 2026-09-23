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
import { AUTHENTIC_PODCASTS } from './update_supabase_podcasts.mjs';

const { Client } = pg;
const connectionString = 'postgresql://neondb_owner:npg_ND6QMC5fkVmr@ep-holy-lake-b4yeup0a-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function setup() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('[PostgreSQL] Connected to Neon database.');

  // Drop unique email constraint so multiple test sessions can share admin email
  await client.query(`ALTER TABLE auth.users DROP CONSTRAINT IF EXISTS users_email_key;`);

  // Create additional application tables
  await client.query(`
    -- Podcasts
    CREATE TABLE IF NOT EXISTS public.podcasts (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Ad rewards legacy sync
    CREATE TABLE IF NOT EXISTS public.ad_rewards (
      id TEXT PRIMARY KEY,
      email TEXT,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Reward claims
    CREATE TABLE IF NOT EXISTS public.reward_claims (
      id TEXT PRIMARY KEY,
      user_id UUID,
      email TEXT,
      milestone INT,
      reward_type TEXT,
      status TEXT DEFAULT 'completed',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- User profiles
    CREATE TABLE IF NOT EXISTS public.user_profiles (
      id UUID PRIMARY KEY,
      xp INT DEFAULT 0,
      coins INT DEFAULT 0,
      level INT DEFAULT 1,
      is_premium BOOLEAN DEFAULT FALSE,
      premium_until TIMESTAMPTZ,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- User Pomodoro sessions
    CREATE TABLE IF NOT EXISTS public.user_pomodoro_sessions (
      id TEXT PRIMARY KEY,
      user_id UUID,
      minutes INT DEFAULT 25,
      date TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- User syllabus progress
    CREATE TABLE IF NOT EXISTS public.user_syllabus_progress (
      id TEXT PRIMARY KEY,
      user_id UUID,
      exam TEXT,
      progress JSONB DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Feedback reports
    CREATE TABLE IF NOT EXISTS public.feedback_reports (
      id TEXT PRIMARY KEY,
      user_id UUID,
      content TEXT,
      category TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Community comments
    CREATE TABLE IF NOT EXISTS public.community_comments (
      id TEXT PRIMARY KEY,
      post_id TEXT,
      author_id UUID,
      author_name TEXT,
      content TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('[PostgreSQL] Additional application tables created successfully.');

  // Seed truthful podcasts
  for (const pod of AUTHENTIC_PODCASTS) {
    await client.query(`
      INSERT INTO public.podcasts (id, data, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (id) DO UPDATE SET
        data = EXCLUDED.data,
        updated_at = NOW();
    `, [pod.id, JSON.stringify(pod)]);
  }
  console.log('[PostgreSQL] Truthful podcast records seeded successfully.');

  // Check all public tables
  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.log('\n--- ALL VERIFIED PUBLIC TABLES IN NEON POSTGRESQL ---');
  for (const row of res.rows) {
    console.log(`  ✓ public.${row.table_name}`);
  }

  await client.end();
}

setup().catch(err => {
  console.error('[Setup Error]:', err);
  process.exit(1);
});
