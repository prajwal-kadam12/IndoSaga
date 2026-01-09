<?php
/**
 * Order Success Handler (Buy Now)
 * Processes successful order and sends dual emails (Admin + User)
 */

// Security: Only allow CLI execution, not HTTP requests
if (php_sapi_name() !== 'cli') {
    exit('Forbidden: This script can only be executed via command line');
}

require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/../config/mail_service.php';
require_once __DIR__ . '/../templates/order_templates.php';
require_once __DIR__ . '/../config/simple_sms_service.php';

// Ensure classes are loaded
if (!class_exists('MailService')) {
    throw new Exception('MailService class not found - check mail_service.php');
}
if (!class_exists('OrderEmailTemplates')) {
    throw new Exception('OrderEmailTemplates class not found - check order_templates.php');
}
if (!class_exists('SimpleSmsService')) {
    throw new Exception('SimpleSmsService class not found - check simple_sms_service.php');
}

try {
    // Get JSON input from stdin for CLI execution
    $rawInput = file_get_contents('php://stdin');
    if (empty($rawInput)) {
        throw new Exception('No input data received from stdin');
    }
    
    $input = json_decode($rawInput, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON: ' . json_last_error_msg() . ' - Raw input: ' . substr($rawInput, 0, 100));
    }
    
    // Validate required fields
    $requiredFields = ['orderId', 'customerName', 'customerEmail', 'total', 'paymentStatus'];
    foreach ($requiredFields as $field) {
        if (empty($input[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }
    
    // Sanitize and prepare data
    $orderData = [
        'orderId' => filter_var($input['orderId'], FILTER_SANITIZE_STRING),
        'customerName' => filter_var($input['customerName'], FILTER_SANITIZE_STRING),
        'customerEmail' => filter_var($input['customerEmail'], FILTER_SANITIZE_EMAIL),
        'customerPhone' => isset($input['customerPhone']) ? filter_var($input['customerPhone'], FILTER_SANITIZE_STRING) : '',
        'total' => filter_var($input['total'], FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION),
        'paymentStatus' => filter_var($input['paymentStatus'], FILTER_SANITIZE_STRING),
        'paymentMethod' => isset($input['paymentMethod']) ? filter_var($input['paymentMethod'], FILTER_SANITIZE_STRING) : 'Online Payment',
        'transactionId' => isset($input['transactionId']) ? filter_var($input['transactionId'], FILTER_SANITIZE_STRING) : '',
        'shippingAddress' => isset($input['shippingAddress']) ? filter_var($input['shippingAddress'], FILTER_SANITIZE_STRING) : '',
        'orderItems' => isset($input['orderItems']) ? $input['orderItems'] : []
    ];
    
    // Validate email format
    if (!filter_var($orderData['customerEmail'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email format');
    }
    
    // Validate and sanitize order items
    $sanitizedItems = [];
    if (is_array($orderData['orderItems'])) {
        foreach ($orderData['orderItems'] as $item) {
            $sanitizedItems[] = [
                'productName' => filter_var($item['productName'] ?? '', FILTER_SANITIZE_STRING),
                'quantity' => filter_var($item['quantity'] ?? 1, FILTER_SANITIZE_NUMBER_INT),
                'price' => filter_var($item['price'] ?? 0, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION)
            ];
        }
    }
    $orderData['orderItems'] = $sanitizedItems;
    
    // Initialize mail service
    $mailService = new MailService();
    
    // Generate email templates
    $userEmailData = OrderEmailTemplates::userOrderConfirmation($orderData);
    $adminEmailData = OrderEmailTemplates::adminOrderNotification($orderData);
    
    // Prepare email data for dual sending
    $userEmail = [
        'to' => $orderData['customerEmail'],
        'subject' => $userEmailData['subject'],
        'body' => $userEmailData['body']
    ];
    
    $adminEmail = [
        'to' => ADMIN_EMAIL,
        'subject' => $adminEmailData['subject'],
        'body' => $adminEmailData['body']
    ];
    
    // Send dual emails
    $emailResults = $mailService->sendDualEmails($userEmail, $adminEmail);
    
    // Send SMS notification if phone number is provided
    $smsResult = ['success' => false, 'message' => 'No phone number provided', 'skipped' => true];
    
    if (!empty($orderData['customerPhone'])) {
        try {
            $smsResult = SimpleSmsService::sendOrderConfirmationSms($orderData);
        } catch (Exception $smsException) {
            // Don't fail the whole process if SMS fails
            $smsResult = [
                'success' => false,
                'error' => $smsException->getMessage(),
                'phone' => $orderData['customerPhone']
            ];
            error_log("SMS sending failed but continuing: " . $smsException->getMessage());
        }
    }
    
    // Log the order
    $logEntry = [
        'type' => 'order_success',
        'order_id' => $orderData['orderId'],
        'customer_email' => $orderData['customerEmail'],
        'customer_name' => $orderData['customerName'],
        'total_amount' => $orderData['total'],
        'payment_status' => $orderData['paymentStatus'],
        'payment_method' => $orderData['paymentMethod'],
        'item_count' => count($orderData['orderItems']),
        'timestamp' => date('Y-m-d H:i:s'),
        'email_results' => $emailResults,
        'sms_result' => $smsResult
    ];
    
    // Save to log file
    $logFile = __DIR__ . '/../logs/order_success.log';
    $logDir = dirname($logFile);
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    file_put_contents($logFile, json_encode($logEntry) . PHP_EOL, FILE_APPEND | LOCK_EX);
    
    // Response
    $response = [
        'success' => true,
        'message' => 'Order confirmation emails sent successfully',
        'order_id' => $orderData['orderId'],
        'email_results' => [
            'user_email_sent' => $emailResults['user_email']['success'],
            'admin_email_sent' => $emailResults['admin_email']['success']
        ],
        'sms_result' => [
            'sms_sent' => $smsResult['success'],
            'sms_message' => $smsResult['success'] ? 'SMS sent successfully' : ($smsResult['error'] ?? $smsResult['message'] ?? 'SMS sending failed'),
            'phone_number' => !empty($orderData['customerPhone']) ? $orderData['customerPhone'] : 'Not provided'
        ],
        'data' => [
            'customer_name' => $orderData['customerName'],
            'total_amount' => $orderData['total'],
            'payment_status' => $orderData['paymentStatus'],
            'items_count' => count($orderData['orderItems'])
        ]
    ];
    
    echo json_encode($response, JSON_PRETTY_PRINT);

} catch (Exception $e) {
    // Error response
    $errorResponse = [
        'success' => false,
        'message' => 'Order email notification failed',
        'error' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    // Log error
    $errorLog = __DIR__ . '/../logs/errors.log';
    $errorDir = dirname($errorLog);
    if (!is_dir($errorDir)) {
        mkdir($errorDir, 0755, true);
    }
    file_put_contents($errorLog, json_encode($errorResponse) . PHP_EOL, FILE_APPEND | LOCK_EX);
    
    http_response_code(400);
    echo json_encode($errorResponse, JSON_PRETTY_PRINT);
}
?>