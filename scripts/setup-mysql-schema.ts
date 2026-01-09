#!/usr/bin/env tsx

import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import path from 'path';

async function setupMySQLSchema() {
  console.log('🔧 Setting up MySQL database schema...');
  
  try {
    // Create MySQL connection using environment variables
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true
    });

    console.log('✅ Connected to MySQL database');

    // Check existing tables
    const [tables] = await connection.execute('SHOW TABLES');
    const existingTables = (tables as any[]).map(row => Object.values(row)[0]);
    console.log('📋 Existing tables:', existingTables);

    // Read and execute schema
    const schemaPath = path.join(process.cwd(), 'scripts', 'mysql-schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    
    console.log('📝 Executing schema creation...');
    await connection.execute(schema);
    
    // Check tables again
    const [newTables] = await connection.execute('SHOW TABLES');
    const allTables = (newTables as any[]).map(row => Object.values(row)[0]);
    console.log('✅ All tables after schema setup:', allTables);

    // Close connection
    await connection.end();
    console.log('🎉 MySQL schema setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Schema setup failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupMySQLSchema()
    .then(() => {
      console.log('✅ Schema setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Schema setup failed:', error);
      process.exit(1);
    });
}

export { setupMySQLSchema };