<?php
/**
 * Email Templates for Order Success (Buy Now)
 */

class OrderEmailTemplates {
    
    /**
     * Format payment status for admin email
     */
    private static function formatPaymentStatus($data) {
        $status = strtolower($data['paymentStatus']);
        
        if ($status === 'paid' || $status === 'success' || $status === 'completed') {
            return "<p><strong>Payment Status:</strong> <span style='color: #16a34a; font-weight: bold;'>✅ PAYMENT COMPLETE</span></p>";
        } elseif ($status === 'pending' || $status === 'processing') {
            return "<p><strong>Payment Status:</strong> <span style='color: #f59e0b; font-weight: bold;'>⏳ PAYMENT PENDING</span></p>";
        } else {
            return "<p><strong>Payment Status:</strong> <span style='color: #dc2626; font-weight: bold;'>❌ PAYMENT FAILED</span></p>";
        }
    }
    
    /**
     * Format payment method for admin email
     */
    private static function formatPaymentMethod($data) {
        $method = isset($data['paymentMethod']) ? $data['paymentMethod'] : 'Online Payment';
        $transactionId = isset($data['transactionId']) ? $data['transactionId'] : '';
        
        $html = "<p><strong>Payment Method:</strong> ";
        
        // Add payment method icon and description
        if (stripos($method, 'upi') !== false || stripos($method, 'phonepe') !== false || stripos($method, 'gpay') !== false || stripos($method, 'paytm') !== false) {
            $html .= "📱 UPI Payment ($method)";
        } elseif (stripos($method, 'card') !== false || stripos($method, 'credit') !== false || stripos($method, 'debit') !== false) {
            $html .= "💳 Card Payment ($method)";
        } elseif (stripos($method, 'netbanking') !== false || stripos($method, 'bank') !== false) {
            $html .= "🏦 Net Banking ($method)";
        } elseif (stripos($method, 'wallet') !== false) {
            $html .= "👛 Digital Wallet ($method)";
        } elseif (stripos($method, 'razorpay') !== false) {
            $html .= "💰 Razorpay Payment Gateway";
        } elseif (stripos($method, 'cod') !== false || stripos($method, 'cash') !== false) {
            $html .= "💵 Cash on Delivery";
        } else {
            $html .= "💰 $method";
        }
        
        $html .= "</p>";
        
        if (!empty($transactionId)) {
            $html .= "<p><strong>Transaction ID:</strong> $transactionId</p>";
        }
        
        return $html;
    }
    
    /**
     * Format payment status for customer email
     */
    private static function formatPaymentStatusCustomer($data) {
        $status = strtolower($data['paymentStatus']);
        
        if ($status === 'paid' || $status === 'success' || $status === 'completed') {
            return "<div style='background: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 10px 0;'>
                <p style='margin: 0; color: #166534; font-weight: bold;'>✅ Payment Successfully Completed</p>
                <p style='margin: 5px 0 0 0; color: #166534; font-size: 14px;'>Your payment has been processed and confirmed</p>
            </div>";
        } elseif ($status === 'pending' || $status === 'processing') {
            return "<div style='background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 10px 0;'>
                <p style='margin: 0; color: #92400e; font-weight: bold;'>⏳ Payment Processing</p>
                <p style='margin: 5px 0 0 0; color: #92400e; font-size: 14px;'>Your payment is being processed and will be confirmed shortly</p>
            </div>";
        } else {
            return "<div style='background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 10px 0;'>
                <p style='margin: 0; color: #991b1b; font-weight: bold;'>❌ Payment Issue</p>
                <p style='margin: 5px 0 0 0; color: #991b1b; font-size: 14px;'>Please contact customer support for payment assistance</p>
            </div>";
        }
    }
    
