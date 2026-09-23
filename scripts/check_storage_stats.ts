import 'dotenv/config';
import { queryPostgres, pgPool } from '../src/lib/postgres.js';
import fs from 'fs';

async function checkStorage() {
  const localData = JSON.parse(fs.readFileSync('data/exam_content.json', 'utf8'));
  const localKeys = Object.keys(localData);
  const localBytes = fs.statSync('data/exam_content.json').size;

  let dbStats: any = { count: 0, byStatus: {}, byType: {} };
  try {
    const countRes = await queryPostgres('SELECT status, type, count(*) as count FROM exam_content GROUP BY status, type');
    countRes.rows.forEach(r => {
      dbStats.byStatus[r.status] = (dbStats.byStatus[r.status] || 0) + parseInt(r.count, 10);
      dbStats.byType[r.type] = (dbStats.byType[r.type] || 0) + parseInt(r.count, 10);
      dbStats.count += parseInt(r.count, 10);
    });
  } catch (err: any) {
    dbStats.error = err.message;
  }

  console.log('--- STORAGE & RECORD COUNTS ---');
  console.log('Local Cache Records:', localKeys.length);
  console.log('Local Cache File Size:', (localBytes / 1024).toFixed(2), 'KB');
  console.log('Neon Postgres Total Records:', dbStats.count);
  console.log('Neon Postgres By Status:', JSON.stringify(dbStats.byStatus));
  console.log('Neon Postgres By Type:', JSON.stringify(dbStats.byType));

  if (pgPool) await pgPool.end();
  process.exit(0);
}
checkStorage();
