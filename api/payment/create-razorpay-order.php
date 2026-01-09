<?php
require_once __DIR__ . '/../../php/config/cors.php';
/**
 * Create Razorpay Order API
 * POST /api/create-razorpay-order
 */

require_once __DIR__ . '/../../database/mysql_connection.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $productId = $input['productId'] ?? '';
    $quantity = $input['quantity'] ?? 1;
    $currency = $input['currency'] ?? 'INR';
    $isCartOrder = $input['isCartOrder'] ?? false;
    $orderItems = $input['orderItems'] ?? [];
    
    if (!$productId && !$isCartOrder) {
        http_response_code(400);
        echo json_encode(['message' => 'Product ID required']);
        exit;
    }
    
    $db = MySQLConnection::getInstance();
    $amount = 0;
    $productName = "";
    $productDetails = [];
    
    if ($isCartOrder && count($orderItems) > 0) {
        // Handle cart order with multiple products
        $totalAmount = 0;
        $productNames = [];
        
        foreach ($orderItems as $item) {
            $product = $db->fetch("SELECT * FROM products WHERE id = ?", [$item['productId']]);
            if (!$product) {
                http_response_code(404);
                echo json_encode(['message' => "Product not found: " . $item['productId']]);
                exit;
            }
            
            $itemPrice = floatval($product['price']);
            $totalAmount += $itemPrice * $item['quantity'];
            $productNames[] = $product['name'];
        }
        
        $amount = $totalAmount;
        $productName = count($orderItems) . " items: " . implode(', ', $productNames);
        $productDetails = [
            'isCartOrder' => true,
            'itemCount' => count($orderItems),
            'items' => $orderItems
        ];
    } else {
        // Handle single product order
        $product = $db->fetch("SELECT * FROM products WHERE id = ?", [$productId]);
        if (!$product) {
            http_response_code(404);
            echo json_encode(['message' => 'Product not found']);
            exit;
        }
        
        $amount = floatval($product['price']) * $quantity;
        $productName = $product['name'];
        $productDetails = [
            'id' => $product['id'],
            'name' => $product['name'],
            'price' => $product['price']
        ];
    }
    
    // Get Razorpay credentials
    $keyId = getenv('RAZORPAY_KEY_ID') ?: $_ENV['RAZORPAY_KEY_ID'] ?? null;
    $keySecret = getenv('RAZORPAY_KEY_SECRET') ?: $_ENV['RAZORPAY_KEY_SECRET'] ?? null;
    
    $testKeyId = getenv('RAZORPAY_TEST_KEY_ID') ?: $_ENV['RAZORPAY_TEST_KEY_ID'] ?? null;
    $testKeySecret = getenv('RAZORPAY_TEST_KEY_SECRET') ?: $_ENV['RAZORPAY_TEST_KEY_SECRET'] ?? null;
    
    // Prefer test credentials in development
    $finalKeyId = $testKeyId ?: $keyId;
    $finalKeySecret = $testKeySecret ?: $keySecret;
    
    if (!$finalKeyId || !$finalKeySecret) {
        http_response_code(500);
        echo json_encode(['message' => 'Razorpay not configured']);
        exit;
    }
    
    $options = [
        'amount' => round($amount * 100), // Razorpay expects amount in paise
        'currency' => $currency,
        'receipt' => 'order_' . time(),
        'notes' => [
            'product_id' => $productId,
            'product_name' => $productName,
            'quantity' => $isCartOrder ? array_sum(array_column($orderItems, 'quantity')) : $quantity,
            'is_cart_order' => $isCartOrder ? 'true' : 'false',
            'item_count' => $isCartOrder ? count($orderItems) : 1
        ]
    ];
    
    // Create Razorpay order using cURL
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://api.razorpay.com/v1/orders');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($options));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Basic ' . base64_encode($finalKeyId . ':' . $finalKeySecret)
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        $order = json_decode($response, true);
        $order['product'] = $productDetails;
        $order['quantity'] = $isCartOrder ? array_sum(array_column($orderItems, 'quantity')) : $quantity;
        $order['isCartOrder'] = $isCartOrder;
        if ($isCartOrder) {
            $order['orderItems'] = $orderItems;
        }
        
        echo json_encode($order);
    } else {
        error_log('Razorpay API Error: ' . $response);
        http_response_code(500);
        echo json_encode(['message' => 'Failed to create Razorpay order']);
    }
} catch (Exception $e) {
    error_log('Create Razorpay order error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['message' => 'Failed to create order']);
}
?>