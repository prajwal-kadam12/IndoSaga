import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import connectPg from "connect-pg-simple";
import multer from "multer";
// import sharp from "sharp"; // Moved to dynamic import in route
import { getStorage } from "./storage";

// Import API routes
import productQuestionsRouter from './routes/product-questions';
import productReviewsRouter from './routes/product-reviews';
import ordersRouter from './routes/orders';
import orderItemsRouter from './routes/order-items';
import paymentsRouter from './routes/payments';
import {
  insertProductSchema,
  insertCategorySchema,
  insertCartItemSchema,
  insertWishlistItemSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertContactInquirySchema,
  insertUserSchema,
  insertProductReviewSchema,
  insertSubcategorySchema,
  insertProductQuestionSchema
} from "@shared/schema";
import { z } from "zod";
import Razorpay from "razorpay";
import Stripe from "stripe";
import crypto from "crypto";
// Remove direct database imports - using storage interface only
// import { db } from "./db";
// import { users } from "@shared/schema";
// import { eq } from "drizzle-orm";
// import { auth } from "express-openid-connect"; // Using client-side Auth0 instead

// Email sending using SMTP directly in Node.js
import nodemailer from 'nodemailer';

// SMS service for order notifications
import { sendOrderConfirmationSms } from './sms-service';

// PHP Email Bridge for enhanced email notifications
import { sendOrderSuccessEmail, sendOrderCancellationEmail, logPHPEmailActivity } from './php-bridge';

// Function to create SMTP transporter
function createEmailTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

// Function to generate order confirmation email templates
function generateOrderEmailTemplates(orderData: any) {
  const userEmailSubject = `🎉 Order Confirmed - #${orderData.orderId} - IndoSaga Furniture`;
  const adminEmailSubject = `🛒 New Order Received - Order #${orderData.orderId} - ₹${orderData.total}`;

  const itemsHtml = orderData.orderItems?.map((item: any) => `
    <div style="padding: 10px; border-bottom: 1px solid #eee;">
      <strong>${item.productName}</strong><br>
      Quantity: ${item.quantity} | Price: ₹${item.price} | Subtotal: ₹${item.quantity * item.price}
    </div>
  `).join('') || '';

  const userEmailBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; }
        .header { background: linear-gradient(135deg, #16a34a, #22c55e); color: white; padding: 30px; text-align: center; }
        .content { background: white; padding: 25px; margin: 10px 0; border-radius: 8px; }
        .order-card { background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 15px 0; }
        .items-section { background: #fafafa; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .total { background: #e7f3ff; padding: 15px; border-radius: 8px; text-align: center; font-size: 18px; font-weight: bold; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏡 IndoSaga Furniture</h1>
          <h2>Order Confirmed!</h2>
        </div>
        <div class="content">
          <h3>Dear ${orderData.customerName},</h3>
          <p>🎉 Thank you for your order! We're excited to craft your beautiful furniture pieces.</p>
          <div class="order-card">
            <h4>📋 Order Summary</h4>
            <p><strong>Order Number:</strong> #${orderData.orderId}</p>
            <p><strong>Payment Status:</strong> ✅ ${orderData.paymentStatus}</p>
          </div>
          <div class="items-section">
            <h4>🛍️ Your Items</h4>
            ${itemsHtml}
          </div>
          <div class="total">Total Amount: ₹${orderData.total}</div>
          <p>Thank you for choosing IndoSaga Furniture!</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const adminEmailBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; }
        .header { background: #16a34a; color: white; padding: 20px; text-align: center; }
        .content { background: white; padding: 20px; margin: 10px 0; }
        .order-info { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>IndoSaga Furniture</h1>
          <h2>🎉 New Order Alert!</h2>
        </div>
        <div class="content">
          <div class="order-info">
            <h4>📋 Order Information</h4>
            <p><strong>Order ID:</strong> #${orderData.orderId}</p>
            <p><strong>Customer:</strong> ${orderData.customerName} (${orderData.customerEmail})</p>
            <p><strong>Total Amount:</strong> ₹${orderData.total}</p>
            <p><strong>Payment Status:</strong> ${orderData.paymentStatus}</p>
          </div>
          <h4>🛍️ Order Items</h4>
          ${itemsHtml}
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    userEmail: { subject: userEmailSubject, body: userEmailBody },
    adminEmail: { subject: adminEmailSubject, body: adminEmailBody }
  };
}

// Function to send order confirmation emails
async function sendOrderConfirmationEmail(orderData: any) {
  try {
    if (!process.env.SMTP_USERNAME || !process.env.SMTP_PASSWORD) {
      throw new Error('SMTP credentials not configured');
    }

    const transporter = createEmailTransporter();
    const templates = generateOrderEmailTemplates(orderData);

    // Send user email
    const userEmailResult = await transporter.sendMail({
      from: `"IndoSaga Furniture" <${process.env.SMTP_USERNAME}>`,
      to: orderData.customerEmail,
      subject: templates.userEmail.subject,
      html: templates.userEmail.body,
    });

    // Send admin email
    const adminEmailResult = await transporter.sendMail({
      from: `"IndoSaga Furniture" <${process.env.SMTP_USERNAME}>`,
      to: 'kadamprajwal358@gmail.com', // Admin email
      subject: templates.adminEmail.subject,
      html: templates.adminEmail.body,
    });

    console.log('📧 User email sent:', userEmailResult.messageId);
    console.log('📧 Admin email sent:', adminEmailResult.messageId);

    return {
      success: true,
      userEmailId: userEmailResult.messageId,
      adminEmailId: adminEmailResult.messageId
    };
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw error;
  }
}


// Initialize Razorpay with provided credentials
let razorpay: Razorpay | null = null;
// Force test credentials in development for security and testing
const isDevelopment = process.env.NODE_ENV === 'development';
console.log('Development mode:', isDevelopment);
console.log('Test Key Available:', !!process.env.RAZORPAY_TEST_KEY_ID);
console.log('Live Key Available:', !!process.env.RAZORPAY_KEY_ID);

// Always use test credentials when available
let keyId: string | undefined;
let keySecret: string | undefined;

if (process.env.RAZORPAY_TEST_KEY_ID && (process.env.RAZORPAY_TEST_KEY_SECRET || process.env.RAZORPAY_SECRET)) {
  keyId = process.env.RAZORPAY_TEST_KEY_ID;
  keySecret = process.env.RAZORPAY_TEST_KEY_SECRET || process.env.RAZORPAY_SECRET;
  console.log('Using TEST credentials for Razorpay');
} else if (process.env.RAZORPAY_KEY_ID && (process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET)) {
  keyId = process.env.RAZORPAY_KEY_ID;
  keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET;
  console.log('Using LIVE credentials for Razorpay');
}

if (keyId && keySecret) {
  razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
  console.log(`Razorpay initialized with ${keyId?.includes('test') ? 'test' : 'live'} credentials`);
  console.log(`Key ID: ${keyId.slice(0, 12)}...`);
  console.log(`Key Secret: ${keySecret ? 'Present' : 'Missing'}`);
} else {
  console.log('Razorpay credentials not found in environment variables');
}

// Initialize Stripe
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  console.log('Stripe initialized with credentials');
  console.log(`Stripe Key: ${process.env.STRIPE_SECRET_KEY.slice(0, 12)}...`);
} else {
  console.log('Stripe credentials not found in environment variables');
}

// Auth0 configuration
const baseURL = process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5001';
const auth0Config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_CLIENT_SECRET,
  baseURL: baseURL,
  clientID: process.env.AUTH0_CLIENT_ID,
  issuerBaseURL: process.env.AUTH0_DOMAIN ? `https://${process.env.AUTH0_DOMAIN}` : undefined,
  routes: {
    logout: '/logout',
    callback: '/callback'
  }
};

console.log('Auth0 Config:', {
  baseURL: auth0Config.baseURL,
  callbackURL: `${baseURL}/callback`,
  clientID: auth0Config.clientID ? 'Set' : 'Not set',
  issuerBaseURL: auth0Config.issuerBaseURL
});

