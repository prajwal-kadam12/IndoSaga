<?php
require_once __DIR__ . '/../../php/config/cors.php';
/**
 * Logout User
 * POST /api/auth/logout
 */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
    exit;
}

try {
    // Destroy the session completely
    session_unset();
    session_destroy();
    
    // Clear the session cookie
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    
    echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
} catch (Exception $e) {
    error_log('Logout error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['message' => 'Logout failed']);
}
?>