import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create pool with better error handling and connection management
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
});

// Add error handling for connection drops
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  // Don't process.exit() here - let the app continue and try to reconnect
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT, closing database pool');
  pool.end();
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, closing database pool');
  pool.end();
});

export const db = drizzle({ client: pool, schema });