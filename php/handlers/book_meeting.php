<?php
/**
 * Virtual Meeting Booking Handler
 * Processes meeting booking form and sends dual emails (Admin + User)
 */

// Security: Only allow CLI execution, not HTTP requests
if (php_sapi_name() !== 'cli') {
    http_response_code(403);
    exit('Forbidden: This script can only be executed via command line');
}


require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/../config/mail_service.php';
require_once __DIR__ . '/../templates/meeting_templates.php';

// Ensure classes are loaded
if (!class_exists('MailService')) {
    throw new Exception('MailService class not found - check mail_service.php');
}
if (!class_exists('MeetingEmailTemplates')) {
    throw new Exception('MeetingEmailTemplates class not found - check meeting_templates.php');
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
    $requiredFields = ['customerName', 'customerEmail', 'appointmentDate', 'appointmentTime', 'meetingType'];
    foreach ($requiredFields as $field) {
        if (empty($input[$field])) {
            throw new Exception("Missing required field: $field");
        }
    }
    
    // Sanitize and prepare data
    $meetingData = [
        'customerName' => filter_var($input['customerName'], FILTER_SANITIZE_STRING),
        'customerEmail' => filter_var($input['customerEmail'], FILTER_SANITIZE_EMAIL),
        'customerPhone' => isset($input['customerPhone']) ? filter_var($input['customerPhone'], FILTER_SANITIZE_STRING) : '',
        'appointmentDate' => filter_var($input['appointmentDate'], FILTER_SANITIZE_STRING),
        'appointmentTime' => filter_var($input['appointmentTime'], FILTER_SANITIZE_STRING),
        'meetingType' => filter_var($input['meetingType'], FILTER_SANITIZE_STRING),
        'notes' => isset($input['notes']) ? filter_var($input['notes'], FILTER_SANITIZE_STRING) : ''
    ];
    
    // Validate email format
    if (!filter_var($meetingData['customerEmail'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Invalid email format');
    }
    
    // Generate unique meeting ID
    $meetingData['meetingId'] = 'MTG-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6));
    
    // Initialize mail service
    $mailService = new MailService();
    
    // Generate email templates
    $userEmailData = MeetingEmailTemplates::userMeetingConfirmation($meetingData);
    $adminEmailData = MeetingEmailTemplates::adminMeetingNotification($meetingData);
    
    // Prepare email data for dual sending
    $userEmail = [
        'to' => $meetingData['customerEmail'],
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
    
    // Log the meeting booking
    $logEntry = [
        'type' => 'meeting_booking',
        'meeting_id' => $meetingData['meetingId'],
        'customer_email' => $meetingData['customerEmail'],
        'customer_name' => $meetingData['customerName'],
        'appointment_date' => $meetingData['appointmentDate'],
        'appointment_time' => $meetingData['appointmentTime'],
        'meeting_type' => $meetingData['meetingType'],
        'timestamp' => date('Y-m-d H:i:s'),
        'email_results' => $emailResults
    ];
    
    // Save to log file
    $logFile = __DIR__ . '/../logs/meeting_bookings.log';
    $logDir = dirname($logFile);
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    file_put_contents($logFile, json_encode($logEntry) . PHP_EOL, FILE_APPEND | LOCK_EX);
    
    // Response
    $response = [
        'success' => true,
        'message' => 'Meeting booked successfully',
        'meeting_id' => $meetingData['meetingId'],
        'email_results' => [
            'user_email_sent' => $emailResults['user_email']['success'],
            'admin_email_sent' => $emailResults['admin_email']['success']
        ],
        'data' => [
            'customer_name' => $meetingData['customerName'],
            'appointment_date' => $meetingData['appointmentDate'],
            'appointment_time' => $meetingData['appointmentTime'],
            'meeting_type' => $meetingData['meetingType']
        ]
    ];
    
    echo json_encode($response, JSON_PRETTY_PRINT);

} catch (Exception $e) {
    // Error response
    $errorResponse = [
        'success' => false,
        'message' => 'Meeting booking failed',
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