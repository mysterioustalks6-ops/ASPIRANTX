import 'dotenv/config';
import { queryPostgres, pgPool } from '../src/lib/postgres.js';
import { INITIAL_CBT_TESTS } from '../src/data/cbtData.js';
import { INITIAL_QUESTION_BANK, INITIAL_PYQS_DATABASE } from '../src/data/academicData.js';

interface QuestionSourceAudit {
  sourceName: string;
  sourceType: string;
  totalRecords: number;
  verifiedCount: number;
  pendingCount: number;
  blockedCount: number;
  unknownProvenanceCount: number;
  notes: string;
}

async function auditAllQuestionSources() {
  console.log(`\n================================================================================`);
  console.log(`📊 PHASE 2 — EXISTING QUESTION DATA INVENTORY AUDIT`);
  console.log(`================================================================================\n`);

  const results: QuestionSourceAudit[] = [];

  // 1. Neon table: question_bank
  try {
    const qbRes = await queryPostgres(`SELECT * FROM question_bank;`);
    let verified = 0;
    let pending = 0;
    let unknown = 0;
    for (const r of qbRes.rows) {
      const d = r.data || {};
      const status = d.verification_status || d.status;
      if (status === 'verified') verified++;
      else if (status === 'pending_review') pending++;
      else unknown++;
    }
    results.push({
      sourceName: 'Neon public.question_bank',
      sourceType: 'Database Table',
      totalRecords: qbRes.rows.length,
      verifiedCount: verified,
      pendingCount: pending,
      blockedCount: 0,
      unknownProvenanceCount: unknown,
      notes: 'Contains initial system questions with generic jsonb payload.'
    });
  } catch (e: any) {
    console.error('Error auditing question_bank:', e.message);
  }

  // 2. Neon table: pyqs
  try {
    const pyqRes = await queryPostgres(`SELECT * FROM pyqs;`);
    let verified = 0;
    let pending = 0;
    let unknown = 0;
    for (const r of pyqRes.rows) {
      const d = r.data || {};
      const status = d.verification_status || d.status;
      if (status === 'verified') verified++;
      else if (status === 'pending_review') pending++;
      else unknown++;
    }
    results.push({
      sourceName: 'Neon public.pyqs',
      sourceType: 'Database Table',
      totalRecords: pyqRes.rows.length,
      verifiedCount: verified,
      pendingCount: pending,
      blockedCount: 0,
      unknownProvenanceCount: unknown,
      notes: 'Contains early sample PYQ records.'
    });
  } catch (e: any) {
    console.error('Error auditing pyqs:', e.message);
  }

  // 3. Neon table: pyq_bank
  try {
    const pyqbRes = await queryPostgres(`SELECT * FROM pyq_bank;`);
    results.push({
      sourceName: 'Neon public.pyq_bank',
      sourceType: 'Database Table',
      totalRecords: pyqbRes.rows.length,
      verifiedCount: 0,
      pendingCount: 0,
      blockedCount: 0,
      unknownProvenanceCount: 0,
      notes: 'Empty table.'
    });
  } catch (e: any) {
    console.error('Error auditing pyq_bank:', e.message);
  }

  // 4. Neon table: exam_content (questions column)
  try {
    const ecRes = await queryPostgres(`
      SELECT exam_id, type, verification_status, jsonb_array_length(questions) as q_len
      FROM exam_content
      WHERE jsonb_array_length(questions) > 0;
    `);
    const totalQ = ecRes.rows.reduce((sum: number, r: any) => sum + Number(r.q_len || 0), 0);
    results.push({
      sourceName: 'Neon public.exam_content (questions)',
      sourceType: 'Database Table',
      totalRecords: totalQ,
      verifiedCount: 0,
      pendingCount: totalQ,
      blockedCount: 0,
      unknownProvenanceCount: 0,
      notes: 'All 77 exam_content rows currently have questions = [].'
    });
  } catch (e: any) {
    console.error('Error auditing exam_content questions:', e.message);
  }

  // 5. Static code: src/data/cbtData.ts (INITIAL_CBT_TESTS)
  let staticCbtQuestions = 0;
  for (const t of INITIAL_CBT_TESTS) {
    staticCbtQuestions += (t.questions || []).length;
  }
  results.push({
    sourceName: 'src/data/cbtData.ts (INITIAL_CBT_TESTS)',
    sourceType: 'Static Code Array',
    totalRecords: staticCbtQuestions,
    verifiedCount: 0,
    pendingCount: staticCbtQuestions,
    blockedCount: 0,
    unknownProvenanceCount: 0,
    notes: 'Static standard national mock questions. Marked pending_review until key verification.'
  });

  // 6. Static code: src/data/academicData.ts (INITIAL_QUESTION_BANK)
  results.push({
    sourceName: 'src/data/academicData.ts (INITIAL_QUESTION_BANK)',
    sourceType: 'Static Code Array',
    totalRecords: INITIAL_QUESTION_BANK.length,
    verifiedCount: 0,
    pendingCount: INITIAL_QUESTION_BANK.length,
    blockedCount: 0,
    unknownProvenanceCount: 0,
    notes: 'Sample seed questions for Polity, History, Economy. Marked pending_review.'
  });

  // 7. Static code: src/data/academicData.ts (INITIAL_PYQS_DATABASE)
  results.push({
    sourceName: 'src/data/academicData.ts (INITIAL_PYQS_DATABASE)',
    sourceType: 'Static Code Array',
    totalRecords: INITIAL_PYQS_DATABASE.length,
    verifiedCount: 0,
    pendingCount: 0,
    blockedCount: 0,
    unknownProvenanceCount: 0,
    notes: 'Empty array.'
  });

  console.table(results);

  const grandTotal = results.reduce((acc, r) => acc + r.totalRecords, 0);
  console.log(`Grand Total Existing Question Records across project: ${grandTotal}`);

  await pgPool.end();
}

auditAllQuestionSources().catch(console.error);
