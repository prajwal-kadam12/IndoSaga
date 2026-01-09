<?php
require_once __DIR__ . '/../../php/config/cors.php';
/**
 * Products API - FIXED VERSION
 * GET /api/products - Get all products with filters
 * POST /api/products - Create new product
 */

require_once __DIR__ . '/../../database/mysql_connection.php';

try {
    $db = MySQLConnection::getInstance();
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get products with optional filters
        $category = $_GET['category'] ?? '';
        $subcategory = $_GET['subcategory'] ?? '';
        $search = $_GET['search'] ?? '';
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
        $offset = isset($_GET['offset']) ? intval($_GET['offset']) : 0;
        
        // Validate limit and offset
        $limit = max(1, min(100, $limit)); // Between 1 and 100
        $offset = max(0, $offset);
        
        $whereConditions = [];
        $params = [];
        
        if ($category) {
            $whereConditions[] = "p.categoryId = ?";
            $params[] = $category;
        }
        
        if ($subcategory) {
            $whereConditions[] = "p.subcategoryId = ?";
            $params[] = $subcategory;
        }
        
        if ($search) {
            $whereConditions[] = "(p.name LIKE ? OR p.description LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }
        
        $whereClause = count($whereConditions) > 0 ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
        
        // FIX: Don't use placeholders for LIMIT/OFFSET - cast to int and embed directly
        $sql = "SELECT p.*, c.name as categoryName, s.name as subcategoryName 
                FROM products p 
                LEFT JOIN categories c ON p.categoryId = c.id 
                LEFT JOIN subcategories s ON p.subcategoryId = s.id 
                $whereClause 
                ORDER BY p.createdAt DESC 
                LIMIT $limit OFFSET $offset";
        
        $products = $db->fetchAll($sql, $params);
        echo json_encode($products);
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Create new product (admin only - add auth check if needed)
        $input = json_decode(file_get_contents('php://input'), true);
        
        $productId = uniqid('prod_');
        $db->query(
            "INSERT INTO products (id, name, description, price, categoryId, subcategoryId, imageUrl, featured, createdAt) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())",
            [
                $productId,
                $input['name'],
                $input['description'],
                $input['price'],
                $input['categoryId'],
                $input['subcategoryId'] ?? null,
                $input['imageUrl'],
                $input['featured'] ?? false
            ]
        );
        
        $product = $db->fetch("SELECT * FROM products WHERE id = ?", [$productId]);
        echo json_encode($product);
        
    } else {
        http_response_code(405);
        echo json_encode(['message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    error_log('Products API error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['message' => 'Failed to process request']);
}
?>