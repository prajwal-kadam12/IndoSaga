-- IndoSaga NeonDB (PostgreSQL) Setup Script

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tables

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    sid varchar PRIMARY KEY,
    sess jsonb NOT NULL,
    expire timestamp NOT NULL
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions (expire);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id varchar PRIMARY KEY,
    email varchar UNIQUE NOT NULL,
    name varchar,
    first_name varchar,
    last_name varchar,
    phone varchar,
    address text,
    profile_image_url varchar,
    password_hash varchar,
    provider varchar,
    created_at timestamp DEFAULT NOW(),
    updated_at timestamp DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar NOT NULL,
    description text,
    created_at timestamp DEFAULT NOW()
);

-- Subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar NOT NULL,
    category_id varchar NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    description text,
    image_url varchar,
    created_at timestamp DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar NOT NULL,
    description text,
    price decimal(10, 2) NOT NULL,
    original_price decimal(10, 2),
    category_id varchar REFERENCES categories(id) ON DELETE SET NULL,
    subcategory_id varchar REFERENCES subcategories(id) ON DELETE SET NULL,
    image_url varchar,
    images text[], -- PostgreSQL array type
    in_stock boolean DEFAULT true,
    stock integer DEFAULT 0,
    featured boolean DEFAULT false,
    is_deal boolean DEFAULT false,
    deal_price decimal(10, 2),
    deal_expiry timestamp,
    created_at timestamp DEFAULT NOW(),
    updated_at timestamp DEFAULT NOW()
);

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id varchar NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity integer DEFAULT 1,
    created_at timestamp DEFAULT NOW()
);

-- Wishlist items table
CREATE TABLE IF NOT EXISTS wishlist_items (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id varchar NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at timestamp DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total decimal(10, 2) NOT NULL,
    status varchar DEFAULT 'pending',
    payment_id varchar,
    payment_status varchar DEFAULT 'pending',
    payment_method varchar,
    razorpay_order_id varchar,
    razorpay_payment_id varchar,
    razorpay_signature varchar,
    customer_name varchar NOT NULL,
    customer_phone varchar NOT NULL,
    customer_email varchar,
    shipping_address text NOT NULL,
    pincode varchar NOT NULL,
    tracking_id varchar,
    created_at timestamp DEFAULT NOW(),
    updated_at timestamp DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id varchar NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id varchar NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity integer NOT NULL,
    price decimal(10, 2) NOT NULL,
    created_at timestamp DEFAULT NOW()
);

-- Support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar REFERENCES users(id) ON DELETE SET NULL,
    customer_name varchar NOT NULL,
    customer_email varchar NOT NULL,
    customer_phone varchar,
    subject varchar NOT NULL,
    message text NOT NULL,
    status varchar DEFAULT 'open',
    priority varchar DEFAULT 'medium',
    assigned_to varchar,
    created_at timestamp DEFAULT NOW(),
    updated_at timestamp DEFAULT NOW()
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id varchar REFERENCES users(id) ON DELETE SET NULL,
    customer_name varchar NOT NULL,
    customer_email varchar NOT NULL,
    customer_phone varchar NOT NULL,
    appointment_date timestamp NOT NULL,
    duration integer DEFAULT 30,
    meeting_type varchar DEFAULT 'virtual_showroom',
    status varchar DEFAULT 'scheduled',
    meeting_link varchar,
    meeting_id varchar,
    notes text,
    reminder_sent boolean DEFAULT false,
    created_at timestamp DEFAULT NOW(),
    updated_at timestamp DEFAULT NOW()
);

-- Contact inquiries table
CREATE TABLE IF NOT EXISTS contact_inquiries (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name varchar NOT NULL,
    last_name varchar NOT NULL,
    email varchar NOT NULL,
    phone varchar,
    inquiry_type varchar NOT NULL,
    message text NOT NULL,
    status varchar DEFAULT 'new',
    created_at timestamp DEFAULT NOW()
);

-- Product reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id varchar NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id varchar REFERENCES users(id) ON DELETE SET NULL,
    user_name varchar NOT NULL,
    rating integer NOT NULL,
    comment text NOT NULL,
    images text[],
    is_verified boolean DEFAULT false,
    created_at timestamp DEFAULT NOW(),
    updated_at timestamp DEFAULT NOW()
);

