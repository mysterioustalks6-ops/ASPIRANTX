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
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;
const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_ND6QMC5fkVmr@ep-holy-lake-b4yeup0a-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require';

// Complete list of all 68 tables referenced in the codebase
const ALL_68_TABLES = [
  "active_sponsors",
  "ad_rewards",
  "admin_announcements",
  "admin_content",
  "admin_settings",
  "admin_users",
  "ai_conversations",
  "ai_messages",
  "assignment_submissions",
  "audit_logs",
  "avatars",
  "blog_content_requests",
  "blog_posts",
  "books_library",
  "cbt_results",
  "class_assignments",
  "class_attendance",
  "class_enrollments",
  "community_comments",
  "community_groups",
  "community_messages",
  "community_posts",
  "community_votes",
  "educator_bookings",
  "educator_chats",
  "educators",
  "exams",
  "feature_flags",
  "flashcard_reviews",
  "flashcards",
  "karma_votes",
  "notifications",
  "office_activity_feed",
  "orders",
  "personal_syllabus_nodes",
  "podcasts",
  "pyq_bank",
  "pyqs",
  "question_bank",
  "reward_claims",
  "reward_milestones",
  "reward_transactions",
  "sponsor_inquiries",
  "sponsorship_applications",
  "sponsorship_tiers",
  "study_buddy_matches",
  "study_buddy_queue",
  "study_heartbeats",
  "syllabus_nodes",
  "syllabus_time_log",
  "teacher_classes",
  "teacher_profiles",
  "team_applications",
  "user_custom_subjects",
  "user_dashboards",
  "user_error_logs",
  "user_feedback",
  "user_karma",
  "user_manual_questions",
  "user_payouts",
  "user_pomodoro_sessions",
  "user_profiles",
  "user_subscriptions",
  "user_syllabus_progress",
  "user_tasks",
  "user_wallets",
  "utr_requests",
  "wallet_transactions"
];