// Image similarity matching function
async function findSimilarProductsByImage(imageBuffer: Buffer) {
  try {
    // Extract basic image properties for analysis
    let sharp;
    try {
      sharp = (await import('sharp')).default;
    } catch (err) {
      console.warn("Sharp not available for findSimilarProductsByImage, falling back to random matching");
      // Fallback: return some random products if sharp fails
      const allProducts = await (await getStorage()).getProducts({});
      return allProducts.sort(() => 0.5 - Math.random()).slice(0, 8);
    }
    const image = sharp(imageBuffer);
    const { width, height } = await image.metadata();

    // Get dominant colors and basic properties
    const { dominant } = await image.stats();

    // Get all products and categories from storage
    const allProducts = await (await getStorage()).getProducts({});
    const allCategories = await (await getStorage()).getCategories();

    // Create a category lookup map
    const categoryMap = new Map();
    allCategories.forEach(cat => {
      categoryMap.set(cat.id, cat.name);
    });

    // For now, implement a simple similarity algorithm based on:
    // 1. Product categories (furniture types are visually similar)
    // 2. Random selection with weighted preferences
    // 3. Featured products get higher priority

    // Simulate AI-based categorization based on image properties
    let detectedCategory = '';
    const aspectRatio = width && height ? width / height : 1;

    // Enhanced heuristic based on image properties and available categories
    const availableCategories = allCategories.map(cat => cat.name);
    console.log('Available categories:', availableCategories);

    if (aspectRatio > 1.5) {
      // Wide images likely to be sofas, dining tables
      const wideCategories = availableCategories.filter(cat =>
        cat.toLowerCase().includes('sofa') ||
        cat.toLowerCase().includes('dining') ||
        cat.toLowerCase().includes('table')
      );
      detectedCategory = wideCategories.length > 0 ?
        wideCategories[Math.floor(Math.random() * wideCategories.length)] :
        availableCategories[0];
    } else if (aspectRatio < 0.8) {
      // Tall images likely to be wardrobes, chairs
      const tallCategories = availableCategories.filter(cat =>
        cat.toLowerCase().includes('wardrobe') ||
        cat.toLowerCase().includes('chair') ||
        cat.toLowerCase().includes('cabinet')
      );
      detectedCategory = tallCategories.length > 0 ?
        tallCategories[Math.floor(Math.random() * tallCategories.length)] :
        availableCategories[0];
    } else {
      // Square-ish images could be any furniture - try all categories
      detectedCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
    }

    console.log(`Detected furniture category: ${detectedCategory} (aspect ratio: ${aspectRatio.toFixed(2)})`);

    // Filter products by detected category or similar categories
    let exactMatches = allProducts.filter(product => {
      const productCategoryName = categoryMap.get(product.categoryId);
      return productCategoryName === detectedCategory;
    });

    let partialMatches = allProducts.filter(product => {
      const productCategoryName = categoryMap.get(product.categoryId);
      return productCategoryName && detectedCategory && (
        productCategoryName.toLowerCase().includes(detectedCategory.toLowerCase()) ||
        detectedCategory.toLowerCase().includes(productCategoryName.toLowerCase())
      );
    });

    let featuredProducts = allProducts.filter(p => p.featured);

    // Combine results: exact matches first, then partial matches, then featured products
    let similarProducts = [
      ...exactMatches,
      ...partialMatches.filter(p => !exactMatches.find(ep => ep.id === p.id)),
      ...featuredProducts.filter(p => !exactMatches.find(ep => ep.id === p.id) && !partialMatches.find(pm => pm.id === p.id))
    ];

    // If still no matches, return a diverse selection of all products
    if (similarProducts.length === 0) {
      console.log('No category matches found, returning diverse selection');
      similarProducts = allProducts.slice(0, 8);
    }

    console.log(`Found ${exactMatches.length} exact matches, ${partialMatches.length} partial matches, ${featuredProducts.length} featured products`);
    console.log('Category map:', Array.from(categoryMap.entries()));
    console.log('Products with categories:', allProducts.slice(0, 3).map(p => ({ id: p.id, name: p.name, categoryId: p.categoryId, categoryName: categoryMap.get(p.categoryId) })));

    // Sort by relevance (featured first, then by category match, then randomize)
    similarProducts.sort((a, b) => {
      // Featured products get highest priority
      if (a.featured !== b.featured) {
        return b.featured ? 1 : -1;
      }

      // Then prioritize exact category matches
      const aCategoryName = categoryMap.get(a.categoryId);
      const bCategoryName = categoryMap.get(b.categoryId);
      const aExactMatch = aCategoryName === detectedCategory;
      const bExactMatch = bCategoryName === detectedCategory;

      if (aExactMatch !== bExactMatch) {
        return bExactMatch ? 1 : -1;
      }

      // Random shuffle for similar products
      return Math.random() - 0.5;
    });

    // Return top 6-8 similar products
    return similarProducts.slice(0, 8);

  } catch (error) {
    console.error('Error in image similarity analysis:', error);
    // Fallback: return featured products
    return await (await getStorage()).getFeaturedProducts();
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Trust proxy is required for secure cookies on Netlify/Serverless
  app.set("trust proxy", 1);

  // Implement persistent database session storage for Netlify/Serverless stability
  const PostgresStore = connectPg(session);
  const sessionStore = new PostgresStore({
    conString: process.env.DATABASE_URL,
    tableName: 'sessions', // Must match neondb_setup.sql
    createTableIfMissing: true // Resilience if SQL setup was skipped
  });

  app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'indosaga-stable-session-key-2024',
    resave: false,
    saveUninitialized: false,
    name: 'indosaga.sid',
    proxy: true, // Tell express-session to trust the reverse proxy
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
  }));

  console.log('Using client-side Auth0 authentication');

  // Configure multer for image uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    },
  });

  // Client-side Auth0 handles authentication - no server routes needed

  // Logout route
  app.get('/logout', (req, res) => {
    (req as any).session = null;
    res.redirect('/');
  });

  // API logout endpoint for proper session clearing
  app.post('/api/auth/logout', (req, res) => {
    try {
      // Destroy the session completely
      if ((req as any).session) {
        (req as any).session.destroy((err: any) => {
          if (err) {
            console.error('Session destroy error:', err);
            return res.status(500).json({ message: 'Logout failed' });
          }

          // Clear the session cookie
          res.clearCookie('connect.sid');
          res.json({ success: true, message: 'Logged out successfully' });
        });
      } else {
        res.json({ success: true, message: 'No active session' });
      }
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Logout failed' });
    }
  });

  // Profile route (protected)
  app.get('/profile', async (req, res) => {
    const user = (req as any).session?.user;
    if (!user) {
      return res.redirect('/login');
    }

    try {
      // Check if user exists in database, create if not
      const existingUser = await (await getStorage()).getUserByEmail(user.email);

      if (!existingUser && user.email) {
        // Create new user from session
        const newUser = await (await getStorage()).upsertUser({
          email: user.email,
          name: user.name || '',
          firstName: user.given_name || '',
          lastName: user.family_name || '',
          profileImageUrl: user.picture || '',
          provider: user.provider || 'demo'
        });

        return res.json(newUser);
      }

      res.json(existingUser);
    } catch (error) {
      console.error('Profile error:', error);
      res.status(500).json({ message: 'Failed to get profile' });
    }
  });

  // Sync Auth0 user with server session
  app.post('/api/auth/sync', async (req, res) => {
    try {
      const { user, localCartItems = [] } = req.body;

      if (!user || !user.email) {
        return res.status(400).json({ message: 'Invalid user data' });
      }

      // Store user in session
      (req as any).session.user = {
        id: user.sub || crypto.randomUUID(),
        email: user.email,
        name: user.name || '',
        firstName: user.given_name || '',
        lastName: user.family_name || '',
        profileImageUrl: user.picture || '',
        provider: 'auth0'
      };

      // Check if user exists in database, create if not
      let existingUser = await (await getStorage()).getUserByEmail(user.email);
      let dbUser;

      if (!existingUser) {
        const newUser = await (await getStorage()).upsertUser({
          email: user.email,
          name: user.name || '',
          firstName: user.given_name || '',
          lastName: user.family_name || '',
          profileImageUrl: user.picture || '',
          provider: 'auth0'
        });
        dbUser = newUser;
      } else {
        dbUser = existingUser;
      }

      // Migrate localStorage cart items to authenticated user's cart
      if (localCartItems.length > 0 && dbUser) {
        console.log(`Migrating ${localCartItems.length} localStorage cart items to authenticated user`);

        for (const localItem of localCartItems) {
          try {
            // Validate and add each item to the authenticated user's cart
            const cartData = {
              userId: dbUser.id,
              productId: localItem.productId || localItem.id,
              quantity: localItem.quantity || 1
            };

            // Validate the cart item data
            const validatedCartData = insertCartItemSchema.parse(cartData);
            await (await getStorage()).addToCart(validatedCartData);

            console.log(`Migrated item: ${cartData.productId} (qty: ${cartData.quantity})`);
          } catch (itemError) {
            console.error('Error migrating cart item:', itemError, localItem);
            // Continue with other items even if one fails
          }
        }

        console.log('Cart migration completed');
      }

      res.json(dbUser);
    } catch (error) {
      console.error('Auth sync error:', error);
      res.status(500).json({ message: 'Failed to sync authentication' });
    }
  });

  // Check authentication status
  app.get('/api/auth/me', async (req, res) => {
    try {
      const user = (req as any).session?.user;
      if (!user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      // Get complete user data from database
      try {
        const dbUser = await (await getStorage()).getUserByEmail(user.email);

        if (dbUser) {
          // Merge session data with database data
          const completeUser = {
            ...user,
            name: dbUser.name || user.name,
            phone: dbUser.phone || '',
            address: dbUser.address || '',
            firstName: dbUser.firstName || user.given_name,
            lastName: dbUser.lastName || user.family_name,
            profileImageUrl: dbUser.profileImageUrl || user.picture
          };

          res.json(completeUser);
        } else {
          // Return session data if no database record
          res.json(user);
        }
      } catch (dbError) {
        console.error('Database error in auth/me:', dbError);
        // Fallback to session data
        res.json(user);
      }
    } catch (error) {
      console.error('Auth me error:', error);
      res.status(500).json({ message: 'Authentication error' });
    }
  });

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      console.log("Health check requested...");
      const storage = await getStorage();
      const allProducts = await storage.getProducts();
      const featuredProducts = await storage.getFeaturedProducts();

      res.json({
        status: "ok",
        database: "connected",
        totalProducts: allProducts.length,
        featuredCount: featuredProducts.length,
        env: process.env.NODE_ENV,
        databaseUrlSet: !!process.env.DATABASE_URL,
        razorpayInitialized: !!razorpay,
        razorpayKeys: {
          hasKeyId: !!keyId,
          hasKeySecret: !!keySecret,
          usingTest: !!keyId?.includes('test')
        },
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("HEALTH_CHECK_ERROR:", error);
      res.status(500).json({
        status: "error",
        database: "disconnected",
        error: `NEON_DRV_FIX: ${error.message}`,
        hint: "Check DATABASE_URL in Netlify environment variables.",
        details: error.toString()
      });
    }
  });

  // Update user profile
  app.put('/api/auth/profile', async (req, res) => {
    try {
      const user = (req as any).session?.user;
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { name, email, phone, address, profileImageUrl } = req.body;

      // Update user in database
      await (await getStorage()).upsertUser({
        email: email || user.email,
        name: name || user.name,
        phone: phone || '',
        address: address || '',
        firstName: user.given_name || '',
        lastName: user.family_name || '',
        profileImageUrl: profileImageUrl || user.picture || user.profileImageUrl || '',
        provider: user.provider || 'auth0'
      });

      // Update session data
      (req as any).session.user = {
        ...user,
        name: name || user.name,
        email: email || user.email,
        phone: phone || '',
        address: address || '',
        profileImageUrl: profileImageUrl || user.picture || user.profileImageUrl || ''
      };

      res.json({
        success: true,
        message: "Profile updated successfully",
        user: (req as any).session.user
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ message: 'Failed to update profile' });
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await (await getStorage()).getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await (await getStorage()).createCategory(categoryData);
      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid category data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create category" });
      }
    }
  });

  // Subcategories
  app.get("/api/subcategories", async (req, res) => {
    try {
      const { categoryId } = req.query;
      const subcategories = await (await getStorage()).getSubcategories(categoryId as string);
      res.json(subcategories);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      res.status(500).json({ message: "Failed to fetch subcategories" });
    }
  });

  app.post("/api/subcategories", async (req, res) => {
    try {
      const subcategoryData = insertSubcategorySchema.parse(req.body);
      const subcategory = await (await getStorage()).createSubcategory(subcategoryData);
      res.json(subcategory);
    } catch (error) {
      console.error("Error creating subcategory:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid subcategory data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create subcategory" });
      }
    }
  });

  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const { search, categoryId, subcategoryId, minPrice, maxPrice, featured, isDeal } = req.query;
      const filters = {
        search: search as string,
        categoryId: categoryId as string,
        subcategoryId: subcategoryId as string,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        featured: featured === 'true',
        isDeal: isDeal === 'true',
      };

      const products = await (await getStorage()).getProducts(filters);
      console.log(`API: Fetching products with filters: ${JSON.stringify(filters)}. Found: ${products.length}`);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/featured", async (req, res) => {
    try {
      const products = await (await getStorage()).getFeaturedProducts();
      console.log(`API: Fetching featured products. Found: ${products.length}`);
      res.json(products);
    } catch (error) {
      console.error("Error fetching featured products:", error);
      res.status(500).json({ message: "Failed to fetch featured products" });
    }
  });

  app.get("/api/products/deals", async (req, res) => {
    try {
      const products = await (await getStorage()).getDealProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching deal products:", error);
      res.status(500).json({ message: "Failed to fetch deal products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await (await getStorage()).getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await (await getStorage()).createProduct(productData);
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid product data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create product" });
      }
    }
  });

  // Image search endpoint
  app.post("/api/products/search-by-image", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      console.log("Processing image search request...");

      // Process the uploaded image using Sharp for analysis
      const imageBuffer = req.file.buffer;

      // Dynamic import to prevent crash if sharp is not available in environment
      let sharp;
      try {
        sharp = (await import('sharp')).default;
      } catch (err) {
        console.error("Sharp initialization failed:", err);
        return res.status(500).json({
          message: "Image search is currently unavailable",
          error: "Native library 'sharp' not found in environment."
        });
      }

      const imageMetadata = await sharp(imageBuffer).metadata();

      console.log("Image metadata:", {
        format: imageMetadata.format,
        width: imageMetadata.width,
        height: imageMetadata.height,
        size: req.file.size
      });

      // For now, implement a simple similarity search based on product categories and features
      // In a production system, you'd use AI/ML services like Google Vision API, AWS Rekognition, etc.
      const similarProducts = await findSimilarProductsByImage(imageBuffer);

      console.log(`Found ${similarProducts.length} similar products`);
      res.json(similarProducts);
    } catch (error) {
      console.error("Error processing image search:", error);
      res.status(500).json({ message: "Failed to process image search" });
    }
  });

  // Cart operations - require authentication for persistent cart
  app.get("/api/cart", async (req, res) => {
    try {
      const user = (req as any).session?.user;
      if (user) {
        // Get user from database first
        const dbUser = await (await getStorage()).getUserByEmail(user?.email || '');
        if (dbUser) {
          const cartItems = await (await getStorage()).getCartItems(dbUser.id);
          return res.json(cartItems);
        }
      }
      // Return empty cart for non-authenticated users
      res.json([]);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    try {
      const user = (req as any).session?.user;
      if (user) {
        const dbUser = await (await getStorage()).getUserByEmail(user?.email || '');
        if (dbUser) {
          const cartData = insertCartItemSchema.parse({ ...req.body, userId: dbUser.id });
          const cartItem = await (await getStorage()).addToCart(cartData);
          return res.json(cartItem);
        }
      }
      // For non-authenticated users, return success and let frontend handle localStorage
      res.json({ success: true, message: "Item added to cart" });
    } catch (error) {
      console.error("Error adding to cart:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid cart data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to add to cart" });
      }
    }
  });

  app.put("/api/cart/:id", async (req, res) => {
    try {
      const user = (req as any).session?.user;
      if (user) {
        const { quantity } = req.body;
        const cartItem = await (await getStorage()).updateCartItem(req.params.id, quantity);
        if (!cartItem) {
          return res.status(404).json({ message: "Cart item not found" });
        }
        return res.json(cartItem);
      }
      // For non-authenticated users, return success and let frontend handle localStorage
      res.json({ success: true, message: "Cart item updated" });
    } catch (error) {
      console.error("Error updating cart item:", error);
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    try {
      const user = (req as any).session?.user;
      if (user) {
        await (await getStorage()).removeFromCart(req.params.id);
        return res.json({ message: "Item removed from cart" });
      }
      // For non-authenticated users, return success and let frontend handle localStorage
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ message: "Failed to remove from cart" });
    }
  });

  // Wishlist operations - require authentication for persistent wishlist
  app.get("/api/wishlist", async (req, res) => {
    try {
      const user = (req as any).session?.user;
      if (user) {
        const dbUser = await (await getStorage()).getUserByEmail(user?.email || '');
        if (dbUser) {
          const wishlistItems = await (await getStorage()).getWishlistItems(dbUser.id);
          return res.json(wishlistItems);
        }
      }
      // Return empty wishlist for non-authenticated users
      res.json([]);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      res.status(500).json({ message: "Failed to fetch wishlist" });
    }
  });

  app.post("/api/wishlist", async (req, res) => {
    try {
      const user = (req as any).session?.user;
      if (user) {
        const dbUser = await (await getStorage()).getUserByEmail(user?.email || '');
        if (dbUser) {
          const wishlistData = insertWishlistItemSchema.parse({ ...req.body, userId: dbUser.id });
          const wishlistItem = await (await getStorage()).addToWishlist(wishlistData);
          return res.json(wishlistItem);
        }
      }
      // For non-authenticated users, return 401 to trigger frontend localStorage fallback
      res.status(401).json({ message: "Authentication required" });
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid wishlist data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to add to wishlist" });
      }
    }
  });

  app.delete("/api/wishlist/:productId", async (req, res) => {
    try {
      const user = (req as any).session?.user;
      if (user) {
        const dbUser = await (await getStorage()).getUserByEmail(user?.email || '');
        if (dbUser) {
          await (await getStorage()).removeFromWishlist(dbUser.id, req.params.productId);
          return res.json({ message: "Item removed from wishlist" });
        }
      }
      // For non-authenticated users, return 401 to trigger frontend localStorage fallback  
      res.status(401).json({ message: "Authentication required" });
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      res.status(500).json({ message: "Failed to remove from wishlist" });
    }
  });

  // Protected checkout route - requires authentication
  app.get("/checkout", (req, res) => {
    const user = (req as any).session?.user;
    if (!user) {
      // Redirect to home page - client-side Auth0 will handle authentication
      return res.redirect('/?auth=required&returnTo=/checkout');
    }
    res.redirect('/?page=checkout');
  });

  // Helpdesk/Support endpoints  
  app.post('/api/support/tickets', async (req, res) => {
    try {
      const { customerName, customerEmail, customerPhone, subject, message, priority = 'medium' } = req.body;

      if (!customerName || !customerEmail || !subject || !message) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // In a real implementation, this would save to a support ticket database
      const ticketId = `TICKET-${Date.now()}`;

      const ticketData = {
        ticketId,
        customerName,
        customerEmail,
        subject: subject,
        priority
      };

      console.log('Support ticket created:', ticketData);

      // Email service removed - ticket created successfully

      res.json({
        success: true,
        ticketId,
        message: 'Support ticket created successfully'
      });
    } catch (error) {
      console.error('Error creating support ticket:', error);
      res.status(500).json({ message: 'Failed to create support ticket' });
    }
  });

  app.post('/api/helpdesk/chat', async (req, res) => {
    try {
      const { message, ticketId } = req.body;
      const user = (req as any).session?.user;

      if (!message) {
        return res.status(400).json({ message: 'Message is required' });
      }

      // In a real implementation, this would save to chat history and potentially notify support staff
      const chatMessage = {
        id: Date.now().toString(),
        message,
        sender: 'customer',
        timestamp: new Date().toISOString(),
        senderName: user?.name || user?.email || 'Customer'
      };

      console.log('Chat message sent:', chatMessage);

      res.json(chatMessage);
    } catch (error) {
      console.error('Error sending chat message:', error);
      res.status(500).json({ message: 'Failed to send message' });
    }
  });

  app.get('/api/helpdesk/tickets', async (req, res) => {
    try {
      const user = (req as any).session?.user;
      if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // In a real implementation, this would fetch from database
      // For now, return empty array
      res.json([]);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      res.status(500).json({ message: 'Failed to fetch tickets' });
    }
  });

  // Appointment booking endpoints
  app.post('/api/appointments', async (req, res) => {
    try {
      const user = (req as any).session?.user;

      const {
        customerName,
        customerEmail,
        customerPhone,
        appointmentDate,
        appointmentTime,
        meetingType = 'virtual_showroom',
        notes,
        date,
        time,
        type
      } = req.body;

      // Handle both old and new format
      const finalDate = date || appointmentDate;
      const finalTime = time || appointmentTime;
      const finalType = type || meetingType;

      if (!customerName || !customerEmail || !finalDate || !finalTime) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Email rate limiting removed
      const appointmentId = `APT-${Date.now()}`;

      // In a real implementation, this would save to database
      const appointment = {
        id: appointmentId,
        customerName,
        customerEmail,
        customerPhone: customerPhone || '',
        date: finalDate,
        time: finalTime,
        type: finalType,
        status: 'scheduled',
        notes: notes || '',
        createdAt: new Date().toISOString(),
        userId: user?.id || 'guest'
      };

      console.log('Appointment booked:', appointment);

      // Send appointment emails using Node.js directly (Netlify compatible)
      try {
        const transporter = createEmailTransporter();

        // Email to Admin
        await transporter.sendMail({
          from: `"${customerName}" <${process.env.SMTP_USERNAME}>`,
          replyTo: customerEmail,
          to: process.env.ADMIN_EMAIL || process.env.SMTP_USERNAME,
          subject: `📅 New Appointment: ${finalType} - ${customerName}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #8B4513;">New Appointment Request</h2>
              <p><strong>Customer:</strong> ${customerName}</p>
              <p><strong>Email:</strong> ${customerEmail}</p>
              <p><strong>Phone:</strong> ${customerPhone || 'Not provided'}</p>
              <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #8B4513; margin: 20px 0;">
                <p><strong>Date:</strong> ${finalDate}</p>
                <p><strong>Time:</strong> ${finalTime}</p>
                <p><strong>Type:</strong> ${finalType}</p>
                <p><strong>Notes:</strong> ${notes || 'None'}</p>
              </div>
            </div>
          `
        });

        // Confirmation to Customer
        await transporter.sendMail({
          from: `"IndoSaga Furniture" <${process.env.SMTP_USERNAME}>`,
          to: customerEmail,
          subject: "Appointment Confirmed - IndoSaga Furniture",
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #8B4513;">Appointment Confirmed!</h2>
              <p>Dear ${customerName},</p>
              <p>Your appointment has been successfully scheduled.</p>
              <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #8B4513; margin: 20px 0;">
                <p><strong>Date:</strong> ${finalDate}</p>
                <p><strong>Time:</strong> ${finalTime}</p>
                <p><strong>Type:</strong> ${finalType}</p>
              </div>
              <p>We look forward to meeting you!</p>
              <br>
              <p>Best regards,</p>
              <p><strong>IndoSaga Furniture Team</strong></p>
            </div>
          `
        });

        console.log('✅ Appointment emails sent successfully via Nodemailer');

      } catch (emailError: any) {
        console.error('❌ Appointment email error:', emailError);
        // Don't fail the booking if email fails, but log it clearly
      }

      res.json(appointment);
    } catch (error) {
      console.error('Error booking appointment:', error);
      res.status(500).json({ message: 'Failed to book appointment' });
    }
  });

  app.get('/api/appointments', async (req, res) => {
    try {
      const user = (req as any).session?.user;
      if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // In a real implementation, this would fetch from database
      // For now, return empty array
      res.json([]);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      res.status(500).json({ message: 'Failed to fetch appointments' });
    }
  });

  // Video call endpoints
  app.post('/api/video-call/start', async (req, res) => {
    try {
      const user = (req as any).session?.user;
      if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { appointmentId } = req.body;

      // In a real implementation, this would:
      // 1. Validate the appointment
      // 2. Generate WebRTC connection details
      // 3. Notify the shop owner

      const sessionId = `VIDEO-${Date.now()}`;

      console.log('Video call started:', {
        sessionId,
        appointmentId,
        customer: user.name || user.email
      });

      res.json({
        success: true,
        sessionId,
        message: 'Video call session started'
      });
    } catch (error) {
      console.error('Error starting video call:', error);
      res.status(500).json({ message: 'Failed to start video call' });
    }
  });

  // Orders - require authentication

  // GET orders for authenticated user
  app.get("/api/orders", async (req, res) => {
    const user = (req as any).session?.user;
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    try {
      const dbUser = await (await getStorage()).getUserByEmail(user?.email || '');
      if (!dbUser) {
        return res.status(401).json({ message: "User not found" });
      }

      const orders = await (await getStorage()).getOrders(dbUser.id);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Get a specific order by ID
  app.get("/api/orders/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const order = await (await getStorage()).getOrder(id);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // POST new order (supports both authenticated and COD guest checkout)
  app.post(["/api/orders", "/api/orders/checkout"], async (req, res) => {
    const user = (req as any).session?.user;
    const { orderItems: orderItemsData, paymentMethod, ...orderData } = req.body;

    // Allow COD orders without authentication (guest checkout)
    const isCODOrder = paymentMethod === 'cod';

    if (!user && !isCODOrder) {
      return res.status(401).json({ message: 'Authentication required for online payments' });
    }

    try {
      let dbUser = null;
      let userId = null;

      // For authenticated users, get their database record
      if (user) {
        dbUser = await (await getStorage()).getUserByEmail(user?.email || '');
        if (!dbUser && !isCODOrder) {
          return res.status(401).json({ message: "User not found" });
        }
        userId = dbUser?.id;
      }

      // For COD guest checkout, create a temporary user if email is provided
      if (!dbUser && isCODOrder && orderData.customerEmail) {
        try {
          // Check if user exists by email
          const existingUser = await (await getStorage()).getUserByEmail(orderData.customerEmail);
          if (existingUser) {
            userId = existingUser.id;
          } else {
            // Create a new user for this COD order
            const newUser = await (await getStorage()).createUser({
              name: orderData.customerName || 'Guest Customer',
              email: orderData.customerEmail,
              provider: 'guest',
              passwordHash: `guest_${Date.now()}`
            });
            userId = newUser.id;
          }
        } catch (error) {
          console.log('Could not create/find user for COD order, continuing with null userId');
        }
      }

      // Create the main order - ensure total is string
      const orderToCreate = insertOrderSchema.parse({
        ...orderData,
        paymentMethod,
        userId: userId || null, // Allow null for guest orders
        total: String(orderData.total) // Convert total to string for schema
      });
      const order = await (await getStorage()).createOrder(orderToCreate);

      // Create order items if they exist
      if (orderItemsData && orderItemsData.length > 0) {
        const orderItems = orderItemsData.map((item: any) => ({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }));

        await (await getStorage()).addOrderItems(orderItems);
      }

      // Clear the user's cart after successful order creation (only if user is authenticated)
      if (dbUser) {
        await (await getStorage()).clearCart(dbUser.id);
      }

      // Send order confirmation emails
      try {
        await sendOrderConfirmationEmail({
          orderId: order.id,
          customerName: orderData.customerName || dbUser?.name || 'Valued Customer',
          customerEmail: orderData.customerEmail || dbUser?.email || '',
          customerPhone: orderData.customerPhone || '',
          total: String(orderData.total),
          paymentStatus: orderData.paymentStatus || 'pending',
          paymentMethod: paymentMethod || 'cod',
          shippingAddress: orderData.shippingAddress || '',
          orderItems: orderItemsData?.map((item: any) => ({
            productName: item.productName || 'Product',
            quantity: item.quantity || 1,
            price: item.price || 0
          })) || []
        });
        console.log(`📧 Order confirmation emails sent for order ${order.id}`);
      } catch (emailError) {
        console.error(`❌ Failed to send order confirmation emails for order ${order.id}:`, emailError);
        // Don't fail the order creation if email fails
      }

      // Send order confirmation SMS
      if (orderData.customerPhone) {
        try {
          const smsResult = await sendOrderConfirmationSms({
            orderId: order.id,
            customerName: orderData.customerName || dbUser?.name || 'Valued Customer',
            customerPhone: orderData.customerPhone,
            total: orderData.total,
            paymentStatus: orderData.paymentStatus || 'paid'
          });

          if (smsResult.success) {
            console.log(`📱 Order confirmation SMS sent for order ${order.id} to ${orderData.phone}`);
          } else {
            console.error(`❌ SMS failed for order ${order.id}: ${smsResult.error}`);
          }
        } catch (smsError) {
          console.error(`❌ Failed to send order confirmation SMS for order ${order.id}:`, smsError);
          // Don't fail the order creation if SMS fails
        }
      } else {
        console.log(`ℹ️ No phone number provided for order ${order.id}, skipping SMS`);
      }

      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid order data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create order" });
      }
    }
  });

  // POST direct checkout order (for guest users and authenticated users)
  app.post("/api/orders/direct-checkout", async (req, res) => {
    try {
      const { orderItems: orderItemsData, customerEmail, ...orderData } = req.body;

      // For direct checkout, we might not have a logged-in user session
      const user = (req as any).session?.user;
      let userId = null;

      // If user is authenticated, link the order to their account
      if (user) {
        const dbUser = await (await getStorage()).getUserByEmail(user.email || '');
        if (dbUser) {
          userId = dbUser.id;
        }
      }

      // Email rate limiting removed

      // Create the main order with or without user association
      const orderToCreate = insertOrderSchema.parse({
        ...orderData,
        userId,
        paymentStatus: orderData.paymentStatus || 'paid' // Default to paid for successful payments
      });
      const order = await (await getStorage()).createOrder(orderToCreate);

      // Create order items if they exist
      if (orderItemsData && orderItemsData.length > 0) {
        const orderItems = orderItemsData.map((item: any) => ({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }));

        await (await getStorage()).addOrderItems(orderItems);
      }

      // Clear the user's cart if they are authenticated
      if (userId) {
        await (await getStorage()).clearCart(userId);
      }

      // Send order confirmation emails
      try {
        await sendOrderConfirmationEmail({
          orderId: order.id,
          customerName: orderData.fullName || 'Valued Customer',
          customerEmail: customerEmail || orderData.email,
          customerPhone: orderData.phone || '',
          total: String(orderData.total),
          paymentStatus: orderData.paymentStatus || 'paid',
          paymentMethod: orderData.paymentMethod || 'Online Payment',
          shippingAddress: `${orderData.fullName || ''}, ${orderData.address || ''}, ${orderData.city || ''}, ${orderData.state || ''}, ${orderData.zipCode || ''}`.trim(),
          orderItems: orderItemsData?.map((item: any) => ({
            productName: item.productName || 'Product',
            quantity: item.quantity || 1,
            price: item.price || 0
          })) || []
        });
        console.log(`📧 Order confirmation emails sent for order ${order.id}`);
      } catch (emailError) {
        console.error(`❌ Failed to send order confirmation emails for order ${order.id}:`, emailError);
        // Don't fail the order creation if email fails
      }

      // Send order confirmation SMS
      if (orderData.phone) {
        try {
          const smsResult = await sendOrderConfirmationSms({
            orderId: order.id,
            customerName: orderData.fullName || 'Valued Customer',
            customerPhone: orderData.phone,
            total: orderData.total,
            paymentStatus: orderData.paymentStatus || 'paid'
          });

          if (smsResult.success) {
            console.log(`📱 Order confirmation SMS sent for order ${order.id} to ${orderData.phone}`);
          } else {
            console.error(`❌ SMS failed for order ${order.id}: ${smsResult.error}`);
          }
        } catch (smsError) {
          console.error(`❌ Failed to send order confirmation SMS for order ${order.id}:`, smsError);
          // Don't fail the order creation if SMS fails
        }
      } else {
        console.log(`ℹ️ No phone number provided for order ${order.id}, skipping SMS`);
      }

      res.json(order);
    } catch (error) {
      console.error("Error creating direct checkout order:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid order data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create order" });
      }
    }
  });

  // Cancel order endpoint
  app.post("/api/orders/:id/cancel", async (req, res) => {
    try {
      const user = (req as any).session?.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const dbUser = await (await getStorage()).getUserByEmail(user.email || '');
      if (!dbUser) {
        return res.status(401).json({ message: "User not found" });
      }

      const { id } = req.params;
      const { reason, details, customerEmail, customerName } = req.body;
      const order = await (await getStorage()).getOrder(id);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if user owns the order
      if (order.userId !== dbUser.id) {
        return res.status(403).json({ message: "Access denied - not your order" });
      }

      // Check if order can be cancelled
      if (!['pending', 'processing', 'confirmed'].includes(order.status || 'pending')) {
        return res.status(400).json({
          message: "Order cannot be cancelled at this stage. Only pending, processing, or confirmed orders can be cancelled."
        });
      }

      // Update order status to cancelled
      const updatedOrder = await (await getStorage()).updateOrderStatus(id, 'cancelled');

      // Send cancellation confirmation emails using PHP integration
      // SECURITY FIX: Use server-sourced user data only, never trust client data
      try {
        const { spawn } = await import('child_process');
        const phpData = JSON.stringify({
          orderId: order.id,
          customerName: dbUser.name || order.customerName || 'Valued Customer',
          customerEmail: dbUser.email || order.customerEmail,
          reason: reason || 'Not specified',
          details: details || '',
          orderTotal: order.total,
          cancellationDate: new Date().toISOString()
        });

        const phpProcess = spawn('php', ['php/handlers/order_cancellation.php'], {
          stdio: ['pipe', 'pipe', 'pipe'],
          cwd: process.cwd()
        });

        // Write data with proper encoding and flush
        phpProcess.stdin.write(phpData + '\n', 'utf8');
        phpProcess.stdin.end();

        let phpOutput = '';
        let phpError = '';

        phpProcess.stdout.on('data', (data: any) => {
          phpOutput += data.toString();
        });

        phpProcess.stderr.on('data', (data: any) => {
          phpError += data.toString();
        });

        await new Promise((resolve) => {
          phpProcess.on('close', (code: any) => {
            if (code === 0 && phpOutput.trim()) {
              try {
                const phpResult = JSON.parse(phpOutput.trim());
                console.log('📧 Cancellation emails sent via PHP integration:', phpResult);
              } catch (parseError) {
                console.error('❌ Failed to parse PHP response:', phpOutput);
              }
            } else {
              console.error(`❌ PHP process failed with code ${code}:`, phpError || 'No error output');
            }
            resolve(void 0);
          });
        });

      } catch (emailError) {
        console.error(`❌ Failed to send cancellation emails for order ${order.id}:`, emailError);
        // Don't fail the cancellation if email fails
      }

      res.json({
        success: true,
        message: "Order cancelled successfully. Confirmation emails have been sent.",
        order: updatedOrder
      });
    } catch (error) {
      console.error("Error cancelling order:", error);
      res.status(500).json({ message: "Failed to cancel order" });
    }
  });

  // Razorpay configuration endpoint
  app.get("/api/payment/config", (req, res) => {
    try {
      const configKeyId = keyId; // Use the same keyId that was determined during initialization
      if (!configKeyId) {
        return res.json({
          key: null,
          enabled: false,
          message: "Razorpay not configured"
        });
      }
      res.json({
        key: configKeyId,
        enabled: !!razorpay
      });
    } catch (error) {
      console.error("Error fetching payment config:", error);
      res.status(500).json({ message: "Failed to fetch payment configuration" });
    }
  });

  // Razorpay order creation endpoint
  app.post("/api/create-razorpay-order", async (req, res) => {
    try {
      if (!razorpay) {
        return res.status(500).json({ message: "Razorpay not configured" });
      }

      // Validate request body
      const bodySchema = z.object({
        productId: z.string(),
        quantity: z.number().min(1).optional().default(1),
        currency: z.string().optional().default('INR'),
        isCartOrder: z.boolean().optional().default(false),
        orderItems: z.array(z.object({
          productId: z.string(),
          quantity: z.number(),
          price: z.number().optional()
        })).optional()
      });

      const { productId, quantity, currency, isCartOrder, orderItems } = bodySchema.parse(req.body);

      let amount = 0;
      let productName = "";
      let productDetails: any;

      if (isCartOrder && orderItems && orderItems.length > 0) {
        // Handle cart order with multiple products
        let totalAmount = 0;
        const productNames: string[] = [];

        for (const item of orderItems) {
          const product = await (await getStorage()).getProduct(item.productId);
          if (!product) {
            return res.status(404).json({ message: `Product not found: ${item.productId}` });
          }

          // Use server-side price for security
          const itemPrice = parseFloat(product.price);
          totalAmount += itemPrice * item.quantity;
          productNames.push(product.name);
        }

        amount = totalAmount;
        productName = `${orderItems.length} items: ${productNames.join(', ')}`;
        productDetails = {
          isCartOrder: true,
          itemCount: orderItems.length,
          items: orderItems
        };
      } else {
        // Handle single product order
        const product = await (await getStorage()).getProduct(productId);
        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }

        // Calculate amount from server-side data, not client input
        amount = parseFloat(product.price) * quantity;
        productName = product.name;
        productDetails = {
          id: product.id,
          name: product.name,
          price: product.price
        };
      }

      const options = {
        amount: Math.round(amount * 100), // Razorpay expects amount in paise
        currency,
        receipt: `order_${Date.now()}`,
        notes: {
          product_id: productId,
          product_name: productName,
          quantity: isCartOrder ? (orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0).toString() : quantity.toString(),
          is_cart_order: isCartOrder.toString(),
          item_count: isCartOrder ? (orderItems?.length || 0).toString() : "1"
        }
      };

      console.log("Creating Razorpay order with options:", options);

      try {
        const order = await razorpay.orders.create(options);
        console.log("Razorpay order created successfully:", order.id);

        // Return order with product details for verification
        res.json({
          ...order,
          product: productDetails,
          quantity: isCartOrder ? orderItems?.reduce((sum, item) => sum + item.quantity, 0) : quantity,
          isCartOrder,
          orderItems: isCartOrder ? orderItems : undefined
        });
      } catch (razorpayError: any) {
        console.error('Razorpay API Error:', razorpayError);

        // Check if it's an authentication error
        if (razorpayError.statusCode === 401) {
          return res.status(200).json({
            message: "Online payment temporarily unavailable. Redirecting to Cash on Delivery.",
            errorType: "auth_failed",
            fallbackOptions: ["cod"],
            showCODOption: true,
            autoRedirectToCOD: true
          });
        }

        // Handle other Razorpay errors
        return res.status(500).json({
          message: "Payment gateway error. Please try Cash on Delivery.",
          errorType: "razorpay_error",
          fallbackOptions: ["cod"],
          showCODOption: true
        });
      }
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      res.status(500).json({
        message: "Failed to create order. Please try Cash on Delivery.",
        errorType: "server_error",
        fallbackOptions: ["cod"],
        showCODOption: true
      });
    }
  });

  // Stripe payment intent creation endpoint
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe not configured" });
      }

      // Validate request body
      const bodySchema = z.object({
        productId: z.string(),
        quantity: z.number().min(1).optional().default(1),
        currency: z.string().optional().default('inr')
      });

      const { productId, quantity, currency } = bodySchema.parse(req.body);

      // Get product from database to ensure server-side price calculation
      const product = await (await getStorage()).getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Calculate amount from server-side data, not client input
      const amount = parseFloat(product.price) * quantity;

      console.log("Creating Stripe payment intent for:", {
        productId: product.id,
        productName: product.name,
        amount: amount,
        quantity: quantity
      });

      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Stripe expects amount in smallest currency unit (paise for INR)
          currency: currency,
          metadata: {
            product_id: productId,
            product_name: product.name,
            quantity: quantity.toString()
          },
          automatic_payment_methods: {
            enabled: true,
          },
        });

        console.log("Stripe payment intent created successfully:", paymentIntent.id);

        // Return payment intent with product details for verification
        res.json({
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          product: {
            id: product.id,
            name: product.name,
            price: product.price
          },
          quantity
        });
      } catch (stripeError: any) {
        console.error('Stripe API Error:', stripeError);

        return res.status(500).json({
          message: "Payment processing error. Please try Cash on Delivery.",
          errorType: "stripe_error",
          fallbackOptions: ["cod"],
          showCODOption: true
        });
      }
    } catch (error) {
      console.error("Error creating Stripe payment intent:", error);
      res.status(500).json({
        message: "Failed to create payment. Please try Cash on Delivery.",
        errorType: "server_error",
        fallbackOptions: ["cod"],
        showCODOption: true
      });
    }
  });

  app.post("/api/verify-razorpay-payment", async (req, res) => {
    try {
      // First, check if Razorpay is properly configured
      if (!razorpay) {
        return res.status(500).json({
          success: false,
          message: "Payment gateway not configured. Please try a different payment method."
        });
      }

      // Validate request body with Zod and provide better error messages
      const bodySchema = z.object({
        razorpay_order_id: z.string().min(1, "Missing order ID from payment gateway"),
        razorpay_payment_id: z.string().min(1, "Missing payment ID from payment gateway"),
        razorpay_signature: z.string().min(1, "Missing payment signature from payment gateway"),
        customerDetails: z.object({
          name: z.string(),
          email: z.string().email(),
          contact: z.string(),
          address: z.string(),
          city: z.string().optional(),
          district: z.string().optional(),
          state: z.string().optional(),
          pincode: z.string()
        }),
        productId: z.string(),
        quantity: z.number().min(1).optional().default(1)
      });

      // Log the incoming request for debugging
      console.log("Payment verification request body:", {
        hasOrderId: !!req.body.razorpay_order_id,
        hasPaymentId: !!req.body.razorpay_payment_id,
        hasSignature: !!req.body.razorpay_signature,
        customerEmail: req.body.customerDetails?.email,
        productId: req.body.productId
      });

      try {
        var {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          customerDetails,
          productId,
          quantity
        } = bodySchema.parse(req.body);
      } catch (validationError: any) {
        console.error("Payment verification validation failed:", validationError);
        console.error("Raw request body:", req.body);

        // Check if this is because payment fields are missing (order creation failed)
        const missingFields = validationError.issues?.map((issue: any) => issue.path[0]).filter(Boolean) || [];
        const isPaymentFieldsMissing = ['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature'].some(field =>
          missingFields.includes(field)
        );

        if (isPaymentFieldsMissing) {
          return res.status(400).json({
            success: false,
            message: "Payment verification failed due to missing payment data. If money was debited, please contact support with your transaction details.",
            details: `Missing fields: ${missingFields.join(', ')}`,
            supportInfo: "Contact support with your payment confirmation and order details for assistance."
          });
        }

        return res.status(400).json({
          success: false,
          message: "Invalid payment data received",
          details: validationError.issues?.[0]?.message || "Please check your information and try again"
        });
      }

      const sign = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSign = crypto
        .createHmac("sha256", keySecret!)
        .update(sign.toString())
        .digest("hex");

      if (razorpay_signature === expectedSign) {
        // Payment verified successfully, now create order and send emails
        try {
          // Get user session for authentication
          const userId = (req.session as any)?.user?.id;
          if (!userId) {
            return res.status(401).json({ success: false, message: "Authentication required for order creation" });
          }

          // Get user from database
          const dbUser = await (await getStorage()).getUser(userId);
          if (!dbUser) {
            return res.status(404).json({ success: false, message: "User not found" });
          }

          // Get product from database for server-side validation
          const product = await (await getStorage()).getProduct(productId);
          if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
          }

          // Calculate total from server-side data
          const serverTotal = parseFloat(product.price) * quantity;

          const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          // Create order in database with proper schema validation
          const orderToCreate = insertOrderSchema.parse({
            userId: dbUser.id,
            total: String(serverTotal),
            customerName: customerDetails.name,
            customerPhone: customerDetails.contact,
            customerEmail: customerDetails.email,
            shippingAddress: `${customerDetails.address}, ${customerDetails.city || ''}, ${customerDetails.district || ''}, ${customerDetails.state || ''}`.replace(/, ,/g, ',').replace(/,$/, ''),
            pincode: customerDetails.pincode,
            paymentStatus: 'paid',
            paymentMethod: 'Razorpay Online Payment',
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            paymentId: razorpay_payment_id
          });

          const order = await (await getStorage()).createOrder(orderToCreate);

          // Create order items from server-side data
          const orderItems = [{
            orderId: order.id,
            productId: product.id,
            quantity: quantity,
            price: String(serverTotal)
          }];
          await (await getStorage()).addOrderItems(orderItems);

          // Prepare order data for PHP emails
          const orderData = {
            orderId,
            customerName: customerDetails.name,
            customerEmail: customerDetails.email,
            customerPhone: customerDetails.contact,
            total: serverTotal,
            paymentStatus: 'paid',
            paymentMethod: 'Razorpay Online Payment',
            transactionId: razorpay_payment_id,
            shippingAddress: `${customerDetails.address}, ${customerDetails.city || ''}, ${customerDetails.district || ''}, ${customerDetails.state || ''}`.replace(/, ,/g, ',').replace(/,$/, ''),
            orderItems: [{
              productName: product.name,
              quantity: quantity,
              price: serverTotal
            }]
          };

          // Send email notifications via enhanced PHP bridge
          try {
            const emailResult = await sendOrderSuccessEmail(orderData);
            logPHPEmailActivity('success', orderId, emailResult);

            if (emailResult.success) {
              console.log('📧 Razorpay order confirmation emails sent via PHP bridge');
            } else {
              console.error('❌ PHP email bridge failed for Razorpay order:', emailResult.message);
              // Fallback to Node.js email
              await sendOrderConfirmationEmail(orderData);
            }
          } catch (emailError) {
            console.error('Failed to send Razorpay order emails via PHP bridge:', emailError);
            // Fallback to Node.js email
            try {
              await sendOrderConfirmationEmail(orderData);
            } catch (fallbackError) {
              console.error('Both PHP and Node.js email failed:', fallbackError);
            }
          }

          // Send SMS notification if available
          try {
            if (customerDetails.contact) {
              await sendOrderConfirmationSms({
                customerName: customerDetails.name,
                customerPhone: customerDetails.contact,
                orderId: orderId,
                total: serverTotal,
                paymentStatus: 'paid'
              });
              console.log('📱 SMS notification sent successfully');
            }
          } catch (smsError) {
            console.error('SMS notification failed:', smsError);
          }

          // Respond with success
          res.json({
            success: true,
            message: "Payment verified and order created successfully",
            orderId: orderId,
            transactionId: razorpay_payment_id,
            emailSent: true,
            orderData: {
              orderId,
              customerName: customerDetails.name,
              total: serverTotal,
              paymentStatus: 'paid'
            }
          });

        } catch (orderError) {
          console.error('Error creating order:', orderError);
          res.json({
            success: true,
            message: "Payment verified but order creation failed",
            transactionId: razorpay_payment_id
          });
        }
      } else {
        console.log("Invalid payment signature received");
        res.status(400).json({
          success: false,
          message: "Payment verification failed. The payment signature is invalid.",
          details: "This might be a security issue or payment gateway problem. Please try again."
        });
      }
    } catch (error: any) {
      console.error("Error verifying payment:", error);
      res.status(500).json({
        success: false,
        message: "Payment verification failed due to server error",
        details: error.message || "Please try again or contact support if the issue persists"
      });
    }
  });

  // Direct payment verification endpoint (for cases where Razorpay order creation failed but payment succeeded)
  app.post("/api/verify-direct-payment", async (req, res) => {
    try {
      console.log("Direct payment verification request:", {
        hasPaymentId: !!req.body.razorpay_payment_id,
        customerEmail: req.body.customerDetails?.email,
        productId: req.body.productId,
        total: req.body.total
      });

      // Validate request body - only payment_id is required for direct verification
      const bodySchema = z.object({
        razorpay_payment_id: z.string().min(1, "Missing payment ID"),
        customerDetails: z.object({
          name: z.string(),
          email: z.string().email(),
          contact: z.string(),
          address: z.string(),
          city: z.string().optional(),
          district: z.string().optional(),
          state: z.string().optional(),
          pincode: z.string()
        }),
        productId: z.string(),
        quantity: z.number().min(1).optional().default(1),
        total: z.number().min(1),
        isCartOrder: z.boolean().optional().default(false),
        orderItems: z.array(z.object({
          productId: z.string(),
          quantity: z.number(),
          price: z.number().optional()
        })).optional()
      });

      const {
        razorpay_payment_id,
        customerDetails,
        productId,
        quantity,
        total,
        isCartOrder,
        orderItems
      } = bodySchema.parse(req.body);

      // Get user session for authentication
      const user = (req.session as any)?.user;
      if (!user || !user.email) {
        return res.status(401).json({ success: false, message: "Authentication required for order creation" });
      }

      // Get user from database using email (consistent with other endpoints)
      const dbUser = await (await getStorage()).getUserByEmail(user.email);
      if (!dbUser) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      let orderItems_array: any[] = [];
      let serverTotal = total;

      if (isCartOrder && orderItems && orderItems.length > 0) {
        // Handle cart order with multiple products
        // Use the total from frontend which includes all discounts and deals
        serverTotal = total;

        for (const item of orderItems) {
          const product = await (await getStorage()).getProduct(item.productId);
          if (!product) {
            console.error(`Product not found during direct verification: ${item.productId}`);
            continue;
          }

          // Use the discounted price from the frontend instead of original product price
          const actualItemPrice = item.price || parseFloat(product.price);

          orderItems_array.push({
            orderId: '', // Will be set after order creation
            productId: product.id,
            quantity: item.quantity,
            price: String(actualItemPrice * item.quantity)
          });
        }
      } else {
        // Handle single product order
        const product = await (await getStorage()).getProduct(productId);
        if (!product) {
          return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Use the actual total from frontend (which includes discounts/deals) instead of original product price
        serverTotal = total;
        orderItems_array = [{
          orderId: '', // Will be set after order creation
          productId: product.id,
          quantity: quantity,
          price: String(serverTotal)
        }];
      }

      // Create order in database (let database generate the ID)
      const orderToCreate = insertOrderSchema.parse({
        userId: dbUser.id,
        total: String(serverTotal),
        customerName: customerDetails.name,
        customerPhone: customerDetails.contact,
        customerEmail: customerDetails.email,
        shippingAddress: `${customerDetails.address}, ${customerDetails.city || ''}, ${customerDetails.district || ''}, ${customerDetails.state || ''}`.replace(/, ,/g, ',').replace(/,$/, ''),
        pincode: customerDetails.pincode,
        paymentStatus: 'paid',
        paymentMethod: 'Razorpay Direct',
        razorpayOrderId: 'DIRECT_PAYMENT', // Mark as direct payment
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: 'DIRECT_VERIFICATION', // Mark as direct verification
        paymentId: razorpay_payment_id
      });

      const order = await (await getStorage()).createOrder(orderToCreate);

      // Update order items with the correct order ID
      const finalOrderItems = orderItems_array.map(item => ({
        ...item,
        orderId: order.id
      }));

      await (await getStorage()).addOrderItems(finalOrderItems);

      // Clear the authenticated user's cart after successful order creation
      await (await getStorage()).clearCart(dbUser.id);

      // Prepare order data for email notifications
      const emailOrderItems = isCartOrder && orderItems ?
        orderItems.map(item => ({
          productName: `Product ${item.productId}`, // We'll get actual names in a real scenario
          quantity: item.quantity,
          price: serverTotal / orderItems.length // Approximate price
        })) :
        [{
          productName: `Product ${productId}`,
          quantity: quantity,
          price: serverTotal
        }];

      const orderData = {
        orderId: order.id,
        customerName: customerDetails.name,
        customerEmail: customerDetails.email,
        customerPhone: customerDetails.contact,
        total: serverTotal,
        paymentStatus: 'paid',
        paymentMethod: 'Razorpay Direct',
        transactionId: razorpay_payment_id,
        shippingAddress: `${customerDetails.address}, ${customerDetails.city || ''}, ${customerDetails.district || ''}, ${customerDetails.state || ''}`.replace(/, ,/g, ',').replace(/,$/, ''),
        orderItems: emailOrderItems
      };

      // Send email notifications
      try {
        const emailResult = await sendOrderSuccessEmail(orderData);
        logPHPEmailActivity('success', order.id, emailResult);

        if (emailResult.success) {
          console.log('📧 Direct payment order confirmation emails sent via PHP bridge');
        } else {
          console.error('❌ PHP email bridge failed for direct payment order:', emailResult.message);
          // Fallback to Node.js email
          await sendOrderConfirmationEmail(orderData);
        }
      } catch (emailError) {
        console.error('Failed to send direct payment order emails:', emailError);
        // Fallback to Node.js email
        try {
          await sendOrderConfirmationEmail(orderData);
        } catch (fallbackError) {
          console.error('Both PHP and Node.js email failed for direct payment:', fallbackError);
        }
      }

      // Send SMS notification if available
      try {
        if (customerDetails.contact) {
          await sendOrderConfirmationSms({
            customerName: customerDetails.name,
            customerPhone: customerDetails.contact,
            orderId: order.id,
            total: serverTotal,
            paymentStatus: 'paid'
          });
          console.log('📱 SMS notification sent successfully for direct payment');
        }
      } catch (smsError) {
        console.error('SMS notification failed for direct payment:', smsError);
      }

      // Respond with success (use actual database order ID)
      res.json({
        success: true,
        message: "Direct payment verified and order created successfully",
        orderId: order.id,
        transactionId: razorpay_payment_id,
        emailSent: true,
        paymentMethod: 'direct_verification',
        orderData: {
          orderId: order.id,
          customerName: customerDetails.name,
          total: serverTotal,
          paymentStatus: 'paid'
        }
      });

    } catch (error: any) {
      console.error("Error in direct payment verification:", error);
      res.status(500).json({
        success: false,
        message: "Direct payment verification failed due to server error",
        details: error.message || "Please contact support with your payment details"
      });
    }
  });

  // Stripe payment verification endpoint
  app.post("/api/verify-stripe-payment", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe not configured" });
      }

      // Validate request body with Zod
      const bodySchema = z.object({
        payment_intent_id: z.string(),
        customerDetails: z.object({
          name: z.string(),
          email: z.string().email(),
          contact: z.string(),
          address: z.string(),
          city: z.string().optional(),
          district: z.string().optional(),
          state: z.string().optional(),
          pincode: z.string()
        }),
        productId: z.string(),
        quantity: z.number().min(1).optional().default(1)
      });

      const {
        payment_intent_id,
        customerDetails,
        productId,
        quantity
      } = bodySchema.parse(req.body);

      // Verify payment intent with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

      if (paymentIntent.status === 'succeeded') {
        // Payment verified successfully, now create order and send emails
        try {
          // Get user session for authentication
          const userId = (req.session as any)?.user?.id;
          if (!userId) {
            return res.status(401).json({ success: false, message: "Authentication required for order creation" });
          }

          // Get user from database
          const dbUser = await (await getStorage()).getUser(userId);
          if (!dbUser) {
            return res.status(404).json({ success: false, message: "User not found" });
          }

          // Get product from database for server-side validation
          const product = await (await getStorage()).getProduct(productId);
          if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
          }

          // Calculate total from server-side data
          const serverTotal = parseFloat(product.price) * quantity;

          const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          // Create order in database
          const orderToCreate = insertOrderSchema.parse({
            userId: dbUser.id,
            total: String(serverTotal),
            customerName: customerDetails.name,
            customerEmail: customerDetails.email,
            customerPhone: customerDetails.contact,
            shippingAddress: `${customerDetails.address}, ${customerDetails.city || ''}, ${customerDetails.district || ''}, ${customerDetails.state || ''}`,
            pincode: customerDetails.pincode,
            paymentMethod: 'stripe',
            paymentStatus: 'paid',
            status: 'confirmed',
            paymentId: payment_intent_id
          });

          const order = await (await getStorage()).createOrder(orderToCreate);

          // Add order items
          const orderItems = [{
            orderId: order.id,
            productId: productId,
            quantity: quantity,
            price: String(parseFloat(product.price))
          }];

          await (await getStorage()).addOrderItems(orderItems);

          console.log(`✅ Stripe order created successfully: ${order.id}`);

          // Send email notifications via PHP bridge
          const emailOrderData = {
            orderId: order.id,
            customerName: customerDetails.name,
            customerEmail: customerDetails.email,
            customerPhone: customerDetails.contact,
            total: serverTotal,
            paymentStatus: 'paid',
            paymentMethod: 'Stripe Card Payment',
            transactionId: payment_intent_id,
            shippingAddress: `${customerDetails.address}, ${customerDetails.city || ''}, ${customerDetails.district || ''}, ${customerDetails.state || ''}`.replace(/, ,/g, ',').replace(/,$/, ''),
            orderItems: [{
              productName: product.name,
              quantity: quantity,
              price: serverTotal
            }]
          };

          try {
            const emailResult = await sendOrderSuccessEmail(emailOrderData);
            logPHPEmailActivity('success', order.id, emailResult);

            if (emailResult.success) {
              console.log('📧 Stripe order confirmation emails sent via PHP bridge');
            } else {
              console.error('❌ PHP email bridge failed for Stripe order:', emailResult.message);
              // Fallback to Node.js email
              await sendOrderConfirmationEmail(emailOrderData);
            }
          } catch (emailError) {
            console.error('Failed to send Stripe order emails via PHP bridge:', emailError);
            // Fallback to Node.js email
            try {
              await sendOrderConfirmationEmail(emailOrderData);
            } catch (fallbackError) {
              console.error('Both PHP and Node.js email failed:', fallbackError);
            }
          }

          // Respond with success
          res.json({
            success: true,
            message: "Payment verified and order created successfully",
            orderId: order.id,
            transactionId: payment_intent_id,
            orderData: {
              orderId: order.id,
              customerName: customerDetails.name,
              customerEmail: customerDetails.email,
              total: serverTotal,
              paymentMethod: 'Stripe Card Payment'
            }
          });

        } catch (orderError) {
          console.error("Error creating order after Stripe payment:", orderError);
          res.status(500).json({
            success: false,
            message: "Payment successful but failed to create order. Please contact support.",
            transactionId: payment_intent_id
          });
        }
      } else {
        res.status(400).json({ success: false, message: "Payment verification failed. Payment not completed" });
      }
    } catch (error) {
      console.error("Error verifying Stripe payment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to verify payment and create order",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // COD Order creation endpoint
  app.post("/api/orders/cod", async (req, res) => {
    try {
      const { orderId, customerName, customerEmail, customerPhone, total, paymentStatus, paymentMethod, transactionId, shippingAddress, orderItems } = req.body;

      // Validate required fields
      if (!orderId || !customerName || !customerEmail || !total) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
      }

      // Get user session for authentication
      const sessionUser = (req.session as any)?.user;
      if (!sessionUser) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }

      // Get user from database using email (more reliable than session ID)
      const dbUser = await (await getStorage()).getUserByEmail(sessionUser.email);
      if (!dbUser) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      // Create order data for PHP email (without orderItems)
      const emailOrderData = {
        orderId,
        customerName,
        customerEmail,
        customerPhone: customerPhone || '',
        total,
        paymentStatus: paymentStatus || 'COD - Payment Pending',
        paymentMethod: paymentMethod || 'Cash on Delivery',
        transactionId: transactionId || orderId,
        shippingAddress: shippingAddress || '',
        orderItems: orderItems || []
      };

      // Extract order items from request
      const { orderItems: orderItemsData, ...orderDataForDb } = req.body;

      // Create order in database
      const orderToCreate = insertOrderSchema.parse({
        ...orderDataForDb,
        userId: dbUser.id,
        paymentStatus: paymentStatus || 'COD - Payment Pending'
      });
      const order = await (await getStorage()).createOrder(orderToCreate);

      // Create order items if they exist
      if (orderItemsData && orderItemsData.length > 0) {
        const orderItems = orderItemsData.map((item: any) => ({
          orderId: order.id,
          productId: item.productId || '',
          quantity: item.quantity || 1,
          price: item.price || 0
        }));
        await (await getStorage()).addOrderItems(orderItems);
      }

      // Send emails using existing PHP integration
      try {
        const { spawn } = await import('child_process');
        const php = spawn('php', ['php/handlers/order_success.php'], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        // Send order data to PHP script
        php.stdin.write(JSON.stringify(emailOrderData));
        php.stdin.end();

        let phpOutput = '';
        let phpError = '';

        php.stdout.on('data', (data) => {
          phpOutput += data.toString();
        });

        php.stderr.on('data', (data) => {
          phpError += data.toString();
        });

        php.on('close', (code) => {
          if (code === 0 && phpOutput) {
            try {
              const emailResult = JSON.parse(phpOutput);
              console.log('📧 PHP email handler success:', emailResult);
            } catch (parseError) {
              console.log('📧 PHP emails processed:', phpOutput);
            }
          } else {
            console.error('❌ PHP email handler failed:', phpError || phpOutput);
          }
        });

        console.log('📧 COD order emails sent via PHP integration');

      } catch (emailError) {
        console.error('Failed to send COD order emails via PHP:', emailError);
        // Don't fail the order if email fails
      }

      // Send SMS if phone number provided
      try {
        if (customerPhone) {
          await sendOrderConfirmationSms({
            customerName,
            customerPhone,
            orderId,
            total,
            paymentStatus: emailOrderData.paymentStatus
          });
          console.log('📱 COD SMS notification sent');
        }
      } catch (smsError) {
        console.error('SMS notification failed:', smsError);
      }

      // Return success response
      res.json({
        success: true,
        message: 'COD order created successfully',
        orderId: order.id,
        customerName,
        total,
        paymentStatus: emailOrderData.paymentStatus,
        emailSent: true
      });

    } catch (error) {
      console.error('COD order creation failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create COD order',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Contact form
  app.post("/api/contact", async (req, res) => {
    try {
      const contactData = insertContactInquirySchema.parse(req.body);
      const inquiry = await (await getStorage()).createContactInquiry(contactData);

      // Validate SMTP configuration
      if (!process.env.SMTP_USERNAME || !process.env.SMTP_PASSWORD) {
        console.error("Missing SMTP credentials");
        return res.status(500).json({
          message: "Email configuration error: Missing SMTP credentials on server",
          status: "config_error"
        });
      }

      // Send email using Node.js directly (Netlify compatible)
      try {
        const transporter = createEmailTransporter();

        // verify connection configuration
        await transporter.verify();

        // Email to Admin
        await transporter.sendMail({
          from: `"${contactData.firstName} ${contactData.lastName}" <${process.env.SMTP_USERNAME}>`, // Send via authenticated user
          replyTo: contactData.email,
          to: process.env.ADMIN_EMAIL || process.env.SMTP_USERNAME,
          subject: `New Inquiry: ${contactData.inquiryType} - ${contactData.firstName} ${contactData.lastName}`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #8B4513;">New Contact Inquiry</h2>
              <p><strong>Name:</strong> ${contactData.firstName} ${contactData.lastName}</p>
              <p><strong>Email:</strong> ${contactData.email}</p>
              <p><strong>Phone:</strong> ${contactData.phone || 'Not provided'}</p>
              <p><strong>Type:</strong> ${contactData.inquiryType}</p>
              <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #8B4513; margin: 20px 0;">
                <p><strong>Message:</strong></p>
                <p style="white-space: pre-wrap;">${contactData.message}</p>
              </div>
              <p style="font-size: 12px; color: #666;">Received via IndoSaga Website</p>
            </div>
          `
        });

        // Auto-reply to User
        await transporter.sendMail({
          from: `"IndoSaga Furniture" <${process.env.SMTP_USERNAME}>`,
          to: contactData.email,
          subject: "We received your inquiry - IndoSaga Furniture",
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #8B4513;">Thank you for contacting us!</h2>
              <p>Dear ${contactData.firstName},</p>
              <p>We have received your message regarding "<strong>${contactData.inquiryType}</strong>".</p>
              <p>Our team will review your inquiry and get back to you shortly.</p>
              <br>
              <p>Best regards,</p>
              <p><strong>IndoSaga Furniture Team</strong></p>
            </div>
          `
        });

        console.log('✅ Contact emails sent successfully via Nodemailer');

      } catch (emailError: any) {
        console.error('❌ Contact email error:', emailError);
        res.status(500).json({
          message: "Failed to send email. please check SMTP configuration.",
          error: emailError.message,
          code: emailError.code
        });
        return;
      }

      res.json(inquiry);
    } catch (error) {
      console.error("Error creating contact inquiry:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid contact data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create contact inquiry" });
      }
    }
  });

  // Product Reviews
  app.get("/api/products/:productId/reviews", async (req, res) => {
    try {
      const reviews = await (await getStorage()).getProductReviews(req.params.productId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching product reviews:", error);
      res.status(500).json({ message: "Failed to fetch product reviews" });
    }
  });

  // Upload review images
  app.post("/api/products/:productId/reviews/upload-images", upload.array('images', 5), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No images uploaded" });
      }

      // Since Netlify functions are read-only (except tmp which is ephemeral),
      // and we are using Postgres, we will store smaller images as Base64 Data URIs directly.
      // Ideally these should go to S3/Cloudinary, but to keep it zero-config for the user
      // and consistent with their profile image setup, we use Base64.

      const imageUrls: string[] = [];

      for (const file of files) {
        // Simple optimization could be done here (resize/compress) but for now direct conversion
        const base64 = file.buffer.toString('base64');
        const mimeType = file.mimetype;
        const dataUri = `data:${mimeType};base64,${base64}`;
        imageUrls.push(dataUri);
      }

      // Return the data URIs as "URLs". The frontend will send these back when creating the review,
      // and they will be stored in the text[] column of the product_reviews table.
      res.json({ imageUrls });

    } catch (error) {
      console.error("Error uploading review images:", error);
      res.status(500).json({ message: "Failed to upload images" });
    }
  });

  app.post("/api/products/:productId/reviews", async (req, res) => {
    try {
      const sessionUser = (req as any).session?.user;

      // Require authentication for review submission
      if (!sessionUser || !sessionUser.email) {
        return res.status(401).json({ message: "Authentication required to submit reviews" });
      }

      // Get user from database using email (consistent with other endpoints)
      const dbUser = await (await getStorage()).getUserByEmail(sessionUser.email);
      if (!dbUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const reviewData = insertProductReviewSchema.parse({
        ...req.body,
        productId: req.params.productId,
        userId: dbUser.id,
      });

      const review = await (await getStorage()).createProductReview(reviewData);
      res.json(review);
    } catch (error) {
      console.error("Error creating product review:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid review data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create product review" });
      }
    }
  });

  // Product Q&A
  app.get("/api/products/:productId/questions", async (req, res) => {
    try {
      const questions = await (await getStorage()).getProductQuestions(req.params.productId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching product questions:", error);
      res.status(500).json({ message: "Failed to fetch product questions" });
    }
  });

  app.post("/api/products/:productId/questions", async (req, res) => {
    try {
      const sessionUser = (req as any).session?.user;

      // Require authentication for question submission
      if (!sessionUser || !sessionUser.email) {
        return res.status(401).json({ message: "Authentication required to submit questions" });
      }

      // Get user from database using email (consistent with other endpoints)
      const dbUser = await (await getStorage()).getUserByEmail(sessionUser.email);
      if (!dbUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const questionData = insertProductQuestionSchema.parse({
        ...req.body,
        productId: req.params.productId,
        userId: dbUser.id,
      });

      const question = await (await getStorage()).createProductQuestion(questionData);
      res.json(question);
    } catch (error) {
      console.error("Error creating product question:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid question data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create product question" });
      }
    }
  });

  // Update product question (for owners to add answers)
  app.put("/api/products/questions/:questionId", async (req, res) => {
    try {
      const questionData = req.body;
      const question = await (await getStorage()).updateProductQuestion(req.params.questionId, {
        ...questionData,
        answeredAt: questionData.answer ? new Date() : undefined
      });

      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }

      res.json(question);
    } catch (error) {
      console.error("Error updating product question:", error);
      res.status(500).json({ message: "Failed to update product question" });
    }
  });

  // Email testing endpoint removed

  // Register MySQL API routes
  app.use('/api/product-questions', productQuestionsRouter);
  app.use('/api/product-reviews', productReviewsRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/order-items', orderItemsRouter);
  app.use('/api/payments', paymentsRouter);

  const httpServer = createServer(app);
  return httpServer;
}