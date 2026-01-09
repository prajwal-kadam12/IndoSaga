import {
  type User,
  type UpsertUser,
  type Product,
  type InsertProduct,
  type Category,
  type InsertCategory,
  type Subcategory,
  type InsertSubcategory,
  type CartItem,
  type InsertCartItem,
  type WishlistItem,
  type InsertWishlistItem,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type ContactInquiry,
  type InsertContactInquiry,
  type ProductReview,
  type InsertProductReview,
  type ProductQuestion,
  type InsertProductQuestion,
} from "@shared/schema";
import { IStorage } from "./storage";
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export class JSONStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private categories: Map<string, Category> = new Map();
  private subcategories: Map<string, Subcategory> = new Map();
  private products: Map<string, Product> = new Map();
  private cartItems: Map<string, CartItem> = new Map();
  private wishlistItems: Map<string, WishlistItem> = new Map();
  private orders: Map<string, Order> = new Map();
  private orderItems: Map<string, OrderItem> = new Map();
  private contactInquiries: Map<string, ContactInquiry> = new Map();
  private productReviews: Map<string, ProductReview> = new Map();
  private productQuestions: Map<string, ProductQuestion> = new Map();

  private dataDir: string;
  private isLoaded = false;

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
  }

  private async ensureDataLoaded() {
    if (this.isLoaded) return;
    await this.loadAllData();
    this.isLoaded = true;
  }

  private async loadAllData() {
    console.log('Loading data from JSON files...');
    
    try {
      // Load categories
      const categoriesData = await this.loadJSONFile<Category[]>('categories.json');
      categoriesData.forEach(category => this.categories.set(category.id, category));

      // Load subcategories
      const subcategoriesData = await this.loadJSONFile<Subcategory[]>('subcategories.json');
      subcategoriesData.forEach(subcategory => this.subcategories.set(subcategory.id, subcategory));

      // Load products
      const productsData = await this.loadJSONFile<Product[]>('products.json');
      productsData.forEach(product => this.products.set(product.id, product));

      // Load users
      const usersData = await this.loadJSONFile<User[]>('users.json');
      usersData.forEach(user => this.users.set(user.id, user));

      // Load cart items
      const cartItemsData = await this.loadJSONFile<CartItem[]>('cartItems.json');
      cartItemsData.forEach(item => this.cartItems.set(item.id, item));

      // Load wishlist items
      const wishlistItemsData = await this.loadJSONFile<WishlistItem[]>('wishlistItems.json');
      wishlistItemsData.forEach(item => this.wishlistItems.set(item.id, item));

      // Load orders
      const ordersData = await this.loadJSONFile<Order[]>('orders.json');
      ordersData.forEach(order => this.orders.set(order.id, order));

      // Load order items
      const orderItemsData = await this.loadJSONFile<OrderItem[]>('orderItems.json');
      orderItemsData.forEach(item => this.orderItems.set(item.id, item));

      // Load contact inquiries
      const contactInquiriesData = await this.loadJSONFile<ContactInquiry[]>('contactInquiries.json');
      contactInquiriesData.forEach(inquiry => this.contactInquiries.set(inquiry.id, inquiry));

      // Load product reviews
      const productReviewsData = await this.loadJSONFile<ProductReview[]>('productReviews.json');
      productReviewsData.forEach(review => this.productReviews.set(review.id, review));

      // Load product questions
      const productQuestionsData = await this.loadJSONFile<ProductQuestion[]>('productQuestions.json');
      productQuestionsData.forEach(question => this.productQuestions.set(question.id, question));

      console.log('✅ All JSON data loaded successfully');
    } catch (error) {
      console.error('Error loading JSON data:', error);
      throw error;
    }
  }

  private async loadJSONFile<T>(filename: string): Promise<T> {
    try {
      const filePath = path.join(this.dataDir, filename);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.warn(`Could not load ${filename}, using empty array`);
      return [] as unknown as T;
    }
  }

  private async saveJSONFile<T>(filename: string, data: T[]) {
    const filePath = path.join(this.dataDir, filename);
    const tempPath = filePath + '.tmp';
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2));
    await fs.rename(tempPath, filePath);
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    await this.ensureDataLoaded();
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    await this.ensureDataLoaded();
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async createUser(userData: User): Promise<User> {
    await this.ensureDataLoaded();
    const user: User = {
      ...userData,
      name: userData.name ?? null,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      phone: userData.phone ?? null,
      address: userData.address ?? null,
      profileImageUrl: userData.profileImageUrl ?? null,
      passwordHash: userData.passwordHash ?? null,
      provider: userData.provider ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    await this.saveJSONFile('users.json', Array.from(this.users.values()));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    await this.ensureDataLoaded();
    
    // Find existing user by email
    const existingUser = Array.from(this.users.values()).find(u => u.email === userData.email);
    
    if (existingUser) {
      // Update existing user
      const updatedUser: User = {
        ...existingUser,
        ...userData,
        name: userData.name ?? existingUser.name,
        firstName: userData.firstName ?? existingUser.firstName,
        lastName: userData.lastName ?? existingUser.lastName,
        phone: userData.phone ?? existingUser.phone,
        address: userData.address ?? existingUser.address,
        profileImageUrl: userData.profileImageUrl ?? existingUser.profileImageUrl,
        passwordHash: existingUser.passwordHash,
        provider: userData.provider ?? existingUser.provider,
        updatedAt: new Date(),
      };
      this.users.set(existingUser.id, updatedUser);
      await this.saveJSONFile('users.json', Array.from(this.users.values()));
      return updatedUser;
    } else {
      // Create new user
      const newUser: User = {
        id: crypto.randomUUID(),
        ...userData,
        name: userData.name ?? null,
        firstName: userData.firstName ?? null,
        lastName: userData.lastName ?? null,
        phone: userData.phone ?? null,
        address: userData.address ?? null,
        profileImageUrl: userData.profileImageUrl ?? null,
        passwordHash: userData.passwordHash ?? null,
        provider: userData.provider ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.set(newUser.id, newUser);
      await this.saveJSONFile('users.json', Array.from(this.users.values()));
      return newUser;
    }
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    await this.ensureDataLoaded();
    return Array.from(this.categories.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    await this.ensureDataLoaded();
    const newCategory: Category = {
      id: crypto.randomUUID(),
      ...category,
      description: category.description ?? null,
      createdAt: new Date(),
    };
    this.categories.set(newCategory.id, newCategory);
    await this.saveJSONFile('categories.json', Array.from(this.categories.values()));
    return newCategory;
  }

  // Subcategory operations
  async getSubcategories(categoryId?: string): Promise<Subcategory[]> {
    await this.ensureDataLoaded();
    let subcategories = Array.from(this.subcategories.values());
    
    if (categoryId) {
      subcategories = subcategories.filter(sub => sub.categoryId === categoryId);
    }
    
    return subcategories.sort((a, b) => a.name.localeCompare(b.name));
  }

  async createSubcategory(subcategory: InsertSubcategory): Promise<Subcategory> {
    await this.ensureDataLoaded();
    const newSubcategory: Subcategory = {
      id: crypto.randomUUID(),
      ...subcategory,
      description: subcategory.description ?? null,
      imageUrl: subcategory.imageUrl ?? null,
      createdAt: new Date(),
    };
    this.subcategories.set(newSubcategory.id, newSubcategory);
    await this.saveJSONFile('subcategories.json', Array.from(this.subcategories.values()));
    return newSubcategory;
  }

  // Product operations
  async getProducts(filters?: {
    search?: string;
    categoryId?: string;
    subcategoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    featured?: boolean;
    isDeal?: boolean;
  }): Promise<Product[]> {
    await this.ensureDataLoaded();
    let products = Array.from(this.products.values());

    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm) ||
        p.description?.toLowerCase().includes(searchTerm)
      );
    }

    if (filters?.categoryId) {
      products = products.filter(p => p.categoryId === filters.categoryId);
    }

    if (filters?.subcategoryId) {
      products = products.filter(p => p.subcategoryId === filters.subcategoryId);
    }

    if (filters?.minPrice !== undefined) {
      products = products.filter(p => parseFloat(p.price) >= filters.minPrice!);
    }

    if (filters?.maxPrice !== undefined) {
      products = products.filter(p => parseFloat(p.price) <= filters.maxPrice!);
    }

    if (filters?.featured !== undefined) {
      products = products.filter(p => p.featured === filters.featured);
    }

    if (filters?.isDeal !== undefined) {
      products = products.filter(p => p.isDeal === filters.isDeal);
    }

    // Filter active deals (not expired)
    if (filters?.isDeal === true) {
      const now = new Date();
      products = products.filter(p => !p.dealExpiry || new Date(p.dealExpiry) > now);
    }

    return products.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async getProduct(id: string): Promise<Product | undefined> {
    await this.ensureDataLoaded();
    return this.products.get(id);
  }

  async getFeaturedProducts(): Promise<Product[]> {
    await this.ensureDataLoaded();
    return Array.from(this.products.values())
      .filter(p => p.featured === true)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 6);
  }

  async getDealProducts(): Promise<Product[]> {
    await this.ensureDataLoaded();
    const now = new Date();
    return Array.from(this.products.values())
      .filter(p => p.isDeal === true && (!p.dealExpiry || new Date(p.dealExpiry) > now))
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    await this.ensureDataLoaded();
    const newProduct: Product = {
      id: crypto.randomUUID(),
      ...product,
      description: product.description ?? null,
      originalPrice: product.originalPrice ?? null,
      categoryId: product.categoryId ?? null,
      subcategoryId: product.subcategoryId ?? null,
      imageUrl: product.imageUrl ?? null,
      images: product.images ?? null,
      inStock: product.inStock ?? true,
      stock: product.stock ?? 0,
      featured: product.featured ?? false,
      isDeal: product.isDeal ?? false,
      dealPrice: product.dealPrice ?? null,
      dealExpiry: product.dealExpiry ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.products.set(newProduct.id, newProduct);
    await this.saveJSONFile('products.json', Array.from(this.products.values()));
    return newProduct;
  }

  // Cart operations
  async getCartItems(userId: string): Promise<(CartItem & { product: Product })[]> {
    await this.ensureDataLoaded();
    const userCartItems = Array.from(this.cartItems.values())
      .filter(item => item.userId === userId);
    
    return userCartItems.map(item => {
      const product = this.products.get(item.productId);
      if (!product) {
        throw new Error(`Product not found for cart item: ${item.productId}`);
      }
      return { ...item, product };
    }).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    await this.ensureDataLoaded();
    
    // Check if item already exists
    const existing = Array.from(this.cartItems.values())
      .find(ci => ci.userId === item.userId && ci.productId === item.productId);

    if (existing) {
      // Update quantity
      const updated: CartItem = {
        ...existing,
        quantity: (existing.quantity || 0) + (item.quantity || 1),
      };
      this.cartItems.set(existing.id, updated);
      await this.saveJSONFile('cartItems.json', Array.from(this.cartItems.values()));
      return updated;
    } else {
      // Create new item
      const newItem: CartItem = {
        id: crypto.randomUUID(),
        ...item,
        quantity: item.quantity ?? 1,
        createdAt: new Date(),
      };
      this.cartItems.set(newItem.id, newItem);
      await this.saveJSONFile('cartItems.json', Array.from(this.cartItems.values()));
      return newItem;
    }
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem | undefined> {
    await this.ensureDataLoaded();
    const item = this.cartItems.get(id);
    if (!item) return undefined;

    const updated: CartItem = {
      ...item,
      quantity,
    };
    this.cartItems.set(id, updated);
    await this.saveJSONFile('cartItems.json', Array.from(this.cartItems.values()));
    return updated;
  }

  async removeFromCart(id: string): Promise<void> {
    await this.ensureDataLoaded();
    this.cartItems.delete(id);
    await this.saveJSONFile('cartItems.json', Array.from(this.cartItems.values()));
  }

  async clearCart(userId: string): Promise<void> {
    await this.ensureDataLoaded();
    const userItems = Array.from(this.cartItems.entries())
      .filter(([_, item]) => item.userId === userId);
    
    userItems.forEach(([id, _]) => this.cartItems.delete(id));
    await this.saveJSONFile('cartItems.json', Array.from(this.cartItems.values()));
  }

  // Wishlist operations
  async getWishlistItems(userId: string): Promise<(WishlistItem & { product: Product })[]> {
    await this.ensureDataLoaded();
    const userWishlistItems = Array.from(this.wishlistItems.values())
      .filter(item => item.userId === userId);
    
    return userWishlistItems.map(item => {
      const product = this.products.get(item.productId);
      if (!product) {
        throw new Error(`Product not found for wishlist item: ${item.productId}`);
      }
      return { ...item, product };
    }).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async addToWishlist(item: InsertWishlistItem): Promise<WishlistItem> {
    await this.ensureDataLoaded();
    
    // Check if item already exists
    const existing = Array.from(this.wishlistItems.values())
      .find(wi => wi.userId === item.userId && wi.productId === item.productId);

    if (existing) {
      return existing;
    }

    const newItem: WishlistItem = {
      id: crypto.randomUUID(),
      ...item,
      createdAt: new Date(),
    };
    this.wishlistItems.set(newItem.id, newItem);
    await this.saveJSONFile('wishlistItems.json', Array.from(this.wishlistItems.values()));
    return newItem;
  }

  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    await this.ensureDataLoaded();
    const item = Array.from(this.wishlistItems.entries())
      .find(([_, item]) => item.userId === userId && item.productId === productId);
    
    if (item) {
      this.wishlistItems.delete(item[0]);
      await this.saveJSONFile('wishlistItems.json', Array.from(this.wishlistItems.values()));
    }
  }

  // Order operations
  async createOrder(order: InsertOrder): Promise<Order> {
    await this.ensureDataLoaded();
    const newOrder: Order = {
      id: (order as any).id || crypto.randomUUID(), // Use custom ID if provided, otherwise generate UUID
      ...order,
      status: order.status ?? "pending",
      paymentId: order.paymentId ?? null,
      paymentStatus: order.paymentStatus ?? "pending",
      paymentMethod: order.paymentMethod ?? null,
      razorpayOrderId: order.razorpayOrderId ?? null,
      razorpayPaymentId: order.razorpayPaymentId ?? null,
      razorpaySignature: order.razorpaySignature ?? null,
      customerEmail: order.customerEmail ?? null,
      trackingId: order.trackingId ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.orders.set(newOrder.id, newOrder);
    await this.saveJSONFile('orders.json', Array.from(this.orders.values()));
    return newOrder;
  }

  async addOrderItems(orderItemsData: InsertOrderItem[]): Promise<OrderItem[]> {
    await this.ensureDataLoaded();
    const newOrderItems = orderItemsData.map(item => ({
      id: crypto.randomUUID(),
      ...item,
      createdAt: new Date(),
    }));

    newOrderItems.forEach(item => this.orderItems.set(item.id, item));
    await this.saveJSONFile('orderItems.json', Array.from(this.orderItems.values()));
    return newOrderItems;
  }

  async getOrders(userId: string): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] })[]> {
    await this.ensureDataLoaded();
    const userOrders = Array.from(this.orders.values())
      .filter(order => order.userId === userId)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return userOrders.map(order => {
      const items = Array.from(this.orderItems.values())
        .filter(item => item.orderId === order.id)
        .map(item => {
          const product = this.products.get(item.productId);
          if (!product) {
            throw new Error(`Product not found for order item: ${item.productId}`);
          }
          return { ...item, product };
        });

      return { ...order, orderItems: items };
    });
  }

  async getOrder(id: string): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] }) | undefined> {
    await this.ensureDataLoaded();
    const order = this.orders.get(id);
    if (!order) return undefined;

    const items = Array.from(this.orderItems.values())
      .filter(item => item.orderId === order.id)
      .map(item => {
        const product = this.products.get(item.productId);
        if (!product) {
          throw new Error(`Product not found for order item: ${item.productId}`);
        }
        return { ...item, product };
      });

    return { ...order, orderItems: items };
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    await this.ensureDataLoaded();
    const order = this.orders.get(id);
    if (!order) return undefined;

    const updated: Order = {
      ...order,
      status,
      updatedAt: new Date(),
    };
    this.orders.set(id, updated);
    await this.saveJSONFile('orders.json', Array.from(this.orders.values()));
    return updated;
  }

  // Contact operations
  async createContactInquiry(inquiry: InsertContactInquiry): Promise<ContactInquiry> {
    await this.ensureDataLoaded();
    const newInquiry: ContactInquiry = {
      id: crypto.randomUUID(),
      ...inquiry,
      phone: inquiry.phone ?? null,
      status: 'new',
      createdAt: new Date(),
    };
    this.contactInquiries.set(newInquiry.id, newInquiry);
    await this.saveJSONFile('contactInquiries.json', Array.from(this.contactInquiries.values()));
    return newInquiry;
  }

  // Review operations
  async getProductReviews(productId: string): Promise<ProductReview[]> {
    await this.ensureDataLoaded();
    return Array.from(this.productReviews.values())
      .filter(review => review.productId === productId)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async createProductReview(review: InsertProductReview): Promise<ProductReview> {
    await this.ensureDataLoaded();
    const newReview: ProductReview = {
      id: crypto.randomUUID(),
      ...review,
      userId: review.userId ?? null,
      images: review.images ?? null,
      isVerified: review.isVerified ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.productReviews.set(newReview.id, newReview);
    await this.saveJSONFile('productReviews.json', Array.from(this.productReviews.values()));
    return newReview;
  }

  // Q&A operations
  async getProductQuestions(productId: string): Promise<ProductQuestion[]> {
    await this.ensureDataLoaded();
    return Array.from(this.productQuestions.values())
      .filter(question => question.productId === productId && question.isPublic === true)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async createProductQuestion(question: InsertProductQuestion): Promise<ProductQuestion> {
    await this.ensureDataLoaded();
    const newQuestion: ProductQuestion = {
      id: crypto.randomUUID(),
      ...question,
      userId: question.userId ?? null,
      userEmail: question.userEmail ?? null,
      answer: question.answer ?? null,
      answeredBy: question.answeredBy ?? null,
      answeredAt: question.answeredAt ?? null,
      isPublic: question.isPublic ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.productQuestions.set(newQuestion.id, newQuestion);
    await this.saveJSONFile('productQuestions.json', Array.from(this.productQuestions.values()));
    return newQuestion;
  }

  async updateProductQuestion(id: string, data: Partial<ProductQuestion>): Promise<ProductQuestion | undefined> {
    await this.ensureDataLoaded();
    const question = this.productQuestions.get(id);
    if (!question) return undefined;

    const updated: ProductQuestion = {
      ...question,
      ...data,
      updatedAt: new Date(),
    };
    this.productQuestions.set(id, updated);
    await this.saveJSONFile('productQuestions.json', Array.from(this.productQuestions.values()));
    return updated;
  }
}