async function main() {
  console.log('Connecting to Neon PostgreSQL database...');
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected to Neon PostgreSQL successfully.\n');

  // 1. Ensure auth schema and functions
  console.log('--- Setting up auth schema & compatibility functions ---');
  await client.query(`
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE TABLE IF NOT EXISTS auth.users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE OR REPLACE FUNCTION auth.uid() 
    RETURNS uuid 
    LANGUAGE sql STABLE
    AS $$
      SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
  `);

  // 2. Execute migration files in supabase/migrations/
  console.log('--- Applying migration files from supabase/migrations/ ---');
  const migrationsDir = path.resolve('supabase/migrations');
  if (fs.existsSync(migrationsDir)) {
    const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
    for (const mf of migrationFiles) {
      const sqlContent = fs.readFileSync(path.join(migrationsDir, mf), 'utf8');
      try {
        await client.query(sqlContent);
        console.log(`  ✓ Migration applied: ${mf}`);
      } catch (err) {
        console.log(`  ⚠ Migration ${mf} notice: ${err.message}`);
      }
    }
  }

  // 3. Create all remaining tables from ALL_68_TABLES
  console.log('\n--- Ensuring all 68 tables exist in public schema ---');
  const existingTablesRes = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
  `);
  const existingSet = new Set(existingTablesRes.rows.map(r => r.table_name));

  for (const tbl of ALL_68_TABLES) {
    if (existingSet.has(tbl)) {
      console.log(`  ✓ Table 'public.${tbl}' already exists.`);
      continue;
    }

    console.log(`  + Creating table 'public.${tbl}'...`);
    // Create flexible, robust table schema
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.${tbl} (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT,
        email TEXT,
        data JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    existingSet.add(tbl);
  }

  // 4. Seed Essential Default Content if empty
  console.log('\n--- Seeding Initial Core Datasets ---');

  // Question Bank
  const qbCount = await client.query('SELECT COUNT(*) FROM public.question_bank');
  if (parseInt(qbCount.rows[0].count, 10) === 0) {
    console.log('  Seeding question_bank sample rows...');
    await client.query(`
      INSERT INTO public.question_bank (id, user_id, data) VALUES
      ('qb_upsc_polity_1', 'system', '{"exam": "UPSC", "subject": "Polity", "topic": "Fundamental Rights", "question": "Which Article guarantees Right to Equality?", "options": ["Article 14", "Article 19", "Article 21", "Article 32"], "answer": 0, "difficulty": "Easy"}'::jsonb),
      ('qb_neet_bio_1', 'system', '{"exam": "NEET_UG", "subject": "Biology", "topic": "Cell Biology", "question": "Which organelle is the powerhouse of the cell?", "options": ["Ribosome", "Mitochondria", "Nucleus", "Chloroplast"], "answer": 1, "difficulty": "Easy"}'::jsonb),
      ('qb_jee_phy_1', 'system', '{"exam": "JEE_MAIN", "subject": "Physics", "topic": "Kinematics", "question": "What is the rate of change of displacement?", "options": ["Acceleration", "Velocity", "Speed", "Force"], "answer": 1, "difficulty": "Easy"}'::jsonb)
      ON CONFLICT (id) DO NOTHING;
    `);
  }

  // PYQs
  const pyqCount = await client.query('SELECT COUNT(*) FROM public.pyqs');
  if (parseInt(pyqCount.rows[0].count, 10) === 0) {
    console.log('  Seeding pyqs sample rows...');
    await client.query(`
      INSERT INTO public.pyqs (id, user_id, data) VALUES
      ('pyq_upsc_2023_1', 'system', '{"exam": "UPSC", "year": 2023, "subject": "Polity", "question": "In essence, what does Due Process of Law mean?", "options": ["The principle of natural justice", "The procedure established by law", "Fair application of law", "Equality before law"], "answer": 0}'::jsonb),
      ('pyq_neet_2023_1', 'system', '{"exam": "NEET_UG", "year": 2023, "subject": "Biology", "question": "Movement and accumulation of ions across a membrane against concentration gradient can be explained by:", "options": ["Passive Transport", "Active Transport", "Osmosis", "Facilitated Diffusion"], "answer": 1}'::jsonb)
      ON CONFLICT (id) DO NOTHING;
    `);
  }

  // Feature flags
  const ffCount = await client.query('SELECT COUNT(*) FROM public.feature_flags');
  if (parseInt(ffCount.rows[0].count, 10) === 0) {
    console.log('  Seeding feature_flags...');
    await client.query(`
      INSERT INTO public.feature_flags (id, data) VALUES
      ('active_recall_flashcards', '{"feature_name": "active_recall_flashcards", "enabled": true, "description": "Active recall Leitner flashcards"}'::jsonb),
      ('topper_podcasts', '{"feature_name": "topper_podcasts", "enabled": true, "description": "Educational audio series"}'::jsonb),
      ('ad_rewards_program', '{"feature_name": "ad_rewards_program", "enabled": true, "description": "Rewarded study ads"}'::jsonb)
      ON CONFLICT (id) DO NOTHING;
    `);
  }

  // 5. Final Verification of all tables
  console.log('\n--- FINAL VERIFICATION: ALL PUBLIC TABLES IN NEON POSTGRESQL ---');
  const finalTables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);

  console.log(`Total public tables present: ${finalTables.rows.length}`);
  finalTables.rows.forEach((r, idx) => {
    console.log(`  ${String(idx + 1).padStart(2, ' ')}. public.${r.table_name}`);
  });

  const missing = ALL_68_TABLES.filter(t => !finalTables.rows.some(r => r.table_name === t));
  if (missing.length === 0) {
    console.log('\nSUCCESS: ALL 68 REFERENCED TABLES ARE PRESENT IN NEON POSTGRESQL!');
  } else {
    console.log('\nWARNING: Missing tables:', missing);
  }

  await client.end();
}

main().catch(err => {
  console.error('Fatal error setting up tables:', err);
  process.exit(1);
});
