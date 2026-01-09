<?php
require_once __DIR__ . '/../../php/config/cors.php';
/**
 * Payment Configuration API
 * GET /api/payment/config
 */

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
    exit;
}

try {
    // Get Razorpay configuration from environment
    $keyId = getenv('RAZORPAY_KEY_ID') ?: $_ENV['RAZORPAY_KEY_ID'] ?? null;
    $testKeyId = getenv('RAZORPAY_TEST_KEY_ID') ?: $_ENV['RAZORPAY_TEST_KEY_ID'] ?? null;
    
    // Prefer test credentials in development
    $configKeyId = $testKeyId ?: $keyId;
    
    if (!$configKeyId) {
        echo json_encode([
            'key' => null,
            'enabled' => false,
            'message' => 'Razorpay not configured'
        ]);
        exit;
    }
    
    echo json_encode([
        'key' => $configKeyId,
        'enabled' => true
    ]);
} catch (Exception $e) {
    error_log('Payment config error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['message' => 'Failed to fetch payment configuration']);
}
?>