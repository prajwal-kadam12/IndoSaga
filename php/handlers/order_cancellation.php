<?php
// Order Cancellation Handler for IndoSaga Furniture
// Handles cancellation email notifications to customers and admin

require_once __DIR__ . '/../config/email_config.php';
require_once __DIR__ . '/../config/mail_service.php';
require_once __DIR__ . '/../templates/cancellation_templates.php';

// Set content type for JSON responses
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle both HTTP POST requests and command line execution
$isCommandLine = (php_sapi_name() === 'cli');

if (!$isCommandLine) {
    // Handle preflight requests
    if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }

    // Only allow POST requests for HTTP
    if (!isset($_SERVER['REQUEST_METHOD']) || $_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        exit();
    }
}

// Function to log cancellation activities
function logCancellation($message) {
    $logFile = __DIR__ . '/../logs/order_cancellations.log';
    $logDir = dirname($logFile);
    
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    $timestamp = date('Y-m-d H:i:s');
    $logMessage = "[{$timestamp}] {$message}" . PHP_EOL;
    file_put_contents($logFile, $logMessage, FILE_APPEND | LOCK_EX);
}

try {
    // Get JSON input from stdin or php://input
    $input = '';
    if ($isCommandLine) {
        // For command line execution, read from stdin
        $input = stream_get_contents(STDIN);
    } else {
        // For HTTP requests, read from php://input
        $input = file_get_contents('php://input');
    }
    
    // Trim whitespace and newlines
    $input = trim($input);
    
    // Debug: Log the raw input for troubleshooting
    logCancellation("Raw input received (length: " . strlen($input) . "): " . $input);
    
    if (empty($input)) {
        throw new Exception('No input data received');
    }
    
    $data = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        logCancellation("JSON decode error: " . json_last_error_msg() . " | Raw input: " . $input);
        throw new Exception('Invalid JSON input: ' . json_last_error_msg());
    }
    
    // Debug: Log parsed data
    logCancellation("Parsed JSON data: " . json_encode($data));
    
    // Validate required fields
    $requiredFields = ['orderId', 'customerName', 'customerEmail', 'orderTotal'];
    foreach ($requiredFields as $field) {
        if (empty($data[$field])) {
            throw new Exception("Missing required field: {$field}");
        }
    }
    
    // Sanitize input data
    $cancellationData = [
        'orderId' => htmlspecialchars($data['orderId']),
        'customerName' => htmlspecialchars($data['customerName']),
        'customerEmail' => filter_var($data['customerEmail'], FILTER_SANITIZE_EMAIL),
        'reason' => htmlspecialchars($data['reason'] ?? 'Not specified'),
        'details' => htmlspecialchars($data['details'] ?? ''),
        'orderTotal' => htmlspecialchars($data['orderTotal']),
        'cancellationDate' => $data['cancellationDate'] ?? date('c')
    ];
    
    // Validate email format
    if (!filter_var($cancellationData['customerEmail'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid customer email format');
    }
    
    // Log cancellation attempt
    logCancellation("Processing cancellation for Order {$cancellationData['orderId']} - Customer: {$cancellationData['customerName']} - Reason: {$cancellationData['reason']}");
    
    // Generate email templates
    $emailTemplates = generateCancellationEmailTemplates($cancellationData);
    
    // Get email configuration and admin email
    $emailConfig = include __DIR__ . '/../config/email_config.php';
    $adminEmail = 'kadamprajwal358@gmail.com'; // ADMIN_EMAIL constant
    
    $emailResults = [
        'customer_email_sent' => false,
        'admin_email_sent' => false,
        'errors' => []
    ];
    
    // Send customer cancellation confirmation email
    try {
        $customerEmailResult = sendMail(
            $cancellationData['customerEmail'],
            $emailTemplates['customer']['subject'],
            $emailTemplates['customer']['body']
        );
        
        $customerEmailSent = $customerEmailResult['success'];
        
        if ($customerEmailSent) {
            $emailResults['customer_email_sent'] = true;
            logCancellation("Customer cancellation email sent successfully to {$cancellationData['customerEmail']}");
        } else {
            $emailResults['errors'][] = 'Failed to send customer cancellation email';
            logCancellation("Failed to send customer cancellation email to {$cancellationData['customerEmail']}");
        }
    } catch (Exception $e) {
        $emailResults['errors'][] = 'Customer email error: ' . $e->getMessage();
        logCancellation("Customer email error: " . $e->getMessage());
    }
    
    // Send admin cancellation notification email
    try {
        $adminEmailResult = sendMail(
            $adminEmail,
            $emailTemplates['admin']['subject'],
            $emailTemplates['admin']['body']
        );
        
        $adminEmailSent = $adminEmailResult['success'];
        
        if ($adminEmailSent) {
            $emailResults['admin_email_sent'] = true;
            logCancellation("Admin cancellation notification sent successfully to {$adminEmail}");
        } else {
            $emailResults['errors'][] = 'Failed to send admin cancellation notification';
            logCancellation("Failed to send admin cancellation notification to {$adminEmail}");
        }
    } catch (Exception $e) {
        $emailResults['errors'][] = 'Admin email error: ' . $e->getMessage();
        logCancellation("Admin email error: " . $e->getMessage());
    }
    
    // Prepare response
    $response = [
        'success' => true,
        'message' => 'Order cancellation emails processed',
        'order_id' => $cancellationData['orderId'],
        'email_results' => $emailResults,
        'cancellation_data' => [
            'customer_name' => $cancellationData['customerName'],
            'customer_email' => $cancellationData['customerEmail'],
            'reason' => $cancellationData['reason'],
            'order_total' => $cancellationData['orderTotal'],
            'cancellation_date' => $cancellationData['cancellationDate']
        ]
    ];
    
    // Log successful completion
    logCancellation("Cancellation processing completed for Order {$cancellationData['orderId']} - Customer emails: " . ($emailResults['customer_email_sent'] ? 'SUCCESS' : 'FAILED') . " - Admin emails: " . ($emailResults['admin_email_sent'] ? 'SUCCESS' : 'FAILED'));
    
    // Return success response
    echo json_encode($response);
    
} catch (Exception $e) {
    // Log error
    logCancellation("Error processing cancellation: " . $e->getMessage());
    
    // Return error response
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to process order cancellation',
        'error' => $e->getMessage()
    ]);
}
?>