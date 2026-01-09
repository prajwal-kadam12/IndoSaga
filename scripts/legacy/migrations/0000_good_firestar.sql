-- Use your existing cPanel database
USE `cybaemtechnet_indosagaFurniture`;

-- ==============================
-- USERS
-- ==============================
CREATE TABLE IF NOT EXISTS `users` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `name` VARCHAR(255),
  `first_name` VARCHAR(100),
  `last_name` VARCHAR(100),
  `profile_image_url` VARCHAR(255),
  `password_hash` VARCHAR(255),
  `provider` VARCHAR(50),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO `users` (`email`, `name`, `first_name`, `last_name`, `password_hash`, `provider`)
VALUES 
('john@example.com', 'John Doe', 'John', 'Doe', 'hashed_password', 'local'),
('jane@example.com', 'Jane Smith', 'Jane', 'Smith', 'hashed_password2', 'google');

-- ==============================
-- CATEGORIES
-- ==============================
CREATE TABLE IF NOT EXISTS `categories` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO `categories` (`name`, `description`)
VALUES
('Sofas', 'Comfortable and stylish sofas'),
('Beds', 'King, Queen, and Single beds'),
('Tables', 'Dining and coffee tables');

-- ==============================
-- PRODUCTS
-- ==============================
CREATE TABLE IF NOT EXISTS `products` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(10,2) NOT NULL,
  `original_price` DECIMAL(10,2),
  `category_id` CHAR(36),
  `image_url` VARCHAR(255),
  `images` JSON,
  `in_stock` BOOLEAN DEFAULT TRUE,
  `stock` INT DEFAULT 0,
  `featured` BOOLEAN DEFAULT FALSE,
  `is_deal` BOOLEAN DEFAULT FALSE,
  `deal_price` DECIMAL(10,2),
  `deal_expiry` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `products_category_id_fk` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`)
);

INSERT INTO `products` (`name`, `description`, `price`, `original_price`, `category_id`, `image_url`, `images`, `stock`, `featured`, `is_deal`, `deal_price`)
VALUES
('Luxury Sofa', 'Premium leather sofa', 25000.00, 30000.00, (SELECT id FROM `categories` WHERE name='Sofas' LIMIT 1), 'sofa.jpg', JSON_ARRAY('sofa1.jpg','sofa2.jpg'), 10, TRUE, FALSE, NULL),
('Wooden Bed', 'Solid teak wood bed', 20000.00, 25000.00, (SELECT id FROM `categories` WHERE name='Beds' LIMIT 1), 'bed.jpg', JSON_ARRAY('bed1.jpg','bed2.jpg'), 5, TRUE, TRUE, 18000.00),
('Coffee Table', 'Modern coffee table', 5000.00, 6500.00, (SELECT id FROM `categories` WHERE name='Tables' LIMIT 1), 'table.jpg', JSON_ARRAY('table1.jpg'), 15, FALSE, FALSE, NULL);

-- ==============================
-- CART ITEMS
-- ==============================
CREATE TABLE IF NOT EXISTS `cart_items` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NOT NULL,
  `quantity` INT DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `cart_items_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  CONSTRAINT `cart_items_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)
);

INSERT INTO `cart_items` (`user_id`, `product_id`, `quantity`)
VALUES
((SELECT id FROM `users` WHERE email='john@example.com' LIMIT 1), (SELECT id FROM `products` WHERE name='Luxury Sofa' LIMIT 1), 1),
((SELECT id FROM `users` WHERE email='jane@example.com' LIMIT 1), (SELECT id FROM `products` WHERE name='Wooden Bed' LIMIT 1), 2);

-- ==============================
-- WISHLIST ITEMS
-- ==============================
CREATE TABLE IF NOT EXISTS `wishlist_items` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `wishlist_items_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  CONSTRAINT `wishlist_items_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)
);

INSERT INTO `wishlist_items` (`user_id`, `product_id`)
VALUES
((SELECT id FROM `users` WHERE email='john@example.com' LIMIT 1), (SELECT id FROM `products` WHERE name='Coffee Table' LIMIT 1));

-- ==============================
-- ORDERS
-- ==============================
CREATE TABLE IF NOT EXISTS `orders` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `user_id` CHAR(36) NOT NULL,
  `total` DECIMAL(10,2) NOT NULL,
  `status` VARCHAR(50) DEFAULT 'pending',
  `payment_id` VARCHAR(100),
  `payment_status` VARCHAR(50) DEFAULT 'pending',
  `payment_method` VARCHAR(50),
  `razorpay_order_id` VARCHAR(100),
  `razorpay_payment_id` VARCHAR(100),
  `razorpay_signature` VARCHAR(255),
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_phone` VARCHAR(20) NOT NULL,
  `customer_email` VARCHAR(255),
  `shipping_address` TEXT NOT NULL,
  `pincode` VARCHAR(20) NOT NULL,
  `tracking_id` VARCHAR(100),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `orders_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);

INSERT INTO `orders` (`user_id`, `total`, `status`, `payment_method`, `customer_name`, `customer_phone`, `customer_email`, `shipping_address`, `pincode`)
VALUES
((SELECT id FROM `users` WHERE email='john@example.com' LIMIT 1), 25000.00, 'confirmed', 'COD', 'John Doe', '9876543210', 'john@example.com', '123 Street, City', '400001');

-- ==============================
-- ORDER ITEMS
-- ==============================
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `order_id` CHAR(36) NOT NULL,
  `product_id` CHAR(36) NOT NULL,
  `quantity` INT NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `order_items_order_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`),
  CONSTRAINT `order_items_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`)
);

INSERT INTO `order_items` (`order_id`, `product_id`, `quantity`, `price`)
VALUES
((SELECT id FROM `orders` WHERE customer_name='John Doe' LIMIT 1), (SELECT id FROM `products` WHERE name='Luxury Sofa' LIMIT 1), 1, 25000.00);

-- ==============================
-- CONTACT INQUIRIES
-- ==============================
CREATE TABLE IF NOT EXISTS `contact_inquiries` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20),
  `inquiry_type` VARCHAR(100) NOT NULL,
  `message` TEXT NOT NULL,
  `status` VARCHAR(50) DEFAULT 'new',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO `contact_inquiries` (`first_name`, `last_name`, `email`, `phone`, `inquiry_type`, `message`)
VALUES
('Alice', 'Brown', 'alice@example.com', '9123456780', 'Product Inquiry', 'I want to know more about the Luxury Sofa');

-- ==============================
-- SESSIONS
-- ==============================
CREATE TABLE IF NOT EXISTS `sessions` (
  `sid` VARCHAR(255) PRIMARY KEY,
  `sess` JSON NOT NULL,
  `expire` TIMESTAMP NOT NULL,
  INDEX `IDX_session_expire` (`expire`)
);

INSERT INTO `sessions` (`sid`, `sess`, `expire`)
VALUES
('sess_12345', JSON_OBJECT('user_id', '1', 'role', 'customer'), DATE_ADD(NOW(), INTERVAL 1 DAY));
