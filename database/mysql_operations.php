<?php
/**
 * MySQL Database Operations for IndoSaga
 * Provides all CRUD operations for database entities
 */

require_once 'mysql_connection.php';

class MySQLOperations {
    private $db;
    
    public function __construct() {
        $this->db = MySQLConnection::getInstance();
    }
    
    // CATEGORIES
    public function getCategories() {
        return $this->db->fetchAll("SELECT * FROM categories ORDER BY name");
    }
    
    public function getCategoryById($id) {
        return $this->db->fetch("SELECT * FROM categories WHERE id = ?", [$id]);
    }
    
    public function createCategory($name, $description = null) {
        $id = $this->generateId();
        $this->db->query(
            "INSERT INTO categories (id, name, description, created_at) VALUES (?, ?, ?, NOW())",
            [$id, $name, $description]
        );
        return $this->getCategoryById($id);
    }
    
    // SUBCATEGORIES
    public function getSubcategories($categoryId = null) {
        if ($categoryId) {
            return $this->db->fetchAll(
                "SELECT * FROM subcategories WHERE category_id = ? ORDER BY name",
                [$categoryId]
            );
        }
        return $this->db->fetchAll("SELECT * FROM subcategories ORDER BY name");
    }
    
    public function getSubcategoryById($id) {
        return $this->db->fetch("SELECT * FROM subcategories WHERE id = ?", [$id]);
    }
    
    public function createSubcategory($name, $categoryId, $description = null, $imageUrl = null) {
        $id = $this->generateId();
        $this->db->query(
            "INSERT INTO subcategories (id, name, category_id, description, image_url, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
            [$id, $name, $categoryId, $description, $imageUrl]
        );
        return $this->getSubcategoryById($id);
    }
    
    // PRODUCTS
    public function getProducts($filters = []) {
        $sql = "SELECT p.*, c.name as category_name, s.name as subcategory_name 
                FROM products p 
                LEFT JOIN categories c ON p.category_id = c.id 
                LEFT JOIN subcategories s ON p.subcategory_id = s.id 
                WHERE 1=1";
        $params = [];
        
        if (!empty($filters['search'])) {
            $sql .= " AND (p.name LIKE ? OR p.description LIKE ?)";
            $searchTerm = "%{$filters['search']}%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        if (!empty($filters['categoryId'])) {
            $sql .= " AND (p.category_id = ? OR p.subcategory_id = ?)";
            $params[] = $filters['categoryId'];
            $params[] = $filters['categoryId'];
        }
        
        if (!empty($filters['subcategoryId'])) {
            $sql .= " AND p.subcategory_id = ?";
            $params[] = $filters['subcategoryId'];
        }
        
        if (isset($filters['featured'])) {
            $sql .= " AND p.featured = ?";
            $params[] = $filters['featured'] ? 1 : 0;
        }
        
        if (isset($filters['isDeal'])) {
            $sql .= " AND p.is_deal = ?";
            $params[] = $filters['isDeal'] ? 1 : 0;
        }
        
        if (!empty($filters['minPrice'])) {
            $sql .= " AND p.price >= ?";
            $params[] = $filters['minPrice'];
        }
        
        if (!empty($filters['maxPrice'])) {
            $sql .= " AND p.price <= ?";
            $params[] = $filters['maxPrice'];
        }
        
        $sql .= " ORDER BY p.created_at DESC";
        
        $products = $this->db->fetchAll($sql, $params);
        
        // Parse JSON fields
        foreach ($products as &$product) {
            $product['images'] = json_decode($product['images'] ?? '[]', true);
            $product['in_stock'] = (bool)$product['in_stock'];
            $product['featured'] = (bool)$product['featured'];
            $product['is_deal'] = (bool)$product['is_deal'];
        }
        
        return $products;
    }
    
    public function getProductById($id) {
        $product = $this->db->fetch(
            "SELECT p.*, c.name as category_name, s.name as subcategory_name 
             FROM products p 
             LEFT JOIN categories c ON p.category_id = c.id 
             LEFT JOIN subcategories s ON p.subcategory_id = s.id 
             WHERE p.id = ?",
            [$id]
        );
        
        if ($product) {
            $product['images'] = json_decode($product['images'] ?? '[]', true);
            $product['in_stock'] = (bool)$product['in_stock'];
            $product['featured'] = (bool)$product['featured'];
            $product['is_deal'] = (bool)$product['is_deal'];
        }
        
        return $product;
    }
    
