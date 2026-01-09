<?php
require_once __DIR__ . '/../../php/config/cors.php';
/**
 * Verify Razorpay Payment API
 * POST /api/verify-razorpay-payment
 */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $razorpayPaymentId = $input['razorpay_payment_id'] ?? '';
    $razorpayOrderId = $input['razorpay_order_id'] ?? '';
    $razorpaySignature = $input['razorpay_signature'] ?? '';
    
    if (!$razorpayPaymentId || !$razorpayOrderId || !$razorpaySignature) {
        http_response_code(400);
        echo json_encode(['message' => 'Missing payment verification data']);
        exit;
    }
    
    // Get Razorpay credentials
    $keySecret = getenv('RAZORPAY_KEY_SECRET') ?: $_ENV['RAZORPAY_KEY_SECRET'] ?? null;
    $testKeySecret = getenv('RAZORPAY_TEST_KEY_SECRET') ?: $_ENV['RAZORPAY_TEST_KEY_SECRET'] ?? null;
    
    // Prefer test credentials in development
    $finalKeySecret = $testKeySecret ?: $keySecret;
    
    if (!$finalKeySecret) {
        http_response_code(500);
        echo json_encode(['message' => 'Razorpay not configured']);
        exit;
    }
    
    // Verify signature
    $expectedSignature = hash_hmac('sha256', $razorpayOrderId . "|" . $razorpayPaymentId, $finalKeySecret);
    
    if (!hash_equals($expectedSignature, $razorpaySignature)) {
        http_response_code(400);
        echo json_encode(['message' => 'Invalid payment signature']);
        exit;
    }
    
    // Payment verified successfully
    echo json_encode([
        'success' => true,
        'message' => 'Payment verified successfully',
        'payment_id' => $razorpayPaymentId,
        'order_id' => $razorpayOrderId
    ]);
} catch (Exception $e) {
    error_log('Razorpay verification error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['message' => 'Payment verification failed']);
}
?>