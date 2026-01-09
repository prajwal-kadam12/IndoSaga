// MySQL Configuration for IndoSaga Database Migration
// This file contains the MySQL setup and fallback configuration

import { MySQLStorage } from './mysql-storage';
import { JSONStorage } from './json-storage';
import type { IStorage } from './storage';

// MySQL connection test
async function testMySQLConnection(): Promise<boolean> {
  try {
    const mysqlStorage = new MySQLStorage();
    return await mysqlStorage.testConnection();
  } catch (error) {
    console.log('MySQL connection failed, using JSON storage fallback');
    return false;
  }
}

// Storage factory function
export async function createStorage(): Promise<IStorage> {
  // Check if MySQL credentials are available
  const hasCredentials = process.env.DB_HOST && 
                        process.env.DB_PORT && 
                        process.env.DB_NAME && 
                        process.env.DB_USER && 
                        process.env.DB_PASSWORD;

  if (!hasCredentials) {
    console.log('MySQL credentials not found, using JSON storage');
    return new JSONStorage();
  }

  // Test MySQL connection
  const mysqlAvailable = await testMySQLConnection();
  
  if (mysqlAvailable) {
    console.log('✅ Using MySQL database storage');
    return new MySQLStorage();
  } else {
    console.log('❌ MySQL connection failed, falling back to JSON storage');
    console.log('📋 To fix: Ask your hosting provider to whitelist Replit IP: 34.11.197.112');
    return new JSONStorage();
  }
}

// Database configuration info
export const DatabaseInfo = {
  mysql: {
    host: process.env.DB_HOST || 'Not configured',
    port: process.env.DB_PORT || 'Not configured',
    database: process.env.DB_NAME || 'Not configured',
    user: process.env.DB_USER || 'Not configured',
    connected: false
  },
  currentStorage: 'JSON (fallback)',
  migrationStatus: 'Ready - PHP files created, MySQL schema available',
  nextSteps: [
    'Whitelist Replit IP (34.11.197.112) in your MySQL server',
    'Run migration script: tsx scripts/migrate-json-to-mysql.ts',
    'Restart application to use MySQL storage'
  ]
};