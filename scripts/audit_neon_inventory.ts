import 'dotenv/config';
import { queryPostgres, pgPool } from '../src/lib/postgres.js';

import crypto from 'crypto';

function sha256(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function runInventoryAudit() {
  console.log(`\n=== NEON INVENTORY AUDIT ===\n`);

  // 1. Total counts by status and verification_status
  const totalRes = await queryPostgres(`SELECT COUNT(*) as total FROM exam_content;`);
  const statusRes = await queryPostgres(`
    SELECT status, COUNT(*) as cnt FROM exam_content GROUP BY status ORDER BY cnt DESC;
  `);
  const vStatusRes = await queryPostgres(`
    SELECT verification_status, COUNT(*) as cnt FROM exam_content GROUP BY verification_status ORDER BY cnt DESC;
  `);

  console.log(`Total exam_content rows:`, totalRes.rows[0].total);
  console.log(`\nStatus breakdown:`);
  console.table(statusRes.rows);
  console.log(`\nVerification status breakdown:`);
  console.table(vStatusRes.rows);

  // Cross breakdown (status x verification_status x type)
  const crossRes = await queryPostgres(`
    SELECT type, status, verification_status, COUNT(*) as cnt
    FROM exam_content
    GROUP BY type, status, verification_status
    ORDER BY type, status, cnt DESC;
  `);
  console.log(`\nCross breakdown:`);
  console.table(crossRes.rows);

  // 2. Verified Candidates (7 records)
  const candidateExams = [
    'CTET',
    'MAHARASHTRA_COMMON_ENTRAN',
    'RRB_NTPC',
    'SSC_CHSL',
    'UPPSC_PCS',
    'CSIR_NATIONAL_ELIGIBILITY',
    'UGC_NET'
  ];

  console.log(`\n=== PHASE 9: 7 VERIFIED CANDIDATES ===`);
  const verifiedRes = await queryPostgres(`
    SELECT exam_id, source_url, sections,
           verification_status, status, provenance->>'publisher' as publisher
    FROM exam_content
    WHERE exam_id = ANY($1) AND type = 'syllabus'
    ORDER BY exam_id;
  `, [candidateExams]);

  for (const r of verifiedRes.rows) {
    const secs = typeof r.sections === 'string' ? JSON.parse(r.sections) : (r.sections || []);
    const secCount = secs.length;
    const topCount = secs.reduce((acc: number, s: any) => acc + (s.topics?.length || 0), 0);
    const contentHash = sha256(JSON.stringify(secs));
    console.log(JSON.stringify({
      exam_id: r.exam_id,
      source_url: r.source_url,
      sec_count: secCount,
      top_count: topCount,
      content_hash: contentHash,
      short_hash: contentHash.slice(0, 16),
      verification_status: r.verification_status,
      status: r.status,
      publisher: r.publisher
    }));
  }

  // 3. Quarantined Candidates (6 records)
  const quarantinedExams = [
    'ANM_GNM',
    'IMU_CET',
    'JEECUP',
    'JENPAS_UG',
    'KARNATAKA_COMMON_ENTRANCE',
    'RAJASTHAN_PUBLIC_SERVICE_'
  ];

  console.log(`\n=== PHASE 10: 6 QUARANTINED RECORDS ===`);
  const quarantinedRes = await queryPostgres(`
    SELECT exam_id, source_url, sections,
           verification_status, status, review_reason
    FROM exam_content
    WHERE exam_id = ANY($1) AND type = 'syllabus'
    ORDER BY exam_id;
  `, [quarantinedExams]);

  for (const r of quarantinedRes.rows) {
    const secs = typeof r.sections === 'string' ? JSON.parse(r.sections) : (r.sections || []);
    console.log(JSON.stringify({
      exam_id: r.exam_id,
      source_url: r.source_url,
      sec_count: secs.length,
      verification_status: r.verification_status,
      status: r.status,
      review_reason: r.review_reason,
      content_hash: secs.length > 0 ? sha256(JSON.stringify(secs)) : 'none (empty sections)'
    }));
  }

  // 4. Legacy records count and status
  console.log(`\n=== PHASE 11: LEGACY RECORDS ===`);
  const legacyRes = await queryPostgres(`
    SELECT COUNT(*) as legacy_count
    FROM exam_content
    WHERE verification_status = 'legacy_fallback';
  `);
  console.log(`Legacy fallback count:`, legacyRes.rows[0].legacy_count);

  // 5. Hash regression checks
  console.log(`\n=== PHASE 12: HASH REGRESSION ===`);
  const allSyllabus = await queryPostgres(`
    SELECT exam_id, sections FROM exam_content WHERE type = 'syllabus';
  `);
  const hashCollisions: Record<string, string[]> = {};
  for (const row of allSyllabus.rows) {
    const secs = typeof row.sections === 'string' ? JSON.parse(row.sections) : (row.sections || []);
    if (secs.length === 0) continue;
    const h = sha256(JSON.stringify(secs));
    if (!hashCollisions[h]) hashCollisions[h] = [];
    hashCollisions[h].push(row.exam_id);
  }

  console.log(`Checking for old placeholder hash dc5130c7f10a0adc...`);
  const foundOldHash = Object.keys(hashCollisions).filter(k => k.startsWith('dc5130c7f10a0adc'));
  console.log(`Old placeholder hash found: ${foundOldHash.length === 0 ? 'NONE (ELIMINATED)' : foundOldHash.join(', ')}`);

  console.log(`Collisions across populated syllabus records:`);
  for (const [h, exams] of Object.entries(hashCollisions)) {
    if (exams.length > 1) {
      console.log(`  - Hash ${h.slice(0, 16)}... (${exams.length} exams): ${exams.join(', ')}`);
    }
  }

  await pgPool.end();
}

runInventoryAudit().catch(console.error);
