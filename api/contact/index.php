<?php
/**
 * Contact API
 * POST /api/contact - Send contact form
 */

// Add CORS headers
require_once __DIR__ . '/../../php/config/cors.php';

require_once __DIR__ . '/../../database/mysql_connection.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $name = $input['name'] ?? '';
    $email = $input['email'] ?? '';
    $phone = $input['phone'] ?? '';
    $message = $input['message'] ?? '';
    
    if (!$name || !$email || !$message) {
        http_response_code(400);
        echo json_encode(['message' => 'Name, email, and message are required']);
        exit;
    }
    
    $db = MySQLConnection::getInstance();
    
    // Save contact inquiry to database
    $inquiryId = uniqid('contact_');
    $db->query(
        "INSERT INTO contactInquiries (id, name, email, phone, message, status, createdAt) VALUES (?, ?, ?, ?, ?, 'new', NOW())",
        [$inquiryId, $name, $email, $phone, $message]
    );
    
    // Send contact emails via PHP handler
    try {
        $contactData = [
            'customerName' => $name,
            'customerEmail' => $email,
            'customerPhone' => $phone,
            'message' => $message
        ];
        
        $command = "echo '" . json_encode($contactData) . "' | php " . __DIR__ . "/../../php/handlers/contact_us.php";
        exec($command, $output, $returnCode);
        
        if ($returnCode === 0) {
            error_log("Contact form emails sent for inquiry $inquiryId");
        }
    } catch (Exception $emailError) {
        error_log("Failed to send contact form emails: " . $emailError->getMessage());
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Thank you for your message. We will get back to you soon!',
        'id' => $inquiryId
    ]);
} catch (Exception $e) {
    error_log('Contact API error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['message' => 'Failed to send message']);
}
?>