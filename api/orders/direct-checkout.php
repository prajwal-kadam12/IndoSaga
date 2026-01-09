<?php
require_once __DIR__ . '/../../php/config/cors.php';
/**
 * Direct Checkout Orders API
 * POST /api/orders/direct-checkout
 */

require_once __DIR__ . '/../../database/mysql_connection.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    $orderItems = $input['orderItems'] ?? [];
    $customerEmail = $input['customerEmail'] ?? $input['email'] ?? '';
    unset($input['orderItems']);
    
    $db = MySQLConnection::getInstance();
    
    // For direct checkout, we might not have a logged-in user session
    $user = $_SESSION['user'] ?? null;
    $userId = null;
    
    // If user is authenticated, link the order to their account
    if ($user) {
        $dbUser = $db->fetch("SELECT * FROM users WHERE email = ?", [$user['email']]);
        if ($dbUser) {
            $userId = $dbUser['id'];
        }
    }
    
    // Create the main order with or without user association
    $orderId = uniqid('order_');
    $db->query(
        "INSERT INTO orders (id, userId, total, status, paymentStatus, paymentMethod, fullName, email, phone, address, city, state, zipCode, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())",
        [
            $orderId,
            $userId,
            $input['total'],
            $input['status'] ?? 'pending',
            $input['paymentStatus'] ?? 'paid',
            $input['paymentMethod'] ?? 'Online Payment',
            $input['fullName'] ?? '',
            $customerEmail,
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
                "INSERT INTO orderItems (id, orderId, productId, quantity, price, createdAt) VALUES (?, ?, ?, ?, ?, NOW())",
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
    
    // Clear the user's cart if they are authenticated
    if ($userId) {
        $db->query("DELETE FROM cartItems WHERE userId = ?", [$userId]);
    }
    
    // Send order confirmation via PHP email handler
    try {
        $orderData = [
            'orderId' => $orderId,
            'customerName' => $input['fullName'] ?? 'Valued Customer',
            'customerEmail' => $customerEmail,
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
} catch (Exception $e) {
    error_log('Direct checkout order error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['message' => 'Failed to create order']);
}
?>