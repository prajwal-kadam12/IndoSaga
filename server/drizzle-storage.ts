import { eq, and, like, gte, lte, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from './db';
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
  productQuestions 
} from '../shared/schema';
import type { IStorage } from './storage';
import type {
  User,
  UpsertUser,
  Product,
  InsertProduct,
  Category,
  InsertCategory,
  Subcategory,
  InsertSubcategory,
  CartItem,
  InsertCartItem,
  WishlistItem,
  InsertWishlistItem,
  Order,
  InsertOrder,
  OrderItem,
  InsertOrderItem,
  ContactInquiry,
  InsertContactInquiry,
  ProductReview,
  InsertProductReview,
  ProductQuestion,
  InsertProductQuestion,
} from '../shared/schema';

export class DrizzleStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: User): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = await this.getUserByEmail(userData.email);
    
    if (existingUser) {
      const result = await db
        .update(users)
        .set({ ...userData, updatedAt: new Date() })
        .where(eq(users.id, existingUser.id))
        .returning();
      return result[0];
    } else {
      const newUser: User = {
        id: nanoid(),
        email: userData.email,
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
      return await this.createUser(newUser);
    }
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const newCategory: Category = {
      id: nanoid(),
      name: category.name,
      description: category.description ?? null,
      createdAt: new Date(),
    };
    const result = await db.insert(categories).values(newCategory).returning();
    return result[0];
  }

  // Subcategory operations
  async getSubcategories(categoryId?: string): Promise<Subcategory[]> {
    if (categoryId) {
      return await db.select().from(subcategories).where(eq(subcategories.categoryId, categoryId));
    }
    return await db.select().from(subcategories);
  }

  async createSubcategory(subcategory: InsertSubcategory): Promise<Subcategory> {
    const newSubcategory: Subcategory = {
      id: nanoid(),
      name: subcategory.name,
      description: subcategory.description ?? null,
      categoryId: subcategory.categoryId,
      imageUrl: subcategory.imageUrl ?? null,
      createdAt: new Date(),
    };
    const result = await db.insert(subcategories).values(newSubcategory).returning();
    return result[0];
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
    const conditions = [];

    if (filters?.search) {
      conditions.push(like(products.name, `%${filters.search}%`));
    }

    if (filters?.categoryId) {
      conditions.push(eq(products.categoryId, filters.categoryId));
    }

    if (filters?.subcategoryId) {
      conditions.push(eq(products.subcategoryId, filters.subcategoryId));
    }

    if (filters?.minPrice !== undefined) {
      conditions.push(gte(products.price, filters.minPrice.toString()));
    }

    if (filters?.maxPrice !== undefined) {
      conditions.push(lte(products.price, filters.maxPrice.toString()));
    }

    if (filters?.featured !== undefined) {
      conditions.push(eq(products.featured, filters.featured));
    }

    if (filters?.isDeal !== undefined) {
      conditions.push(eq(products.isDeal, filters.isDeal));
    }

    if (conditions.length > 0) {
      return await db.select()
        .from(products)
        .where(and(...conditions))
        .orderBy(desc(products.createdAt));
    }

    return await db.select()
      .from(products)
      .orderBy(desc(products.createdAt));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0];
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.featured, true));
  }

  async getDealProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.isDeal, true));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const newProduct: Product = {
      id: nanoid(),
      name: product.name,
      description: product.description ?? null,
      price: product.price,
      originalPrice: product.originalPrice ?? null,
      dealPrice: product.dealPrice ?? null,
      categoryId: product.categoryId ?? null,
      subcategoryId: product.subcategoryId ?? null,
      imageUrl: product.imageUrl ?? null,
      images: product.images ?? null,
      featured: product.featured ?? false,
      isDeal: product.isDeal ?? false,
      dealExpiry: product.dealExpiry ?? null,
      inStock: product.inStock ?? true,
      stock: product.stock ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await db.insert(products).values(newProduct).returning();
    return result[0];
  }

  // Cart operations
  async getCartItems(userId: string): Promise<(CartItem & { product: Product })[]> {
    const result = await db
      .select({
        id: cartItems.id,
        userId: cartItems.userId,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        createdAt: cartItems.createdAt,
        product: products,
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId));

    return result.map(row => ({
      id: row.id,
      userId: row.userId,
      productId: row.productId,
      quantity: row.quantity,
      createdAt: row.createdAt,
      product: row.product!,
    }));
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    const newItem: CartItem = {
      id: nanoid(),
      userId: item.userId,
      productId: item.productId,
      quantity: item.quantity ?? null,
      createdAt: new Date(),
    };
    const result = await db.insert(cartItems).values(newItem).returning();
    return result[0];
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem | undefined> {
    const result = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return result[0];
  }

  async removeFromCart(id: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(userId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
  }

  // Wishlist operations
  async getWishlistItems(userId: string): Promise<(WishlistItem & { product: Product })[]> {
    const result = await db
      .select({
        id: wishlistItems.id,
        userId: wishlistItems.userId,
        productId: wishlistItems.productId,
        createdAt: wishlistItems.createdAt,
        product: products,
      })
      .from(wishlistItems)
      .leftJoin(products, eq(wishlistItems.productId, products.id))
      .where(eq(wishlistItems.userId, userId));

    return result.map(row => ({
      id: row.id,
      userId: row.userId,
      productId: row.productId,
      createdAt: row.createdAt,
      product: row.product!,
    }));
  }

  async addToWishlist(item: InsertWishlistItem): Promise<WishlistItem> {
    const newItem: WishlistItem = {
      id: nanoid(),
      ...item,
      createdAt: new Date(),
    };
    const result = await db.insert(wishlistItems).values(newItem).returning();
    return result[0];
  }

  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    await db.delete(wishlistItems).where(
      and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId))
    );
  }

  // Order operations
  async createOrder(order: InsertOrder): Promise<Order> {
    const newOrder: Order = {
      id: nanoid(),
      userId: order.userId,
      total: order.total,
      status: order.status ?? "pending",
      paymentId: order.paymentId ?? null,
      paymentStatus: order.paymentStatus ?? "pending",
      paymentMethod: order.paymentMethod ?? null,
      razorpayOrderId: order.razorpayOrderId ?? null,
      razorpayPaymentId: order.razorpayPaymentId ?? null,
      razorpaySignature: order.razorpaySignature ?? null,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail ?? null,
      shippingAddress: order.shippingAddress,
      pincode: order.pincode,
      trackingId: order.trackingId ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await db.insert(orders).values(newOrder).returning();
    return result[0];
  }

  async addOrderItems(items: InsertOrderItem[]): Promise<OrderItem[]> {
    const newItems = items.map(item => ({
      id: nanoid(),
      ...item,
      createdAt: new Date(),
    }));
    const result = await db.insert(orderItems).values(newItems).returning();
    return result;
  }

  async getOrders(userId: string): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] })[]> {
    const ordersResult = await db.select().from(orders).where(eq(orders.userId, userId));
    
    const ordersWithItems = await Promise.all(
      ordersResult.map(async (order) => {
        const itemsResult = await db
          .select({
            id: orderItems.id,
            orderId: orderItems.orderId,
            productId: orderItems.productId,
            quantity: orderItems.quantity,
            price: orderItems.price,
            createdAt: orderItems.createdAt,
            product: products,
          })
          .from(orderItems)
          .leftJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, order.id));

        return {
          ...order,
          orderItems: itemsResult.map(row => ({
            id: row.id,
            orderId: row.orderId,
            productId: row.productId,
            quantity: row.quantity,
            price: row.price,
            createdAt: row.createdAt,
            product: row.product!,
          })),
        };
      })
    );

    return ordersWithItems;
  }

  async getOrder(id: string): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] }) | undefined> {
    const orderResult = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!orderResult[0]) return undefined;

    const order = orderResult[0];
    const itemsResult = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        createdAt: orderItems.createdAt,
        product: products,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, order.id));

    return {
      ...order,
      orderItems: itemsResult.map(row => ({
        id: row.id,
        orderId: row.orderId,
        productId: row.productId,
        quantity: row.quantity,
        price: row.price,
        createdAt: row.createdAt,
        product: row.product!,
      })),
    };
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const result = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return result[0];
  }

  // Contact operations
  async createContactInquiry(inquiry: InsertContactInquiry): Promise<ContactInquiry> {
    const newInquiry: ContactInquiry = {
      id: nanoid(),
      email: inquiry.email,
      firstName: inquiry.firstName,
      lastName: inquiry.lastName,
      phone: inquiry.phone ?? null,
      message: inquiry.message,
      inquiryType: inquiry.inquiryType,
      status: null,
      createdAt: new Date(),
    };
    const result = await db.insert(contactInquiries).values(newInquiry).returning();
    return result[0];
  }

  // Review operations
  async getProductReviews(productId: string): Promise<ProductReview[]> {
    return await db.select().from(productReviews).where(eq(productReviews.productId, productId));
  }

  async createProductReview(review: InsertProductReview): Promise<ProductReview> {
    const newReview: ProductReview = {
      id: nanoid(),
      productId: review.productId,
      userId: review.userId ?? null,
      userName: review.userName,
      rating: review.rating,
      comment: review.comment,
      images: review.images ?? null,
      isVerified: review.isVerified ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await db.insert(productReviews).values(newReview).returning();
    return result[0];
  }

  // Q&A operations
  async getProductQuestions(productId: string): Promise<ProductQuestion[]> {
    return await db.select().from(productQuestions).where(eq(productQuestions.productId, productId));
  }

  async createProductQuestion(question: InsertProductQuestion): Promise<ProductQuestion> {
    const newQuestion: ProductQuestion = {
      id: nanoid(),
      productId: question.productId,
      userId: question.userId ?? null,
      userName: question.userName,
      userEmail: question.userEmail ?? null,
      question: question.question,
      answer: question.answer ?? null,
      answeredBy: question.answeredBy ?? null,
      answeredAt: question.answeredAt ?? null,
      isPublic: question.isPublic ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await db.insert(productQuestions).values(newQuestion).returning();
    return result[0];
  }

  async updateProductQuestion(id: string, data: Partial<ProductQuestion>): Promise<ProductQuestion | undefined> {
    const result = await db
      .update(productQuestions)
      .set(data)
      .where(eq(productQuestions.id, id))
      .returning();
    return result[0];
  }
}