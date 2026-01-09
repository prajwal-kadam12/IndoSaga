<?php
/**
 * Support Ticket Handler
 * Processes support ticket submission and sends dual emails (Admin + User)
 */

// Security: Only allow CLI execution, not HTTP requests
if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    exit('Forbidden: This script can only be executed via command line');
}


require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/../config/mail_service.php';
require_once __DIR__ . '/../templates/support_templates.php';

// Ensure classes are loaded
if (!class_exists('MailService')) {
    throw new Exception('MailService class not found - check mail_service.php');
}
if (!class_exists('SupportEmailTemplates')) {
    throw new Exception('SupportEmailTemplates class not found - check support_templates.php');
}

try {
    // Get JSON input from stdin for CLI execution
    $rawInput = file_get_contents('php://stdin');
    if (empty($rawInput)) {
        throw new Exception('No input data received from stdin');
    }
    
    $input = json_decode($rawInput, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON: ' . json_last_error_msg());
    }
    
    // Validate required fields
    $requiredFields = ['customerName', 'customerEmail', 'subject', 'message'];
    foreach ($requiredFields as $field) {
        if (empty($input[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }
    
    // Sanitize and prepare data
    $ticketData = [
        'customerName' => filter_var($input['customerName'], FILTER_SANITIZE_STRING),
        'customerEmail' => filter_var($input['customerEmail'], FILTER_SANITIZE_EMAIL),
        'customerPhone' => isset($input['customerPhone']) ? filter_var($input['customerPhone'], FILTER_SANITIZE_STRING) : '',
        'subject' => filter_var($input['subject'], FILTER_SANITIZE_STRING),
        'message' => filter_var($input['message'], FILTER_SANITIZE_STRING),
        'priority' => isset($input['priority']) ? filter_var($input['priority'], FILTER_SANITIZE_STRING) : 'medium'
    ];
    
    // Validate email format
    if (!filter_var($ticketData['customerEmail'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email format');
    }
    
    // Validate priority level
    $validPriorities = ['low', 'medium', 'high'];
    if (!in_array($ticketData['priority'], $validPriorities)) {
        $ticketData['priority'] = 'medium';
    }
    
    // Generate unique ticket ID
    $ticketData['ticketId'] = 'TKT-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
    
    // Initialize mail service
    $mailService = new MailService();
    
    // Generate email templates
    $userEmailData = SupportEmailTemplates::userSupportConfirmation($ticketData);
    $adminEmailData = SupportEmailTemplates::adminSupportNotification($ticketData);
    
    // Prepare email data for dual sending
    $userEmail = [
        'to' => $ticketData['customerEmail'],
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
    
    // Log the support ticket
    $logEntry = [
        'type' => 'support_ticket',
        'ticket_id' => $ticketData['ticketId'],
        'customer_email' => $ticketData['customerEmail'],
        'customer_name' => $ticketData['customerName'],
        'subject' => $ticketData['subject'],
        'priority' => $ticketData['priority'],
        'message_length' => strlen($ticketData['message']),
        'timestamp' => date('Y-m-d H:i:s'),
        'email_results' => $emailResults
    ];
    
    // Save to log file
    $logFile = __DIR__ . '/../logs/support_tickets.log';
    $logDir = dirname($logFile);
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    file_put_contents($logFile, json_encode($logEntry) . PHP_EOL, FILE_APPEND | LOCK_EX);
    
    // Response
    $response = [
        'success' => true,
        'message' => 'Support ticket created successfully',
        'ticket_id' => $ticketData['ticketId'],
        'email_results' => [
            'user_email_sent' => $emailResults['user_email']['success'],
            'admin_email_sent' => $emailResults['admin_email']['success']
        ],
        'data' => [
            'customer_name' => $ticketData['customerName'],
            'subject' => $ticketData['subject'],
            'priority' => $ticketData['priority'],
            'ticket_id' => $ticketData['ticketId']
        ]
    ];
    
    echo json_encode($response, JSON_PRETTY_PRINT);

} catch (Exception $e) {
    // Error response
    $errorResponse = [
        'success' => false,
        'message' => 'Support ticket creation failed',
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