-- IndoSaga Database Seed Data
-- Insert initial data for categories, subcategories, and products

-- Clear existing data (optional - uncomment if needed)
-- DELETE FROM order_items;
-- DELETE FROM orders;
-- DELETE FROM cart_items;
-- DELETE FROM wishlist_items;
-- DELETE FROM product_reviews;
-- DELETE FROM product_questions;
-- DELETE FROM products;
-- DELETE FROM subcategories;
-- DELETE FROM categories;

-- Insert Categories
INSERT INTO categories (id, name, description, created_at) VALUES
('b56dcb31-c32c-4cb5-967c-32e7b98f826f', 'Dining Tables', 'Premium teak dining tables for your family', '2025-09-15 11:58:27'),
('9b581346-3ce6-49ee-a22e-928ab207ca13', 'Chairs', 'Comfortable and elegant teak chairs', '2025-09-15 11:58:27'),
('4eae8c7c-04c2-4826-a63f-ec517272718d', 'Wardrobes', 'Spacious teak wardrobes for storage', '2025-09-15 11:58:27'),
('91544339-bd53-497e-89e8-2d5de7b7c55e', 'Beds', 'Luxurious teak beds for ultimate comfort', '2025-09-15 11:58:27'),
('8da66a57-0413-48e9-a998-65d9d327161c', 'Sofas', 'Stylish teak sofas for your living room', '2025-09-15 11:58:27'),
('4e0e6652-44e4-4f4f-ada2-86134d527bb6', 'Cabinets', 'Functional teak cabinets for organization', '2025-09-15 11:58:27');

-- Insert Subcategories
INSERT INTO subcategories (id, name, category_id, description, image_url, created_at) VALUES
('3bf07c8c-3016-4377-9caa-2bcdbf4e36d6', '8-Seater Tables', 'b56dcb31-c32c-4cb5-967c-32e7b98f826f', 'Large dining tables for 8 people', '/images/dining-table.webp', '2025-09-15 11:58:27'),
('cbd04275-dcb3-4f86-b982-f94e2f6aeeae', '6-Seater Tables', 'b56dcb31-c32c-4cb5-967c-32e7b98f826f', 'Medium dining tables for 6 people', '/images/dining-table.webp', '2025-09-15 11:58:27'),
('4f9f54f8-4053-41ef-81e1-eaf38fcc0128', 'Dining Chairs', '9b581346-3ce6-49ee-a22e-928ab207ca13', 'Chairs for dining room', '/images/chair-set.jpg', '2025-09-15 11:58:27'),
('be0d5633-74ac-40d7-aac2-1bd0d31fb6ab', 'Modern Chairs', '9b581346-3ce6-49ee-a22e-928ab207ca13', 'Contemporary style chairs', '/images/modern-chairs.webp', '2025-09-15 11:58:27'),
('1f2aa35f-9507-4ecf-b7c7-e24fe4fe3307', 'Designer Chairs', '9b581346-3ce6-49ee-a22e-928ab207ca13', 'Premium designer chairs', '/images/modern-chairs.webp', '2025-09-15 11:58:27'),
('423a81c3-c1a6-4be8-88e8-60e932cb8bba', '4-Door Wardrobes', '4eae8c7c-04c2-4826-a63f-ec517272718d', 'Large 4-door wardrobes', '/images/wardrobe.webp', '2025-09-15 11:58:27'),
('51a2267b-c25b-4801-b24d-f85b76d51998', 'Spacious Wardrobes', '4eae8c7c-04c2-4826-a63f-ec517272718d', 'Large storage wardrobes', '/images/wardrobe.webp', '2025-09-15 11:58:27'),
('c5f79f1a-b845-4aa4-86f1-9bc82b5ea1ff', 'King Size Beds', '91544339-bd53-497e-89e8-2d5de7b7c55e', 'Large king size beds', '/images/bed.jpg', '2025-09-15 11:58:27'),
('55ccb9d3-30a9-4ebd-9eb5-b7cb0e95df11', 'Queen Size Beds', '91544339-bd53-497e-89e8-2d5de7b7c55e', 'Queen size beds', '/images/bed.jpg', '2025-09-15 11:58:27'),
('ce17a651-fdda-4712-a971-b4a0fc5a681c', '3-Seater Sofas', '8da66a57-0413-48e9-a998-65d9d327161c', 'Three seater sofas', '/images/sofa.jpg', '2025-09-15 11:58:27'),
('24ee96d2-d7f4-4178-bdd7-71a9c4874002', 'Living Room Sets', '8da66a57-0413-48e9-a998-65d9d327161c', 'Complete living room furniture', '/images/living-room-set.jpg', '2025-09-15 11:58:27'),
('c7e5c04f-eec7-4b60-b7b4-2b0f3f2613f3', 'Garden Jhulas', '8da66a57-0413-48e9-a998-65d9d327161c', 'Traditional swings for garden', '/images/jhula.jpg', '2025-09-15 11:58:27'),
('402e02fd-01bc-4f00-8787-6a667ed5f9b1', 'Pooja Ghar', '4e0e6652-44e4-4f4f-ada2-86134d527bb6', 'Traditional prayer cabinets', '/images/pooja-ghar.jpg', '2025-09-15 11:58:27'),
('b169548c-136f-4192-a313-43f31467e091', 'Pooja Cabinets', '4e0e6652-44e4-4f4f-ada2-86134d527bb6', 'Compact prayer cabinets', '/images/pooja-ghar.jpg', '2025-09-15 11:58:27'),
('08b3eaa4-be81-4f7d-9731-519cf88c1740', 'Temple Units', '4e0e6652-44e4-4f4f-ada2-86134d527bb6', 'Large temple furniture', '/images/temple-pooja.jpg', '2025-09-15 11:58:27');