    public function getFeaturedProducts() {
        return $this->getProducts(['featured' => true]);
    }
    
    public function getDealProducts() {
        return $this->getProducts(['isDeal' => true]);
    }
    
    // USERS
    public function getUserById($id) {
        return $this->db->fetch("SELECT * FROM users WHERE id = ?", [$id]);
    }
    
    public function getUserByEmail($email) {
        return $this->db->fetch("SELECT * FROM users WHERE email = ?", [$email]);
    }
    
    public function createUser($data) {
        $id = $this->generateId();
        $this->db->query(
            "INSERT INTO users (id, email, name, first_name, last_name, phone, address, profile_image_url, password_hash, provider, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
            [
                $id, $data['email'], $data['name'] ?? null, $data['first_name'] ?? null,
                $data['last_name'] ?? null, $data['phone'] ?? null, $data['address'] ?? null,
                $data['profile_image_url'] ?? null, $data['password_hash'] ?? null, $data['provider'] ?? null
            ]
        );
        return $this->getUserById($id);
    }
    
    // ORDERS
    public function createOrder($data) {
        $id = $this->generateId();
        $this->db->query(
            "INSERT INTO orders (id, user_id, total, status, payment_id, payment_status, payment_method, 
                                razorpay_order_id, razorpay_payment_id, razorpay_signature, customer_name, 
                                customer_phone, customer_email, shipping_address, pincode, tracking_id, 
                                created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
            [
                $id, $data['user_id'], $data['total'], $data['status'] ?? 'pending',
                $data['payment_id'] ?? null, $data['payment_status'] ?? 'pending', $data['payment_method'] ?? null,
                $data['razorpay_order_id'] ?? null, $data['razorpay_payment_id'] ?? null, $data['razorpay_signature'] ?? null,
                $data['customer_name'], $data['customer_phone'], $data['customer_email'] ?? null,
                $data['shipping_address'], $data['pincode'], $data['tracking_id'] ?? null
            ]
        );
        return $this->getOrderById($id);
    }
    
    public function getOrderById($id) {
        return $this->db->fetch("SELECT * FROM orders WHERE id = ?", [$id]);
    }
    
    public function getOrdersByUserId($userId) {
        return $this->db->fetchAll(
            "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
            [$userId]
        );
    }
    
    public function addOrderItems($orderItems) {
        foreach ($orderItems as $item) {
            $id = $this->generateId();
            $this->db->query(
                "INSERT INTO order_items (id, order_id, product_id, quantity, price, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
                [$id, $item['order_id'], $item['product_id'], $item['quantity'], $item['price']]
            );
        }
    }
    
    // CART ITEMS
    public function getCartItems($userId) {
        return $this->db->fetchAll(
            "SELECT ci.*, p.name as product_name, p.price, p.image_url, p.in_stock 
             FROM cart_items ci 
             JOIN products p ON ci.product_id = p.id 
             WHERE ci.user_id = ? 
             ORDER BY ci.created_at DESC",
            [$userId]
        );
    }
    
    public function addToCart($userId, $productId, $quantity = 1) {
        // Check if item already exists
        $existing = $this->db->fetch(
            "SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?",
            [$userId, $productId]
        );
        
        if ($existing) {
            // Update quantity
            $this->db->query(
                "UPDATE cart_items SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?",
                [$quantity, $userId, $productId]
            );
        } else {
            // Insert new item
            $id = $this->generateId();
            $this->db->query(
                "INSERT INTO cart_items (id, user_id, product_id, quantity, created_at) VALUES (?, ?, ?, ?, NOW())",
                [$id, $userId, $productId, $quantity]
            );
        }
    }
    
    public function removeFromCart($userId, $productId) {
        $this->db->query(
            "DELETE FROM cart_items WHERE user_id = ? AND product_id = ?",
            [$userId, $productId]
        );
    }
    
    public function clearCart($userId) {
        $this->db->query("DELETE FROM cart_items WHERE user_id = ?", [$userId]);
    }
    
    // WISHLIST ITEMS
    public function getWishlistItems($userId) {
        return $this->db->fetchAll(
            "SELECT wi.*, p.name as product_name, p.price, p.image_url, p.in_stock 
             FROM wishlist_items wi 
             JOIN products p ON wi.product_id = p.id 
             WHERE wi.user_id = ? 
             ORDER BY wi.created_at DESC",
            [$userId]
        );
    }
    
