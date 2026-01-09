<?php
// Order Cancellation Email Templates for IndoSaga Furniture

function generateCancellationEmailTemplates($cancellationData) {
    $orderId = $cancellationData['orderId'] ?? 'N/A';
    $customerName = $cancellationData['customerName'] ?? 'Customer';
    $customerEmail = $cancellationData['customerEmail'] ?? '';
    $reason = $cancellationData['reason'] ?? 'Not specified';
    $details = $cancellationData['details'] ?? '';
    $orderTotal = $cancellationData['orderTotal'] ?? '0';
    $cancellationDate = date('j F Y, g:i A');
    
    // Customer Cancellation Confirmation Email
    $customerEmailSubject = "🚫 Order Cancellation Confirmed - #" . strtoupper(substr($orderId, -8)) . " - IndoSaga Furniture";
    
    $customerEmailBody = '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; }
            .header { background: linear-gradient(135deg, #dc2626, #ef4444); color: white; padding: 30px; text-align: center; }
            .content { background: white; padding: 25px; margin: 10px 0; border-radius: 8px; }
            .cancellation-card { background: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 15px 0; }
            .reason-section { background: #fafafa; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .refund-info { background: #f0f9ff; padding: 15px; border-radius: 8px; border: 1px solid #0ea5e9; margin: 15px 0; }
            .contact-info { background: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #22c55e; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🏠 IndoSaga Furniture</div>
                <h2>Order Cancellation Confirmed</h2>
                <p>Your order has been successfully cancelled</p>
            </div>
            
            <div class="content">
                <h3>Dear ' . htmlspecialchars($customerName) . ',</h3>
                
                <p>We have successfully processed your cancellation request for the following order:</p>
                
                <div class="cancellation-card">
                    <h4>🚫 Cancelled Order Details</h4>
                    <p><strong>Order ID:</strong> #' . strtoupper(substr($orderId, -8)) . '</p>
                    <p><strong>Order Total:</strong> ₹' . number_format($orderTotal) . '</p>
                    <p><strong>Cancellation Date:</strong> ' . $cancellationDate . '</p>
                    <p><strong>Status:</strong> <span style="color: #dc2626; font-weight: bold;">CANCELLED</span></p>
                </div>
                
                <div class="reason-section">
                    <h4>📝 Cancellation Details</h4>
                    <p><strong>Reason:</strong> ' . htmlspecialchars($reason) . '</p>';
    
    if (!empty($details)) {
        $customerEmailBody .= '
                    <p><strong>Additional Details:</strong></p>
                    <p>' . htmlspecialchars($details) . '</p>';
    }
    
    $customerEmailBody .= '
                </div>
                
                <div class="refund-info">
                    <h4>💰 Refund Information</h4>
                    <p><strong>Refund Amount:</strong> ₹' . number_format($orderTotal) . '</p>
                    <p><strong>Refund Timeline:</strong> 5-7 business days (depending on payment method)</p>
                    <p><strong>Refund Method:</strong> Same as original payment method</p>
                    <p>You will receive a separate notification once the refund is processed.</p>
                </div>
                
                <div class="contact-info">
                    <h4>📞 Need Help?</h4>
                    <p>If you have any questions about your cancellation or refund, please contact us:</p>
                    <p>
                        📧 Email: <a href="mailto:support@indosaga.com">support@indosaga.com</a><br>
                        📱 Phone: +91 98765 43210<br>
                        🕒 Support Hours: Mon-Sat, 9 AM - 7 PM
                    </p>
                </div>
                
                <p>We appreciate your understanding and hope to serve you again in the future with our premium furniture collection.</p>
                
                <p>Best regards,<br>
                <strong>IndoSaga Furniture Team</strong><br>
                Customer Support Department</p>
            </div>
            
            <div class="footer">
                <p>© 2025 IndoSaga Furniture. All rights reserved.</p>
                <p>This is an automated email. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>';
    
    // Admin Notification Email
    $adminEmailSubject = "🚨 Order Cancellation Alert - Order #" . strtoupper(substr($orderId, -8)) . " - ₹" . number_format($orderTotal);
    
    $adminEmailBody = '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; }
            .header { background: linear-gradient(135deg, #dc2626, #ef4444); color: white; padding: 30px; text-align: center; }
            .content { background: white; padding: 25px; margin: 10px 0; border-radius: 8px; }
            .alert-card { background: #fef2f2; padding: 20px; border-radius: 8px; border: 2px solid #dc2626; margin: 15px 0; }
            .customer-info { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .action-required { background: #fef3c7; padding: 15px; border-radius: 8px; border: 1px solid #f59e0b; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
            .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🏠 IndoSaga Admin Panel</div>
                <h2>Order Cancellation Alert</h2>
                <p>A customer has cancelled their order</p>
            </div>
            
            <div class="content">
                <h3>Order Cancellation Notification</h3>
                
                <div class="alert-card">
                    <h4>🚨 Cancelled Order Information</h4>
                    <p><strong>Order ID:</strong> #' . strtoupper(substr($orderId, -8)) . '</p>
                    <p><strong>Full Order ID:</strong> ' . htmlspecialchars($orderId) . '</p>
                    <p><strong>Order Amount:</strong> ₹' . number_format($orderTotal) . '</p>
                    <p><strong>Cancellation Date:</strong> ' . $cancellationDate . '</p>
                    <p><strong>Status:</strong> <span style="color: #dc2626; font-weight: bold;">CANCELLED</span></p>
                </div>
                
                <div class="customer-info">
                    <h4>👤 Customer Information</h4>
                    <p><strong>Customer Name:</strong> ' . htmlspecialchars($customerName) . '</p>
                    <p><strong>Customer Email:</strong> ' . htmlspecialchars($customerEmail) . '</p>
                </div>
                
                <div class="customer-info">
                    <h4>📝 Cancellation Reason</h4>
                    <p><strong>Primary Reason:</strong> ' . htmlspecialchars($reason) . '</p>';
    
    if (!empty($details)) {
        $adminEmailBody .= '
                    <p><strong>Additional Details:</strong></p>
                    <p>' . htmlspecialchars($details) . '</p>';
    }
    
    $adminEmailBody .= '
                </div>
                
                <div class="action-required">
                    <h4>⚡ Actions Required</h4>
                    <ul>
                        <li>Process refund of ₹' . number_format($orderTotal) . '</li>
                        <li>Update inventory if applicable</li>
                        <li>Review cancellation reason for improvements</li>
                        <li>Send refund confirmation to customer</li>
                        <li>Update order status in admin panel</li>
                    </ul>
                </div>
                
                <p><strong>Note:</strong> Customer has been automatically notified about the cancellation. Please process the refund within 1-2 business days.</p>
            </div>
            
            <div class="footer">
                <p>© 2025 IndoSaga Furniture Admin System</p>
                <p>This is an automated admin notification.</p>
            </div>
        </div>
    </body>
    </html>';
    
    return [
        'customer' => [
            'subject' => $customerEmailSubject,
            'body' => $customerEmailBody
        ],
        'admin' => [
            'subject' => $adminEmailSubject,
            'body' => $adminEmailBody
        ]
    ];
}

// Function to get admin email address
function getAdminEmail() {
    return 'kadamprajwal358@gmail.com'; // From email_config.php
}
?>