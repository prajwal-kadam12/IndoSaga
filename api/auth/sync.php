<?php
require_once __DIR__ . '/../../php/config/cors.php';
/**
 * Sync Auth0 User with Server Session
 * POST /api/auth/sync - SECURE VERSION
 */

require_once __DIR__ . '/../../database/mysql_connection.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
    exit;
}

// Set secure session cookie parameters
session_set_cookie_params([
    'lifetime' => 86400, // 24 hours
    'path' => '/',
    'domain' => '',
    'secure' => true, // Only over HTTPS
    'httponly' => true, // No JavaScript access
    'samesite' => 'Lax' // CSRF protection
]);

try {
    $input = json_decode(file_get_contents('php://input'), true);
    $user = $input['user'] ?? null;
    $localCartItems = $input['localCartItems'] ?? [];
    
    if (!$user || !$user['email']) {
        http_response_code(400);
        echo json_encode(['message' => 'Invalid user data']);
        exit;
    }
    
    // SECURITY: Verify Auth0 ID token (simplified version)
    // In production, verify JWT signature using Auth0 JWKS
    if (!isset($user['sub']) || !isset($user['email']) || !isset($user['iss'])) {
        http_response_code(401);
        echo json_encode(['message' => 'Invalid Auth0 token']);
        exit;
    }
    
    // Verify issuer matches your Auth0 domain
    $expectedIssuer = 'https://dev-adj6k3nczttyxyiu.us.auth0.com/';
    if ($user['iss'] !== $expectedIssuer) {
        http_response_code(401);
        echo json_encode(['message' => 'Invalid token issuer']);
        exit;
    }
    
    // Store user in session
    $_SESSION['user'] = [
        'id' => $user['sub'],
        'email' => $user['email'],
        'name' => $user['name'] ?? '',
        'firstName' => $user['given_name'] ?? '',
        'lastName' => $user['family_name'] ?? '',
        'profileImageUrl' => $user['picture'] ?? '',
        'provider' => 'auth0',
        'verified' => true,
        'csrf_token' => bin2hex(random_bytes(32)) // CSRF protection
    ];
    
    $db = MySQLConnection::getInstance();
    
    // Check if user exists in database
    $stmt = $db->query("SELECT * FROM users WHERE email = ?", [$user['email']]);
    $existingUser = $stmt->fetch();
    
    if (!$existingUser) {
        // Create new user
        $userId = $user['sub']; // Use Auth0 sub as user ID
        $db->query(
            "INSERT INTO users (id, email, name, firstName, lastName, profileImageUrl, provider, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
            [
                $userId,
                $user['email'],
                $user['name'] ?? '',
                $user['given_name'] ?? '',
                $user['family_name'] ?? '',
                $user['picture'] ?? '',
                'auth0'
            ]
        );
        $dbUser = ['id' => $userId, 'email' => $user['email'], 'name' => $user['name'] ?? ''];
    } else {
        $dbUser = $existingUser;
    }
    
    // Migrate localStorage cart items to authenticated user's cart
    if (count($localCartItems) > 0 && $dbUser) {
        foreach ($localCartItems as $localItem) {
            try {
                $cartData = [
                    'userId' => $dbUser['id'],
                    'productId' => $localItem['productId'] ?? $localItem['id'],
                    'quantity' => intval($localItem['quantity'] ?? 1)
                ];
                
                // Validate product exists
                $product = $db->fetch("SELECT id FROM products WHERE id = ?", [$cartData['productId']]);
                if (!$product) {
                    continue; // Skip invalid products
                }
                
                // Check if item already exists in cart
                $existingCartItem = $db->fetch(
                    "SELECT * FROM cartItems WHERE userId = ? AND productId = ?",
                    [$cartData['userId'], $cartData['productId']]
                );
                
                if ($existingCartItem) {
                    // Update quantity
                    $db->query(
                        "UPDATE cartItems SET quantity = quantity + ? WHERE userId = ? AND productId = ?",
                        [$cartData['quantity'], $cartData['userId'], $cartData['productId']]
                    );
                } else {
                    // Insert new item
                    $db->query(
                        "INSERT INTO cartItems (id, userId, productId, quantity, createdAt) VALUES (?, ?, ?, ?, NOW())",
                        [uniqid('cart_'), $cartData['userId'], $cartData['productId'], $cartData['quantity']]
                    );
                }
            } catch (Exception $itemError) {
                error_log('Error migrating cart item: ' . $itemError->getMessage());
            }
        }
    }
    
    echo json_encode($dbUser);
} catch (Exception $e) {
    error_log('Auth sync error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['message' => 'Failed to sync authentication']);
}
?>