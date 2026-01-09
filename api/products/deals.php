<?php
require_once __DIR__ . '/../../php/config/cors.php';
/**
 * Deal Products API
 * GET /api/products/deals
 */

require_once __DIR__ . '/../../database/mysql_connection.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
    exit;
}

try {
    $db = MySQLConnection::getInstance();
    
    // Get products with discounts or marked as deals
    $products = $db->fetchAll(
        "SELECT p.*, c.name as categoryName, s.name as subcategoryName 
         FROM products p 
         LEFT JOIN categories c ON p.categoryId = c.id 
         LEFT JOIN subcategories s ON p.subcategoryId = s.id 
         WHERE p.discountPrice IS NOT NULL AND p.discountPrice > 0
         ORDER BY p.createdAt DESC 
         LIMIT 20"
    );
    
    echo json_encode($products);
} catch (Exception $e) {
    error_log('Deal products error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['message' => 'Failed to fetch deal products']);
}
?>