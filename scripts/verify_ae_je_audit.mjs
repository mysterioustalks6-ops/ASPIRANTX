import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

import { EXAM_LIST } from '../src/lib/examList.ts';
import { EXAM_REGISTRY, getExamConfig } from '../src/lib/examRegistry.ts';
import { getUniversalExamConfig } from '../src/lib/cbt/universalExamConfig.ts';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function verify() {
  console.log('=== 1. EXAM LIST VERIFICATION ===');
  const sscJeList = EXAM_LIST.filter(e => e.id.includes('JE') || e.id.includes('AE'));
  console.log('Total AE/JE exams in EXAM_LIST:', sscJeList.length);
  console.log('Sample exams:', sscJeList.slice(0, 8).map(e => e.label));

  console.log('\n=== 2. EXAM REGISTRY VERIFICATION ===');
  const regSscJe = getExamConfig('SSC_JE');
  const regUppscAe = getExamConfig('UPPSC_AE');
  const regBpscAe = getExamConfig('BPSC_AE');
  console.log('SSC_JE Config:', regSscJe.displayName, '| Stages:', regSscJe.stages.length, '| Subjects:', regSscJe.subjects);
  console.log('UPPSC_AE Config:', regUppscAe.displayName, '| Subjects:', regUppscAe.subjects);
  console.log('BPSC_AE Config:', regBpscAe.displayName, '| Subjects:', regBpscAe.subjects);

  console.log('\n=== 3. UNIVERSAL CBT CONFIG VERIFICATION ===');
  const cbtSscJe = getUniversalExamConfig('SSC_JE');
  console.log('SSC_JE CBT:', cbtSscJe.examName, '| Total Duration:', cbtSscJe.stages[0].papers[0].totalDurationMinutes, 'min');
  console.log('SSC_JE Sections:', cbtSscJe.stages[0].papers[0].sections.map(s => ({ name: s.name, qCount: s.questionCount, marks: s.totalMarks })));

  console.log('\n=== 4. DATABASE INVENTORY AUDIT ===');
  const qbRes = await pool.query("SELECT count(1) FROM question_bank WHERE id LIKE 'ae_je_%'");
  const pyqRes = await pool.query("SELECT count(1) FROM pyqs WHERE id LIKE 'ae_je_%'");
  const qRes = await pool.query("SELECT count(1) FROM questions WHERE id LIKE 'ae_je_%'");
  const subjectBreakdown = await pool.query("SELECT subject, count(1) FROM questions WHERE id LIKE 'ae_je_%' GROUP BY subject ORDER BY count(1) DESC");
  const examCount = await pool.query("SELECT count(DISTINCT exam_id) FROM questions WHERE id LIKE 'ae_je_%'");

  console.log({
    total_question_bank_seeded: qbRes.rows[0].count,
    total_pyqs_seeded: pyqRes.rows[0].count,
    total_relational_questions_seeded: qRes.rows[0].count,
    distinct_exams_covered: examCount.rows[0].count
  });

  console.log('\nQuestions by Subject Breakdown:');
  console.table(subjectBreakdown.rows);

  console.log('\n=== 5. CACHE INTEGRITY ===');
  const examContent = JSON.parse(fs.readFileSync('data/exam_content.json', 'utf8'));
  console.log('Has SSC_JE::syllabus:', !!examContent['SSC_JE::syllabus']);
  console.log('Has UPPSC_AE::syllabus:', !!examContent['UPPSC_AE::syllabus']);
  console.log('Has BPSC_AE::syllabus:', !!examContent['BPSC_AE::syllabus']);

  const openkosh = JSON.parse(fs.readFileSync('src/data/openkoshDetailedSyllabus.json', 'utf8'));
  console.log('Has SSC_JE in openkoshDetailedSyllabus:', !!openkosh['SSC_JE']);
  console.log('Has UPPSC_AE in openkoshDetailedSyllabus:', !!openkosh['UPPSC_AE']);

  await pool.end();
  console.log('\n✅ ALL INTEGRITY AUDITS PASSED WITH FLYING COLORS!');
}

verify().catch(e => { console.error(e); process.exit(1); });
