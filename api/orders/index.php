<?php
require_once __DIR__ . '/../../php/config/cors.php';
/**
 * Orders API
 * GET /api/orders - Get orders for authenticated user
 * POST /api/orders - Create new order
 */

require_once __DIR__ . '/../../database/mysql_connection.php';

try {
    $db = MySQLConnection::getInstance();
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get orders for authenticated user
        if (!isset($_SESSION['user'])) {
            http_response_code(401);
            echo json_encode(['message' => 'Authentication required']);
            exit;
        }
        
        $user = $_SESSION['user'];
        $dbUser = $db->fetch("SELECT * FROM users WHERE email = ?", [$user['email']]);
        
        if (!$dbUser) {
            http_response_code(401);
            echo json_encode(['message' => 'User not found']);
            exit;
        }
        
        $orders = $db->fetchAll(
            "SELECT o.*, GROUP_CONCAT(CONCAT(oi.quantity, 'x ', p.name) SEPARATOR ', ') as items
             FROM orders o 
             LEFT JOIN order_items oi ON o.id = oi.order_id 
             LEFT JOIN products p ON oi.product_id = p.id 
             WHERE o.user_id = ? 
             GROUP BY o.id 
             ORDER BY o.created_at DESC",
            [$dbUser['id']]
        );
        
        echo json_encode($orders);
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Create new order
        if (!isset($_SESSION['user'])) {
            http_response_code(401);
            echo json_encode(['message' => 'Authentication required']);
            exit;
        }
        
        $user = $_SESSION['user'];
        $dbUser = $db->fetch("SELECT * FROM users WHERE email = ?", [$user['email']]);
        
        if (!$dbUser) {
            http_response_code(401);
            echo json_encode(['message' => 'User not found']);
            exit;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        $orderItems = $input['orderItems'] ?? [];
        unset($input['orderItems']);
        
        // Create the main order
        $orderId = uniqid('order_');
        $db->query(
            "INSERT INTO orders (id, user_id, total, status, payment_status, payment_method, full_name, email, phone, address, city, state, zip_code, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())",
            [
                $orderId,
                $dbUser['id'],
                $input['total'],
                $input['status'] ?? 'pending',
                $input['paymentStatus'] ?? 'paid',
                $input['paymentMethod'] ?? 'Online Payment',
                $input['fullName'] ?? '',
                $input['email'] ?? $dbUser['email'],
                $input['phone'] ?? '',
                $input['address'] ?? '',
                $input['city'] ?? '',
                $input['state'] ?? '',
                $input['zipCode'] ?? ''
            ]
        );
        
        // Create order items
        if (count($orderItems) > 0) {
            foreach ($orderItems as $item) {
                $orderItemId = uniqid('orderitem_');
                $db->query(
                    "INSERT INTO order_items (id, order_id, product_id, quantity, price, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
                    [
                        $orderItemId,
                        $orderId,
                        $item['productId'],
                        $item['quantity'],
                        $item['price']
                    ]
                );
            }
        }
        
        // Clear the user's cart after successful order creation
        $db->query("DELETE FROM cart_items WHERE user_id = ?", [$dbUser['id']]);
        
        // Send order confirmation via PHP email handler
        try {
            $orderData = [
                'orderId' => $orderId,
                'customerName' => $dbUser['name'] ?: 'Valued Customer',
                'customerEmail' => $dbUser['email'],
                'customerPhone' => $input['phone'] ?? '',
                'total' => $input['total'],
                'paymentStatus' => $input['paymentStatus'] ?? 'paid',
                'paymentMethod' => $input['paymentMethod'] ?? 'Online Payment',
                'shippingAddress' => trim(($input['fullName'] ?? '') . ', ' . ($input['address'] ?? '') . ', ' . ($input['city'] ?? '') . ', ' . ($input['state'] ?? '') . ', ' . ($input['zipCode'] ?? '')),
                'orderItems' => array_map(function($item) {
                    return [
                        'productName' => $item['productName'] ?? 'Product',
                        'quantity' => $item['quantity'] ?? 1,
                        'price' => $item['price'] ?? 0
                    ];
                }, $orderItems)
            ];
            
            // Execute PHP email handler
            $command = "echo '" . json_encode($orderData) . "' | php " . __DIR__ . "/../../php/handlers/order_success.php";
            exec($command, $output, $returnCode);
            
            if ($returnCode === 0) {
                error_log("Order confirmation emails sent for order $orderId");
            }
        } catch (Exception $emailError) {
            error_log("Failed to send order confirmation emails: " . $emailError->getMessage());
        }
        
        $order = $db->fetch("SELECT * FROM orders WHERE id = ?", [$orderId]);
        echo json_encode($order);
        
    } else {
        http_response_code(405);
        echo json_encode(['message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    error_log('Orders API error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['message' => 'Failed to process request']);
}
?>