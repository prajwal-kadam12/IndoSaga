<?php
require_once __DIR__ . '/../../php/config/cors.php';
/**
 * Appointments API
 * POST /api/appointments - Book appointment
 * GET /api/appointments - Get user appointments
 */

require_once __DIR__ . '/../../database/mysql_connection.php';

try {
    $db = MySQLConnection::getInstance();
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Book appointment
        $input = json_decode(file_get_contents('php://input'), true);
        
        $customerName = $input['customerName'] ?? '';
        $customerEmail = $input['customerEmail'] ?? '';
        $customerPhone = $input['customerPhone'] ?? '';
        $appointmentDate = $input['appointmentDate'] ?? $input['date'] ?? '';
        $appointmentTime = $input['appointmentTime'] ?? $input['time'] ?? '';
        $meetingType = $input['meetingType'] ?? $input['type'] ?? 'virtual_showroom';
        $notes = $input['notes'] ?? '';
        
        if (!$customerName || !$customerEmail || !$appointmentDate || !$appointmentTime) {
            http_response_code(400);
            echo json_encode(['message' => 'Missing required fields']);
            exit;
        }
        
        $appointmentId = 'APT-' . time();
        $userId = isset($_SESSION['user']) ? ($_SESSION['user']['id'] ?? 'guest') : 'guest';
        
        // Save appointment to database (you may need to create appointments table)
        $appointment = [
            'id' => $appointmentId,
            'customerName' => $customerName,
            'customerEmail' => $customerEmail,
            'customerPhone' => $customerPhone,
            'date' => $appointmentDate,
            'time' => $appointmentTime,
            'type' => $meetingType,
            'status' => 'scheduled',
            'notes' => $notes,
            'createdAt' => date('Y-m-d H:i:s'),
            'userId' => $userId
        ];
        
        // Send appointment emails via PHP handler
        try {
            $appointmentData = [
                'customerName' => $customerName,
                'customerEmail' => $customerEmail,
                'customerPhone' => $customerPhone,
                'appointmentDate' => $appointmentDate,
                'appointmentTime' => $appointmentTime,
                'meetingType' => $meetingType,
                'notes' => $notes
            ];
            
            $command = "echo '" . json_encode($appointmentData) . "' | php " . __DIR__ . "/../../php/handlers/book_meeting.php";
            exec($command, $output, $returnCode);
            
            if ($returnCode === 0) {
                error_log("Appointment emails sent for appointment $appointmentId");
            }
        } catch (Exception $emailError) {
            error_log("Failed to send appointment emails: " . $emailError->getMessage());
        }
        
        echo json_encode($appointment);
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get user appointments
        if (!isset($_SESSION['user'])) {
            http_response_code(401);
            echo json_encode(['message' => 'Authentication required']);
            exit;
        }
        
        // For now, return empty array - you can implement database storage later
        echo json_encode([]);
        
    } else {
        http_response_code(405);
        echo json_encode(['message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    error_log('Appointments API error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['message' => 'Failed to process request']);
}
?>