<?php
/**
 * Main API Router for IndoSaga Furniture
 * Handles all API requests and routes them to appropriate handlers
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include database connection
require_once __DIR__ . '/../database/mysql_connection.php';

// Start session for authentication
session_start();

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = str_replace('/api', '', $path); // Remove /api prefix

// Parse request body for POST/PUT requests
$input = json_decode(file_get_contents('php://input'), true);
if ($input === null && in_array($method, ['POST', 'PUT'])) {
    $input = $_POST;
}

// Route handler
try {
    switch ($path) {
        // Authentication routes
        case '/auth/me':
            require_once __DIR__ . '/auth/me.php';
            break;
        case '/auth/sync':
            require_once __DIR__ . '/auth/sync.php';
            break;
        case '/auth/logout':
            require_once __DIR__ . '/auth/logout.php';
            break;
        case '/auth/profile':
            require_once __DIR__ . '/auth/profile.php';
            break;
            
        // Product routes
        case '/products':
            require_once __DIR__ . '/products/index.php';
            break;
        case '/products/featured':
            require_once __DIR__ . '/products/featured.php';
            break;
        case '/products/deals':
            require_once __DIR__ . '/products/deals.php';
            break;
            
        // Category routes
        case '/categories':
            require_once __DIR__ . '/categories/index.php';
            break;
        case '/subcategories':
            require_once __DIR__ . '/subcategories/index.php';
            break;
            
        // Cart routes
        case '/cart':
            require_once __DIR__ . '/cart/index.php';
            break;
            
        // Wishlist routes
        case '/wishlist':
            require_once __DIR__ . '/wishlist/index.php';
            break;
            
        // Order routes
        case '/orders':
            require_once __DIR__ . '/orders/index.php';
            break;
        case '/orders/direct-checkout':
            require_once __DIR__ . '/orders/direct-checkout.php';
            break;
            
        // Payment routes
        case '/payment/config':
            require_once __DIR__ . '/payment/config.php';
            break;
        case '/create-razorpay-order':
            require_once __DIR__ . '/payment/create-razorpay-order.php';
            break;
        case '/verify-razorpay-payment':
            require_once __DIR__ . '/payment/verify-razorpay.php';
            break;
            
        // Contact routes
        case '/contact':
            require_once __DIR__ . '/contact/index.php';
            break;
            
        // Support routes
        case '/support/tickets':
            require_once __DIR__ . '/support/tickets.php';
            break;
            
        // Appointment routes
        case '/appointments':
            require_once __DIR__ . '/appointments/index.php';
            break;
            
        // Video call routes
        case '/video-call/start':
            require_once __DIR__ . '/video-call/start.php';
            break;
            
        default:
            // Handle dynamic routes with parameters
            if (preg_match('/^\/products\/([a-zA-Z0-9\-]+)$/', $path, $matches)) {
                $_GET['id'] = $matches[1];
                require_once __DIR__ . '/products/single.php';
            } elseif (preg_match('/^\/products\/([a-zA-Z0-9\-]+)\/reviews$/', $path, $matches)) {
                $_GET['productId'] = $matches[1];
                require_once __DIR__ . '/products/reviews.php';
            } elseif (preg_match('/^\/products\/([a-zA-Z0-9\-]+)\/questions$/', $path, $matches)) {
                $_GET['productId'] = $matches[1];
                require_once __DIR__ . '/products/questions.php';
            } elseif (preg_match('/^\/orders\/([a-zA-Z0-9\-]+)$/', $path, $matches)) {
                $_GET['id'] = $matches[1];
                require_once __DIR__ . '/orders/single.php';
            } elseif (preg_match('/^\/orders\/([a-zA-Z0-9\-]+)\/cancel$/', $path, $matches)) {
                $_GET['id'] = $matches[1];
                require_once __DIR__ . '/orders/cancel.php';
            } else {
                http_response_code(404);
                echo json_encode(['message' => 'Endpoint not found']);
            }
    }
} catch (Exception $e) {
    error_log('API Error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['message' => 'Internal server error']);
}
?>