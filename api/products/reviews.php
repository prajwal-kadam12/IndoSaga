<?php
require_once __DIR__ . '/../../php/config/cors.php';
/**
 * Product Reviews API
 * GET /api/products/:productId/reviews - Get reviews for a product
 * POST /api/products/:productId/reviews - Add review for a product
 */

require_once __DIR__ . '/../../database/mysql_connection.php';

try {
    $productId = $_GET['productId'] ?? '';
    
    if (!$productId) {
        http_response_code(400);
        echo json_encode(['message' => 'Product ID required']);
        exit;
    }
    
    $db = MySQLConnection::getInstance();
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get reviews for a product
        $reviews = $db->fetchAll(
            "SELECT pr.*, u.name as reviewerName, u.profileImageUrl as reviewerImage 
             FROM productReviews pr 
             LEFT JOIN users u ON pr.userId = u.id 
             WHERE pr.productId = ? 
             ORDER BY pr.createdAt DESC",
            [$productId]
        );
        
        echo json_encode($reviews);
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Add review for a product
        if (!isset($_SESSION['user'])) {
            http_response_code(401);
            echo json_encode(['message' => 'Authentication required']);
            exit;
        }
        
        $user = $_SESSION['user'];
        $dbUser = $db->fetch("SELECT * FROM users WHERE email = ?", [$user['email']]);
        
        if (!$dbUser) {
            http_response_code(401);
            echo json_encode(['message' => 'User not found']);
            exit;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        $reviewId = uniqid('review_');
        $db->query(
            "INSERT INTO productReviews (id, productId, userId, rating, comment, createdAt) VALUES (?, ?, ?, ?, ?, NOW())",
            [
                $reviewId,
                $productId,
                $dbUser['id'],
                $input['rating'] ?? 5,
                $input['comment'] ?? ''
            ]
        );
        
        $review = $db->fetch("SELECT * FROM productReviews WHERE id = ?", [$reviewId]);
        echo json_encode($review);
        
    } else {
        http_response_code(405);
        echo json_encode(['message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    error_log('Product reviews error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['message' => 'Failed to process request']);
}
?>