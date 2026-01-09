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

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: User): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Subcategory operations
  getSubcategories(categoryId?: string): Promise<Subcategory[]>;
  createSubcategory(subcategory: InsertSubcategory): Promise<Subcategory>;

  // Product operations
  getProducts(filters?: {
    search?: string;
    categoryId?: string;
    subcategoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    featured?: boolean;
    isDeal?: boolean;
  }): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getFeaturedProducts(): Promise<Product[]>;
  getDealProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;

  // Cart operations
  getCartItems(userId: string): Promise<(CartItem & { product: Product })[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: string, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: string): Promise<void>;
  clearCart(userId: string): Promise<void>;

  // Wishlist operations
  getWishlistItems(userId: string): Promise<(WishlistItem & { product: Product })[]>;
  addToWishlist(item: InsertWishlistItem): Promise<WishlistItem>;
  removeFromWishlist(userId: string, productId: string): Promise<void>;

  // Order operations
  createOrder(order: InsertOrder): Promise<Order>;
  addOrderItems(orderItems: InsertOrderItem[]): Promise<OrderItem[]>;
  getOrders(userId: string): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] })[]>;
  getOrder(id: string): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] }) | undefined>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;

  // Contact operations
  createContactInquiry(inquiry: InsertContactInquiry): Promise<ContactInquiry>;

  // Review operations
  getProductReviews(productId: string): Promise<ProductReview[]>;
  createProductReview(review: InsertProductReview): Promise<ProductReview>;

  // Q&A operations
  getProductQuestions(productId: string): Promise<ProductQuestion[]>;
  createProductQuestion(question: InsertProductQuestion): Promise<ProductQuestion>;
  updateProductQuestion(id: string, data: Partial<ProductQuestion>): Promise<ProductQuestion | undefined>;
}

// Use PostgreSQL storage implementation via Drizzle
import { DrizzleStorage } from "./drizzle-storage";

// Initialize storage (will be MySQL if credentials available, otherwise JSON fallback)
let storageInstance: IStorage | null = null;

export const getStorage = async (): Promise<IStorage> => {
  if (!storageInstance) {
    storageInstance = new DrizzleStorage();
  }
  return storageInstance;
};

// Default export as JSONStorage for initial load if needed, 
// though getStorage() is the preferred way.
export const storage = new DrizzleStorage();