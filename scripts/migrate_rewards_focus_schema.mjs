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
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔄 [Migration] Starting Rewards & Focus Shield database migration on Neon...');

    await client.query('BEGIN');

    // 1. ACHIEVEMENTS TABLE
    console.log('📦 Creating public.achievements...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.achievements (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(64) UNIQUE NOT NULL,
        name VARCHAR(128) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(32) NOT NULL, -- 'FOCUS', 'CONSISTENCY', 'PRACTICE', 'MASTERY', 'SPECIAL'
        rarity VARCHAR(32) NOT NULL DEFAULT 'COMMON', -- 'COMMON', 'RARE', 'EPIC', 'LEGENDARY'
        icon VARCHAR(32) NOT NULL,
        target_value NUMERIC NOT NULL,
        unit VARCHAR(32) NOT NULL,
        xp_reward INTEGER NOT NULL DEFAULT 50,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 2. USER ACHIEVEMENTS TABLE
    console.log('📦 Creating public.user_achievements...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.user_achievements (
        id VARCHAR(64) PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
        achievement_id VARCHAR(64) NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
        current_value NUMERIC NOT NULL DEFAULT 0,
        target_value NUMERIC NOT NULL,
        is_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
        unlocked_at TIMESTAMPTZ,
        progress_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_user_achievement UNIQUE (user_id, achievement_id)
      );
      CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);
    `);

    // 3. CHALLENGES TABLE
    console.log('📦 Creating public.challenges...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.challenges (
        id VARCHAR(64) PRIMARY KEY,
        code VARCHAR(64) UNIQUE NOT NULL,
        title VARCHAR(128) NOT NULL,
        description TEXT NOT NULL,
        frequency VARCHAR(32) NOT NULL, -- 'DAILY', 'WEEKLY', 'MILESTONE'
        target_value NUMERIC NOT NULL,
        unit VARCHAR(32) NOT NULL,
        xp_reward INTEGER NOT NULL DEFAULT 30,
        exam_id VARCHAR(64) DEFAULT 'ALL',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 4. USER CHALLENGES TABLE
    console.log('📦 Creating public.user_challenges...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.user_challenges (
        id VARCHAR(64) PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
        challenge_id VARCHAR(64) NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
        period_key VARCHAR(32) NOT NULL, -- 'YYYY-MM-DD' for daily, 'YYYY-Wxx' for weekly
        current_value NUMERIC NOT NULL DEFAULT 0,
        target_value NUMERIC NOT NULL,
        is_completed BOOLEAN NOT NULL DEFAULT FALSE,
        completed_at TIMESTAMPTZ,
        xp_awarded BOOLEAN NOT NULL DEFAULT FALSE,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_user_challenge_period UNIQUE (user_id, challenge_id, period_key)
      );
      CREATE INDEX IF NOT EXISTS idx_user_challenges_user_period ON public.user_challenges(user_id, period_key);
    `);

    // 5. FOCUS SESSIONS TABLE
    console.log('📦 Creating public.focus_sessions...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.focus_sessions (
        id VARCHAR(64) PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
        requested_minutes INTEGER NOT NULL,
        verified_minutes INTEGER NOT NULL DEFAULT 0,
        accumulated_seconds INTEGER NOT NULL DEFAULT 0,
        blocked_apps JSONB NOT NULL DEFAULT '[]'::jsonb,
        status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        resumed_at TIMESTAMPTZ,
        paused_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_focus_sessions_user ON public.focus_sessions(user_id);
    `);

    // 6. REWARD EVENTS (Idempotent Event Log)
    console.log('📦 Creating public.reward_events...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.reward_events (
        id VARCHAR(64) PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
        event_type VARCHAR(64) NOT NULL,
        reference_id VARCHAR(128) NOT NULL,
        event_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_user_event_ref UNIQUE (user_id, event_type, reference_id)
      );
      CREATE INDEX IF NOT EXISTS idx_reward_events_user ON public.reward_events(user_id);
    `);

    // 7. REWARD LEDGER (Immutable XP History)
    console.log('📦 Creating public.reward_ledger...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.reward_ledger (
        id VARCHAR(64) PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
        xp_change INTEGER NOT NULL,
        balance_after INTEGER NOT NULL,
        source VARCHAR(64) NOT NULL,
        reference_id VARCHAR(128),
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_reward_ledger_user ON public.reward_ledger(user_id);
    `);

    // 8. SEED CANONICAL ACHIEVEMENTS (16 High-Yield Trophies)
    console.log('🌱 Seeding Canonical Achievements...');
    const ACHIEVEMENTS_SEED = [
      ['ach_focus_1', 'FOCUS_FIRST_STEP', 'First Focus', 'Complete your first Pomodoro session (min 25 min)', 'FOCUS', 'COMMON', '🥉', 25, 'minutes', 50],
      ['ach_focus_2', 'FOCUS_10H', 'Deep Concentration', 'Accumulate 600 verified focus minutes', 'FOCUS', 'RARE', '⏱️', 600, 'minutes', 150],
      ['ach_focus_3', 'FOCUS_50H', 'Focus Centurion', 'Accumulate 3,000 verified focus minutes', 'FOCUS', 'EPIC', '🛡️', 3000, 'minutes', 300],
      ['ach_focus_4', 'FOCUS_100H', 'Iron Will Master', 'Accumulate 6,000 verified focus minutes', 'FOCUS', 'LEGENDARY', '👑', 6000, 'minutes', 600],
      ['ach_focus_5', 'SHIELD_GUARDIAN', 'Focus Guardian', 'Complete 3 Focus Shield distraction-free sessions', 'FOCUS', 'RARE', '🛡️', 3, 'sessions', 150],
      ['ach_cons_1', 'STREAK_3D', 'Ignited Scholar', 'Maintain a 3-Day Study Streak', 'CONSISTENCY', 'COMMON', '🔥', 3, 'days', 75],
      ['ach_cons_2', 'STREAK_7D', 'Unstoppable Momentum', 'Maintain a 7-Day Study Streak', 'CONSISTENCY', 'RARE', '⚡', 7, 'days', 150],
      ['ach_cons_3', 'STREAK_30D', 'Academic Discipline', 'Reach an unbroken 30-Day Study Streak', 'CONSISTENCY', 'EPIC', '🏆', 30, 'days', 400],
      ['ach_prac_1', 'CBT_FIRST_TEST', 'Exam Ready', 'Complete 1 full CBT practice test', 'PRACTICE', 'COMMON', '📝', 1, 'tests', 50],
      ['ach_prac_2', 'CBT_PERFECT', 'Bullseye Accuracy', 'Achieve >= 90% accuracy on a full CBT test', 'PRACTICE', 'EPIC', '🎯', 90, 'percent', 350],
      ['ach_prac_3', 'QUESTIONS_100', 'Problem Solver', 'Solve 100 questions correctly', 'PRACTICE', 'COMMON', '🧠', 100, 'questions', 100],
      ['ach_prac_4', 'QUESTIONS_500', 'Question Titan', 'Solve 500 questions correctly', 'PRACTICE', 'EPIC', '⚡', 500, 'questions', 350],
      ['ach_mast_1', 'TASKS_10', 'Organized Aspirant', 'Complete 10 study tasks from your plan', 'MASTERY', 'COMMON', '📋', 10, 'tasks', 75],
      ['ach_mast_2', 'TASKS_50', 'Task Smasher', 'Complete 50 study tasks from your plan', 'MASTERY', 'RARE', '⚔️', 50, 'tasks', 200],
      ['ach_mast_3', 'CARDS_50', 'Active Recall Pro', 'Review 50 flashcards using spaced repetition', 'MASTERY', 'COMMON', '🃏', 50, 'cards', 75],
      ['ach_spec_1', 'EARLY_BIRD', 'Dawn Scholar', 'Complete a focused study session before 7:00 AM IST', 'SPECIAL', 'RARE', '🌅', 1, 'sessions', 150]
    ];

    for (const [id, code, name, desc, cat, rarity, icon, target, unit, xp] of ACHIEVEMENTS_SEED) {
      await client.query(`
        INSERT INTO public.achievements (id, code, name, description, category, rarity, icon, target_value, unit, xp_reward)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (code) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          category = EXCLUDED.category,
          rarity = EXCLUDED.rarity,
          icon = EXCLUDED.icon,
          target_value = EXCLUDED.target_value,
          unit = EXCLUDED.unit,
          xp_reward = EXCLUDED.xp_reward;
      `, [id, code, name, desc, cat, rarity, icon, target, unit, xp]);
    }

    // 9. SEED CANONICAL CHALLENGES
    console.log('🌱 Seeding Canonical Daily & Weekly Challenges...');
    const CHALLENGES_SEED = [
      ['ch_daily_focus', 'DAILY_FOCUS_45', 'Daily Focus Sprint', 'Complete 45 minutes of focused study', 'DAILY', 45, 'minutes', 30, 'ALL'],
      ['ch_daily_questions', 'DAILY_QUESTIONS_15', 'Daily Question Drill', 'Solve 15 questions correctly in CBT or Practice', 'DAILY', 15, 'questions', 40, 'ALL'],
      ['ch_daily_tasks', 'DAILY_TASKS_2', 'Daily Task Master', 'Complete 2 tasks from your study plan', 'DAILY', 2, 'tasks', 25, 'ALL'],
      ['ch_weekly_focus', 'WEEKLY_FOCUS_300', 'Weekly Deep Focus', 'Accumulate 300 verified focus minutes this week', 'WEEKLY', 300, 'minutes', 150, 'ALL'],
      ['ch_weekly_cbt', 'WEEKLY_CBT_2', 'Weekly Benchmark Mock', 'Complete 2 full CBT practice tests this week', 'WEEKLY', 2, 'tests', 120, 'ALL'],
      ['ch_weekly_flashcards', 'WEEKLY_CARDS_40', 'Weekly Active Recall', 'Review 40 flashcards this week', 'WEEKLY', 40, 'cards', 80, 'ALL'],
      ['ch_exam_neet', 'EXAM_NEET_BIO', 'Biology Topic Drill', 'Complete 2 Biology topic tests this week', 'WEEKLY', 2, 'tests', 100, 'NEET'],
      ['ch_exam_upsc', 'EXAM_UPSC_GS', 'Polity & Governance Drill', 'Complete 2 GS Polity/History tests this week', 'WEEKLY', 2, 'tests', 100, 'UPSC_CSE'],
      ['ch_exam_ssc', 'EXAM_SSC_QUANT', 'Quantitative Speed Drill', 'Solve 30 Quantitative Aptitude questions', 'WEEKLY', 30, 'questions', 100, 'SSC_CGL']
    ];

    for (const [id, code, title, desc, freq, target, unit, xp, exam] of CHALLENGES_SEED) {
      await client.query(`
        INSERT INTO public.challenges (id, code, title, description, frequency, target_value, unit, xp_reward, exam_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (code) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          frequency = EXCLUDED.frequency,
          target_value = EXCLUDED.target_value,
          unit = EXCLUDED.unit,
          xp_reward = EXCLUDED.xp_reward,
          exam_id = EXCLUDED.exam_id;
      `, [id, code, title, desc, freq, target, unit, xp, exam]);
    }

    await client.query('COMMIT');
    console.log('✅ [Migration] Rewards, Achievements, Challenges & Focus Shield tables successfully created and seeded!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ [Migration] Error during migration:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
