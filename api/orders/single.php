<?php
require_once __DIR__ . '/../../php/config/cors.php';
/**
 * Single Order API
 * GET /api/orders/:id
 */

require_once __DIR__ . '/../../database/mysql_connection.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
    exit;
}

try {
    $orderId = $_GET['id'] ?? '';
    
    if (!$orderId) {
        http_response_code(400);
        echo json_encode(['message' => 'Order ID required']);
        exit;
    }
    
    $db = MySQLConnection::getInstance();
    
    // Get order details
    $order = $db->fetch("SELECT * FROM orders WHERE id = ?", [$orderId]);
    
    if (!$order) {
        http_response_code(404);
        echo json_encode(['message' => 'Order not found']);
        exit;
    }
    
    // Get order items with product details
    $orderItems = $db->fetchAll(
        "SELECT oi.*, p.name as product_name, p.image_url as product_image_url
         FROM order_items oi 
         LEFT JOIN products p ON oi.product_id = p.id 
         WHERE oi.order_id = ?",
        [$orderId]
    );
    
    // Format order items to match frontend expectations
    $formattedItems = [];
    foreach ($orderItems as $item) {
        $formattedItems[] = [
            'id' => $item['id'],
            'quantity' => intval($item['quantity']),
            'price' => $item['price'], // This is the actual paid price (e.g., ₹1 for flash deals)
            'product' => [
                'name' => $item['product_name'],
                'imageUrl' => $item['product_image_url']
            ]
        ];
    }
    
    // Add order items to order data
    $order['orderItems'] = $formattedItems;
    
    echo json_encode($order);
} catch (Exception $e) {
    error_log('Single order error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['message' => 'Failed to fetch order']);
}
?>