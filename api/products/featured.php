<?php
require_once __DIR__ . '/../../php/config/cors.php';
/**
 * Featured Products API
 * GET /api/products/featured
 */

require_once __DIR__ . '/../../database/mysql_connection.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
    exit;
}

try {
    $db = MySQLConnection::getInstance();
    
    $products = $db->fetchAll(
        "SELECT p.*, c.name as categoryName, s.name as subcategoryName 
         FROM products p 
         LEFT JOIN categories c ON p.categoryId = c.id 
         LEFT JOIN subcategories s ON p.subcategoryId = s.id 
         WHERE p.featured = 1 
         ORDER BY p.createdAt DESC"
    );
    
    echo json_encode($products);
} catch (Exception $e) {
    error_log('Featured products error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['message' => 'Failed to fetch featured products']);
}
?>