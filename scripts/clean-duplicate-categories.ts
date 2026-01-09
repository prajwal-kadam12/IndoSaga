#!/usr/bin/env tsx

import mysql from 'mysql2/promise';

async function cleanDuplicateCategories() {
  console.log('🧹 Cleaning duplicate categories...');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('✅ Connected to MySQL database');

    // Find duplicate categories
    const [duplicates] = await connection.execute(`
      SELECT name, COUNT(*) as count, GROUP_CONCAT(id) as ids 
      FROM categories 
      GROUP BY name 
      HAVING COUNT(*) > 1
    `);

    console.log('📋 Found duplicate categories:');
    console.table(duplicates);

    // For each duplicate category, keep the one with the most recent created_at
    for (const duplicate of duplicates as any[]) {
      const categoryName = duplicate.name;
      const ids = duplicate.ids.split(',');
      
      console.log(`\n🔧 Processing category: ${categoryName}`);
      
      // Get all records for this category name, ordered by created_at DESC
      const [records] = await connection.execute(`
        SELECT id, created_at 
        FROM categories 
        WHERE name = ? 
        ORDER BY created_at DESC
      `, [categoryName]);
      
      const categoryRecords = records as any[];
      const keepId = categoryRecords[0].id; // Keep the most recent one
      const deleteIds = categoryRecords.slice(1).map(r => r.id); // Delete the rest
      
      console.log(`  ✅ Keeping category ID: ${keepId}`);
      console.log(`  🗑️  Deleting category IDs: ${deleteIds.join(', ')}`);
      
      // Update products that reference the categories we're about to delete
      for (const deleteId of deleteIds) {
        const [updateResult] = await connection.execute(`
          UPDATE products 
          SET category_id = ? 
          WHERE category_id = ?
        `, [keepId, deleteId]);
        
        console.log(`    📝 Updated ${(updateResult as any).affectedRows} products`);
      }
      
      // Delete the duplicate categories
      if (deleteIds.length > 0) {
        await connection.execute(`
          DELETE FROM categories 
          WHERE id IN (${deleteIds.map(() => '?').join(',')})
        `, deleteIds);
        
        console.log(`    ✅ Deleted ${deleteIds.length} duplicate categories`);
      }
    }

    // Show final categories
    const [finalCategories] = await connection.execute(`
      SELECT id, name, description, created_at 
      FROM categories 
      ORDER BY name
    `);
    
    console.log('\n📋 Final categories (duplicates removed):');
    console.table(finalCategories);

    await connection.end();
    console.log('🎉 Duplicate category cleanup completed!');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

cleanDuplicateCategories();