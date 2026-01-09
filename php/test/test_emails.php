<?php
/**
 * Email Integration Testing Script
 * Tests all 4 email handlers with sample data
 */

require_once __DIR__ . '/../config/mail_service.php';

// Color output for terminal
function colorOutput($text, $color = 'white') {
    $colors = [
        'red' => '0;31',
        'green' => '0;32',
        'yellow' => '1;33',
        'blue' => '0;34',
        'purple' => '0;35',
        'cyan' => '0;36',
        'white' => '0;37'
    ];
    
    $colorCode = $colors[$color] ?? $colors['white'];
    return "\033[{$colorCode}m{$text}\033[0m";
}

function testEmailHandler($url, $data, $testName) {
    echo colorOutput("\n🧪 Testing: $testName", 'cyan') . "\n";
    echo "URL: $url\n";
    echo "Data: " . json_encode($data, JSON_PRETTY_PRINT) . "\n";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        echo colorOutput("❌ CURL Error: $error", 'red') . "\n";
        return false;
    }
    
    echo "HTTP Code: $httpCode\n";
    
    if ($httpCode === 200) {
        echo colorOutput("✅ SUCCESS", 'green') . "\n";
        $result = json_decode($response, true);
        if ($result) {
            echo "Response: " . json_encode($result, JSON_PRETTY_PRINT) . "\n";
        }
        return true;
    } else {
        echo colorOutput("❌ FAILED", 'red') . "\n";
        echo "Response: $response\n";
        return false;
    }
}

// Test configuration
echo colorOutput("🏡 IndoSaga Email Integration - Testing Suite", 'yellow') . "\n";
echo colorOutput("=" . str_repeat("=", 50), 'yellow') . "\n";

$baseUrl = 'http://localhost:5000/php/handlers';

// Check if .env configuration exists
echo colorOutput("\n🔧 Checking Configuration...", 'cyan') . "\n";

$config = include __DIR__ . '/../config/email_config.php';
$mailService = new MailService();
$serviceConfig = $mailService->getConfig();

echo "SMTP Provider: " . $serviceConfig['provider'] . "\n";
echo "SMTP Host: " . $serviceConfig[$serviceConfig['provider']]['host'] . "\n";
echo "Admin Email: " . $serviceConfig['admin_email'] . "\n";

if (empty($serviceConfig[$serviceConfig['provider']]['username']) || 
    empty($serviceConfig[$serviceConfig['provider']]['password'])) {
    echo colorOutput("⚠️  WARNING: SMTP credentials not configured! Emails will be logged but not sent.", 'yellow') . "\n";
}

// Test 1: Contact Us Enquiry
$contactData = [
    'name' => 'John Smith',
    'email' => 'john.smith@example.com',
    'phone' => '+91-9876543210',
    'company' => 'Smith Interior Design',
    'subject' => 'Inquiry about Custom Furniture',
    'message' => 'Hi, I am interested in custom teak wood furniture for my new home. Could you please provide more details about your dining table collection and pricing?',
    'category' => 'Custom Furniture'
];

$test1 = testEmailHandler("$baseUrl/contact_us.php", $contactData, "Contact Us Enquiry");

// Test 2: Meeting Booking
$meetingData = [
    'customerName' => 'Sarah Johnson',
    'customerEmail' => 'sarah.johnson@example.com',
    'customerPhone' => '+91-9123456789',
    'appointmentDate' => date('Y-m-d', strtotime('+3 days')),
    'appointmentTime' => '2:00 PM',
    'meetingType' => 'virtual_showroom',
    'notes' => 'Interested in bedroom furniture set and looking for quick delivery options.'
];

$test2 = testEmailHandler("$baseUrl/book_meeting.php", $meetingData, "Virtual Meeting Booking");

// Test 3: Support Ticket
$supportData = [
    'customerName' => 'Mike Wilson',
    'customerEmail' => 'mike.wilson@example.com',
    'customerPhone' => '+91-9555123456',
    'subject' => 'Question about Warranty Coverage',
    'message' => 'I purchased a dining table 6 months ago and noticed a small crack in the wood. Is this covered under warranty? Order ID: #12345',
    'priority' => 'medium'
];

$test3 = testEmailHandler("$baseUrl/support_ticket.php", $supportData, "Support Ticket Submission");

// Test 4: Order Success
$orderData = [
    'orderId' => 'ORD-' . date('Ymd') . '-' . rand(1000, 9999),
    'customerName' => 'Emily Davis',
    'customerEmail' => 'emily.davis@example.com',
    'customerPhone' => '+91-9888777666',
    'total' => 45000,
    'paymentStatus' => 'paid',
    'paymentMethod' => 'Razorpay UPI',
    'shippingAddress' => '123 Park Avenue, Sector 12, Gurgaon, Haryana - 122001',
    'orderItems' => [
        [
            'productName' => 'Premium Teak Wood Dining Table',
            'quantity' => 1,
            'price' => 35000
        ],
        [
            'productName' => 'Matching Dining Chairs (Set of 4)',
            'quantity' => 1,
            'price' => 10000
        ]
    ]
];

$test4 = testEmailHandler("$baseUrl/order_success.php", $orderData, "Order Success Confirmation");

// Summary
echo colorOutput("\n📊 Test Results Summary", 'cyan') . "\n";
echo colorOutput("=" . str_repeat("=", 30), 'cyan') . "\n";

$tests = [
    'Contact Us Enquiry' => $test1,
    'Meeting Booking' => $test2,
    'Support Ticket' => $test3,
    'Order Success' => $test4
];

$passedCount = 0;
foreach ($tests as $testName => $result) {
    $status = $result ? colorOutput("✅ PASSED", 'green') : colorOutput("❌ FAILED", 'red');
    echo "$testName: $status\n";
    if ($result) $passedCount++;
}

echo colorOutput("\nOverall Result: $passedCount/" . count($tests) . " tests passed", 
    $passedCount === count($tests) ? 'green' : 'yellow') . "\n";

// Log file check
echo colorOutput("\n📁 Log Files Generated:", 'cyan') . "\n";
$logDir = __DIR__ . '/../logs';
if (is_dir($logDir)) {
    $logFiles = scandir($logDir);
    foreach ($logFiles as $file) {
        if ($file !== '.' && $file !== '..' && pathinfo($file, PATHINFO_EXTENSION) === 'log') {
            $filePath = $logDir . '/' . $file;
            $size = file_exists($filePath) ? filesize($filePath) : 0;
            echo "📄 $file (" . ($size > 0 ? $size . " bytes" : "empty") . ")\n";
        }
    }
} else {
    echo colorOutput("⚠️  Log directory not found", 'yellow') . "\n";
}

echo colorOutput("\n✨ Testing completed!", 'green') . "\n";
echo colorOutput("Check the log files in php/logs/ for detailed email delivery information.", 'white') . "\n";

// Manual testing instructions
echo colorOutput("\n🔧 Manual Testing Instructions:", 'cyan') . "\n";
echo "1. Configure SMTP credentials in .env file\n";
echo "2. Run this script: php php/test/test_emails.php\n";
echo "3. Check your email inbox (both admin and test emails)\n";
echo "4. Verify log files in php/logs/ directory\n";
echo "5. Test integration with your frontend application\n";

echo colorOutput("\n📧 SMTP Configuration Help:", 'yellow') . "\n";
echo "Gmail: Enable 2FA and create App Password\n";
echo "SendGrid: Create account and get API key\n";
echo "Add credentials to .env file in project root\n";
?>