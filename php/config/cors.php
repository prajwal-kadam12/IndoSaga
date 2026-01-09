<?php
// CORS helper - include at start of API entrypoints

$allowedOrigin = getenv('FRONTEND_URL') ?: (isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*');

// Restrict wildcard in production if FRONTEND_URL is set
if (getenv('FRONTEND_URL')) {
    $allowedOrigin = getenv('FRONTEND_URL');
}

header('Access-Control-Allow-Origin: ' . $allowedOrigin);
header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

?>
