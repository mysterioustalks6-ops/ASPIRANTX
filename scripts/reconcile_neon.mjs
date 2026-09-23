import pg from 'pg';
import dns from 'dns';
import dotenv from 'dotenv';
dotenv.config();

dns.setServers(['8.8.8.8', '1.1.1.1']);
const origLookup = dns.lookup;
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
    origLookup(hostname, options, callback);
  });
};

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log('--- CHECKING DISPUTED TABLES IN NEON ---');
  const targetTables = ['user_wallets', 'wallet_transactions', 'utr_requests', 'users'];
  
  const tablesRes = await pool.query(`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_schema IN ('public', 'auth') 
      AND table_name = ANY($1)
    ORDER BY table_schema, table_name;
  `, [targetTables]);
  
  console.log('Found Disputed Tables:', tablesRes.rows);

  const allSchemas = await pool.query(`SELECT schema_name FROM information_schema.schemata ORDER BY schema_name;`);
  console.log('All Schemas in Neon:', allSchemas.rows.map(r => r.schema_name));

  const allPublicTables = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.log('Total public tables:', allPublicTables.rows.length);

  for (const t of tablesRes.rows) {
    const pks = await pool.query(`
      SELECT c.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
      JOIN information_schema.columns c ON c.table_name = tc.table_name AND c.column_name = ccu.column_name
      WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = $1 AND tc.table_name = $2;
    `, [t.table_schema, t.table_name]);

    const fks = await pool.query(`
      SELECT tc.constraint_name, kcu.column_name, ccu.table_schema AS foreign_table_schema,
             ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = $1 AND tc.table_name = $2;
    `, [t.table_schema, t.table_name]);

    const idxs = await pool.query(`
      SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = $1 AND tablename = $2;
    `, [t.table_schema, t.table_name]);

    const constraints = await pool.query(`
      SELECT constraint_name, constraint_type 
      FROM information_schema.table_constraints 
      WHERE table_schema = $1 AND table_name = $2;
    `, [t.table_schema, t.table_name]);

    const count = await pool.query(`SELECT COUNT(*) FROM "${t.table_schema}"."${t.table_name}"`);

    console.log(`\n========================================`);
    console.log(`EXACT TABLE: ${t.table_schema}.${t.table_name}`);
    console.log(`Database/Schema: neondb / ${t.table_schema}`);
    console.log(`Primary Key:`, pks.rows.map(r => r.column_name).join(', ') || 'NONE');
    console.log(`Foreign Keys:`, fks.rows.map(f => `${f.column_name} -> ${f.foreign_table_schema}.${f.foreign_table_name}(${f.foreign_column_name})`));
    console.log(`Indexes:`, idxs.rows.map(i => i.indexname));
    console.log(`Constraints:`, constraints.rows.map(c => `${c.constraint_name} (${c.constraint_type})`));
    console.log(`Row Count:`, count.rows[0].count);
  }

  // Also check if auth.users exists
  const authUsersCheck = await pool.query(`
    SELECT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'auth' AND table_name = 'users';
  `);
  console.log('\nauth.users check:', authUsersCheck.rows);

  await pool.end();
}

run().catch(console.error);
