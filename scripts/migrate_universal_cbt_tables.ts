import 'dotenv/config';
import pg from 'pg';
import { UNIVERSAL_EXAM_CONFIGS } from '../src/lib/cbt/universalExamConfig.js';
const { Client } = pg;

const client = new Client({ connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL });

async function run() {
  console.log('🚀 Running Universal CBT Engine Database Migration...');
  await client.connect();

  // 1. Add columns to cbt_attempts
  console.log('1. Checking and updating cbt_attempts schema...');
  await client.query(`
    ALTER TABLE cbt_attempts 
    ADD COLUMN IF NOT EXISTS timing_model VARCHAR(32) DEFAULT 'GLOBAL_TIMER',
    ADD COLUMN IF NOT EXISTS exam_config JSONB,
    ADD COLUMN IF NOT EXISTS section_states JSONB,
    ADD COLUMN IF NOT EXISTS current_section_id VARCHAR(64);
  `);
  console.log('   ✓ cbt_attempts schema updated.');

  // 2. Add columns to cbt_attempt_questions
  console.log('2. Checking and updating cbt_attempt_questions schema...');
  await client.query(`
    ALTER TABLE cbt_attempt_questions
    ADD COLUMN IF NOT EXISTS section_id VARCHAR(64),
    ADD COLUMN IF NOT EXISTS selected_option TEXT,
    ADD COLUMN IF NOT EXISTS marks_obtained NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_evaluated BOOLEAN DEFAULT false;
  `);
  console.log('   ✓ cbt_attempt_questions schema updated.');

  // 3. Ensure blueprints exist for all major exams with official patterns
  console.log('3. Syncing official blueprints from universal configuration registry...');
  for (const [examKey, config] of Object.entries(UNIVERSAL_EXAM_CONFIGS)) {
    const stage = config.stages[0];
    const paper = stage?.papers[0];
    if (!paper) continue;

    const blueprintId = `blueprint_${examKey.toLowerCase()}_official`;
    const totalQuestions = paper.sections.reduce((acc, s) => acc + s.questionCount, 0);
    const durationSeconds = paper.totalDurationMinutes * 60;
    const firstSec = paper.sections[0];
    const negMark = firstSec?.markingScheme?.negative ?? 0.25;

    await client.query(`
      INSERT INTO cbt_blueprints (
        id, exam_id, title, mode, duration_seconds, total_questions,
        sections, marking_scheme, negative_marking, allow_pause,
        navigation_rules, verification_status, created_at
      ) VALUES (
        $1, $2, $3, 'full', $4, $5,
        $6, $7, $8, true,
        $9, 'verified', NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        duration_seconds = EXCLUDED.duration_seconds,
        total_questions = EXCLUDED.total_questions,
        sections = EXCLUDED.sections,
        marking_scheme = EXCLUDED.marking_scheme,
        negative_marking = EXCLUDED.negative_marking,
        navigation_rules = EXCLUDED.navigation_rules,
        verification_status = 'verified';
    `, [
      blueprintId,
      config.examId,
      `${config.examName} — Official Pattern (${config.version})`,
      durationSeconds,
      totalQuestions,
      JSON.stringify(paper.sections),
      JSON.stringify(firstSec.markingScheme),
      negMark,
      JSON.stringify({
        timing_model: paper.timingModel,
        sections_locked: paper.timingModel === 'SECTION_TIMER'
      })
    ]);
    console.log(`   ✓ Synced blueprint: ${blueprintId} (${config.examId}) [${paper.timingModel}]`);
  }

  console.log('\n🎉 Universal CBT Database Schema & Blueprints successfully migrated!');
  await client.end();
}

run().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
