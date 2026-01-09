import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema';

// Lazy initialization for serverless environments
// This prevents top-level crashes if environment variables are missing during module load
export const db = new Proxy({} as any, {
  get(_, prop) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is missing. Please set it in Netlify Dashboard -> Site Settings -> Environment Variables.");
    }
    const sql = neon(url);
    const instance = drizzle(sql, { schema });
    return (instance as any)[prop];
  }
});

export default db;