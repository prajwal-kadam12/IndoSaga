import mysql from 'mysql2/promise';
import { nanoid } from 'nanoid';
import type { IStorage } from './storage';
import type {
  User,
  Category,
  Subcategory,
  Product,
  CartItem,
  WishlistItem,
  Order,
  OrderItem,
  ContactInquiry,
  SupportTicket,
  Appointment,
  ProductReview,
  ProductQuestion,
  InsertCartItem,
  InsertWishlistItem,
  InsertOrder,
  InsertOrderItem,
  InsertContactInquiry,
  InsertSupportTicket,
  InsertAppointment,
  InsertProductReview,
  InsertProductQuestion,
  UpsertUser,
  InsertCategory,
  InsertSubcategory,
  InsertProduct
} from '../shared/schema';

export class MySQLStorage implements IStorage {
  private pool: mysql.Pool;

  constructor() {
    // Get and sanitize database configuration
    let host = process.env.DB_HOST || '';
    let port = parseInt(process.env.DB_PORT || '3306');
    
    // Defensive parsing: handle cases where host contains port or scheme
    if (host.startsWith('http://')) {
      host = host.substring(7);
      console.warn('Warning: Stripped http:// scheme from DB_HOST');
    }
    if (host.startsWith('https://')) {
      host = host.substring(8);
      console.warn('Warning: Stripped https:// scheme from DB_HOST');
    }
    if (host.includes(':') && port === 3306) {
      const parts = host.split(':');
      host = parts[0];
      port = parseInt(parts[1]) || 3306;
      console.warn(`Warning: Split host:port combination - Host: ${host}, Port: ${port}`);
    }
    
    // Create MySQL connection pool - SSL is optional based on server support
    const poolConfig: any = {
      host: host,
      port: port,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      dateStrings: true
    };

    // Only add SSL config if explicitly enabled
    if (process.env.DB_SSL_ENABLED === 'true') {
      poolConfig.ssl = {
        // Enable SSL encryption - use proper certificate validation for production
        rejectUnauthorized: process.env.NODE_ENV === 'production' ? true : false,
        ca: process.env.DB_SSL_CA, // CA certificate for validation
        cert: process.env.DB_SSL_CERT, // Client certificate if required
        key: process.env.DB_SSL_KEY, // Client key if required
      };
      console.log('🔒 SSL encryption enabled for MySQL connection');
    } else {
      console.log('⚠️  SSL disabled - consider enabling DB_SSL_ENABLED=true for production');
    }

    this.pool = mysql.createPool(poolConfig);
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      console.log('✅ MySQL connection successful');
      return true;
    } catch (error) {
      console.error('❌ MySQL connection failed:', error);
      return false;
    }
  }

  // Helper method to format dates for MySQL
  private formatDate(date: string | Date): string {
    if (!date) return new Date().toISOString().slice(0, 19).replace('T', ' ');
    const d = new Date(date);
    return d.toISOString().slice(0, 19).replace('T', ' ');
  }

  // Helper method to parse dates from MySQL
  private parseDate(date: any): Date | null {
    if (!date) return null;
    return new Date(date);
  }

  // Helper method to parse JSON safely
  private parseJSON(value: any): any {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [rows] = await this.pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    const users = rows as any[];
    if (users.length === 0) return undefined;
    const row = users[0];
    return {
      ...row,
      createdAt: this.parseDate(row.created_at),
      updatedAt: this.parseDate(row.updated_at),
      firstName: row.first_name,
      lastName: row.last_name,
      profileImageUrl: row.profile_image_url,
      passwordHash: row.password_hash
    };
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [rows] = await this.pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    const users = rows as any[];
    if (users.length === 0) return undefined;
    const row = users[0];
    return {
      ...row,
      createdAt: this.parseDate(row.created_at),
      updatedAt: this.parseDate(row.updated_at),
      firstName: row.first_name,
      lastName: row.last_name,
      profileImageUrl: row.profile_image_url,
      passwordHash: row.password_hash
    };
  }

  async createUser(user: User): Promise<User> {
    const now = this.formatDate(new Date());
    
    await this.pool.execute(`
      INSERT INTO users (id, email, name, first_name, last_name, phone, address, profile_image_url, password_hash, provider, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      user.id, user.email, user.name, user.firstName, user.lastName,
      user.phone, user.address, user.profileImageUrl, user.passwordHash,
      user.provider, now, now
    ]);

    return user;
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const id = nanoid();
    const now = this.formatDate(new Date());
    
    // Convert undefined values to null for MySQL
    const safeUser = {
      id,
      email: user.email,
      name: user.name || null,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      phone: user.phone || null,
      address: user.address || null,
      profileImageUrl: user.profileImageUrl || null,
      passwordHash: user.passwordHash || null,
      provider: user.provider || null,
      createdAt: now,
      updatedAt: now
    };
    
    await this.pool.execute(`
      INSERT INTO users (id, email, name, first_name, last_name, phone, address, profile_image_url, password_hash, provider, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        first_name = VALUES(first_name),
        last_name = VALUES(last_name),
        phone = VALUES(phone),
        address = VALUES(address),
        profile_image_url = VALUES(profile_image_url),
        updated_at = VALUES(updated_at)
    `, [
      safeUser.id, safeUser.email, safeUser.name, safeUser.firstName, safeUser.lastName,
      safeUser.phone, safeUser.address, safeUser.profileImageUrl, safeUser.passwordHash,
      safeUser.provider, safeUser.createdAt, safeUser.updatedAt
    ]);

    return this.getUserByEmail(user.email) as Promise<User>;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    const [rows] = await this.pool.execute('SELECT * FROM categories ORDER BY name');
    return (rows as any[]).map(row => ({
      ...row,
      createdAt: this.parseDate(row.created_at)
    }));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = nanoid();
    const now = this.formatDate(new Date());
    
    await this.pool.execute(`
      INSERT INTO categories (id, name, description, created_at)
      VALUES (?, ?, ?, ?)
    `, [id, category.name, category.description, now]);
    
    return {
      id,
      name: category.name,
      description: category.description || null,
      createdAt: new Date()
    };
  }

  // Subcategories
  async getSubcategories(categoryId?: string): Promise<Subcategory[]> {
    let query = 'SELECT * FROM subcategories';
    let params: any[] = [];
    
    if (categoryId) {
      query += ' WHERE category_id = ?';
      params.push(categoryId);
    }
    
    query += ' ORDER BY name';
    
    const [rows] = await this.pool.execute(query, params);
    return (rows as any[]).map(row => ({
      ...row,
      categoryId: row.category_id,
      imageUrl: row.image_url,
      createdAt: this.parseDate(row.created_at)
    }));
  }

  async createSubcategory(subcategory: InsertSubcategory): Promise<Subcategory> {
    const id = nanoid();
    const now = this.formatDate(new Date());
    
    await this.pool.execute(`
      INSERT INTO subcategories (id, name, category_id, description, image_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, subcategory.name, subcategory.categoryId, subcategory.description, subcategory.imageUrl, now]);
    
    return {
      id,
      name: subcategory.name,
      categoryId: subcategory.categoryId,
      description: subcategory.description || null,
      imageUrl: subcategory.imageUrl || null,
      createdAt: new Date()
    };
  }

  // Products
  async getProducts(filters?: {
    search?: string;
    categoryId?: string;
    subcategoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    featured?: boolean;
    isDeal?: boolean;
  }): Promise<Product[]> {
    let query = `
      SELECT p.*, c.name as category_name, s.name as subcategory_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      LEFT JOIN subcategories s ON p.subcategory_id = s.id 
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (filters?.search) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    
    if (filters?.categoryId) {
      query += ' AND (p.category_id = ? OR p.subcategory_id = ?)';
      params.push(filters.categoryId, filters.categoryId);
    }
    
    if (filters?.subcategoryId) {
      query += ' AND p.subcategory_id = ?';
      params.push(filters.subcategoryId);
    }
    
    if (filters?.minPrice !== undefined) {
      query += ' AND p.price >= ?';
      params.push(filters.minPrice);
    }
    
    if (filters?.maxPrice !== undefined) {
      query += ' AND p.price <= ?';
      params.push(filters.maxPrice);
    }
    
    if (filters?.featured !== undefined && filters.featured) {
      // Show first 8 products as featured
      query += ' LIMIT 8';
    }
    
    if (filters?.isDeal !== undefined && filters.isDeal) {
      query += ' AND (p.name LIKE "%Deal%" OR p.name LIKE "%Flash%" OR p.name LIKE "%Sale%")';
    }
    
    query += ' ORDER BY p.created_at DESC';
    
    const [rows] = await this.pool.execute(query, params);
    
    return (rows as any[]).map(row => ({
      ...row,
      categoryId: row.category_id,
      subcategoryId: row.subcategory_id,
      imageUrl: row.image_url,
      images: row.image_url ? [row.image_url] : [],
      inStock: row.stock > 0,
      featured: row.featured === 1,
      isDeal: row.is_deal === 1,
      dealPrice: row.deal_price,
      dealExpiry: this.parseDate(row.deal_expiry),
      createdAt: this.parseDate(row.created_at),
      updatedAt: this.parseDate(row.updated_at),
      originalPrice: row.original_price || row.price
    }));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [rows] = await this.pool.execute(`
      SELECT p.*, c.name as category_name, s.name as subcategory_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      LEFT JOIN subcategories s ON p.subcategory_id = s.id 
      WHERE p.id = ?
    `, [id]);
    
    const products = rows as any[];
    if (products.length === 0) return undefined;
    
    const row = products[0];
    return {
      ...row,
      categoryId: row.category_id,
      subcategoryId: row.subcategory_id,
      imageUrl: row.image_url,
      images: row.image_url ? [row.image_url] : [],
      inStock: row.stock > 0,
      featured: row.featured === 1,
      isDeal: row.is_deal === 1,
      dealPrice: row.deal_price,
      dealExpiry: this.parseDate(row.deal_expiry),
      createdAt: this.parseDate(row.created_at),
      updatedAt: this.parseDate(row.updated_at),
      originalPrice: row.original_price || row.price
    };
  }

  async getFeaturedProducts(): Promise<Product[]> {
    // Get products where featured = 1, fallback to first 8 if none are featured
    const [rows] = await this.pool.execute(`
      SELECT p.*, c.name as category_name, s.name as subcategory_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      LEFT JOIN subcategories s ON p.subcategory_id = s.id 
      WHERE p.featured = 1
      ORDER BY p.created_at DESC
      LIMIT 8
    `);
    
    return (rows as any[]).map(row => ({
      ...row,
      categoryId: row.category_id,
      subcategoryId: row.subcategory_id,
      imageUrl: row.image_url,
      images: row.image_url ? [row.image_url] : [],
      inStock: row.stock > 0,
      featured: row.featured === 1,
      isDeal: row.is_deal === 1,
      dealPrice: row.deal_price,
      dealExpiry: this.parseDate(row.deal_expiry),
      createdAt: this.parseDate(row.created_at),
      updatedAt: this.parseDate(row.updated_at),
      originalPrice: row.original_price || row.price
    }));
  }

  async getDealProducts(): Promise<Product[]> {
    // Get products where is_deal = 1
    const [rows] = await this.pool.execute(`
      SELECT p.*, c.name as category_name, s.name as subcategory_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      LEFT JOIN subcategories s ON p.subcategory_id = s.id 
      WHERE p.is_deal = 1
      ORDER BY p.created_at DESC
    `);
    
    return (rows as any[]).map(row => ({
      ...row,
      categoryId: row.category_id,
      subcategoryId: row.subcategory_id,
      imageUrl: row.image_url,
      images: row.image_url ? [row.image_url] : [],
      inStock: row.stock > 0,
      featured: row.featured === 1,
      isDeal: row.is_deal === 1,
      dealPrice: row.deal_price,
      dealExpiry: this.parseDate(row.deal_expiry),
      createdAt: this.parseDate(row.created_at),
      updatedAt: this.parseDate(row.updated_at),
      originalPrice: row.original_price || row.price
    }));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = nanoid();
    const now = this.formatDate(new Date());
    
    await this.pool.execute(`
      INSERT INTO products (
        id, name, description, price, category_id, subcategory_id,
        image_url, stock, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, product.name, product.description, product.price,
      product.categoryId, product.subcategoryId, product.imageUrl,
      product.stock || 10, now
    ]);
    
    return this.getProduct(id) as Promise<Product>;
  }

  // Cart Items
  async getCartItems(userId: string): Promise<(CartItem & { product: Product })[]> {
    const [rows] = await this.pool.execute(`
      SELECT ci.*, p.*, ci.id as cart_id, p.id as product_id
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
      ORDER BY ci.created_at DESC
    `, [userId]);

    return (rows as any[]).map(row => ({
      id: row.cart_id,
      userId: row.user_id,
      productId: row.product_id,
      quantity: row.quantity,
      createdAt: this.parseDate(row.created_at),
      product: {
        ...row,
        id: row.product_id,
        categoryId: row.category_id,
        subcategoryId: row.subcategory_id,
        imageUrl: row.image_url,
        images: row.image_url ? [row.image_url] : [],
        inStock: row.stock > 0,
        featured: false,
        isDeal: row.name.includes('Deal') || row.name.includes('Flash') || row.name.includes('Sale'),
        dealPrice: null,
        dealExpiry: null,
        createdAt: this.parseDate(row.created_at),
        updatedAt: this.parseDate(row.created_at),
        originalPrice: row.price
      }
    }));
  }

  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    const id = nanoid();
    const now = this.formatDate(new Date());
    
    // Check if item already exists in cart
    const [existing] = await this.pool.execute(`
      SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?
    `, [cartItem.userId, cartItem.productId]);
    
    if ((existing as any[]).length > 0) {
      // Update quantity
      await this.pool.execute(`
        UPDATE cart_items SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?
      `, [cartItem.quantity || 1, cartItem.userId, cartItem.productId]);
      
      const [rows] = await this.pool.execute(`
        SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?
      `, [cartItem.userId, cartItem.productId]);
      
      const row = (rows as any[])[0];
      return {
        ...row,
        userId: row.user_id,
        productId: row.product_id,
        createdAt: this.parseDate(row.created_at)
      };
    } else {
      // Insert new item
      await this.pool.execute(`
        INSERT INTO cart_items (id, user_id, product_id, quantity, created_at)
        VALUES (?, ?, ?, ?, ?)
      `, [id, cartItem.userId, cartItem.productId, cartItem.quantity || 1, now]);
      
      return {
        id,
        userId: cartItem.userId,
        productId: cartItem.productId,
        quantity: cartItem.quantity || 1,
        createdAt: new Date()
      };
    }
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem | undefined> {
    if (quantity <= 0) {
      await this.removeFromCart(id);
      return undefined;
    }
    
    await this.pool.execute(`
      UPDATE cart_items SET quantity = ? WHERE id = ?
    `, [quantity, id]);
    
    const [rows] = await this.pool.execute(`
      SELECT * FROM cart_items WHERE id = ?
    `, [id]);
    
    const cartItems = rows as any[];
    if (cartItems.length === 0) return undefined;
    
    const row = cartItems[0];
    return {
      ...row,
      userId: row.user_id,
      productId: row.product_id,
      createdAt: this.parseDate(row.created_at)
    };
  }

  async removeFromCart(id: string): Promise<void> {
    await this.pool.execute(`DELETE FROM cart_items WHERE id = ?`, [id]);
  }

  async clearCart(userId: string): Promise<void> {
    await this.pool.execute(`DELETE FROM cart_items WHERE user_id = ?`, [userId]);
  }

  // Wishlist Items
  async getWishlistItems(userId: string): Promise<(WishlistItem & { product: Product })[]> {
    const [rows] = await this.pool.execute(`
      SELECT wi.*, p.*, wi.id as wishlist_id, p.id as product_id
      FROM wishlist_items wi
      JOIN products p ON wi.product_id = p.id
      WHERE wi.user_id = ?
      ORDER BY wi.created_at DESC
    `, [userId]);

    return (rows as any[]).map(row => ({
      id: row.wishlist_id,
      userId: row.user_id,
      productId: row.product_id,
      createdAt: this.parseDate(row.created_at),
      product: {
        ...row,
        id: row.product_id,
        categoryId: row.category_id,
        subcategoryId: row.subcategory_id,
        imageUrl: row.image_url,
        images: row.image_url ? [row.image_url] : [],
        inStock: row.stock > 0,
        featured: false,
        isDeal: row.name.includes('Deal') || row.name.includes('Flash') || row.name.includes('Sale'),
        dealPrice: null,
        dealExpiry: null,
        createdAt: this.parseDate(row.created_at),
        updatedAt: this.parseDate(row.created_at),
        originalPrice: row.price
      }
    }));
  }

  async addToWishlist(wishlistItem: InsertWishlistItem): Promise<WishlistItem> {
    const id = nanoid();
    const now = this.formatDate(new Date());
    
    try {
      await this.pool.execute(`
        INSERT INTO wishlist_items (id, user_id, product_id, created_at)
        VALUES (?, ?, ?, ?)
      `, [id, wishlistItem.userId, wishlistItem.productId, now]);
    } catch (error: any) {
      // If duplicate key error, ignore it
      if (error.code !== 'ER_DUP_ENTRY') {
        throw error;
      }
    }
    
    return {
      id,
      userId: wishlistItem.userId,
      productId: wishlistItem.productId,
      createdAt: new Date()
    };
  }

  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    await this.pool.execute(`
      DELETE FROM wishlist_items WHERE user_id = ? AND product_id = ?
    `, [userId, productId]);
  }

  // Orders
  async createOrder(order: InsertOrder): Promise<Order> {
    const id = nanoid();
    const now = this.formatDate(new Date());
    
    await this.pool.execute(`
      INSERT INTO orders (
        id, user_id, total, status, payment_id, payment_status, payment_method,
        razorpay_order_id, razorpay_payment_id, razorpay_signature,
        customer_name, customer_phone, customer_email, shipping_address, pincode,
        tracking_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, order.userId, order.total, order.status || 'pending',
      order.paymentId || null, order.paymentStatus || 'pending', order.paymentMethod,
      order.razorpayOrderId || null, order.razorpayPaymentId || null, order.razorpaySignature || null,
      order.customerName, order.customerPhone, order.customerEmail,
      order.shippingAddress, order.pincode, order.trackingId || null,
      now, now
    ]);
    
    const [rows] = await this.pool.execute('SELECT * FROM orders WHERE id = ?', [id]);
    const row = (rows as any[])[0];
    
    return {
      ...row,
      userId: row.user_id,
      paymentId: row.payment_id,
      paymentStatus: row.payment_status,
      paymentMethod: row.payment_method,
      razorpayOrderId: row.razorpay_order_id,
      razorpayPaymentId: row.razorpay_payment_id,
      razorpaySignature: row.razorpay_signature,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerEmail: row.customer_email,
      shippingAddress: row.shipping_address,
      trackingId: row.tracking_id,
      createdAt: this.parseDate(row.created_at),
      updatedAt: this.parseDate(row.updated_at)
    };
  }

  async addOrderItems(orderItems: InsertOrderItem[]): Promise<OrderItem[]> {
    const results: OrderItem[] = [];
    const now = this.formatDate(new Date());
    
    for (const orderItem of orderItems) {
      const id = nanoid();
      
      await this.pool.execute(`
        INSERT INTO order_items (id, order_id, product_id, quantity, price, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [id, orderItem.orderId, orderItem.productId, orderItem.quantity, orderItem.price, now]);
      
      results.push({
        id,
        orderId: orderItem.orderId,
        productId: orderItem.productId,
        quantity: orderItem.quantity,
        price: orderItem.price,
        createdAt: new Date()
      });
    }
    
    return results;
  }

  async getOrders(userId: string): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] })[]> {
    const [orderRows] = await this.pool.execute(`
      SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC
    `, [userId]);
    
    const orders = orderRows as any[];
    const results: (Order & { orderItems: (OrderItem & { product: Product })[] })[] = [];
    
    for (const orderRow of orders) {
      const [itemRows] = await this.pool.execute(`
        SELECT oi.*, p.*, oi.id as order_item_id, p.id as product_id
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [orderRow.id]);
      
      const orderItems = (itemRows as any[]).map(row => ({
        id: row.order_item_id,
        orderId: row.order_id,
        productId: row.product_id,
        quantity: row.quantity,
        price: row.price,
        createdAt: this.parseDate(row.created_at),
        product: {
          ...row,
          id: row.product_id,
          categoryId: row.category_id,
          subcategoryId: row.subcategory_id,
          imageUrl: row.image_url,
          images: this.parseJSON(row.images) || [],
          inStock: Boolean(row.in_stock),
          featured: Boolean(row.featured),
          isDeal: Boolean(row.is_deal),
          dealPrice: row.deal_price,
          dealExpiry: this.parseDate(row.deal_expiry),
          createdAt: this.parseDate(row.created_at),
          updatedAt: this.parseDate(row.updated_at),
          originalPrice: row.original_price
        }
      }));
      
      results.push({
        ...orderRow,
        userId: orderRow.user_id,
        paymentId: orderRow.payment_id,
        paymentStatus: orderRow.payment_status,
        paymentMethod: orderRow.payment_method,
        razorpayOrderId: orderRow.razorpay_order_id,
        razorpayPaymentId: orderRow.razorpay_payment_id,
        razorpaySignature: orderRow.razorpay_signature,
        customerName: orderRow.customer_name,
        customerPhone: orderRow.customer_phone,
        customerEmail: orderRow.customer_email,
        shippingAddress: orderRow.shipping_address,
        trackingId: orderRow.tracking_id,
        createdAt: this.parseDate(orderRow.created_at),
        updatedAt: this.parseDate(orderRow.updated_at),
        orderItems
      });
    }
    
    return results;
  }

  async getOrder(id: string): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] }) | undefined> {
    const [orderRows] = await this.pool.execute('SELECT * FROM orders WHERE id = ?', [id]);
    const orders = orderRows as any[];
    if (orders.length === 0) return undefined;
    
    const orderRow = orders[0];
    
    const [itemRows] = await this.pool.execute(`
      SELECT oi.*, p.*, oi.id as order_item_id, p.id as product_id
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [id]);
    
    const orderItems = (itemRows as any[]).map(row => ({
      id: row.order_item_id,
      orderId: row.order_id,
      productId: row.product_id,
      quantity: row.quantity,
      price: row.price,
      createdAt: this.parseDate(row.created_at),
      product: {
        ...row,
        id: row.product_id,
        categoryId: row.category_id,
        subcategoryId: row.subcategory_id,
        imageUrl: row.image_url,
        images: row.image_url ? [row.image_url] : [],
        inStock: row.stock > 0,
        featured: false,
        isDeal: row.name.includes('Deal') || row.name.includes('Flash') || row.name.includes('Sale'),
        dealPrice: null,
        dealExpiry: null,
        createdAt: this.parseDate(row.created_at),
        updatedAt: this.parseDate(row.created_at),
        originalPrice: row.price
      }
    }));
    
    return {
      ...orderRow,
      userId: orderRow.user_id,
      paymentId: orderRow.payment_id,
      paymentStatus: orderRow.payment_status,
      paymentMethod: orderRow.payment_method,
      razorpayOrderId: orderRow.razorpay_order_id,
      razorpayPaymentId: orderRow.razorpay_payment_id,
      razorpaySignature: orderRow.razorpay_signature,
      customerName: orderRow.customer_name,
      customerPhone: orderRow.customer_phone,
      customerEmail: orderRow.customer_email,
      shippingAddress: orderRow.shipping_address,
      trackingId: orderRow.tracking_id,
      createdAt: this.parseDate(orderRow.created_at),
      updatedAt: this.parseDate(orderRow.updated_at),
      orderItems
    };
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const now = this.formatDate(new Date());
    
    await this.pool.execute(`
      UPDATE orders SET status = ?, updated_at = ? WHERE id = ?
    `, [status, now, id]);
    
    const [rows] = await this.pool.execute('SELECT * FROM orders WHERE id = ?', [id]);
    const orders = rows as any[];
    if (orders.length === 0) return undefined;
    
    const row = orders[0];
    return {
      ...row,
      userId: row.user_id,
      paymentId: row.payment_id,
      paymentStatus: row.payment_status,
      paymentMethod: row.payment_method,
      razorpayOrderId: row.razorpay_order_id,
      razorpayPaymentId: row.razorpay_payment_id,
      razorpaySignature: row.razorpay_signature,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerEmail: row.customer_email,
      shippingAddress: row.shipping_address,
      trackingId: row.tracking_id,
      createdAt: this.parseDate(row.created_at),
      updatedAt: this.parseDate(row.updated_at)
    };
  }

  // Contact Inquiries
  async createContactInquiry(inquiry: InsertContactInquiry): Promise<ContactInquiry> {
    const id = nanoid();
    const now = this.formatDate(new Date());
    
    await this.pool.execute(`
      INSERT INTO contact_inquiries (id, first_name, last_name, email, phone, inquiry_type, message, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, inquiry.firstName, inquiry.lastName, inquiry.email, inquiry.phone, inquiry.inquiryType, inquiry.message, now]);
    
    return {
      id,
      firstName: inquiry.firstName,
      lastName: inquiry.lastName,
      email: inquiry.email,
      phone: inquiry.phone || null,
      inquiryType: inquiry.inquiryType,
      message: inquiry.message,
      status: 'new',
      createdAt: new Date()
    };
  }

  // Product Reviews
  async getProductReviews(productId: string): Promise<ProductReview[]> {
    const [rows] = await this.pool.execute(`
      SELECT * FROM product_reviews WHERE product_id = ? ORDER BY created_at DESC
    `, [productId]);
    
    return (rows as any[]).map(row => ({
      ...row,
      productId: row.product_id,
      userId: row.user_id,
      userName: row.user_name,
      images: this.parseJSON(row.images) || [],
      isVerified: Boolean(row.is_verified),
      createdAt: this.parseDate(row.created_at),
      updatedAt: this.parseDate(row.updated_at)
    }));
  }

  async createProductReview(review: InsertProductReview): Promise<ProductReview> {
    const id = nanoid();
    const now = this.formatDate(new Date());
    
    await this.pool.execute(`
      INSERT INTO product_reviews (
        id, product_id, user_id, user_name, rating, comment, images, is_verified, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, review.productId, review.userId, review.userName, review.rating,
      review.comment, JSON.stringify(review.images || []), review.isVerified || false, now, now
    ]);
    
    return {
      id,
      productId: review.productId,
      userId: review.userId || null,
      userName: review.userName,
      rating: review.rating,
      comment: review.comment,
      images: review.images || [],
      isVerified: review.isVerified || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Product Questions
  async getProductQuestions(productId: string): Promise<ProductQuestion[]> {
    const [rows] = await this.pool.execute(`
      SELECT * FROM product_questions WHERE product_id = ? AND is_public = 1 ORDER BY created_at DESC
    `, [productId]);
    
    return (rows as any[]).map(row => ({
      ...row,
      productId: row.product_id,
      userId: row.user_id,
      userName: row.user_name,
      userEmail: row.user_email,
      answeredBy: row.answered_by,
      answeredAt: this.parseDate(row.answered_at),
      isPublic: Boolean(row.is_public),
      createdAt: this.parseDate(row.created_at),
      updatedAt: this.parseDate(row.updated_at)
    }));
  }

  async createProductQuestion(question: InsertProductQuestion): Promise<ProductQuestion> {
    const id = nanoid();
    const now = this.formatDate(new Date());
    
    await this.pool.execute(`
      INSERT INTO product_questions (
        id, product_id, user_id, user_name, user_email, question, answer,
        answered_by, answered_at, is_public, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, question.productId, question.userId, question.userName, question.userEmail,
      question.question, question.answer || null, question.answeredBy || null, 
      question.answeredAt ? this.formatDate(question.answeredAt) : null,
      question.isPublic !== false, now, now
    ]);
    
    return {
      id,
      productId: question.productId,
      userId: question.userId || null,
      userName: question.userName,
      userEmail: question.userEmail || null,
      question: question.question,
      answer: question.answer || null,
      answeredBy: question.answeredBy || null,
      answeredAt: question.answeredAt || null,
      isPublic: question.isPublic !== false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async updateProductQuestion(id: string, data: Partial<ProductQuestion>): Promise<ProductQuestion | undefined> {
    const fields: string[] = [];
    const values: any[] = [];
    
    if (data.answer !== undefined) {
      fields.push('answer = ?');
      values.push(data.answer);
    }
    if (data.answeredBy !== undefined) {
      fields.push('answered_by = ?');
      values.push(data.answeredBy);
    }
    if (data.answeredAt !== undefined) {
      fields.push('answered_at = ?');
      values.push(data.answeredAt ? this.formatDate(data.answeredAt) : null);
    }
    if (data.isPublic !== undefined) {
      fields.push('is_public = ?');
      values.push(data.isPublic);
    }
    
    if (fields.length === 0) {
      // No fields to update, just return the existing question
      const [rows] = await this.pool.execute('SELECT * FROM product_questions WHERE id = ?', [id]);
      const questions = rows as any[];
      if (questions.length === 0) return undefined;
      
      const row = questions[0];
      return {
        ...row,
        productId: row.product_id,
        userId: row.user_id,
        userName: row.user_name,
        userEmail: row.user_email,
        answeredBy: row.answered_by,
        answeredAt: this.parseDate(row.answered_at),
        isPublic: Boolean(row.is_public),
        createdAt: this.parseDate(row.created_at),
        updatedAt: this.parseDate(row.updated_at)
      };
    }
    
    fields.push('updated_at = ?');
    values.push(this.formatDate(new Date()));
    values.push(id);
    
    await this.pool.execute(`
      UPDATE product_questions SET ${fields.join(', ')} WHERE id = ?
    `, values);
    
    const [rows] = await this.pool.execute('SELECT * FROM product_questions WHERE id = ?', [id]);
    const questions = rows as any[];
    if (questions.length === 0) return undefined;
    
    const row = questions[0];
    return {
      ...row,
      productId: row.product_id,
      userId: row.user_id,
      userName: row.user_name,
      userEmail: row.user_email,
      answeredBy: row.answered_by,
      answeredAt: this.parseDate(row.answered_at),
      isPublic: Boolean(row.is_public),
      createdAt: this.parseDate(row.created_at),
      updatedAt: this.parseDate(row.updated_at)
    };
  }
}