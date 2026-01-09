<?php
require_once __DIR__ . '/../../php/config/cors.php';
/**
 * Video Call API
 * POST /api/video-call/start
 */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
    exit;
}

try {
    if (!isset($_SESSION['user'])) {
        http_response_code(401);
        echo json_encode(['message' => 'Authentication required']);
        exit;
    }
    
    $user = $_SESSION['user'];
    $input = json_decode(file_get_contents('php://input'), true);
    
    $appointmentId = $input['appointmentId'] ?? '';
    
    // In a real implementation, this would:
    // 1. Validate the appointment
    // 2. Generate WebRTC connection details
    // 3. Notify the shop owner
    
    $sessionId = 'VIDEO-' . time();
    
    error_log('Video call started: ' . json_encode([
        'sessionId' => $sessionId,
        'appointmentId' => $appointmentId,
        'customer' => $user['name'] ?: $user['email']
    ]));
    
    echo json_encode([
        'success' => true,
        'sessionId' => $sessionId,
        'message' => 'Video call session started'
    ]);
} catch (Exception $e) {
    error_log('Video call start error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['message' => 'Failed to start video call']);
}
?>