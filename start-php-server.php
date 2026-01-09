<?php
/**
 * Start PHP Development Server for IndoSaga
 * This starts a PHP server that works with both the API and static files
 */

$host = '0.0.0.0';
$port = 5002;

echo "🚀 Starting IndoSaga PHP Server...\n";
echo "📍 Host: $host\n";
echo "📍 Port: $port\n";
echo "📂 Document Root: " . __DIR__ . "\n";
echo "🌐 Access URL: http://$host:$port\n";
echo "🔗 API Endpoint: http://$host:$port/api\n\n";

echo "✅ PHP Backend Features:\n";
echo "  - cPanel MySQL Database Integration\n";
echo "  - Complete REST API\n";
echo "  - Auth0 Authentication Support\n";
echo "  - Razorpay Payment Integration\n";
echo "  - Email & SMS Notifications\n";
echo "  - Cross-platform Compatibility\n\n";

echo "📋 API Endpoints Available:\n";
echo "  GET  /api/products - Get all products\n";
echo "  GET  /api/categories - Get categories\n";
echo "  GET  /api/cart - Get cart items\n";
echo "  POST /api/auth/sync - Sync authentication\n";
echo "  POST /api/orders - Create order\n";
echo "  POST /api/contact - Contact form\n";
echo "  ... and many more!\n\n";

echo "🔄 Starting server...\n\n";

// Start the PHP built-in server
$command = "php -S $host:$port";
passthru($command);
?>