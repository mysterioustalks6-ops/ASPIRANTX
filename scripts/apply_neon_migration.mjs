import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;
const connectionString = 'postgresql://neondb_owner:npg_ND6QMC5fkVmr@ep-holy-lake-b4yeup0a-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function main() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('[PostgreSQL] Connected successfully to live Neon PostgreSQL database');

  // Ensure auth schema, auth.users and auth.uid() exist for Supabase/PostgreSQL compatibility
  await client.query(`
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE TABLE IF NOT EXISTS auth.users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE OR REPLACE FUNCTION auth.uid() 
    RETURNS uuid 
    LANGUAGE sql STABLE
    AS $$
      SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
  `);
  console.log('[PostgreSQL] auth schema, auth.users table, and auth.uid() function verified.');

  const migrationPath = path.resolve('supabase/migrations/20260922000001_create_flashcards_and_rewards.sql');
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');

  // Execute migration
  try {
    await client.query(migrationSql);
    console.log('[PostgreSQL] Migration 20260922000001_create_flashcards_and_rewards.sql applied successfully!');
  } catch (mErr) {
    if (mErr.message?.includes('already exists')) {
      console.log('[PostgreSQL] Migration objects already exist:', mErr.message);
    } else {
      throw mErr;
    }
  }

  // Verify created tables
  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN ('flashcards', 'flashcard_reviews', 'reward_transactions', 'user_tasks')
    ORDER BY table_name;
  `);

  console.log('\n--- VERIFIED POSTGRESQL TABLES ---');
  for (const row of res.rows) {
    console.log(`✓ public.${row.table_name} EXISTS`);
  }

  // Verify constraints
  const constraints = await client.query(`
    SELECT tc.table_name, tc.constraint_name, tc.constraint_type
    FROM information_schema.table_constraints tc
    WHERE tc.table_schema = 'public'
      AND tc.table_name IN ('flashcards', 'flashcard_reviews', 'reward_transactions', 'user_tasks')
    ORDER BY tc.table_name, tc.constraint_type;
  `);

  console.log('\n--- VERIFIED CONSTRAINTS ---');
  for (const row of constraints.rows) {
    console.log(`  [${row.table_name}] ${row.constraint_type}: ${row.constraint_name}`);
  }

  // Verify indexes
  const indexes = await client.query(`
    SELECT tablename, indexname 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND tablename IN ('flashcards', 'flashcard_reviews', 'reward_transactions', 'user_tasks')
    ORDER BY tablename, indexname;
  `);

  console.log('\n--- VERIFIED INDEXES ---');
  for (const row of indexes.rows) {
    console.log(`  [${row.tablename}] INDEX: ${row.indexname}`);
  }

  // Verify RLS status
  const rlsRes = await client.query(`
    SELECT relname, relrowsecurity 
    FROM pg_class 
    JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace 
    WHERE pg_namespace.nspname = 'public' 
      AND relname IN ('flashcards', 'flashcard_reviews', 'reward_transactions', 'user_tasks');
  `);
  console.log('\n--- VERIFIED RLS STATUS ---');
  for (const row of rlsRes.rows) {
    console.log(`  [${row.relname}] RLS ENABLED: ${row.relrowsecurity}`);
  }

  // Verify Policies
  const polRes = await client.query(`
    SELECT tablename, policyname, cmd 
    FROM pg_policies 
    WHERE schemaname = 'public';
  `);
  console.log('\n--- VERIFIED POLICIES ---');
  for (const row of polRes.rows) {
    console.log(`  [${row.tablename}] POLICY: ${row.policyname} (${row.cmd})`);
  }

  await client.end();
}

main().catch(err => {
  console.error('[PostgreSQL Migration Error]:', err);
  process.exit(1);
});
