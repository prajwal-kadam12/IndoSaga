#!/usr/bin/env tsx

import { readFileSync } from 'fs';
import path from 'path';
import { db } from '../server/db.js';
import { categories, subcategories, products } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

interface JsonData {
  categories: Array<{
    id: string;
    name: string;
    description: string;
    createdAt: string;
  }>;
  subcategories: Array<{
    id: string;
    name: string;
    categoryId: string;
    description: string;
    imageUrl: string;
    createdAt: string;
  }>;
  products: Array<{
    id: string;
    name: string;
    description: string;
    price: string;
    originalPrice: string;
    categoryId: string;
    subcategoryId: string;
    imageUrl: string;
    images: string[];
    inStock: boolean;
    stock: number;
    featured: boolean;
    isDeal: boolean;
    dealPrice: string | null;
    dealExpiry: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
}

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // Read JSON data
    const jsonPath = path.join(process.cwd(), 'indosaga-complete-data.json');
    const jsonData: JsonData = JSON.parse(readFileSync(jsonPath, 'utf-8'));
    
    console.log(`📊 Data loaded: ${jsonData.categories.length} categories, ${jsonData.subcategories.length} subcategories, ${jsonData.products.length} products`);

    // 1. Seed Categories (idempotent - only insert if not exists)
    console.log('📁 Seeding categories...');
    for (const category of jsonData.categories) {
      try {
        // Check if category exists
        const existing = await db.select().from(categories).where(eq(categories.id, category.id)).limit(1);
        
        if (existing.length === 0) {
          await db.insert(categories).values({
            id: category.id,
            name: category.name,
            description: category.description,
            createdAt: new Date(category.createdAt)
          });
          console.log(`  ✅ Added category: ${category.name}`);
        } else {
          console.log(`  ⏭️  Category exists: ${category.name}`);
        }
      } catch (error) {
        console.error(`  ❌ Error adding category ${category.name}:`, error);
      }
    }

    // 2. Seed Subcategories (idempotent)
    console.log('📂 Seeding subcategories...');
    for (const subcategory of jsonData.subcategories) {
      try {
        // Check if subcategory exists
        const existing = await db.select().from(subcategories).where(eq(subcategories.id, subcategory.id)).limit(1);
        
        if (existing.length === 0) {
          await db.insert(subcategories).values({
            id: subcategory.id,
            name: subcategory.name,
            categoryId: subcategory.categoryId,
            description: subcategory.description,
            imageUrl: subcategory.imageUrl,
            createdAt: new Date(subcategory.createdAt)
          });
          console.log(`  ✅ Added subcategory: ${subcategory.name}`);
        } else {
          console.log(`  ⏭️  Subcategory exists: ${subcategory.name}`);
        }
      } catch (error) {
        console.error(`  ❌ Error adding subcategory ${subcategory.name}:`, error);
      }
    }

    // 3. Seed Products (idempotent with proper type conversions)
    console.log('🛋️  Seeding products...');
    for (const product of jsonData.products) {
      try {
        // Check if product exists
        const existing = await db.select().from(products).where(eq(products.id, product.id)).limit(1);
        
        if (existing.length === 0) {
          await db.insert(products).values({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price, // Already a string in JSON
            originalPrice: product.originalPrice, // Already a string in JSON
            categoryId: product.categoryId,
            subcategoryId: product.subcategoryId,
            imageUrl: product.imageUrl,
            images: product.images, // Array field for PostgreSQL
            inStock: product.inStock,
            stock: product.stock,
            featured: product.featured,
            isDeal: product.isDeal,
            dealPrice: product.dealPrice, // Can be null or string
            dealExpiry: product.dealExpiry ? new Date(product.dealExpiry) : null,
            createdAt: new Date(product.createdAt),
            updatedAt: new Date(product.updatedAt)
          });
          console.log(`  ✅ Added product: ${product.name}`);
        } else {
          console.log(`  ⏭️  Product exists: ${product.name}`);
        }
      } catch (error) {
        console.error(`  ❌ Error adding product ${product.name}:`, error);
      }
    }

    console.log('🎉 Database seeding completed successfully!');
    
    // Verify data
    const categoryCount = await db.select().from(categories);
    const subcategoryCount = await db.select().from(subcategories);
    const productCount = await db.select().from(products);
    
    console.log(`📊 Final counts:`);
    console.log(`  Categories: ${categoryCount.length}`);
    console.log(`  Subcategories: ${subcategoryCount.length}`);
    console.log(`  Products: ${productCount.length}`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };