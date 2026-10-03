import fs from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const syllabusRaw = fs.readFileSync('src/data/openkoshDetailedSyllabus.json', 'utf8');
  const detailedSyllabus = JSON.parse(syllabusRaw);
  const syllabusExams = Object.keys(detailedSyllabus);

  const qCounts = await pool.query(`
    SELECT exam_id, count(*)::int as count 
    FROM questions 
    GROUP BY exam_id 
    ORDER BY count ASC
  `);

  console.log(`DB has ${qCounts.rows.length} exams.`);
  console.log(`openkoshDetailedSyllabus has ${syllabusExams.length} exams.`);

  const dbExamMap = new Map();
  for (const r of qCounts.rows) {
    dbExamMap.set(r.exam_id, r.count);
  }

  const missingFromSyllabus = [];
  const needsTopup = [];

  for (const r of qCounts.rows) {
    const hasSyllabus = !!detailedSyllabus[r.exam_id];
    if (!hasSyllabus) {
      missingFromSyllabus.push(r.exam_id);
    }
    if (r.count < 5000) {
      needsTopup.push({
        exam: r.exam_id,
        current: r.count,
        needed: 5000 - r.count,
        hasSyllabus
      });
    }
  }

  console.log(`\nExams needing topup to 5,000: ${needsTopup.length}`);
  console.table(needsTopup);

  if (missingFromSyllabus.length > 0) {
    console.log('\nExams in DB not found in openkoshDetailedSyllabus:', missingFromSyllabus);
  }

  const sample = await pool.query(`
    SELECT exam_id, id 
    FROM questions 
    WHERE exam_id IN ('NEET_UG', 'CDS', 'RUHS_BSC_NURSING', 'SSC_CGL') 
    LIMIT 10;
  `);
  console.log('\nSample question IDs in DB:');
  console.table(sample.rows);

  await pool.end();
}

run().catch(console.error);
