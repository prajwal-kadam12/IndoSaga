<?php
require_once __DIR__ . '/../../php/config/cors.php';
/**
 * Single Product API
 * GET /api/products/:id
 */

require_once __DIR__ . '/../../database/mysql_connection.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
    exit;
}

try {
    $productId = $_GET['id'] ?? '';
    
    if (!$productId) {
        http_response_code(400);
        echo json_encode(['message' => 'Product ID required']);
        exit;
    }
    
    $db = MySQLConnection::getInstance();
    
    $product = $db->fetch(
        "SELECT p.*, c.name as categoryName, s.name as subcategoryName 
         FROM products p 
         LEFT JOIN categories c ON p.categoryId = c.id 
         LEFT JOIN subcategories s ON p.subcategoryId = s.id 
         WHERE p.id = ?",
        [$productId]
    );
    
    if (!$product) {
        http_response_code(404);
        echo json_encode(['message' => 'Product not found']);
        exit;
    }
    
    echo json_encode($product);
} catch (Exception $e) {
    error_log('Single product error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['message' => 'Failed to fetch product']);
}
?>