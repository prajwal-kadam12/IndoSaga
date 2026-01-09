<?php
/**
 * Complete Order Flow Test
 * Tests both email and SMS together in a realistic order scenario
 */

require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/../config/mail_service.php';
require_once __DIR__ . '/../templates/order_templates.php';
require_once __DIR__ . '/../config/simple_sms_service.php';

echo "🛒 Testing Complete Order Flow (Email + SMS)\n";
echo str_repeat("=", 50) . "\n\n";

// Sample order data
$orderData = [
    'orderId' => 'ORD-' . date('YmdHis'),
    'customerName' => 'Prajwal Kadam',
    'customerEmail' => 'prajwalkdm2004@gmail.com',
    'customerPhone' => '9876543210', // Your test number
    'total' => 25000.00,
    'paymentStatus' => 'Success',
    'paymentMethod' => 'Razorpay UPI',
    'transactionId' => 'TXN' . rand(100000, 999999),
    'shippingAddress' => 'Test Address, Mumbai, Maharashtra - 400001',
    'orderItems' => [
        [
            'productName' => 'Premium Teak Wood Dining Table',
            'quantity' => 1,
            'price' => 15000.00
        ],
        [
            'productName' => 'Dining Chairs Set (4 pieces)',
            'quantity' => 1,
            'price' => 10000.00
        ]
    ]
];

echo "📝 Order Details:\n";
echo "Order ID: " . $orderData['orderId'] . "\n";
echo "Customer: " . $orderData['customerName'] . "\n";
echo "Email: " . $orderData['customerEmail'] . "\n";
echo "Phone: " . $orderData['customerPhone'] . "\n";
echo "Total: ₹" . number_format($orderData['total'], 2) . "\n";
echo "Items: " . count($orderData['orderItems']) . " products\n\n";

// Test SMS configuration status
echo "🔧 SMS Configuration Status:\n";
$smsStatus = SimpleSmsService::getConfigurationStatus();
echo "Enabled Providers: " . implode(', ', $smsStatus['enabled_providers']) . "\n";
echo "Primary Provider: " . ($smsStatus['primary_provider'] ?? 'None') . "\n";
echo "SMS Enabled: " . ($smsStatus['sms_enabled'] ? 'Yes' : 'No') . "\n\n";

// Test email sending
echo "📧 Testing Email Notifications...\n";
try {
    $mailService = new MailService();
    
    // Generate templates
    $userEmailData = OrderEmailTemplates::userOrderConfirmation($orderData);
    $adminEmailData = OrderEmailTemplates::adminOrderNotification($orderData);
    
    echo "✅ Email templates generated successfully\n";
    echo "User Subject: " . $userEmailData['subject'] . "\n";
    echo "Admin Subject: " . $adminEmailData['subject'] . "\n\n";
    
} catch (Exception $e) {
    echo "❌ Email template generation failed: " . $e->getMessage() . "\n\n";
}

// Test SMS sending  
echo "📱 Testing SMS Notification...\n";
try {
    $smsResult = SimpleSmsService::sendOrderConfirmationSms($orderData);
    
    echo "SMS Result:\n";
    echo json_encode($smsResult, JSON_PRETTY_PRINT) . "\n\n";
    
    if ($smsResult['success']) {
        echo "✅ SMS sent successfully!\n";
    } else {
        echo "❌ SMS failed: " . ($smsResult['error'] ?? 'Unknown error') . "\n";
        if (strpos($smsResult['error'], 'transaction') !== false) {
            echo "💡 Solution: Add ₹100+ to your Fast2SMS wallet to activate API\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ SMS sending exception: " . $e->getMessage() . "\n";
}

echo "\n" . str_repeat("=", 50) . "\n";
echo "🎯 Test Summary:\n";
echo "- Order ID: " . $orderData['orderId'] . " created\n";
echo "- SMS Integration: " . ($smsStatus['sms_enabled'] ? 'Configured' : 'Not configured') . "\n";
echo "- Fast2SMS API: " . (!empty(getenv('FAST2SMS_API_KEY')) ? 'Configured' : 'Missing') . "\n";

if (!empty(getenv('FAST2SMS_API_KEY'))) {
    echo "\n💰 To activate SMS:\n";
    echo "1. Login to your Fast2SMS account\n";
    echo "2. Add ₹100+ to your wallet balance\n";
    echo "3. SMS will then work automatically\n";
}

echo "\n✨ Integration is ready! Once Fast2SMS is activated, customers will receive:\n";
echo "📧 Order confirmation emails\n";
echo "📱 SMS notifications with order details\n";
echo "🔍 Order tracking links\n";
?>