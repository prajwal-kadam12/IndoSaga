import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema';

// Safe initialization that won't crash the serverless function bundle
const databaseUrl = process.env.DATABASE_URL || "";

if (!databaseUrl) {
  console.warn("⚠️ DATABASE_URL is missing. Please set it in Netlify Environment Variables.");
}

const sql = neon(databaseUrl);
export const db = drizzle(sql, { schema });
export default db;