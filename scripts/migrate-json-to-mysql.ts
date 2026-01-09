import { nanoid } from 'nanoid';
import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';

// MySQL connection configuration
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  ssl: undefined
});

// Helper function to format dates for MySQL
function formatDate(date: string | Date | null | undefined): string | null {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

// Helper function to read JSON data
async function readJSONFile(filePath: string): Promise<any[]> {
  try {
    const fullPath = path.resolve(process.cwd(), 'data', filePath);
    const data = await fs.readFile(fullPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.warn(`Warning: Could not read ${filePath}, using empty array`);
    return [];
  }
}

async function migrateCategories() {
  console.log('Migrating categories...');
  const categories = await readJSONFile('categories.json');
  
  for (const category of categories) {
    await pool.execute(`
      INSERT IGNORE INTO categories (id, name, description, created_at)
      VALUES (?, ?, ?, ?)
    `, [
      category.id || nanoid(),
      category.name,
      category.description || null,
      formatDate(category.createdAt) || formatDate(new Date())
    ]);
  }
  
  console.log(`✅ Migrated ${categories.length} categories`);
}

async function migrateSubcategories() {
  console.log('Migrating subcategories...');
  const subcategories = await readJSONFile('subcategories.json');
  
  for (const subcategory of subcategories) {
    await pool.execute(`
      INSERT IGNORE INTO subcategories (id, name, category_id, description, image_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      subcategory.id || nanoid(),
      subcategory.name,
      subcategory.categoryId,
      subcategory.description || null,
      subcategory.imageUrl || null,
      formatDate(subcategory.createdAt) || formatDate(new Date())
    ]);
  }
  
  console.log(`✅ Migrated ${subcategories.length} subcategories`);
}

async function migrateProducts() {
  console.log('Migrating products...');
  const products = await readJSONFile('products.json');
  
  for (const product of products) {
    await pool.execute(`
      INSERT IGNORE INTO products (
        id, name, description, price, original_price, category_id, subcategory_id,
        image_url, images, in_stock, stock, featured, is_deal, deal_price, deal_expiry,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      product.id || nanoid(),
      product.name,
      product.description || null,
      product.price,
      product.originalPrice || null,
      product.categoryId || null,
      product.subcategoryId || null,
      product.imageUrl || null,
      JSON.stringify(product.images || []),
      product.inStock !== false,
      product.stock || 0,
      product.featured === true,
      product.isDeal === true,
      product.dealPrice || null,
      formatDate(product.dealExpiry),
      formatDate(product.createdAt) || formatDate(new Date()),
      formatDate(product.updatedAt) || formatDate(new Date())
    ]);
  }
  
  console.log(`✅ Migrated ${products.length} products`);
}

async function migrateUsers() {
  console.log('Migrating users...');
  const users = await readJSONFile('users.json');
  
  for (const user of users) {
    await pool.execute(`
      INSERT IGNORE INTO users (
        id, email, name, first_name, last_name, phone, address,
        profile_image_url, password_hash, provider, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      user.id || nanoid(),
      user.email,
      user.name || null,
      user.firstName || null,
      user.lastName || null,
      user.phone || null,
      user.address || null,
      user.profileImageUrl || null,
      user.passwordHash || null,
      user.provider || null,
      formatDate(user.createdAt) || formatDate(new Date()),
      formatDate(user.updatedAt) || formatDate(new Date())
    ]);
  }
  
  console.log(`✅ Migrated ${users.length} users`);
}

async function migrateCartItems() {
  console.log('Migrating cart items...');
  const cartItems = await readJSONFile('cartItems.json');
  
  for (const item of cartItems) {
    await pool.execute(`
      INSERT IGNORE INTO cart_items (id, user_id, product_id, quantity, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [
      item.id || nanoid(),
      item.userId,
      item.productId,
      item.quantity || 1,
      formatDate(item.createdAt) || formatDate(new Date())
    ]);
  }
  
  console.log(`✅ Migrated ${cartItems.length} cart items`);
}

async function migrateWishlistItems() {
  console.log('Migrating wishlist items...');
  const wishlistItems = await readJSONFile('wishlistItems.json');
  
  for (const item of wishlistItems) {
    await pool.execute(`
      INSERT IGNORE INTO wishlist_items (id, user_id, product_id, created_at)
      VALUES (?, ?, ?, ?)
    `, [
      item.id || nanoid(),
      item.userId,
      item.productId,
      formatDate(item.createdAt) || formatDate(new Date())
    ]);
  }
  
  console.log(`✅ Migrated ${wishlistItems.length} wishlist items`);
}

async function migrateOrders() {
  console.log('Migrating orders...');
  const orders = await readJSONFile('orders.json');
  
  for (const order of orders) {
    await pool.execute(`
      INSERT IGNORE INTO orders (
        id, user_id, total, status, payment_id, payment_status, payment_method,
        razorpay_order_id, razorpay_payment_id, razorpay_signature,
        customer_name, customer_phone, customer_email, shipping_address, pincode,
        tracking_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      order.id || nanoid(),
      order.userId,
      order.total,
      order.status || 'pending',
      order.paymentId || null,
      order.paymentStatus || 'pending',
      order.paymentMethod || null,
      order.razorpayOrderId || null,
      order.razorpayPaymentId || null,
      order.razorpaySignature || null,
      order.customerName,
      order.customerPhone,
      order.customerEmail || null,
      order.shippingAddress,
      order.pincode,
      order.trackingId || null,
      formatDate(order.createdAt) || formatDate(new Date()),
      formatDate(order.updatedAt) || formatDate(new Date())
    ]);
  }
  
  console.log(`✅ Migrated ${orders.length} orders`);
}

async function migrateOrderItems() {
  console.log('Migrating order items...');
  const orderItems = await readJSONFile('orderItems.json');
  
  for (const item of orderItems) {
    await pool.execute(`
      INSERT IGNORE INTO order_items (id, order_id, product_id, quantity, price, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      item.id || nanoid(),
      item.orderId,
      item.productId,
      item.quantity,
      item.price,
      formatDate(item.createdAt) || formatDate(new Date())
    ]);
  }
  
  console.log(`✅ Migrated ${orderItems.length} order items`);
}

async function migrateContactInquiries() {
  console.log('Migrating contact inquiries...');
  const inquiries = await readJSONFile('contactInquiries.json');
  
  for (const inquiry of inquiries) {
    await pool.execute(`
      INSERT IGNORE INTO contact_inquiries (
        id, first_name, last_name, email, phone, inquiry_type, message, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      inquiry.id || nanoid(),
      inquiry.firstName,
      inquiry.lastName,
      inquiry.email,
      inquiry.phone || null,
      inquiry.inquiryType,
      inquiry.message,
      inquiry.status || 'new',
      formatDate(inquiry.createdAt) || formatDate(new Date())
    ]);
  }
  
  console.log(`✅ Migrated ${inquiries.length} contact inquiries`);
}

async function migrateSupportTickets() {
  console.log('Migrating support tickets...');
  const tickets = await readJSONFile('supportTickets.json');
  
  for (const ticket of tickets) {
    await pool.execute(`
      INSERT IGNORE INTO support_tickets (
        id, user_id, customer_name, customer_email, customer_phone,
        subject, message, status, priority, assigned_to, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      ticket.id || nanoid(),
      ticket.userId || null,
      ticket.customerName,
      ticket.customerEmail,
      ticket.customerPhone || null,
      ticket.subject,
      ticket.message,
      ticket.status || 'open',
      ticket.priority || 'medium',
      ticket.assignedTo || null,
      formatDate(ticket.createdAt) || formatDate(new Date()),
      formatDate(ticket.updatedAt) || formatDate(new Date())
    ]);
  }
  
  console.log(`✅ Migrated ${tickets.length} support tickets`);
}

async function migrateAppointments() {
  console.log('Migrating appointments...');
  const appointments = await readJSONFile('appointments.json');
  
  for (const appointment of appointments) {
    await pool.execute(`
      INSERT IGNORE INTO appointments (
        id, user_id, customer_name, customer_email, customer_phone,
        appointment_date, duration, meeting_type, status, meeting_link,
        meeting_id, notes, reminder_sent, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      appointment.id || nanoid(),
      appointment.userId || null,
      appointment.customerName,
      appointment.customerEmail,
      appointment.customerPhone,
      formatDate(appointment.appointmentDate),
      appointment.duration || 30,
      appointment.meetingType || 'virtual_showroom',
      appointment.status || 'scheduled',
      appointment.meetingLink || null,
      appointment.meetingId || null,
      appointment.notes || null,
      appointment.reminderSent === true,
      formatDate(appointment.createdAt) || formatDate(new Date()),
      formatDate(appointment.updatedAt) || formatDate(new Date())
    ]);
  }
  
  console.log(`✅ Migrated ${appointments.length} appointments`);
}

async function migrateProductReviews() {
  console.log('Migrating product reviews...');
  const reviews = await readJSONFile('productReviews.json');
  
  for (const review of reviews) {
    await pool.execute(`
      INSERT IGNORE INTO product_reviews (
        id, product_id, user_id, user_name, rating, comment, images, is_verified, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      review.id || nanoid(),
      review.productId,
      review.userId || null,
      review.userName,
      review.rating,
      review.comment,
      JSON.stringify(review.images || []),
      review.isVerified === true,
      formatDate(review.createdAt) || formatDate(new Date()),
      formatDate(review.updatedAt) || formatDate(new Date())
    ]);
  }
  
  console.log(`✅ Migrated ${reviews.length} product reviews`);
}

async function migrateProductQuestions() {
  console.log('Migrating product questions...');
  const questions = await readJSONFile('productQuestions.json');
  
  for (const question of questions) {
    await pool.execute(`
      INSERT IGNORE INTO product_questions (
        id, product_id, user_id, user_name, user_email, question, answer,
        answered_by, answered_at, is_public, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      question.id || nanoid(),
      question.productId,
      question.userId || null,
      question.userName,
      question.userEmail || null,
      question.question,
      question.answer || null,
      question.answeredBy || null,
      formatDate(question.answeredAt),
      question.isPublic !== false,
      formatDate(question.createdAt) || formatDate(new Date()),
      formatDate(question.updatedAt) || formatDate(new Date())
    ]);
  }
  
  console.log(`✅ Migrated ${questions.length} product questions`);
}

async function createSchema() {
  console.log('Creating MySQL database schema...');
  const schemaPath = path.resolve(process.cwd(), 'scripts', 'mysql-schema.sql');
  const schema = await fs.readFile(schemaPath, 'utf-8');
  
  // Split schema into individual statements
  const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
  
  for (const statement of statements) {
    if (statement.trim()) {
      await pool.execute(statement);
    }
  }
  
  console.log('✅ Database schema created successfully');
}

async function testConnection() {
  console.log('Testing MySQL connection...');
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ MySQL connection successful');
    return true;
  } catch (error) {
    console.error('❌ MySQL connection failed:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting JSON to MySQL migration...');
  console.log('Database Config:', {
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    database: process.env.MYSQL_DB,
    user: process.env.MYSQL_USER
  });
  
  try {
    // Test connection first
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Failed to connect to MySQL database');
    }
    
    // Create schema
    await createSchema();
    
    // Migrate data in proper order (respecting foreign key constraints)
    await migrateUsers();
    await migrateCategories();
    await migrateSubcategories();
    await migrateProducts();
    await migrateCartItems();
    await migrateWishlistItems();
    await migrateOrders();
    await migrateOrderItems();
    await migrateContactInquiries();
    await migrateSupportTickets();
    await migrateAppointments();
    await migrateProductReviews();
    await migrateProductQuestions();
    
    console.log('🎉 Migration completed successfully!');
    
    // Show final counts
    const [categoryCount] = await pool.execute('SELECT COUNT(*) as count FROM categories');
    const [productCount] = await pool.execute('SELECT COUNT(*) as count FROM products');
    const [orderCount] = await pool.execute('SELECT COUNT(*) as count FROM orders');
    
    console.log('\n📊 Final Database Counts:');
    console.log(`Categories: ${(categoryCount as any[])[0].count}`);
    console.log(`Products: ${(productCount as any[])[0].count}`);
    console.log(`Orders: ${(orderCount as any[])[0].count}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}