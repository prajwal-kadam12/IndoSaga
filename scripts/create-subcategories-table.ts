#!/usr/bin/env tsx

import mysql from 'mysql2/promise';

async function createSubcategoriesTable() {
  console.log('🔧 Creating subcategories table...');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('✅ Connected to MySQL database');

    // Create subcategories table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS subcategories (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category_id VARCHAR(36) NOT NULL,
        description TEXT,
        image_url VARCHAR(512),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Subcategories table created successfully');

    // Add foreign key constraint
    try {
      await connection.execute(`
        ALTER TABLE subcategories 
        ADD CONSTRAINT fk_subcategories_category 
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      `);
      console.log('✅ Foreign key constraint added');
    } catch (err: any) {
      if (err.code === 'ER_DUP_KEY') {
        console.log('⚠️  Foreign key constraint already exists');
      } else {
        console.log('⚠️  Foreign key constraint failed:', err.message);
      }
    }

    // Check final tables
    const [tables] = await connection.execute('SHOW TABLES');
    const allTables = (tables as any[]).map(row => Object.values(row)[0]);
    console.log('📋 All tables now:', allTables);

    await connection.end();
    console.log('🎉 Subcategories table setup completed!');
    
  } catch (error) {
    console.error('❌ Table creation failed:', error);
    process.exit(1);
  }
}

createSubcategoriesTable();