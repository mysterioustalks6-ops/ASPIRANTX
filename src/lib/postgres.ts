import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  const defaultLookup = dns.lookup;
  (dns.lookup as any) = (hostname: any, options: any, callback: any) => {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    dns.resolve4(hostname, (err, addresses) => {
      if (!err && addresses && addresses.length > 0) {
        if (options && options.all) {
          return callback(null, addresses.map((a) => ({ address: a, family: 4 })));
        }
        return callback(null, addresses[0], 4);
      }
      defaultLookup(hostname, options, callback);
    });
  };
} catch (_e) {}

import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

let poolInstance: pg.Pool | null = null;

if (connectionString) {
  poolInstance = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  poolInstance.on('error', (err) => {
    console.error('[PostgreSQL Pool Error]:', err.message);
  });
}

export const pgPool = poolInstance;

export async function queryPostgres<R extends pg.QueryResultRow = any>(text: string, params?: any[]): Promise<pg.QueryResult<R>> {
  if (!pgPool) {
    throw new Error('PostgreSQL is not configured. DATABASE_URL is missing.');
  }
  return await pgPool.query<R>(text, params);
}
