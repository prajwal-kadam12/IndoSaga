<?php
/**
 * Contact Us Handler
 * Processes contact enquiry form and sends dual emails (Admin + User)
 */

// Security: Only allow CLI execution, not HTTP requests
if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    exit('Forbidden: This script can only be executed via command line');
}


require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/../config/mail_service.php';
require_once __DIR__ . '/../templates/contact_templates.php';

// Ensure classes are loaded
if (!class_exists('MailService')) {
    throw new Exception('MailService class not found - check mail_service.php');
}
if (!class_exists('ContactEmailTemplates')) {
    throw new Exception('ContactEmailTemplates class not found - check contact_templates.php');
}

try {
    // Get JSON input from stdin for CLI execution
    $rawInput = file_get_contents('php://stdin');
    
    if (empty($rawInput)) {
        throw new Exception('No input data received');
    }
    
    $input = json_decode($rawInput, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON: ' . json_last_error_msg() . ' - Raw input: ' . substr($rawInput, 0, 100));
    }
    
    // Validate required fields
    $requiredFields = ['name', 'email', 'subject', 'message'];
    foreach ($requiredFields as $field) {
        if (empty($input[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }
    
    // Sanitize and prepare data
    $contactData = [
        'name' => filter_var($input['name'], FILTER_SANITIZE_STRING),
        'email' => filter_var($input['email'], FILTER_SANITIZE_EMAIL),
        'phone' => isset($input['phone']) ? filter_var($input['phone'], FILTER_SANITIZE_STRING) : '',
        'company' => isset($input['company']) ? filter_var($input['company'], FILTER_SANITIZE_STRING) : '',
        'subject' => filter_var($input['subject'], FILTER_SANITIZE_STRING),
        'message' => filter_var($input['message'], FILTER_SANITIZE_STRING),
        'category' => isset($input['category']) ? filter_var($input['category'], FILTER_SANITIZE_STRING) : 'General Enquiry'
    ];
    
    // Validate email format
    if (!filter_var($contactData['email'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email format');
    }
    
    // Generate unique enquiry ID
    $contactData['enquiryId'] = 'ENQ-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
    
    // Initialize mail service
    $mailService = new MailService();
    
    // Generate email templates
    $userEmailData = ContactEmailTemplates::userContactAcknowledgment($contactData);
    $adminEmailData = ContactEmailTemplates::adminContactNotification($contactData);
    
    // Prepare email data for dual sending
    $userEmail = [
        'to' => $contactData['email'],
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
    
    // Log the contact enquiry
    $logEntry = [
        'type' => 'contact_enquiry',
        'enquiry_id' => $contactData['enquiryId'],
        'customer_email' => $contactData['email'],
        'customer_name' => $contactData['name'],
        'subject' => $contactData['subject'],
        'category' => $contactData['category'],
        'has_phone' => !empty($contactData['phone']),
        'has_company' => !empty($contactData['company']),
        'message_length' => strlen($contactData['message']),
        'timestamp' => date('Y-m-d H:i:s'),
        'email_results' => $emailResults
    ];
    
    // Save to log file
    $logFile = __DIR__ . '/../logs/contact_enquiries.log';
    $logDir = dirname($logFile);
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    file_put_contents($logFile, json_encode($logEntry) . PHP_EOL, FILE_APPEND | LOCK_EX);
    
    // Response
    $response = [
        'success' => true,
        'message' => 'Contact enquiry submitted successfully',
        'enquiry_id' => $contactData['enquiryId'],
        'email_results' => [
            'user_email_sent' => $emailResults['user_email']['success'],
            'admin_email_sent' => $emailResults['admin_email']['success']
        ],
        'data' => [
            'customer_name' => $contactData['name'],
            'subject' => $contactData['subject'],
            'category' => $contactData['category'],
            'enquiry_id' => $contactData['enquiryId']
        ]
    ];
    
    echo json_encode($response, JSON_PRETTY_PRINT);

} catch (Exception $e) {
    // Error response
    $errorResponse = [
        'success' => false,
        'message' => 'Contact enquiry submission failed',
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