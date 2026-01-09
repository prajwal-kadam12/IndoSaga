<?php
require_once __DIR__ . '/../../php/config/cors.php';
/**
 * Wishlist API
 * GET /api/wishlist - Get wishlist items for authenticated user
 * POST /api/wishlist - Add item to wishlist
 * DELETE /api/wishlist - Remove item from wishlist
 */

require_once __DIR__ . '/../../database/mysql_connection.php';

try {
    $db = MySQLConnection::getInstance();
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get wishlist items for authenticated user
        if (!isset($_SESSION['user'])) {
            echo json_encode([]);
            exit;
        }
        
        $user = $_SESSION['user'];
        $dbUser = $db->fetch("SELECT * FROM users WHERE email = ?", [$user['email']]);
        
        if (!$dbUser) {
            echo json_encode([]);
            exit;
        }
        
        $wishlistItems = $db->fetchAll(
            "SELECT w.*, p.name as productName, p.price, p.image_url as imageUrl 
             FROM wishlist_items w 
             JOIN products p ON w.product_id = p.id 
             WHERE w.user_id = ?",
            [$dbUser['id']]
        );
        
        echo json_encode($wishlistItems);
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Add item to wishlist
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
        
        // Check if item already exists in wishlist
        $existingWishlistItem = $db->fetch(
            "SELECT * FROM wishlist_items WHERE user_id = ? AND product_id = ?",
            [$dbUser['id'], $input['productId']]
        );
        
        if (!$existingWishlistItem) {
            $wishlistItemId = uniqid('wish_');
            $db->query(
                "INSERT INTO wishlist_items (id, user_id, product_id, created_at) VALUES (?, ?, ?, NOW())",
                [$wishlistItemId, $dbUser['id'], $input['productId']]
            );
            $wishlistItem = $db->fetch("SELECT * FROM wishlist_items WHERE id = ?", [$wishlistItemId]);
            echo json_encode($wishlistItem);
        } else {
            echo json_encode($existingWishlistItem);
        }
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        // Remove item from wishlist
        if (!isset($_SESSION['user'])) {
            http_response_code(401);
            echo json_encode(['message' => 'Authentication required']);
            exit;
        }
        
        $wishlistItemId = $_GET['wishlistItemId'] ?? '';
        $productId = $_GET['productId'] ?? '';
        
        if ($wishlistItemId) {
            $db->query("DELETE FROM wishlist_items WHERE id = ?", [$wishlistItemId]);
        } elseif ($productId) {
            $user = $_SESSION['user'];
            $dbUser = $db->fetch("SELECT * FROM users WHERE email = ?", [$user['email']]);
            $db->query("DELETE FROM wishlist_items WHERE user_id = ? AND product_id = ?", [$dbUser['id'], $productId]);
        } else {
            http_response_code(400);
            echo json_encode(['message' => 'Wishlist item ID or product ID required']);
            exit;
        }
        
        echo json_encode(['success' => true]);
        
    } else {
        http_response_code(405);
        echo json_encode(['message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    error_log('Wishlist API error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['message' => 'Failed to process request']);
}
?>