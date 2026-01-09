import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  categories, 
  subcategories, 
  products, 
  users,
  orders,
  orderItems,
  cartItems,
  wishlistItems,
  productReviews,
  productQuestions
} from '../shared/schema.js';

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required');
}

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const db = drizzle(pool);

async function loadJsonData(filename: string) {
  try {
    const filePath = path.join(process.cwd(), 'data', filename);
    const data = await fs.readFile(filePath, 'utf-8');
    const jsonData = JSON.parse(data);
    
    // Convert date strings to Date objects
    return jsonData.map((item: any) => {
      const converted = { ...item };
      if (converted.createdAt && typeof converted.createdAt === 'string') {
        converted.createdAt = new Date(converted.createdAt);
      }
      if (converted.updatedAt && typeof converted.updatedAt === 'string') {
        converted.updatedAt = new Date(converted.updatedAt);
      }
      if (converted.orderDate && typeof converted.orderDate === 'string') {
        converted.orderDate = new Date(converted.orderDate);
      }
      if (converted.dealExpiry && typeof converted.dealExpiry === 'string') {
        converted.dealExpiry = new Date(converted.dealExpiry);
      }
      return converted;
    });
  } catch (error) {
    console.warn(`⚠️ Could not load ${filename}:`, error);
    return [];
  }
}

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // 1. Seed Categories
    console.log('📁 Seeding categories...');
    const categoriesData = await loadJsonData('categories.json');
    if (categoriesData.length > 0) {
      await db.insert(categories).values(categoriesData).onConflictDoNothing();
      console.log(`✅ Inserted ${categoriesData.length} categories`);
    }

    // 2. Seed Subcategories
    console.log('📂 Seeding subcategories...');
    const subcategoriesData = await loadJsonData('subcategories.json');
    if (subcategoriesData.length > 0) {
      await db.insert(subcategories).values(subcategoriesData).onConflictDoNothing();
      console.log(`✅ Inserted ${subcategoriesData.length} subcategories`);
    }

    // 3. Seed Products
    console.log('🛋️ Seeding products...');
    const productsData = await loadJsonData('products.json');
    if (productsData.length > 0) {
      await db.insert(products).values(productsData).onConflictDoNothing();
      console.log(`✅ Inserted ${productsData.length} products`);
    }

    // 4. Seed Users
    console.log('👥 Seeding users...');
    const usersData = await loadJsonData('users.json');
    if (usersData.length > 0) {
      await db.insert(users).values(usersData).onConflictDoNothing();
      console.log(`✅ Inserted ${usersData.length} users`);
    }

    // 5. Seed Orders
    console.log('📦 Seeding orders...');
    const ordersData = await loadJsonData('orders.json');
    if (ordersData.length > 0) {
      await db.insert(orders).values(ordersData).onConflictDoNothing();
      console.log(`✅ Inserted ${ordersData.length} orders`);
    }

    // 6. Seed Order Items
    console.log('📋 Seeding order items...');
    const orderItemsData = await loadJsonData('orderItems.json');
    if (orderItemsData.length > 0) {
      await db.insert(orderItems).values(orderItemsData).onConflictDoNothing();
      console.log(`✅ Inserted ${orderItemsData.length} order items`);
    }

    // 7. Seed Product Reviews
    console.log('⭐ Seeding product reviews...');
    const reviewsData = await loadJsonData('productReviews.json');
    if (reviewsData.length > 0) {
      await db.insert(productReviews).values(reviewsData).onConflictDoNothing();
      console.log(`✅ Inserted ${reviewsData.length} product reviews`);
    }

    // 8. Seed Product Questions
    console.log('❓ Seeding product questions...');
    const questionsData = await loadJsonData('productQuestions.json');
    if (questionsData.length > 0) {
      await db.insert(productQuestions).values(questionsData).onConflictDoNothing();
      console.log(`✅ Inserted ${questionsData.length} product questions`);
    }

    console.log('\n🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run seeding
seedDatabase();