-- Insert Products
INSERT INTO products (id, name, description, price, original_price, category_id, subcategory_id, image_url, images, in_stock, stock, featured, is_deal, deal_price, deal_expiry, created_at, updated_at) VALUES
('7b6523d2-c621-437c-880b-d25869ea9643', 'Royal Maharaja Dining Table', 'Exquisite 8-seater solid teak dining table with hand-carved traditional motifs and brass inlays', 75000.00, 95000.00, 'b56dcb31-c32c-4cb5-967c-32e7b98f826f', '3bf07c8c-3016-4377-9caa-2bcdbf4e36d6', '/images/dining-table.webp', '[]', 1, 3, 1, 0, NULL, NULL, '2025-09-15 11:58:28', '2025-09-15 11:58:28'),
('70222550-be04-4709-b6f3-f54b32f8e623', 'Premium Teak Chair Set', 'Elegant set of 6 solid teak dining chairs with traditional design and comfortable cushioning', 48000.00, 62000.00, '9b581346-3ce6-49ee-a22e-928ab207ca13', '4f9f54f8-4053-41ef-81e1-eaf38fcc0128', '/images/chair-set.jpg', '[]', 1, 8, 1, 0, NULL, NULL, '2025-09-15 11:58:28', '2025-09-15 11:58:28'),
('429150f3-0408-4437-b283-253f4ca79465', 'Emperor Teak Wardrobe', 'Magnificent 4-door solid teak wardrobe with mirror, drawers and premium brass fittings', 85000.00, 110000.00, '4eae8c7c-04c2-4826-a63f-ec517272718d', '423a81c3-c1a6-4be8-88e8-60e932cb8bba', '/images/wardrobe.webp', '[]', 1, 2, 1, 0, NULL, NULL, '2025-09-15 11:58:28', '2025-09-15 11:58:28'),
('6f636077-aa45-48da-9ac8-8f5e59fcf960', 'Royal King Size Teak Bed', 'Luxurious king size solid teak bed with storage compartments and intricate headboard design', 95000.00, 125000.00, '91544339-bd53-497e-89e8-2d5de7b7c55e', 'c5f79f1a-b845-4aa4-86f1-9bc82b5ea1ff', '/images/bed.jpg', '[]', 1, 2, 1, 0, NULL, NULL, '2025-09-15 11:58:28', '2025-09-15 11:58:28'),
('b9a383f3-295c-4609-a9dd-69776352c518', 'Imperial Teak Sofa', 'Elegant solid teak sofa with premium fabric upholstery and traditional design', 85000.00, 105000.00, '8da66a57-0413-48e9-a998-65d9d327161c', 'ce17a651-fdda-4712-a971-b4a0fc5a681c', '/images/sofa.jpg', '[]', 1, 3, 1, 0, NULL, NULL, '2025-09-15 11:58:28', '2025-09-15 11:58:28'),
('08200d6e-c5e7-431d-8f5d-403edf938e65', 'Heritage Teak Pooja Ghar', 'Traditional solid teak pooja mandir with intricate carvings and storage compartments', 58000.00, 72000.00, '4e0e6652-44e4-4f4f-ada2-86134d527bb6', '402e02fd-01bc-4f00-8787-6a667ed5f9b1', '/images/pooja-ghar.jpg', '[]', 1, 5, 1, 0, NULL, NULL, '2025-09-15 11:58:28', '2025-09-15 11:58:28'),
('862ed023-01b3-46b8-984b-b46279ddb883', 'Modern Teak Chairs - Flash Deal', 'Set of 2 modern solid teak chairs with ergonomic design - Limited time ₹1 deal!', 25000.00, 32000.00, '9b581346-3ce6-49ee-a22e-928ab207ca13', 'be0d5633-74ac-40d7-aac2-1bd0d31fb6ab', '/images/modern-chairs.webp', '[]', 1, 15, 0, 1, 1.00, '2025-09-16 11:58:28', '2025-09-15 11:58:28', '2025-09-15 11:58:28'),
('a5871390-b81b-434c-b8de-11c6ca21430c', 'Teak Temple - ₹1 Deal', 'Beautiful solid teak temple for home worship - Incredible ₹1 flash sale!', 35000.00, 45000.00, '4e0e6652-44e4-4f4f-ada2-86134d527bb6', '402e02fd-01bc-4f00-8787-6a667ed5f9b1', '/images/temple-pooja.jpg', '[]', 1, 8, 0, 1, 1.00, '2025-09-16 11:58:28', '2025-09-15 11:58:28', '2025-09-15 11:58:28'),
('cfe71c6c-4129-48a3-9ebd-1d6437fe87ac', 'Traditional Jhula - Flash Sale', 'Handcrafted solid teak jhula swing for garden or porch - Unbelievable ₹1 deal!', 45000.00, 58000.00, '8da66a57-0413-48e9-a998-65d9d327161c', 'c7e5c04f-eec7-4b60-b7b4-2b0f3f2613f3', '/images/jhula.jpg', '[]', 1, 12, 0, 1, 1.00, '2025-09-16 11:58:28', '2025-09-15 11:58:28', '2025-09-15 11:58:28'),
('78482536-1cfb-4c32-bb0b-eb0b3ed84344', 'Complete Living Room Set', 'Comprehensive solid teak living room furniture set including sofa, center table, and side tables', 185000.00, 225000.00, '8da66a57-0413-48e9-a998-65d9d327161c', '24ee96d2-d7f4-4178-bdd7-71a9c4874002', '/images/living-room-set.jpg', '[]', 1, 2, 0, 0, NULL, NULL, '2025-09-15 11:58:28', '2025-09-15 11:58:28'),
('e517b387-73b3-47a4-be77-deed2162f917', 'Classic Teak Dining Table', 'Spacious 6-seater solid teak dining table perfect for family meals and gatherings', 55000.00, 68000.00, 'b56dcb31-c32c-4cb5-967c-32e7b98f826f', 'cbd04275-dcb3-4f86-b982-f94e2f6aeeae', '/images/dining-table.webp', '[]', 1, 6, 0, 0, NULL, NULL, '2025-09-15 11:58:28', '2025-09-15 11:58:28'),
('10944d54-9873-479d-9697-fa0ba69ab7d2', 'Ergonomic Chair Set of 4', 'Set of 4 comfortable solid teak chairs with ergonomic design for dining or office use', 32000.00, 40000.00, '9b581346-3ce6-49ee-a22e-928ab207ca13', '4f9f54f8-4053-41ef-81e1-eaf38fcc0128', '/images/chair-set.jpg', '[]', 1, 10, 0, 0, NULL, NULL, '2025-09-15 11:58:28', '2025-09-15 11:58:28'),
('0e76c553-cfa9-414d-9e14-7a1f2c89bb1a', 'Spacious Teak Wardrobe', 'Large solid teak wardrobe with multiple compartments, hanging space, and mirror', 72000.00, 88000.00, '4eae8c7c-04c2-4826-a63f-ec517272718d', '51a2267b-c25b-4801-b24d-f85b76d51998', '/images/wardrobe.webp', '[]', 1, 4, 0, 0, NULL, NULL, '2025-09-15 11:58:28', '2025-09-15 11:58:28'),
('0af67dae-bb55-434e-ad78-21348617eb31', 'Queen Size Teak Bed', 'Elegant queen size solid teak bed with modern design and storage options', 68000.00, 82000.00, '91544339-bd53-497e-89e8-2d5de7b7c55e', '55ccb9d3-30a9-4ebd-9eb5-b7cb0e95df11', '/images/bed.jpg', '[]', 1, 5, 0, 0, NULL, NULL, '2025-09-15 11:58:28', '2025-09-15 11:58:28'),
('ee7884c7-f1aa-4ed6-aa8f-cf8ffb0ec7f5', 'Comfortable Teak Sofa', 'Premium 3-seater solid teak sofa with high-quality fabric upholstery', 65000.00, 78000.00, '8da66a57-0413-48e9-a998-65d9d327161c', 'ce17a651-fdda-4712-a971-b4a0fc5a681c', '/images/sofa.jpg', '[]', 1, 7, 0, 0, NULL, NULL, '2025-09-15 11:58:28', '2025-09-15 11:58:28'),
('bc5b696b-cd2a-43c3-a92b-7ef28f788878', 'Traditional Pooja Cabinet', 'Compact solid teak pooja cabinet with traditional carvings and storage', 38000.00, 48000.00, '4e0e6652-44e4-4f4f-ada2-86134d527bb6', 'b169548c-136f-4192-a313-43f31467e091', '/images/pooja-ghar.jpg', '[]', 1, 12, 0, 0, NULL, NULL, '2025-09-15 11:58:28', '2025-09-15 11:58:28'),
('6a20eddc-e2cb-4e94-a7e5-43c8d6ac6297', 'Modern Designer Chairs', 'Contemporary solid teak chairs with sleek design perfect for modern homes', 28000.00, 35000.00, '9b581346-3ce6-49ee-a22e-928ab207ca13', '1f2aa35f-9507-4ecf-b7c7-e24fe4fe3307', '/images/modern-chairs.webp', '[]', 1, 15, 0, 0, NULL, NULL, '2025-09-15 11:58:28', '2025-09-15 11:58:28'),
('b671127c-ac23-496a-b1f3-1b08cb7cf34d', 'Garden Teak Jhula', 'Beautiful handcrafted solid teak swing perfect for garden or balcony relaxation', 42000.00, 52000.00, '8da66a57-0413-48e9-a998-65d9d327161c', 'c7e5c04f-eec7-4b60-b7b4-2b0f3f2613f3', '/images/jhula.jpg', '[]', 1, 8, 0, 0, NULL, NULL, '2025-09-15 11:58:28', '2025-09-15 11:58:28'),
('9803cb2b-801a-4d18-9c9d-d8e4b9cd957b', 'Sacred Temple Unit', 'Elegant solid teak temple with intricate religious carvings and multiple shelves', 48000.00, 58000.00, '4e0e6652-44e4-4f4f-ada2-86134d527bb6', '08b3eaa4-be81-4f7d-9731-519cf88c1740', '/images/temple-pooja.jpg', '[]', 1, 6, 0, 0, NULL, NULL, '2025-09-15 11:58:28', '2025-09-15 11:58:28');