    /**
     * Format payment method for customer email
     */
    private static function formatPaymentMethodCustomer($data) {
        $method = isset($data['paymentMethod']) ? $data['paymentMethod'] : 'Online Payment';
        $transactionId = isset($data['transactionId']) ? $data['transactionId'] : '';
        
        $html = "<div style='background: #f8fafc; padding: 15px; border-radius: 8px; margin: 10px 0;'>";
        $html .= "<h4 style='margin: 0 0 10px 0; color: #1e293b;'>💳 Payment Details</h4>";
        
        // Add payment method with icon
        if (stripos($method, 'upi') !== false || stripos($method, 'phonepe') !== false || stripos($method, 'gpay') !== false || stripos($method, 'paytm') !== false) {
            $html .= "<p style='margin: 5px 0;'><strong>Method:</strong> 📱 UPI Payment</p>";
            $html .= "<p style='margin: 5px 0;'><strong>Provider:</strong> $method</p>";
        } elseif (stripos($method, 'card') !== false || stripos($method, 'credit') !== false || stripos($method, 'debit') !== false) {
            $html .= "<p style='margin: 5px 0;'><strong>Method:</strong> 💳 Card Payment</p>";
            $html .= "<p style='margin: 5px 0;'><strong>Type:</strong> $method</p>";
        } elseif (stripos($method, 'netbanking') !== false || stripos($method, 'bank') !== false) {
            $html .= "<p style='margin: 5px 0;'><strong>Method:</strong> 🏦 Net Banking</p>";
            $html .= "<p style='margin: 5px 0;'><strong>Bank:</strong> $method</p>";
        } elseif (stripos($method, 'wallet') !== false) {
            $html .= "<p style='margin: 5px 0;'><strong>Method:</strong> 👛 Digital Wallet</p>";
            $html .= "<p style='margin: 5px 0;'><strong>Wallet:</strong> $method</p>";
        } elseif (stripos($method, 'razorpay') !== false) {
            $html .= "<p style='margin: 5px 0;'><strong>Method:</strong> 💰 Online Payment</p>";
            $html .= "<p style='margin: 5px 0;'><strong>Gateway:</strong> Razorpay</p>";
        } elseif (stripos($method, 'cod') !== false || stripos($method, 'cash') !== false) {
            $html .= "<p style='margin: 5px 0;'><strong>Method:</strong> 💵 Cash on Delivery</p>";
            $html .= "<p style='margin: 5px 0;'><strong>Note:</strong> Payment due at delivery</p>";
        } else {
            $html .= "<p style='margin: 5px 0;'><strong>Method:</strong> 💰 $method</p>";
        }
        
        if (!empty($transactionId)) {
            $html .= "<p style='margin: 5px 0;'><strong>Transaction ID:</strong> <code style='background: #e2e8f0; padding: 2px 6px; border-radius: 4px;'>$transactionId</code></p>";
        }
        
        $html .= "</div>";
        
        return $html;
    }
    