-- Product Q&A table
CREATE TABLE IF NOT EXISTS product_questions (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id varchar NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id varchar REFERENCES users(id) ON DELETE SET NULL,
    user_name varchar NOT NULL,
    user_email varchar,
    question text NOT NULL,
    answer text,
    answered_by varchar,
    answered_at timestamp,
    is_public boolean DEFAULT true,
    created_at timestamp DEFAULT NOW(),
    updated_at timestamp DEFAULT NOW()
);

-- 3. Seed Data (Manual IDs for relations)

-- Categories
INSERT INTO categories (id, name, description) VALUES
('2e28cd03-79c6-48f4-9d0b-2e54df7be807', 'Dining Tables', 'Premium teak dining tables for your family'),
('12ddde7c-df69-4520-a271-33ff87271f61', 'Chairs', 'Comfortable and elegant teak chairs'),
('f87d2687-bc99-4378-9dcf-462af881a51b', 'Wardrobes', 'Spacious teak wardrobes for storage'),
('f44afe1f-1018-4c6c-9fd2-05959bbe41ab', 'Beds', 'Luxurious teak beds for ultimate comfort'),
('4f51b3f6-d533-46bb-be7f-6158ee2e7203', 'Sofas', 'Stylish teak sofas for your living room'),
('24b2ab4d-890c-4634-b1a5-203c373c6a78', 'Cabinets', 'Functional teak cabinets for organization')
ON CONFLICT (id) DO NOTHING;

