<?php
require_once __DIR__ . '/../../php/config/cors.php';
/**
 * Product Questions API
 * GET /api/products/:productId/questions - Get questions for a product
 * POST /api/products/:productId/questions - Ask question about a product
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
        // Get questions for a product
        $questions = $db->fetchAll(
            "SELECT pq.*, u.name as askerName 
             FROM productQuestions pq 
             LEFT JOIN users u ON pq.userId = u.id 
             WHERE pq.productId = ? 
             ORDER BY pq.createdAt DESC",
            [$productId]
        );
        
        echo json_encode($questions);
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Ask question about a product
        $input = json_decode(file_get_contents('php://input'), true);
        
        $userId = null;
        if (isset($_SESSION['user'])) {
            $user = $_SESSION['user'];
            $dbUser = $db->fetch("SELECT * FROM users WHERE email = ?", [$user['email']]);
            if ($dbUser) {
                $userId = $dbUser['id'];
            }
        }
        
        $questionId = uniqid('question_');
        $db->query(
            "INSERT INTO productQuestions (id, productId, userId, question, status, createdAt) VALUES (?, ?, ?, ?, 'pending', NOW())",
            [
                $questionId,
                $productId,
                $userId,
                $input['question'] ?? ''
            ]
        );
        
        $question = $db->fetch("SELECT * FROM productQuestions WHERE id = ?", [$questionId]);
        echo json_encode($question);
        
    } else {
        http_response_code(405);
        echo json_encode(['message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    error_log('Product questions error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['message' => 'Failed to process request']);
}
?>