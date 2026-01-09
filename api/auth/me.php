<?php
require_once __DIR__ . '/../../php/config/cors.php';
/**
 * Check Authentication Status
 * GET /api/auth/me
 */

require_once __DIR__ . '/../../database/mysql_connection.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
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
    
    // Get complete user data from database
    $db = MySQLConnection::getInstance();
    $stmt = $db->query(
        "SELECT * FROM users WHERE email = ?", 
        [$user['email']]
    );
    $dbUser = $stmt->fetch();
    
    if ($dbUser) {
        // Merge session data with database data
        $completeUser = array_merge($user, [
            'name' => $dbUser['name'] ?: $user['name'],
            'phone' => $dbUser['phone'] ?: '',
            'address' => $dbUser['address'] ?: '',
            'firstName' => $dbUser['firstName'] ?: $user['given_name'],
            'lastName' => $dbUser['lastName'] ?: $user['family_name'],
            'profileImageUrl' => $dbUser['profileImageUrl'] ?: $user['picture']
        ]);
        
        echo json_encode($completeUser);
    } else {
        // Return session data if no database record
        echo json_encode($user);
    }
} catch (Exception $e) {
    error_log('Auth me error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['message' => 'Authentication error']);
}
?>