<?php
require_once __DIR__ . '/../../php/config/cors.php';
/**
 * Update User Profile
 * PUT /api/auth/profile
 */

require_once __DIR__ . '/../../database/mysql_connection.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
    exit;
}

try {
    if (!isset($_SESSION['user'])) {
        http_response_code(401);
        echo json_encode(['message' => 'Not authenticated']);
        exit;
    }

    $user = $_SESSION['user'];
    $input = json_decode(file_get_contents('php://input'), true);
    
    $name = $input['name'] ?? $user['name'];
    $email = $input['email'] ?? $user['email'];
    $phone = $input['phone'] ?? '';
    $address = $input['address'] ?? '';
    
    $db = MySQLConnection::getInstance();
    
    // Update user in database
    $db->query(
        "INSERT INTO users (id, email, name, phone, address, firstName, lastName, profileImageUrl, provider, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW()) 
         ON DUPLICATE KEY UPDATE 
         name = VALUES(name), phone = VALUES(phone), address = VALUES(address)",
        [
            $user['id'] ?? uniqid('user_'),
            $email,
            $name,
            $phone,
            $address,
            $user['firstName'] ?? '',
            $user['lastName'] ?? '',
            $user['profileImageUrl'] ?? '',
            $user['provider'] ?? 'auth0'
        ]
    );
    
    // Update session data
    $_SESSION['user'] = array_merge($user, [
        'name' => $name,
        'email' => $email,
        'phone' => $phone,
        'address' => $address
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Profile updated successfully',
        'user' => $_SESSION['user']
    ]);
} catch (Exception $e) {
    error_log('Profile update error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['message' => 'Failed to update profile']);
}
?>