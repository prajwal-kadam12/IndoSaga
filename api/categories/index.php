<?php
require_once __DIR__ . '/../../php/config/cors.php';
/**
 * Categories API
 * GET /api/categories - Get all categories
 * POST /api/categories - Create new category
 */

require_once __DIR__ . '/../../database/mysql_connection.php';

try {
    $db = MySQLConnection::getInstance();
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $categories = $db->fetchAll("SELECT * FROM categories ORDER BY name");
        echo json_encode($categories);
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $categoryId = uniqid('cat_');
        $db->query(
            "INSERT INTO categories (id, name, description, imageUrl, createdAt) VALUES (?, ?, ?, ?, NOW())",
            [
                $categoryId,
                $input['name'],
                $input['description'] ?? '',
                $input['imageUrl'] ?? ''
            ]
        );
        
        $category = $db->fetch("SELECT * FROM categories WHERE id = ?", [$categoryId]);
        echo json_encode($category);
        
    } else {
        http_response_code(405);
        echo json_encode(['message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    error_log('Categories API error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['message' => 'Failed to process request']);
}
?>