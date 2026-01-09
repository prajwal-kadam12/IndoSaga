/**
 * API Configuration for IndoSaga Frontend
 * Switch between Node.js and PHP backends
 */

// API Backend Configuration
export const API_CONFIG = {
  // Set to 'php' to use PHP backend, 'nodejs' for Node.js backend
  BACKEND_TYPE: 'nodejs' as 'php' | 'nodejs',
  
  // Base URLs for different backends
  BASE_URLS: {
    php: '/api',
    nodejs: '/api'
  },
  
  // Get the current base URL based on backend type
  get BASE_URL() {
    return this.BASE_URLS[this.BACKEND_TYPE];
  },
  
  // API endpoints
  ENDPOINTS: {
    // Authentication
    AUTH_ME: '/auth/me',
    AUTH_SYNC: '/auth/sync',
    AUTH_LOGOUT: '/auth/logout',
    AUTH_PROFILE: '/auth/profile',
    
    // Products
    PRODUCTS: '/products',
    PRODUCTS_FEATURED: '/products/featured',
    PRODUCTS_DEALS: '/products/deals',
    PRODUCT_BY_ID: (id: string) => `/products/${id}`,
    PRODUCT_REVIEWS: (id: string) => `/products/${id}/reviews`,
    PRODUCT_QUESTIONS: (id: string) => `/products/${id}/questions`,
    
    // Categories
    CATEGORIES: '/categories',
    SUBCATEGORIES: '/subcategories',
    
    // Cart & Wishlist
    CART: '/cart',
    WISHLIST: '/wishlist',
    
    // Orders
    ORDERS: '/orders',
    ORDER_BY_ID: (id: string) => `/orders/${id}`,
    ORDER_CANCEL: (id: string) => `/orders/${id}/cancel`,
    ORDERS_DIRECT_CHECKOUT: '/orders/direct-checkout',
    
    // Payment
    PAYMENT_CONFIG: '/payment/config',
    CREATE_RAZORPAY_ORDER: '/create-razorpay-order',
    VERIFY_RAZORPAY_PAYMENT: '/verify-razorpay-payment',
    
    // Communication
    CONTACT: '/contact',
    APPOINTMENTS: '/appointments',
    SUPPORT_TICKETS: '/support/tickets',
    VIDEO_CALL_START: '/video-call/start',
  }
};

// Helper function to build full API URL
export function buildApiUrl(endpoint: string): string {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}

// Helper function for API requests with proper error handling
export async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const url = buildApiUrl(endpoint);
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include cookies for session management
    ...options,
  };
  
  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API Request failed for ${endpoint}:`, error);
    throw error;
  }
}

// Specific API methods for common operations
export const api = {
  // Authentication
  getAuthStatus: () => apiRequest(API_CONFIG.ENDPOINTS.AUTH_ME),
  syncAuth: (userData: any, localCartItems: any[] = []) => 
    apiRequest(API_CONFIG.ENDPOINTS.AUTH_SYNC, {
      method: 'POST',
      body: JSON.stringify({ user: userData, localCartItems }),
    }),
  logout: () => apiRequest(API_CONFIG.ENDPOINTS.AUTH_LOGOUT, { method: 'POST' }),
  updateProfile: (profileData: any) =>
    apiRequest(API_CONFIG.ENDPOINTS.AUTH_PROFILE, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),
  
  // Products
  getProducts: (filters: any = {}) => {
    const params = new URLSearchParams(filters);
    return apiRequest(`${API_CONFIG.ENDPOINTS.PRODUCTS}?${params}`);
  },
  getFeaturedProducts: () => apiRequest(API_CONFIG.ENDPOINTS.PRODUCTS_FEATURED),
  getDealProducts: () => apiRequest(API_CONFIG.ENDPOINTS.PRODUCTS_DEALS),
  getProduct: (id: string) => apiRequest(API_CONFIG.ENDPOINTS.PRODUCT_BY_ID(id)),
  
  // Categories
  getCategories: () => apiRequest(API_CONFIG.ENDPOINTS.CATEGORIES),
  getSubcategories: (categoryId?: string) => {
    const params = categoryId ? `?categoryId=${categoryId}` : '';
    return apiRequest(`${API_CONFIG.ENDPOINTS.SUBCATEGORIES}${params}`);
  },
  
  // Cart
  getCart: () => apiRequest(API_CONFIG.ENDPOINTS.CART),
  addToCart: (cartData: any) =>
    apiRequest(API_CONFIG.ENDPOINTS.CART, {
      method: 'POST',
      body: JSON.stringify(cartData),
    }),
  updateCart: (cartData: any) =>
    apiRequest(API_CONFIG.ENDPOINTS.CART, {
      method: 'PUT',
      body: JSON.stringify(cartData),
    }),
  removeFromCart: (cartItemId: string) =>
    apiRequest(`${API_CONFIG.ENDPOINTS.CART}?cartItemId=${cartItemId}`, {
      method: 'DELETE',
    }),
  
  // Wishlist
  getWishlist: () => apiRequest(API_CONFIG.ENDPOINTS.WISHLIST),
  addToWishlist: (wishlistData: any) =>
    apiRequest(API_CONFIG.ENDPOINTS.WISHLIST, {
      method: 'POST',
      body: JSON.stringify(wishlistData),
    }),
  removeFromWishlist: (productId: string) =>
    apiRequest(`${API_CONFIG.ENDPOINTS.WISHLIST}?productId=${productId}`, {
      method: 'DELETE',
    }),
  
  // Orders
  getOrders: () => apiRequest(API_CONFIG.ENDPOINTS.ORDERS),
  createOrder: (orderData: any) =>
    apiRequest(API_CONFIG.ENDPOINTS.ORDERS, {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),
  getOrder: (id: string) => apiRequest(API_CONFIG.ENDPOINTS.ORDER_BY_ID(id)),
  
  // Payment
  getPaymentConfig: () => apiRequest(API_CONFIG.ENDPOINTS.PAYMENT_CONFIG),
  createRazorpayOrder: (orderData: any) =>
    apiRequest(API_CONFIG.ENDPOINTS.CREATE_RAZORPAY_ORDER, {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),
  
  // Communication
  submitContact: (contactData: any) =>
    apiRequest(API_CONFIG.ENDPOINTS.CONTACT, {
      method: 'POST',
      body: JSON.stringify(contactData),
    }),
  bookAppointment: (appointmentData: any) =>
    apiRequest(API_CONFIG.ENDPOINTS.APPOINTMENTS, {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    }),
};

export default api;