    public function addToWishlist($userId, $productId) {
        $id = $this->generateId();
        try {
            $this->db->query(
                "INSERT INTO wishlist_items (id, user_id, product_id, created_at) VALUES (?, ?, ?, NOW())",
                [$id, $userId, $productId]
            );
        } catch (Exception $e) {
            // Ignore duplicate key errors
            if (strpos($e->getMessage(), 'Duplicate entry') === false) {
                throw $e;
            }
        }
    }
    
    public function removeFromWishlist($userId, $productId) {
        $this->db->query(
            "DELETE FROM wishlist_items WHERE user_id = ? AND product_id = ?",
            [$userId, $productId]
        );
    }
    
    // CONTACT INQUIRIES
    public function createContactInquiry($data) {
        $id = $this->generateId();
        $this->db->query(
            "INSERT INTO contact_inquiries (id, first_name, last_name, email, phone, inquiry_type, message, status, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'new', NOW())",
            [
                $id, $data['first_name'], $data['last_name'], $data['email'],
                $data['phone'] ?? null, $data['inquiry_type'], $data['message']
            ]
        );
        return $id;
    }
    
    // SUPPORT TICKETS
    public function createSupportTicket($data) {
        $id = $this->generateId();
        $this->db->query(
            "INSERT INTO support_tickets (id, user_id, customer_name, customer_email, customer_phone, subject, message, status, priority, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'open', 'medium', NOW(), NOW())",
            [
                $id, $data['user_id'] ?? null, $data['customer_name'], $data['customer_email'],
                $data['customer_phone'] ?? null, $data['subject'], $data['message']
            ]
        );
        return $id;
    }
    
    // APPOINTMENTS
    public function createAppointment($data) {
        $id = $this->generateId();
        $this->db->query(
            "INSERT INTO appointments (id, user_id, customer_name, customer_email, customer_phone, appointment_date, duration, meeting_type, status, notes, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, NOW(), NOW())",
            [
                $id, $data['user_id'] ?? null, $data['customer_name'], $data['customer_email'],
                $data['customer_phone'], $data['appointment_date'], $data['duration'] ?? 30,
                $data['meeting_type'] ?? 'virtual_showroom', $data['notes'] ?? null
            ]
        );
        return $id;
    }
    
    // PRODUCT REVIEWS
    public function getProductReviews($productId) {
        return $this->db->fetchAll(
            "SELECT * FROM product_reviews WHERE product_id = ? ORDER BY created_at DESC",
            [$productId]
        );
    }
    
    public function createProductReview($data) {
        $id = $this->generateId();
        $this->db->query(
            "INSERT INTO product_reviews (id, product_id, user_id, user_name, rating, comment, images, is_verified, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())",
            [
                $id, $data['product_id'], $data['user_id'] ?? null, $data['user_name'],
                $data['rating'], $data['comment'], json_encode($data['images'] ?? [])
            ]
        );
        return $id;
    }
    
    // PRODUCT Q&A
    public function getProductQuestions($productId) {
        return $this->db->fetchAll(
            "SELECT * FROM product_questions WHERE product_id = ? AND is_public = 1 ORDER BY created_at DESC",
            [$productId]
        );
    }
    
    public function createProductQuestion($data) {
        $id = $this->generateId();
        $this->db->query(
            "INSERT INTO product_questions (id, product_id, user_id, user_name, user_email, question, is_public, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, 1, NOW(), NOW())",
            [
                $id, $data['product_id'], $data['user_id'] ?? null,
                $data['user_name'], $data['user_email'] ?? null, $data['question']
            ]
        );
        return $id;
    }
    
    public function answerProductQuestion($questionId, $answer, $answeredBy) {
        $this->db->query(
            "UPDATE product_questions SET answer = ?, answered_by = ?, answered_at = NOW(), updated_at = NOW() WHERE id = ?",
            [$answer, $answeredBy, $questionId]
        );
    }
    
    // UTILITY METHODS
    private function generateId() {
        return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
    
    public function testConnection() {
        try {
            $result = $this->db->fetch("SELECT 1 as test");
            return $result['test'] === 1;
        } catch (Exception $e) {
            return false;
        }
    }
}

// Global function for easy access
if (!function_exists('getMySQLOps')) {
    function getMySQLOps() {
        return new MySQLOperations();
    }
}

?>