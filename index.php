<?php
/**
 * Main Entry Point for IndoSaga PHP Application
 * Handles both API and static file serving
 */

// Get the request URI
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Handle API requests
if (strpos($requestUri, '/api/') === 0) {
    // Include the API router
    require_once __DIR__ . '/api/index.php';
    exit();
}

// For all other requests, serve the static React app
$staticFile = __DIR__ . '/dist' . $requestUri;

// Check if it's a static file that exists
if (file_exists($staticFile) && !is_dir($staticFile)) {
    // Serve the static file
    $extension = pathinfo($staticFile, PATHINFO_EXTENSION);
    
    // Set appropriate content type
    $contentTypes = [
        'html' => 'text/html',
        'css' => 'text/css',
        'js' => 'application/javascript',
        'json' => 'application/json',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'svg' => 'image/svg+xml',
        'ico' => 'image/x-icon',
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
        'ttf' => 'font/ttf',
        'eot' => 'application/vnd.ms-fontobject'
    ];
    
    if (isset($contentTypes[$extension])) {
        header('Content-Type: ' . $contentTypes[$extension]);
    }
    
    readfile($staticFile);
    exit();
}

// For all other requests (SPA routing), serve index.html
$indexFile = __DIR__ . '/dist/index.html';

if (file_exists($indexFile)) {
    header('Content-Type: text/html');
    readfile($indexFile);
} else {
    // Fallback if built app doesn't exist
    header('Content-Type: text/html');
    echo '<!DOCTYPE html>
<html>
<head>
    <title>IndoSaga Furniture</title>
</head>
<body>
    <h1>🏡 IndoSaga Furniture</h1>
    <p>✅ PHP Backend is running successfully!</p>
    <p>📋 Please build the frontend app:</p>
    <pre>npm run build</pre>
    <p>🌐 API is available at: <a href="/api">/api</a></p>
    <p>🔗 Test endpoints:</p>
    <ul>
        <li><a href="/api/categories">Categories</a></li>
        <li><a href="/api/products">Products</a></li>
        <li><a href="/api/products/featured">Featured Products</a></li>
    </ul>
</body>
</html>';
}
?>