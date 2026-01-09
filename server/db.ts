import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema';

// State to cache the initialization
let _db: any = null;

// Lazy initialization for serverless environments
export const db = new Proxy({} as any, {
  get(target, prop) {
    // Return early for standard JS properties to avoid accidental activation
    if (prop === 'constructor' || prop === 'prototype' || prop === 'toString' || prop === 'valueOf') {
      return (target as any)[prop];
    }

    if (!_db) {
      const url = process.env.DATABASE_URL;
      if (!url) {
        console.warn("⚠️ DATABASE_URL is missing. DB operations will fail.");
        // We throw a descriptive error here instead of calling neon(undefined)
        throw new Error("DATABASE_URL is not set. Please add it to your Netlify Environment Variables.");
      }

      console.log(`📡 DB Initializing with URL (length: ${url.length})`);
      const sql = neon(url);
      _db = drizzle(sql, { schema });
    }

    return _db[prop];
  }
});

export default db;