import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Please check your environment variables.");
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
export default db;