-- Subcategories
INSERT INTO subcategories (id, name, category_id, description, image_url) VALUES
('9adf3fea-40e6-492d-882c-a290ab640d0f', '4-Seater Tables', '2e28cd03-79c6-48f4-9d0b-2e54df7be807', 'Perfect for small families', '/images/dining-table.webp'),
('55d0964a-d461-4572-891d-90f1dd6d0d6b', '6-Seater Tables', '2e28cd03-79c6-48f4-9d0b-2e54df7be807', 'Ideal for medium families', '/images/dining-table.webp'),
('215428a9-ede4-4106-96b2-b7b31ed3ddbb', '8-Seater Tables', '2e28cd03-79c6-48f4-9d0b-2e54df7be807', 'Great for large families', '/images/dining-table.webp'),
('0d810bbb-6e7c-480c-a176-cabbd31cc3ae', 'Round Tables', '2e28cd03-79c6-48f4-9d0b-2e54df7be807', 'Classic round dining tables', '/images/dining-table.webp'),
('d6412d29-0372-4036-8bd1-b731307e4b71', 'Rectangular Tables', '2e28cd03-79c6-48f4-9d0b-2e54df7be807', 'Traditional rectangular designs', '/images/dining-table.webp'),
('5f189a96-16a6-4886-9291-94d08eab5402', 'Dining Chairs', '12ddde7c-df69-4520-a271-33ff87271f61', 'Comfortable dining chairs', '/images/chair-set.jpg'),
('6768b387-f08d-4b69-9749-b05b8016dfe5', 'Office Chairs', '12ddde7c-df69-4520-a271-33ff87271f61', 'Ergonomic office chairs', '/images/modern-chairs.webp'),
('ef49e3bb-7ca4-4b15-a2b6-2dceda2d85f3', 'Lounge Chairs', '12ddde7c-df69-4520-a271-33ff87271f61', 'Relaxing lounge chairs', '/images/chair-set.jpg'),
('a435a5e3-d3c5-4d77-9ada-461cd12a60af', 'Bar Stools', '12ddde7c-df69-4520-a271-33ff87271f61', 'Stylish bar stools', '/images/chair-set.jpg'),
('90a2a824-3f46-4c49-be71-1439efb20cdb', 'Rocking Chairs', '12ddde7c-df69-4520-a271-33ff87271f61', 'Traditional rocking chairs', '/images/chair-set.jpg'),
('0c6cd80a-197e-4044-8d48-9e0f2908f215', '2-Door Wardrobes', 'f87d2687-bc99-4378-9dcf-462af881a51b', 'Compact 2-door designs', '/images/wardrobe.webp'),
('029d3af2-fcde-475d-8588-199d70ce2f8d', '3-Door Wardrobes', 'f87d2687-bc99-4378-9dcf-462af881a51b', 'Medium 3-door wardrobes', '/images/wardrobe.webp'),
('009d8196-db3b-438d-a55a-946c5e353fac', '4-Door Wardrobes', 'f87d2687-bc99-4378-9dcf-462af881a51b', 'Large 4-door wardrobes', '/images/wardrobe.webp'),
('c71cc48c-590c-4d0d-8ea5-4c973117935e', 'Walk-in Closets', 'f87d2687-bc99-4378-9dcf-462af881a51b', 'Luxury walk-in wardrobes', '/images/wardrobe.webp'),
('0cbde92d-2694-4c2f-a7aa-da7de41997d4', 'Kids Wardrobes', 'f87d2687-bc99-4378-9dcf-462af881a51b', 'Child-friendly designs', '/images/wardrobe.webp'),
('3e5768f7-744e-417a-8f8d-b9d32defaa5b', 'Single Beds', 'f44afe1f-1018-4c6c-9fd2-05959bbe41ab', 'Compact single beds', '/images/bed.jpg'),
('862ba24a-bcae-46ef-bb91-e9ca5661f773', 'Double Beds', 'f44afe1f-1018-4c6c-9fd2-05959bbe41ab', 'Comfortable double beds', '/images/bed.jpg'),
('782e0637-2bde-4afb-aba3-edd7a5496359', 'Queen Size', 'f44afe1f-1018-4c6c-9fd2-05959bbe41ab', 'Spacious queen beds', '/images/bed.jpg'),
('9bf221d4-9db1-4f76-98ee-cb7c460510f0', 'King Size', 'f44afe1f-1018-4c6c-9fd2-05959bbe41ab', 'Luxurious king beds', '/images/bed.jpg'),
('425954dd-4adb-417e-aceb-4b4051103d36', 'Storage Beds', 'f44afe1f-1018-4c6c-9fd2-05959bbe41ab', 'Beds with storage', '/images/bed.jpg'),
('e4a9a884-d824-498f-aa3c-ffd35ca8fa34', '2-Seater Sofas', '4f51b3f6-d533-46bb-be7f-6158ee2e7203', 'Compact 2-seater sofas', '/images/sofa.jpg'),
('c6eea840-1db8-4759-b84f-4de4cec65774', '3-Seater Sofas', '4f51b3f6-d533-46bb-be7f-6158ee2e7203', 'Standard 3-seater sofas', '/images/sofa.jpg'),
('94e2d640-3f92-4dd7-aa61-ab0d4e75492e', 'L-Shaped Sofas', '4f51b3f6-d533-46bb-be7f-6158ee2e7203', 'Corner L-shaped sofas', '/images/sofa.jpg'),
('735ea94c-6184-4ae0-bb66-6d29c3636f29', 'Sectional Sofas', '4f51b3f6-d533-46bb-be7f-6158ee2e7203', 'Modular sectional sofas', '/images/living-room-set.jpg'),
('c0c3950d-26f8-420a-a698-008a5a2339a8', 'Recliners', '4f51b3f6-d533-46bb-be7f-6158ee2e7203', 'Comfortable recliner chairs', '/images/jhula.jpg'),
('5a0eec33-a517-4676-bd43-201fb8ea2ac4', 'TV Units', '24b2ab4d-890c-4634-b1a5-203c373c6a78', 'Entertainment TV units', '/images/wardrobe.webp'),
('22cda264-dae2-414a-b0f9-8f460c8cdb3a', 'Pooja Ghar', '24b2ab4d-890c-4634-b1a5-203c373c6a78', 'Traditional prayer units', '/images/pooja-ghar.jpg'),
('e94460e0-2d5c-4062-b079-b872b31ea03f', 'Storage Cabinets', '24b2ab4d-890c-4634-b1a5-203c373c6a78', 'General storage cabinets', '/images/wardrobe.webp'),
('584c8741-9ec3-4867-b8f5-e6a0567311c7', 'Display Units', '24b2ab4d-890c-4634-b1a5-203c373c6a78', 'Decorative display cabinets', '/images/wardrobe.webp'),
('1cc83f19-74b2-4c55-a002-6b8f4071d60e', 'Kitchen Cabinets', '24b2ab4d-890c-4634-b1a5-203c373c6a78', 'Kitchen storage solutions', '/images/wardrobe.webp')
ON CONFLICT (id) DO NOTHING;

