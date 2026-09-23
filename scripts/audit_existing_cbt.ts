import 'dotenv/config';
import { queryPostgres, pgPool } from '../src/lib/postgres.js';

async function main() {
  console.log('=== AUDITING EXISTING QUESTION & CBT DATA IN NEON ===');

  const tables = ['cbt_results', 'question_bank', 'pyq_bank', 'pyqs', 'user_manual_questions', 'exams', 'exam_content'];
  for (const t of tables) {
    try {
      const cnt = await queryPostgres(`SELECT COUNT(*) as c FROM ${t};`);
      console.log(`Table ${t}: ${cnt.rows[0].c} rows`);
    } catch (e: any) {
      console.log(`Table ${t}: error - ${e.message}`);
    }
  }

  console.log('\n--- cbt_results columns ---');
  const cbtCols = await queryPostgres(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'cbt_results';`);
  console.table(cbtCols.rows);

  console.log('\n--- question_bank columns ---');
  const qbCols = await queryPostgres(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'question_bank';`);
  console.table(qbCols.rows);

  console.log('\n--- pyq_bank columns ---');
  const pyqbCols = await queryPostgres(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'pyq_bank';`);
  console.table(pyqbCols.rows);

  console.log('\n--- pyqs columns ---');
  const pyqCols = await queryPostgres(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'pyqs';`);
  console.table(pyqCols.rows);

  console.log('\n--- exam_content questions count by exam ---');
  const ecQuestions = await queryPostgres(`
    SELECT exam_id, type, verification_status, status, jsonb_array_length(questions) as q_len
    FROM exam_content
    WHERE jsonb_array_length(questions) > 0;
  `);
  console.table(ecQuestions.rows);

  console.log('\n--- sample cbt_results ---');
  const sampleCbt = await queryPostgres(`SELECT user_id, updated_at, jsonb_typeof(data) as data_type FROM cbt_results LIMIT 3;`);
  console.table(sampleCbt.rows);

  console.log('\n--- question_bank rows ---');
  const qbRows = await queryPostgres(`SELECT id, user_id, email, jsonb_typeof(data) as dtype FROM question_bank LIMIT 5;`);
  console.table(qbRows.rows);

  console.log('\n--- pyqs rows ---');
  const pyqRows = await queryPostgres(`SELECT id, user_id, email, jsonb_typeof(data) as dtype FROM pyqs LIMIT 5;`);
  console.table(pyqRows.rows);

  await pgPool.end();
}

main().catch(console.error);
