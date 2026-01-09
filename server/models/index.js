/**
 * Database Models for the 5 required tables
 * Based on existing MySQL schema structure
 */

// Product Questions Model
export const ProductQuestion = {
  tableName: 'product_questions',
  fields: {
    id: 'VARCHAR(36) PRIMARY KEY',
    product_id: 'VARCHAR(36) NOT NULL',
    user_id: 'VARCHAR(36)',
    user_name: 'VARCHAR(255) NOT NULL',
    user_email: 'VARCHAR(255)',
    question: 'TEXT NOT NULL',
    answer: 'TEXT',
    answered_by: 'VARCHAR(255)',
    answered_at: 'TIMESTAMP',
    is_public: 'BOOLEAN DEFAULT TRUE',
    created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
  }
};

// Product Reviews Model
export const ProductReview = {
  tableName: 'product_reviews',
  fields: {
    id: 'VARCHAR(36) PRIMARY KEY',
    product_id: 'VARCHAR(36) NOT NULL',
    user_id: 'VARCHAR(36)',
    user_name: 'VARCHAR(255) NOT NULL',
    rating: 'INT NOT NULL',
    comment: 'TEXT NOT NULL',
    images: 'JSON',
    is_verified: 'BOOLEAN DEFAULT FALSE',
    created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
  }
};

// Orders Model
export const Order = {
  tableName: 'orders',
  fields: {
    id: 'VARCHAR(36) PRIMARY KEY',
    user_id: 'VARCHAR(36) NOT NULL',
    total: 'DECIMAL(10,2) NOT NULL',
    status: 'VARCHAR(50) DEFAULT "pending"',
    payment_id: 'VARCHAR(255)',
    payment_status: 'VARCHAR(50) DEFAULT "pending"',
    payment_method: 'VARCHAR(50)',
    razorpay_order_id: 'VARCHAR(255)',
    razorpay_payment_id: 'VARCHAR(255)',
    razorpay_signature: 'VARCHAR(255)',
    customer_name: 'VARCHAR(255) NOT NULL',
    customer_phone: 'VARCHAR(20) NOT NULL',
    customer_email: 'VARCHAR(255)',
    shipping_address: 'TEXT NOT NULL',
    pincode: 'VARCHAR(10) NOT NULL',
    tracking_id: 'VARCHAR(255)',
    created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
  }
};

// Order Items Model
export const OrderItem = {
  tableName: 'order_items',
  fields: {
    id: 'VARCHAR(36) PRIMARY KEY',
    order_id: 'VARCHAR(36) NOT NULL',
    product_id: 'VARCHAR(36) NOT NULL',
    quantity: 'INT NOT NULL',
    price: 'DECIMAL(10,2) NOT NULL',
    created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
  }
};

// Payments Model (extracted from orders table payment fields)
export const Payment = {
  tableName: 'payments',
  fields: {
    id: 'VARCHAR(36) PRIMARY KEY',
    order_id: 'VARCHAR(36) NOT NULL',
    user_id: 'VARCHAR(36) NOT NULL',
    amount: 'DECIMAL(10,2) NOT NULL',
    currency: 'VARCHAR(10) DEFAULT "INR"',
    status: 'VARCHAR(50) DEFAULT "pending"',
    method: 'VARCHAR(50)',
    razorpay_order_id: 'VARCHAR(255)',
    razorpay_payment_id: 'VARCHAR(255)',
    razorpay_signature: 'VARCHAR(255)',
    gateway_response: 'JSON',
    created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
  }
};

// Helper function to generate UUID
export const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};