import dns from 'dns';
if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
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
}

import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

export function findDatabaseUrl(): string | undefined {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.POSTGRES_URL) return process.env.POSTGRES_URL;
  if (process.env.NEON_DATABASE_URL) return process.env.NEON_DATABASE_URL;
  if (process.env.POSTGRES_PRISMA_URL) return process.env.POSTGRES_PRISMA_URL;
  for (const [k, v] of Object.entries(process.env)) {
    if (typeof v === 'string' && (v.startsWith('postgresql://') || v.startsWith('postgres://'))) {
      return v;
    }
  }
  return undefined;
}

const connectionString = findDatabaseUrl();

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
