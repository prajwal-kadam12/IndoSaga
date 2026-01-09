<?php
require_once __DIR__ . '/../php/config/cors.php';
require_once __DIR__ . '/../database/mysql_connection.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $row = dbFetch('SELECT COUNT(*) AS cnt FROM products');
    $count = isset($row['cnt']) ? (int)$row['cnt'] : 0;

    $samples = dbFetchAll('SELECT id, name, image_url, images FROM products LIMIT 10');

    echo json_encode([
        'success' => true,
        'count' => $count,
        'samples' => $samples
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

exit;