    /**
     * Admin notification for new order
     */
    public static function adminOrderNotification($data) {
        $timestamp = date('Y-m-d H:i:s');
        $orderItems = is_array($data['orderItems']) ? $data['orderItems'] : [];
        
        $subject = "🛒 New Order Received - Order #{$data['orderId']} - ₹{$data['total']}";
        
        $itemsHtml = '';
        foreach ($orderItems as $item) {
            $itemsHtml .= "<tr>
                <td>{$item['productName']}</td>
                <td>{$item['quantity']}</td>
                <td>₹{$item['price']}</td>
                <td>₹" . ($item['quantity'] * $item['price']) . "</td>
            </tr>";
        }
        
        $body = "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; }
                .header { background: #16a34a; color: white; padding: 20px; text-align: center; }
                .content { background: white; padding: 20px; margin: 10px 0; }
                .order-info { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 10px 0; }
                .customer-info { background: #f0f9ff; padding: 15px; border-left: 4px solid #0ea5e9; margin: 10px 0; }
                .items-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                .items-table th { background: #f8f9fa; }
                .total-row { background: #e7f3ff; font-weight: bold; }
                .footer { text-align: center; color: #666; font-size: 12px; padding: 10px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>IndoSaga Furniture</h1>
                    <h2>🎉 New Order Alert!</h2>
                </div>
                
                <div class='content'>
                    <h3>💰 Order Received</h3>
                    <p><strong>Order Time:</strong> {$timestamp}</p>
                    
                    <div class='order-info'>
                        <h4>📋 Order Information</h4>
                        <p><strong>Order ID:</strong> #{$data['orderId']}</p>
                        <p><strong>Total Amount:</strong> ₹{$data['total']}</p>
                        " . self::formatPaymentStatus($data) . "
                        " . self::formatPaymentMethod($data) . "
                    </div>
                    
                    <div class='customer-info'>
                        <h4>👤 Customer Details</h4>
                        <p><strong>Name:</strong> {$data['customerName']}</p>
                        <p><strong>Email:</strong> {$data['customerEmail']}</p>
                        <p><strong>Phone:</strong> {$data['customerPhone']}</p>
                        <p><strong>Address:</strong> {$data['shippingAddress']}</p>
                    </div>
                    
                    <h4>🛍️ Order Items</h4>
                    <table class='items-table'>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {$itemsHtml}
                            <tr class='total-row'>
                                <td colspan='3'>Total</td>
                                <td>₹{$data['total']}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <p><strong>⚠️ Action Required:</strong> Process this order and arrange for delivery/pickup as per customer requirements.</p>
                </div>
                
                <div class='footer'>
                    <p>IndoSaga Furniture Admin Panel<br>
                    This is an automated notification from the e-commerce system.</p>
                </div>
            </div>
        </body>
        </html>";
        
        return ['subject' => $subject, 'body' => $body];
    }
    
    /**
     * User confirmation for order
     */
    public static function userOrderConfirmation($data) {
        $orderItems = is_array($data['orderItems']) ? $data['orderItems'] : [];
        
        $subject = "🎉 Order Confirmed - #{$data['orderId']} - IndoSaga Furniture";
        
        $itemsHtml = '';
        foreach ($orderItems as $item) {
            $itemsHtml .= "<div style='padding: 10px; border-bottom: 1px solid #eee;'>
                <strong>{$item['productName']}</strong><br>
                Quantity: {$item['quantity']} | Price: ₹{$item['price']} | Subtotal: ₹" . ($item['quantity'] * $item['price']) . "
            </div>";
        }
        
        $body = "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; }
                .header { background: linear-gradient(135deg, #16a34a, #22c55e); color: white; padding: 30px; text-align: center; }
                .content { background: white; padding: 25px; margin: 10px 0; border-radius: 8px; }
                .order-card { background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 15px 0; }
                .items-section { background: #fafafa; padding: 15px; border-radius: 8px; margin: 15px 0; }
                .delivery-info { background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 15px 0; }
                .footer { text-align: center; color: #666; font-size: 12px; padding: 15px; }
                .total { background: #e7f3ff; padding: 15px; border-radius: 8px; text-align: center; font-size: 18px; font-weight: bold; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>🏡 IndoSaga Furniture</h1>
                    <h2>Order Confirmed!</h2>
                </div>
                
                <div class='content'>
                    <h3>Dear {$data['customerName']},</h3>
                    <p>🎉 Thank you for your order! We're excited to craft your beautiful furniture pieces.</p>
                    
                    <div class='order-card'>
                        <h4>📋 Order Summary</h4>
                        <p><strong>Order Number:</strong> #{$data['orderId']}</p>
                        <p><strong>Order Date:</strong> " . date('F j, Y') . "</p>
                    </div>
                    
                    " . self::formatPaymentStatusCustomer($data) . "
                    " . self::formatPaymentMethodCustomer($data) . "
                    
                    <div class='items-section'>
                        <h4>🛍️ Your Items</h4>
                        {$itemsHtml}
                    </div>
                    
                    <div class='total'>
                        Total Amount: ₹{$data['total']}
                    </div>
                    
                    <div class='delivery-info'>
                        <h4>🚚 Delivery Information</h4>
                        <p><strong>Delivery Address:</strong><br>{$data['shippingAddress']}</p>
                        <p><strong>Estimated Delivery:</strong> 7-14 business days</p>
                        <p><strong>Delivery Instructions:</strong></p>
                        <ul>
                            <li>Handcrafted furniture requires careful handling during delivery</li>
                            <li>Our delivery team will contact you 24 hours before delivery</li>
                            <li>Assembly service available upon request</li>
                            <li>Quality inspection will be done before handover</li>
                        </ul>
                    </div>
                    
                    <h4>📞 Need Help?</h4>
                    <p>For order status, modifications, or any questions:</p>
                    <p><strong>Customer Support:</strong> support@indosaga.com<br>
                    <strong>Phone:</strong> +91-XXXXXXXXXX<br>
                    <strong>WhatsApp:</strong> +91-XXXXXXXXXX</p>
                    
                    <p>Track your order status in your account dashboard.</p>
                    
                    <p>Thank you for choosing IndoSaga Furniture!</p>
                    
                    <p>Best regards,<br>
                    <strong>IndoSaga Furniture Team</strong></p>
                </div>
                
                <div class='footer'>
                    <p>IndoSaga Furniture - Premium Handcrafted Furniture<br>
                    Visit us: www.indosaga.com</p>
                </div>
            </div>
        </body>
        </html>";
        
        return ['subject' => $subject, 'body' => $body];
    }
}
?>