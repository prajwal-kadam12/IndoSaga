-- MySQL Schema for IndoSaga Database
-- Optimized version with enhanced features

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR(128) PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP NOT NULL,
  INDEX idx_session_expire (expire)
);

-- Users table with auth fields
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  profile_image_url VARCHAR(512),
  password_hash VARCHAR(255),
  provider VARCHAR(50),
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE,
  date_of_birth DATE NULL,
  gender ENUM('male', 'female', 'other') NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email_verified (email_verified, is_active)
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category_id VARCHAR(36) NOT NULL,
  description TEXT,
  image_url VARCHAR(512),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  INDEX idx_subcategories_category (category_id)
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL,
  original_price DECIMAL(12,2),
  category_id VARCHAR(36),
  subcategory_id VARCHAR(36),
  image_url VARCHAR(512),
  images JSON,
  in_stock BOOLEAN DEFAULT TRUE,
  stock INT DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  is_deal BOOLEAN DEFAULT FALSE,
  deal_price DECIMAL(12,2),
  deal_expiry TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL,
  INDEX idx_products_category (category_id),
  INDEX idx_products_subcategory (subcategory_id),
  INDEX idx_products_featured (featured),
  INDEX idx_products_deal (is_deal),
  INDEX idx_products_price (price),
  INDEX idx_products_stock (stock, in_stock)
);

-- Product variations table for size/color options
CREATE TABLE IF NOT EXISTS product_variations (
  id VARCHAR(36) PRIMARY KEY,
  product_id VARCHAR(36) NOT NULL,
  sku VARCHAR(100) UNIQUE,
  size VARCHAR(50),
  color VARCHAR(50),
  material VARCHAR(100),
  stock INT DEFAULT 0,
  price_adjustment DECIMAL(10,2) DEFAULT 0,
  image_url VARCHAR(512),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_variations_product (product_id),
  INDEX idx_product_variations_sku (sku)
);

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36) NOT NULL,
  variation_id VARCHAR(36),
  quantity INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (variation_id) REFERENCES product_variations(id) ON DELETE CASCADE,
  INDEX idx_cart_items_user (user_id),
  INDEX idx_cart_items_product (product_id)
);

-- Wishlist items table
CREATE TABLE IF NOT EXISTS wishlist_items (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_wishlist_items_user (user_id),
  INDEX idx_wishlist_items_product (product_id),
  UNIQUE KEY unique_user_product_wishlist (user_id, product_id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  payment_id VARCHAR(100),
  payment_status VARCHAR(20) DEFAULT 'pending',
  payment_method VARCHAR(20),
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  razorpay_signature VARCHAR(255),
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),
  shipping_address TEXT NOT NULL,
  shipping_method VARCHAR(50),
  pincode VARCHAR(10) NOT NULL,
  tracking_id VARCHAR(100),
  estimated_delivery DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_status (status),
  INDEX idx_orders_payment_status (payment_status),
  INDEX idx_orders_created (created_at),
  INDEX idx_orders_payment (payment_status, status),
  CONSTRAINT chk_status_values CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  CONSTRAINT chk_payment_status_values CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'))
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36) NOT NULL,
  variation_id VARCHAR(36),
  quantity INT NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (variation_id) REFERENCES product_variations(id) ON DELETE SET NULL,
  INDEX idx_order_items_order (order_id),
  INDEX idx_order_items_product (product_id)
);

-- Order notes/history table
CREATE TABLE IF NOT EXISTS order_notes (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL,
  note TEXT NOT NULL,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order_notes_order (order_id)
);

-- Support tickets table for helpdesk
CREATE TABLE IF NOT EXISTS support_tickets (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'open',
  priority VARCHAR(10) DEFAULT 'medium',
  assigned_to VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_support_tickets_user (user_id),
  INDEX idx_support_tickets_status (status)
);

-- Appointments table for virtual meetings
CREATE TABLE IF NOT EXISTS appointments (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  appointment_date TIMESTAMP NOT NULL,
  duration INT DEFAULT 30,
  meeting_type VARCHAR(30) DEFAULT 'virtual_showroom',
  status VARCHAR(20) DEFAULT 'scheduled',
  meeting_link VARCHAR(512),
  meeting_id VARCHAR(100),
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_appointments_user (user_id),
  INDEX idx_appointments_date (appointment_date),
  INDEX idx_appointments_status (status)
);

-- Contact inquiries table
CREATE TABLE IF NOT EXISTS contact_inquiries (
  id VARCHAR(36) PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  inquiry_type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
  id VARCHAR(36) PRIMARY KEY,
  product_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36),
  user_name VARCHAR(255) NOT NULL,
  rating INT NOT NULL,
  comment TEXT NOT NULL,
  images JSON,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_product_reviews_product (product_id),
  INDEX idx_product_reviews_user (user_id),
  INDEX idx_reviews_rating (rating, product_id),
  CONSTRAINT chk_rating_range CHECK (rating BETWEEN 1 AND 5)
);

-- Product Q&A table
CREATE TABLE IF NOT EXISTS product_questions (
  id VARCHAR(36) PRIMARY KEY,
  product_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36),
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255),
  question TEXT NOT NULL,
  answer TEXT,
  answered_by VARCHAR(255),
  answered_at TIMESTAMP,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_product_questions_product (product_id),
  INDEX idx_product_questions_user (user_id)
);

-- Inventory tracking
CREATE TABLE IF NOT EXISTS inventory_logs (
  id VARCHAR(36) PRIMARY KEY,
  product_id VARCHAR(36) NOT NULL,
  variation_id VARCHAR(36),
  change_amount INT NOT NULL,
  new_stock_level INT NOT NULL,
  reason VARCHAR(255),
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (variation_id) REFERENCES product_variations(id) ON DELETE CASCADE,
  INDEX idx_inventory_logs_product (product_id)
);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_password_tokens_token (token),
  INDEX idx_password_tokens_user (user_id)
);

-- Email verification tokens
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_email_tokens_token (token),
  INDEX idx_email_tokens_user (user_id)
);

-- Audit log table for critical operations
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  record_id VARCHAR(36),
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_logs_user (user_id),
  INDEX idx_audit_logs_action (action),
  INDEX idx_audit_logs_table (table_name)
);
