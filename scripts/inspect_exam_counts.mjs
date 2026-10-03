import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log('Connecting to Neon DB...');
  const sizeRes = await pool.query(`
    SELECT pg_size_pretty(pg_database_size(current_database())) as total_db_size,
           pg_database_size(current_database()) as total_bytes
  `);
  console.log('Current DB Size:', sizeRes.rows[0]);

  const tblSizes = await pool.query(`
    SELECT relname as table_name,
           pg_size_pretty(pg_total_relation_size(relid)) as total_size,
           pg_total_relation_size(relid) as bytes
    FROM pg_catalog.pg_statio_user_tables
    ORDER BY pg_total_relation_size(relid) DESC
    LIMIT 10;
  `);
  console.log('\nTop 10 Tables by size:');
  console.table(tblSizes.rows);

  const qCounts = await pool.query(`
    SELECT exam_id, count(*)::int as q_count
    FROM questions
    GROUP BY exam_id
    ORDER BY q_count ASC
  `);
  console.log(`\nExams count in 'questions' table (${qCounts.rows.length} exams):`);
  console.table(qCounts.rows);

  const pyqCounts = await pool.query(`
    SELECT data->>'exam' as exam, count(*)::int as pyq_count
    FROM pyqs
    GROUP BY data->>'exam'
    ORDER BY pyq_count ASC
  `);
  console.log(`\nExams count in 'pyqs' table (${pyqCounts.rows.length} exams):`);
  console.table(pyqCounts.rows);

  const qCols = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'questions' 
    ORDER BY ordinal_position;
  `);
  console.log('\nquestions table columns:');
  console.table(qCols.rows);

  const pyqCols = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'pyqs' 
    ORDER BY ordinal_position;
  `);
  console.log('\npyqs table columns:');
  console.table(pyqCols.rows);

  const qbCols = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'question_bank' 
    ORDER BY ordinal_position;
  `);
  console.log('\nquestion_bank table columns:');
  console.table(qbCols.rows);

  await pool.end();
}

run().catch(console.error);
