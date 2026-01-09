import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema';

// Standard initialization for Neon HTTP in serverless environments
// We pass the URL (or empty string if missing) to neon()
// It only throws when a query is actually executed, so it's safe for top-level load
const sql = neon(process.env.DATABASE_URL || "");

export const db = drizzle(sql, { schema });

export default db;