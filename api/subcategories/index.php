<?php
require_once __DIR__ . '/../../php/config/cors.php';
/**
 * Subcategories API
 * GET /api/subcategories - Get subcategories (optionally filtered by categoryId)
 * POST /api/subcategories - Create new subcategory
 */

require_once __DIR__ . '/../../database/mysql_connection.php';

try {
    $db = MySQLConnection::getInstance();
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $categoryId = $_GET['categoryId'] ?? '';
        
        if ($categoryId) {
            $subcategories = $db->fetchAll(
                "SELECT * FROM subcategories WHERE categoryId = ? ORDER BY name",
                [$categoryId]
            );
        } else {
            $subcategories = $db->fetchAll("SELECT * FROM subcategories ORDER BY name");
        }
        
        echo json_encode($subcategories);
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $subcategoryId = uniqid('subcat_');
        $db->query(
            "INSERT INTO subcategories (id, name, categoryId, description, imageUrl, createdAt) VALUES (?, ?, ?, ?, ?, NOW())",
            [
                $subcategoryId,
                $input['name'],
                $input['categoryId'],
                $input['description'] ?? '',
                $input['imageUrl'] ?? ''
            ]
        );
        
        $subcategory = $db->fetch("SELECT * FROM subcategories WHERE id = ?", [$subcategoryId]);
        echo json_encode($subcategory);
        
    } else {
        http_response_code(405);
        echo json_encode(['message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    error_log('Subcategories API error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['message' => 'Failed to process request']);
}
?>