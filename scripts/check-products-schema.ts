#!/usr/bin/env tsx

import mysql from 'mysql2/promise';

async function checkProductsSchema() {
  console.log('🔍 Checking products table structure...');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('✅ Connected to MySQL database');

    // Check products table structure
    const [columns] = await connection.execute('DESCRIBE products');
    console.log('📋 Current products table columns:');
    console.table(columns);

    // Add missing columns if needed
    const columnNames = (columns as any[]).map(col => col.Field);
    
    if (!columnNames.includes('subcategory_id')) {
      console.log('🔧 Adding missing subcategory_id column...');
      await connection.execute(`
        ALTER TABLE products 
        ADD COLUMN subcategory_id VARCHAR(36) AFTER category_id
      `);
      console.log('✅ Added subcategory_id column');
    }

    if (!columnNames.includes('images')) {
      console.log('🔧 Adding missing images column...');
      await connection.execute(`
        ALTER TABLE products 
        ADD COLUMN images JSON AFTER image_url
      `);
      console.log('✅ Added images column');
    }

    if (!columnNames.includes('featured')) {
      console.log('🔧 Adding missing featured column...');
      await connection.execute(`
        ALTER TABLE products 
        ADD COLUMN featured BOOLEAN DEFAULT FALSE AFTER stock
      `);
      console.log('✅ Added featured column');
    }

    if (!columnNames.includes('is_deal')) {
      console.log('🔧 Adding missing is_deal column...');
      await connection.execute(`
        ALTER TABLE products 
        ADD COLUMN is_deal BOOLEAN DEFAULT FALSE AFTER featured
      `);
      console.log('✅ Added is_deal column');
    }

    // Check final structure
    const [finalColumns] = await connection.execute('DESCRIBE products');
    console.log('📋 Updated products table columns:');
    console.table(finalColumns);

    await connection.end();
    console.log('🎉 Products table schema check completed!');
    
  } catch (error) {
    console.error('❌ Schema check failed:', error);
    process.exit(1);
  }
}

checkProductsSchema();