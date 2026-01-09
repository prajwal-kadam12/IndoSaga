<?php
require_once __DIR__ . '/../../php/config/cors.php';
/**
 * Cancel Order API
 * POST /api/orders/:id/cancel
 */

require_once __DIR__ . '/../../database/mysql_connection.php';

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
    $orderId = $_GET['id'] ?? '';
    
    if (!$orderId) {
        http_response_code(400);
        echo json_encode(['message' => 'Order ID required']);
        exit;
    }
    
    $db = MySQLConnection::getInstance();
    $dbUser = $db->fetch("SELECT * FROM users WHERE email = ?", [$user['email']]);
    
    if (!$dbUser) {
        http_response_code(401);
        echo json_encode(['message' => 'User not found']);
        exit;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $reason = $input['reason'] ?? 'Not specified';
    $details = $input['details'] ?? '';
    
    $order = $db->fetch("SELECT * FROM orders WHERE id = ?", [$orderId]);
    
    if (!$order) {
        http_response_code(404);
        echo json_encode(['message' => 'Order not found']);
        exit;
    }
    
    // Check if user owns the order
    if ($order['userId'] !== $dbUser['id']) {
        http_response_code(403);
        echo json_encode(['message' => 'Access denied - not your order']);
        exit;
    }
    
    // Check if order can be cancelled
    if (!in_array($order['status'], ['pending', 'processing', 'confirmed'])) {
        http_response_code(400);
        echo json_encode([
            'message' => 'Order cannot be cancelled at this stage. Only pending, processing, or confirmed orders can be cancelled.'
        ]);
        exit;
    }
    
    // Update order status to cancelled
    $db->query("UPDATE orders SET status = 'cancelled' WHERE id = ?", [$orderId]);
    
    // Send cancellation confirmation emails
    try {
        $orderData = [
            'orderId' => $order['id'],
            'customerName' => $dbUser['name'] ?: 'Valued Customer',
            'customerEmail' => $dbUser['email'],
            'reason' => $reason,
            'details' => $details,
            'orderTotal' => $order['total'],
            'cancellationDate' => date('Y-m-d H:i:s')
        ];
        
        $command = "echo '" . json_encode($orderData) . "' | php " . __DIR__ . "/../../php/handlers/order_cancellation.php";
        exec($command, $output, $returnCode);
        
        if ($returnCode === 0) {
            error_log("Cancellation emails sent for order $orderId");
        }
    } catch (Exception $emailError) {
        error_log("Failed to send cancellation emails: " . $emailError->getMessage());
    }
    
    $updatedOrder = $db->fetch("SELECT * FROM orders WHERE id = ?", [$orderId]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Order cancelled successfully. Confirmation emails have been sent.',
        'order' => $updatedOrder
    ]);
} catch (Exception $e) {
    error_log('Order cancellation error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['message' => 'Failed to cancel order']);
}
?>