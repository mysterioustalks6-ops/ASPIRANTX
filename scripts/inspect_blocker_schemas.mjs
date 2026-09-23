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

const TABLES = [
  'cbt_results',
  'user_syllabus_progress',
  'user_pomodoro_sessions',
  'teacher_classes',
  'class_assignments',
  'assignment_submissions',
  'class_enrollments',
  'class_attendance'
];

async function main() {
  const client = await pool.connect();
  try {
    console.log('=== NEON CATALOG INSPECTION FOR BLOCKER TABLES ===\n');
    for (const table of TABLES) {
      console.log(`----------------------------------------`);
      console.log(`TABLE: public.${table}`);
      
      // 1. Columns
      const colRes = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [table]);
      console.log('COLUMNS:');
      console.table(colRes.rows);

      // 2. Constraints (PK, Unique, FK)
      const conRes = await client.query(`
        SELECT tc.constraint_name, tc.constraint_type, kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.table_schema = 'public' AND tc.table_name = $1;
      `, [table]);
      console.log('CONSTRAINTS:');
      console.table(conRes.rows);

      // 3. Indexes
      const idxRes = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = $1;
      `, [table]);
      console.log('INDEXES:');
      console.table(idxRes.rows);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
