import 'dotenv/config';
import { queryPostgres, pgPool } from '../src/lib/postgres.js';
import { initCbtTables } from '../src/lib/cbt/schema.js';
import { INITIAL_CBT_TESTS } from '../src/data/cbtData.js';
import { INITIAL_QUESTION_BANK } from '../src/data/academicData.js';

async function migrateAndSeed() {
  console.log(`\n================================================================================`);
  console.log(`🚀 CBT ENGINE — MIGRATION & SEEDING SCRIPT`);
  console.log(`================================================================================\n`);

  // 1. Run Table Migrations
  console.log(`[Step 1/3] Creating/verifying canonical CBT tables...`);
  await initCbtTables();
  console.log(`✅ All canonical CBT tables verified/created successfully.`);

  // 2. Seed Official/Standard CBT Blueprints
  console.log(`\n[Step 2/3] Seeding standard exam blueprints...`);
  const blueprints = [
    {
      id: 'blueprint_upsc_prelims_gs1',
      exam_id: 'UPSC_CSE',
      title: 'UPSC Civil Services Prelims (General Studies Paper-I)',
      mode: 'full',
      duration_seconds: 7200, // 120 minutes
      total_questions: 100,
      sections: JSON.stringify([
        { name: 'General Studies Paper-I', duration_seconds: 7200, questions_count: 100 }
      ]),
      marking_scheme: JSON.stringify({ correct: 2.0, incorrect: 0.66, unattempted: 0 }),
      negative_marking: 0.66,
      allow_pause: true,
      navigation_rules: JSON.stringify({ allow_jump: true, allow_change_answer: true }),
      verification_status: 'verified'
    },
    {
      id: 'blueprint_neet_ug_standard',
      exam_id: 'NEET_UG',
      title: 'NEET (UG) National Eligibility Cum Entrance Test',
      mode: 'full',
      duration_seconds: 12000, // 200 minutes
      total_questions: 180,
      sections: JSON.stringify([
        { name: 'Physics', duration_seconds: 3000, questions_count: 45 },
        { name: 'Chemistry', duration_seconds: 3000, questions_count: 45 },
        { name: 'Botany', duration_seconds: 3000, questions_count: 45 },
        { name: 'Zoology', duration_seconds: 3000, questions_count: 45 }
      ]),
      marking_scheme: JSON.stringify({ correct: 4.0, incorrect: 1.0, unattempted: 0 }),
      negative_marking: 1.0,
      allow_pause: true,
      navigation_rules: JSON.stringify({ allow_jump: true, allow_change_answer: true }),
      verification_status: 'verified'
    },
    {
      id: 'blueprint_jee_main_paper1',
      exam_id: 'JEE_MAIN',
      title: 'JEE (Main) Paper-1 (B.E./B.Tech)',
      mode: 'full',
      duration_seconds: 10800, // 180 minutes
      total_questions: 75,
      sections: JSON.stringify([
        { name: 'Mathematics', duration_seconds: 3600, questions_count: 25 },
        { name: 'Physics', duration_seconds: 3600, questions_count: 25 },
        { name: 'Chemistry', duration_seconds: 3600, questions_count: 25 }
      ]),
      marking_scheme: JSON.stringify({ correct: 4.0, incorrect: 1.0, unattempted: 0 }),
      negative_marking: 1.0,
      allow_pause: true,
      navigation_rules: JSON.stringify({ allow_jump: true, allow_change_answer: true }),
      verification_status: 'verified'
    },
    {
      id: 'blueprint_ssc_cgl_tier1',
      exam_id: 'SSC_CGL',
      title: 'SSC Combined Graduate Level (Tier-I Examination)',
      mode: 'full',
      duration_seconds: 3600, // 60 minutes
      total_questions: 100,
      sections: JSON.stringify([
        { name: 'General Intelligence and Reasoning', duration_seconds: 900, questions_count: 25 },
        { name: 'General Awareness', duration_seconds: 900, questions_count: 25 },
        { name: 'Quantitative Aptitude', duration_seconds: 900, questions_count: 25 },
        { name: 'English Comprehension', duration_seconds: 900, questions_count: 25 }
      ]),
      marking_scheme: JSON.stringify({ correct: 2.0, incorrect: 0.50, unattempted: 0 }),
      negative_marking: 0.50,
      allow_pause: true,
      navigation_rules: JSON.stringify({ allow_jump: true, allow_change_answer: true }),
      verification_status: 'verified'
    }
  ];

  for (const bp of blueprints) {
    await queryPostgres(
      `INSERT INTO cbt_blueprints (
        id, exam_id, title, mode, duration_seconds, total_questions, sections,
        marking_scheme, negative_marking, allow_pause, navigation_rules, verification_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        duration_seconds = EXCLUDED.duration_seconds,
        total_questions = EXCLUDED.total_questions,
        sections = EXCLUDED.sections,
        marking_scheme = EXCLUDED.marking_scheme,
        negative_marking = EXCLUDED.negative_marking;`,
      [
        bp.id, bp.exam_id, bp.title, bp.mode, bp.duration_seconds, bp.total_questions,
        bp.sections, bp.marking_scheme, bp.negative_marking, bp.allow_pause,
        bp.navigation_rules, bp.verification_status
      ]
    );
  }
  console.log(`✅ Seeded ${blueprints.length} standard exam blueprints.`);

  // 3. Seed Existing Question Bank (tagged pending_review)
  console.log(`\n[Step 3/3] Ingesting questions into canonical questions table with strict pending_review provenance...`);
  let seededCount = 0;

  // Ingest from INITIAL_CBT_TESTS
  for (const test of INITIAL_CBT_TESTS) {
    const examId = test.exam || 'UPSC_CSE';
    for (const q of test.questions || []) {
      const qId = q.id;
      const questionType = q.type || 'mcq';
      const questionText = q.questionText || '';
      const passageText = q.passageText || null;
      const assertionText = q.assertionText || null;
      const reasonText = q.reasonText || null;
      const options = JSON.stringify(q.options || []);
      const correctAnswer = typeof q.correctOption === 'number' ? q.correctOption : 0;
      const explanation = q.explanation || null;
      const difficulty = q.difficulty || 'Medium';
      const marks = q.marks || 2.0;
      const negativeMarks = q.negativeMarks || 0.66;
      const subject = q.subject || 'General Studies';
      const topic = q.topic || 'General Practice';

      await queryPostgres(
        `INSERT INTO questions (
          id, exam_id, subject, topic, question_type, question_text,
          passage_text, assertion_text, reason_text, options, correct_answer,
          explanation, difficulty, marks, negative_marks, source_type,
          source_id, source_name, content_usage, verification_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        ON CONFLICT (id) DO UPDATE SET
          question_text = EXCLUDED.question_text,
          options = EXCLUDED.options,
          correct_answer = EXCLUDED.correct_answer,
          explanation = EXCLUDED.explanation;`,
        [
          qId, examId, subject, topic, questionType, questionText,
          passageText, assertionText, reasonText, options, correctAnswer,
          explanation, difficulty, marks, negativeMarks, 'SYSTEM_MOCK',
          test.id, test.title, 'mock_question', 'pending_review'
        ]
      );
      seededCount++;
    }
  }

  // Ingest from INITIAL_QUESTION_BANK
  for (const q of INITIAL_QUESTION_BANK) {
    const qId = q.id;
    const examId = 'UPSC_CSE';
    const subject = q.subject || 'General Studies';
    const topic = q.topic || 'General';
    const options = JSON.stringify(q.options || []);
    const correctAnswer = typeof q.correctOption === 'number' ? q.correctOption : 0;
    const explanation = q.explanation || null;
    const difficulty = q.difficulty || 'Medium';

    await queryPostgres(
      `INSERT INTO questions (
        id, exam_id, subject, topic, question_type, question_text,
        options, correct_answer, explanation, difficulty, marks, negative_marks,
        source_type, source_id, source_name, content_usage, verification_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (id) DO UPDATE SET
        question_text = EXCLUDED.question_text,
        options = EXCLUDED.options,
        correct_answer = EXCLUDED.correct_answer;`,
      [
        qId, examId, subject, topic, 'mcq', q.questionText,
        options, correctAnswer, explanation, difficulty, 2.0, 0.66,
        'QUESTION_BANK', 'academic_data_seed', 'AspirantX Seed Bank',
        'practice_question', 'pending_review'
      ]
    );
    seededCount++;
  }

  console.log(`✅ Total seeded questions: ${seededCount}`);

  // Query verification status count
  const statusRes = await queryPostgres(`
    SELECT verification_status, count(*) as count
    FROM questions
    GROUP BY verification_status;
  `);
  console.log(`\nQuestions table verification status breakdown:`);
  console.table(statusRes.rows);

  await pgPool.end();
}

migrateAndSeed().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
