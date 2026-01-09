import { db } from "./db";
import {
  users,
  categories,
  subcategories,
  products,
  cartItems,
  wishlistItems,
  orders,
  orderItems,
  contactInquiries,
  productReviews,
  productQuestions,
  supportTickets,
  appointments,
} from "@shared/schema";
import fs from 'fs/promises';
import path from 'path';

async function ensureDirectoryExists(dirPath: string) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

async function writeJSONFile(filePath: string, data: any) {
  const tempPath = filePath + '.tmp';
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2));
  await fs.rename(tempPath, filePath);
}

async function exportDatabaseToJSON() {
  console.log('Starting database export to JSON files...');

  try {
    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    await ensureDirectoryExists(dataDir);

    console.log('Exporting categories...');
    const categoriesData = await db.select().from(categories);
    await writeJSONFile(path.join(dataDir, 'categories.json'), categoriesData);
    console.log(`Exported ${categoriesData.length} categories`);

    console.log('Exporting subcategories...');
    const subcategoriesData = await db.select().from(subcategories);
    await writeJSONFile(path.join(dataDir, 'subcategories.json'), subcategoriesData);
    console.log(`Exported ${subcategoriesData.length} subcategories`);

    console.log('Exporting products...');
    const productsData = await db.select().from(products);
    
    // Normalize image paths for local development
    const normalizedProducts = productsData.map(product => ({
      ...product,
      // Ensure image URLs are relative to public directory
      imageUrl: product.imageUrl?.startsWith('/') ? product.imageUrl : product.imageUrl ? `/images/${product.imageUrl}` : null,
      images: product.images?.map(img => img.startsWith('/') ? img : `/images/${img}`) || []
    }));
    
    await writeJSONFile(path.join(dataDir, 'products.json'), normalizedProducts);
    console.log(`Exported ${normalizedProducts.length} products`);

    console.log('Exporting users (excluding passwords)...');
    const usersData = await db.select().from(users);
    
    // Remove sensitive data and only keep necessary fields
    const safeUsersData = usersData.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      address: user.address,
      profileImageUrl: user.profileImageUrl,
      provider: user.provider,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
    
    await writeJSONFile(path.join(dataDir, 'users.json'), safeUsersData);
    console.log(`Exported ${safeUsersData.length} users`);

    console.log('Exporting cart items...');
    const cartItemsData = await db.select().from(cartItems);
    await writeJSONFile(path.join(dataDir, 'cartItems.json'), cartItemsData);
    console.log(`Exported ${cartItemsData.length} cart items`);

    console.log('Exporting wishlist items...');
    const wishlistItemsData = await db.select().from(wishlistItems);
    await writeJSONFile(path.join(dataDir, 'wishlistItems.json'), wishlistItemsData);
    console.log(`Exported ${wishlistItemsData.length} wishlist items`);

    console.log('Exporting orders...');
    const ordersData = await db.select().from(orders);
    await writeJSONFile(path.join(dataDir, 'orders.json'), ordersData);
    console.log(`Exported ${ordersData.length} orders`);

    console.log('Exporting order items...');
    const orderItemsData = await db.select().from(orderItems);
    await writeJSONFile(path.join(dataDir, 'orderItems.json'), orderItemsData);
    console.log(`Exported ${orderItemsData.length} order items`);

    console.log('Exporting contact inquiries...');
    const contactInquiriesData = await db.select().from(contactInquiries);
    await writeJSONFile(path.join(dataDir, 'contactInquiries.json'), contactInquiriesData);
    console.log(`Exported ${contactInquiriesData.length} contact inquiries`);

    console.log('Exporting product reviews...');
    const productReviewsData = await db.select().from(productReviews);
    await writeJSONFile(path.join(dataDir, 'productReviews.json'), productReviewsData);
    console.log(`Exported ${productReviewsData.length} product reviews`);

    console.log('Exporting product questions...');
    const productQuestionsData = await db.select().from(productQuestions);
    await writeJSONFile(path.join(dataDir, 'productQuestions.json'), productQuestionsData);
    console.log(`Exported ${productQuestionsData.length} product questions`);

    console.log('Exporting support tickets...');
    const supportTicketsData = await db.select().from(supportTickets);
    await writeJSONFile(path.join(dataDir, 'supportTickets.json'), supportTicketsData);
    console.log(`Exported ${supportTicketsData.length} support tickets`);

    console.log('Exporting appointments...');
    const appointmentsData = await db.select().from(appointments);
    await writeJSONFile(path.join(dataDir, 'appointments.json'), appointmentsData);
    console.log(`Exported ${appointmentsData.length} appointments`);

    console.log('\n✅ Database export completed successfully!');
    console.log(`All data has been exported to the 'data' directory with the following files:`);
    console.log('- categories.json');
    console.log('- subcategories.json');
    console.log('- products.json');
    console.log('- users.json');
    console.log('- cartItems.json');
    console.log('- wishlistItems.json');
    console.log('- orders.json');
    console.log('- orderItems.json');
    console.log('- contactInquiries.json');
    console.log('- productReviews.json');
    console.log('- productQuestions.json');
    console.log('- supportTickets.json');
    console.log('- appointments.json');

  } catch (error) {
    console.error('Error during database export:', error);
    process.exit(1);
  }
}

// Run the export
exportDatabaseToJSON();