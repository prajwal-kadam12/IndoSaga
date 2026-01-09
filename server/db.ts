import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema';

// State to cache the initialization
let _db: any = null;

// Lazy initialization for serverless environments
// We use a Proxy to delay the initialization of the database connection until it's actually used.
// This is critical for serverless cold starts and avoiding crashes when environment variables are missing.
export const db = new Proxy({} as any, {
  get(target, prop) {
    // Return early for standard JS properties to avoid accidental activation
    if (prop === 'constructor' || prop === 'prototype' || prop === 'toString' || prop === 'valueOf') {
      return (target as any)[prop];
    }

    if (!_db) {
      const url = process.env.DATABASE_URL;
      if (!url) {
        throw new Error("DATABASE_URL is not set. Please add it to your Netlify Environment Variables.");
      }

      console.log(`📡 DB Initializing with URL (length: ${url.length})`);
      try {
        const sql = neon(url);
        _db = drizzle(sql, { schema });
      } catch (err: any) {
        console.error("❌ Failed to initialize Drizzle with Neon:", err);
        throw new Error(`Database Initialization Failed: ${err.message}`);
      }
    }

    const value = _db[prop];
    // CRITICAL: Bind functions to the actual _db instance so 'this' works correctly inside Drizzle
    return typeof value === 'function' ? value.bind(_db) : value;
  }
});

export default db;