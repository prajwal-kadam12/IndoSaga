<?php
require_once __DIR__ . '/../../php/config/cors.php';
/**
 * Cart API
 * GET /api/cart - Get cart items for authenticated user
 * POST /api/cart - Add item to cart
 * PUT /api/cart - Update cart item quantity
 * DELETE /api/cart - Remove item from cart
 */

require_once __DIR__ . '/../../database/mysql_connection.php';

try {
    $db = MySQLConnection::getInstance();
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get cart items for authenticated user
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
        
        $cartItems = $db->fetchAll(
            "SELECT c.*, p.name as productName, p.price, p.image_url as imageUrl 
             FROM cart_items c 
             JOIN products p ON c.product_id = p.id 
             WHERE c.user_id = ?",
            [$dbUser['id']]
        );
        
        echo json_encode($cartItems);
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Add item to cart
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
        
        // Check if item already exists in cart
        $existingCartItem = $db->fetch(
            "SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?",
            [$dbUser['id'], $input['productId']]
        );
        
        if ($existingCartItem) {
            // Update quantity
            $newQuantity = $existingCartItem['quantity'] + ($input['quantity'] ?? 1);
            $db->query(
                "UPDATE cart_items SET quantity = ? WHERE id = ?",
                [$newQuantity, $existingCartItem['id']]
            );
            $cartItem = $db->fetch("SELECT * FROM cart_items WHERE id = ?", [$existingCartItem['id']]);
        } else {
            // Insert new item
            $cartItemId = uniqid('cart_');
            $db->query(
                "INSERT INTO cart_items (id, user_id, product_id, quantity, created_at) VALUES (?, ?, ?, ?, NOW())",
                [$cartItemId, $dbUser['id'], $input['productId'], $input['quantity'] ?? 1]
            );
            $cartItem = $db->fetch("SELECT * FROM cart_items WHERE id = ?", [$cartItemId]);
        }
        
        echo json_encode($cartItem);
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        // Update cart item quantity
        if (!isset($_SESSION['user'])) {
            http_response_code(401);
            echo json_encode(['message' => 'Authentication required']);
            exit;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        $db->query(
            "UPDATE cart_items SET quantity = ? WHERE id = ?",
            [$input['quantity'], $input['cartItemId']]
        );
        
        $cartItem = $db->fetch("SELECT * FROM cart_items WHERE id = ?", [$input['cartItemId']]);
        echo json_encode($cartItem);
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        // Remove item from cart
        if (!isset($_SESSION['user'])) {
            http_response_code(401);
            echo json_encode(['message' => 'Authentication required']);
            exit;
        }
        
        $cartItemId = $_GET['cartItemId'] ?? '';
        
        if ($cartItemId) {
            $db->query("DELETE FROM cart_items WHERE id = ?", [$cartItemId]);
            echo json_encode(['success' => true]);
        } else {
            http_response_code(400);
            echo json_encode(['message' => 'Cart item ID required']);
        }
        
    } else {
        http_response_code(405);
        echo json_encode(['message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    error_log('Cart API error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['message' => 'Failed to process request']);
}
?>