-- Products
INSERT INTO products (id, name, description, price, original_price, category_id, subcategory_id, image_url, images, in_stock, stock, featured, is_deal, deal_price, deal_expiry) VALUES
('0a28e281-c3c2-4866-8ee7-ce71d396fc18', 'Royal Maharaja Dining Table', 'Exquisite 8-seater solid teak dining table with hand-carved traditional motifs and brass inlays', 75000.00, 95000.00, '2e28cd03-79c6-48f4-9d0b-2e54df7be807', '215428a9-ede4-4106-96b2-b7b31ed3ddbb', '/images/dining-table.webp', ARRAY[]::text[], true, 3, true, false, NULL, NULL),
('28118e46-c637-44bb-bdac-bfe3ab846906', 'Premium Teak Chair Set', 'Elegant set of 6 solid teak dining chairs with traditional design and comfortable cushioning', 48000.00, 62000.00, '12ddde7c-df69-4520-a271-33ff87271f61', '5f189a96-16a6-4886-9291-94d08eab5402', '/images/chair-set.jpg', ARRAY[]::text[], true, 8, true, false, NULL, NULL),
('e1bd8d6c-4344-46e5-908e-2f0a78583d91', 'Emperor Teak Wardrobe', 'Magnificent 4-door solid teak wardrobe with mirror, drawers and premium brass fittings', 85000.00, 110000.00, 'f87d2687-bc99-4378-9dcf-462af881a51b', '009d8196-db3b-438d-a55a-946c5e353fac', '/images/wardrobe.webp', ARRAY[]::text[], true, 2, true, false, NULL, NULL),
('3f5edf87-e1a3-49a9-a9f2-183bc90b940d', 'Royal King Size Teak Bed', 'Luxurious king size solid teak bed with storage compartments and intricate headboard design', 95000.00, 125000.00, 'f44afe1f-1018-4c6c-9fd2-05959bbe41ab', '9bf221d4-9db1-4f76-98ee-cb7c460510f0', '/images/bed.jpg', ARRAY[]::text[], true, 2, true, false, NULL, NULL),
('239c5e5e-994d-48c3-b238-ad00b65bd127', 'Imperial Teak Sofa', 'Elegant solid teak sofa with premium fabric upholstery and traditional design', 85000.00, 105000.00, '4f51b3f6-d533-46bb-be7f-6158ee2e7203', 'c6eea840-1db8-4759-b84f-4de4cec65774', '/images/sofa.jpg', ARRAY[]::text[], true, 3, true, false, NULL, NULL),
('43fd2413-6d62-47f7-abb6-909d07752c01', 'Heritage Teak Pooja Ghar', 'Traditional solid teak pooja mandir with intricate carvings and storage compartments', 58000.00, 72000.00, '24b2ab4d-890c-4634-b1a5-203c373c6a78', '22cda264-dae2-414a-b0f9-8f460c8cdb3a', '/images/pooja-ghar.jpg', ARRAY[]::text[], true, 5, true, false, NULL, NULL),
('239ee9ac-b237-4e8b-9d42-1d38a02ec2b1', 'Modern Teak Chairs - Flash Deal', 'Set of 2 modern solid teak chairs with ergonomic design - Limited time ₹1 deal!', 25000.00, 32000.00, '12ddde7c-df69-4520-a271-33ff87271f61', '6768b387-f08d-4b69-9749-b05b8016dfe5', '/images/modern-chairs.webp', ARRAY[]::text[], true, 15, false, true, 1.00, '2025-09-10 09:14:47'),
('cbbb9a9c-512f-490c-8c18-560f53f1d938', 'Teak Temple - ₹1 Deal', 'Beautiful solid teak temple for home worship - Incredible ₹1 flash sale!', 35000.00, 45000.00, '24b2ab4d-890c-4634-b1a5-203c373c6a78', '22cda264-dae2-414a-b0f9-8f460c8cdb3a', '/images/temple-pooja.jpg', ARRAY[]::text[], true, 8, false, true, 1.00, '2025-09-10 09:14:47'),
('68fede8c-fcec-4389-ae89-fa5d2dcc123c', 'Traditional Jhula - Flash Sale', 'Handcrafted solid teak jhula swing for garden or porch - Unbelievable ₹1 deal!', 45000.00, 58000.00, '4f51b3f6-d533-46bb-be7f-6158ee2e7203', 'c0c3950d-26f8-420a-a698-008a5a2339a8', '/images/jhula.jpg', ARRAY[]::text[], true, 12, false, true, 1.00, '2025-09-10 09:14:47'),
('2b38a46e-0d45-4e8b-8552-a71a15be4004', 'Complete Living Room Set', 'Comprehensive solid teak living room furniture set including sofa, center table, and side tables', 185000.00, 225000.00, '4f51b3f6-d533-46bb-be7f-6158ee2e7203', '735ea94c-6184-4ae0-bb66-6d29c3636f29', '/images/living-room-set.jpg', ARRAY[]::text[], true, 2, false, false, NULL, NULL),
('b1167401-344e-4996-b128-6f8518c8d8a2', 'Classic Teak Dining Table', 'Spacious 6-seater solid teak dining table perfect for family meals and gatherings', 55000.00, 68000.00, '2e28cd03-79c6-48f4-9d0b-2e54df7be807', '55d0964a-d461-4572-891d-90f1dd6d0d6b', '/images/dining-table.webp', ARRAY[]::text[], true, 6, false, false, NULL, NULL),
('43af7a21-af5c-4351-acde-bcbde3f3ac9b', 'Ergonomic Chair Set of 4', 'Set of 4 comfortable solid teak chairs with ergonomic design for dining or office use', 32000.00, 40000.00, '12ddde7c-df69-4520-a271-33ff87271f61', '5f189a96-16a6-4886-9291-94d08eab5402', '/images/chair-set.jpg', ARRAY[]::text[], true, 10, false, false, NULL, NULL),
('05f31843-547c-4c03-aa78-65b1ac4f974d', 'Spacious Teak Wardrobe', 'Large solid teak wardrobe with multiple compartments, hanging space, and mirror', 72000.00, 88000.00, 'f87d2687-bc99-4378-9dcf-462af881a51b', '029d3af2-fcde-475d-8588-199d70ce2f8d', '/images/wardrobe.webp', ARRAY[]::text[], true, 4, false, false, NULL, NULL),
('0fe228de-9baa-4570-816b-0347ef6ad84f', 'Queen Size Teak Bed', 'Elegant queen size solid teak bed with modern design and storage options', 68000.00, 82000.00, 'f44afe1f-1018-4c6c-9fd2-05959bbe41ab', '782e0637-2bde-4afb-aba3-edd7a5496359', '/images/bed.jpg', ARRAY[]::text[], true, 5, false, false, NULL, NULL),
('94c25d13-90df-4337-a110-d001ed38a583', 'Comfortable Teak Sofa', 'Premium 3-seater solid teak sofa with high-quality fabric upholstery', 65000.00, 78000.00, '4f51b3f6-d533-46bb-be7f-6158ee2e7203', 'c6eea840-1db8-4759-b84f-4de4cec65774', '/images/sofa.jpg', ARRAY[]::text[], true, 7, false, false, NULL, NULL),
('2654cfe2-60ba-4181-a4e5-0412e201733e', 'Traditional Pooja Cabinet', 'Compact solid teak pooja cabinet with traditional carvings and storage', 38000.00, 48000.00, '24b2ab4d-890c-4634-b1a5-203c373c6a78', '22cda264-dae2-414a-b0f9-8f460c8cdb3a', '/images/pooja-ghar.jpg', ARRAY[]::text[], true, 12, false, false, NULL, NULL),
('222cd45c-08ab-4d1e-80ae-31702e09903a', 'Modern Designer Chairs', 'Contemporary solid teak chairs with sleek design perfect for modern homes', 28000.00, 35000.00, '12ddde7c-df69-4520-a271-33ff87271f61', '6768b387-f08d-4b69-9749-b05b8016dfe5', '/images/modern-chairs.webp', ARRAY[]::text[], true, 15, false, false, NULL, NULL),
('e0e7820d-b8a0-42e8-9e52-e57c40a26503', 'Garden Teak Jhula', 'Beautiful handcrafted solid teak swing perfect for garden or balcony relaxation', 42000.00, 52000.00, '4f51b3f6-d533-46bb-be7f-6158ee2e7203', 'c0c3950d-26f8-420a-a698-008a5a2339a8', '/images/jhula.jpg', ARRAY[]::text[], true, 8, false, false, NULL, NULL),
('27591a88-4c87-41d8-87a9-84c9e77e08d2', 'Sacred Temple Unit', 'Beautiful handcrafted solid teak temple unit with intricate religious carvings', 52000.00, 65000.00, '24b2ab4d-890c-4634-b1a5-203c373c6a78', '22cda264-dae2-414a-b0f9-8f460c8cdb3a', '/images/temple-pooja.jpg', ARRAY[]::text[], true, 6, false, false, NULL, NULL)
ON CONFLICT (id) DO NOTHING;
