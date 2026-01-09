<?php
/**
 * SMS Testing Script
 * Test the SMS functionality with Fast2SMS
 */

require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/../config/simple_sms_service.php';

echo "Testing SMS Integration...\n\n";

// Test order data
$testOrderData = [
    'orderId' => 'TEST-' . date('YmdHis'),
    'customerName' => 'Test Customer',
    'customerPhone' => '9876543210', // Test Indian mobile number
    'total' => 2500.00,
    'paymentStatus' => 'Success'
];

echo "Test Order Data:\n";
echo "- Order ID: " . $testOrderData['orderId'] . "\n";
echo "- Customer: " . $testOrderData['customerName'] . "\n";
echo "- Phone: " . $testOrderData['customerPhone'] . "\n";
echo "- Amount: ₹" . number_format($testOrderData['total'], 2) . "\n\n";

// Check if API key is configured
$apiKey = getenv('FAST2SMS_API_KEY');
if (empty($apiKey)) {
    echo "❌ ERROR: FAST2SMS_API_KEY environment variable not set\n";
    exit(1);
} else {
    echo "✅ Fast2SMS API Key is configured\n";
    echo "Key: " . substr($apiKey, 0, 8) . "..." . substr($apiKey, -4) . "\n\n";
    
    // Check if Fast2SMS needs account activation
    echo "ℹ️  Note: Fast2SMS requires a minimum transaction of ₹100 before API access\n";
    echo "   If you see an error about transactions, you need to:\n";
    echo "   1. Login to your Fast2SMS account\n";
    echo "   2. Add ₹100 or more to your wallet\n";
    echo "   3. Your API will then be activated\n\n";
}

try {
    echo "Sending test SMS...\n";
    
    // Send SMS using SimpleSmsService
    $result = SimpleSmsService::sendOrderConfirmationSms($testOrderData);
    
    echo "SMS Result:\n";
    echo json_encode($result, JSON_PRETTY_PRINT) . "\n\n";
    
    if ($result['success']) {
        echo "✅ SMS sent successfully!\n";
        echo "Message: " . ($result['message'] ?? 'Order confirmation SMS sent') . "\n";
    } else {
        echo "❌ SMS sending failed!\n";
        echo "Error: " . ($result['error'] ?? 'Unknown error') . "\n";
        if (isset($result['details'])) {
            echo "Details: " . json_encode($result['details']) . "\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Exception occurred:\n";
    echo "Error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}

echo "\nTest completed.\n";
?>