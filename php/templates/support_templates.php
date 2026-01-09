<?php
/**
 * Email Templates for Support Ticket Submission
 */

class SupportEmailTemplates {
    
    /**
     * Admin notification for new support ticket
     */
    public static function adminSupportNotification($data) {
        $timestamp = date('Y-m-d H:i:s');
        $priorityColor = ['low' => '#22c55e', 'medium' => '#f59e0b', 'high' => '#ef4444'];
        $color = $priorityColor[$data['priority']] ?? '#f59e0b';
        
        $subject = "🎫 New Support Ticket #{$data['ticketId']} - {$data['priority']} Priority";
        
        $body = "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; }
                .header { background: linear-gradient(135deg, #8b5cf6, #a855f7); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: white; padding: 25px; margin: 10px 0; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .ticket-card { background: #faf5ff; padding: 20px; border-radius: 8px; border-left: 4px solid #8b5cf6; margin: 15px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .customer-card { background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #0ea5e9; margin: 15px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .message-card { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 15px 0; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .action-card { background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 15px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .priority { background: {$color}; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; display: inline-block; }
                .footer { text-align: center; color: #666; font-size: 12px; padding: 15px; background: #f8f9fa; border-radius: 8px; margin-top: 10px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>IndoSaga Furniture</h1>
                    <h2>🆘 New Support Ticket</h2>
                </div>
                
                <div class='content'>
                    <h3>📩 Support Request Received</h3>
                    <p><strong>Received Time:</strong> {$timestamp}</p>
                    
                    <div class='ticket-card'>
                        <h4>🎫 Ticket Information</h4>
                        <p><strong>Ticket ID:</strong> #{$data['ticketId']}</p>
                        <p><strong>Priority:</strong> <span class='priority'>" . strtoupper($data['priority']) . "</span></p>
                        <p><strong>Subject:</strong> {$data['subject']}</p>
                    </div>
                    
                    <div class='customer-card'>
                        <h4>👤 Customer Details</h4>
                        <p><strong>Name:</strong> {$data['customerName']}</p>
                        <p><strong>Email:</strong> {$data['customerEmail']}</p>
                        <p><strong>Phone:</strong> {$data['customerPhone']}</p>
                    </div>
                    
                    <div class='message-card'>
                        <h4>💬 Customer Message</h4>
                        <div style='background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 3px solid #0ea5e9; font-style: italic;'>{$data['message']}</div>
                    </div>
                    
                    <div class='action-card'>
                        <h4>⚠️ Action Required</h4>
                        <p>Please respond to this support ticket within 2-4 hours based on priority level.</p>
                        
                        <h4>📋 Response Guidelines</h4>
                        <ul>
                            <li><strong>High Priority:</strong> Respond within 1 hour</li>
                            <li><strong>Medium Priority:</strong> Respond within 4 hours</li>
                            <li><strong>Low Priority:</strong> Respond within 24 hours</li>
                        </ul>
                    </div>
                </div>
                
                <div class='footer'>
                    <p>IndoSaga Furniture Support System<br>
                    This is an automated notification from the helpdesk system.</p>
                </div>
            </div>
        </body>
        </html>";
        
        return ['subject' => $subject, 'body' => $body];
    }
    
    /**
     * User confirmation for support ticket
     */
    public static function userSupportConfirmation($data) {
        $subject = "✅ Support Ticket Created - #{$data['ticketId']} - IndoSaga Furniture";
        
        $body = "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; }
                .header { background: linear-gradient(135deg, #8b5cf6, #a855f7); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: white; padding: 25px; margin: 10px 0; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .ticket-card { background: #faf5ff; padding: 20px; border-radius: 8px; border-left: 4px solid #8b5cf6; margin: 15px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .response-info { background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 15px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .contact-info { background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 15px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .footer { text-align: center; color: #666; font-size: 12px; padding: 15px; background: #f8f9fa; border-radius: 8px; margin-top: 10px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>🏡 IndoSaga Furniture</h1>
                    <h2>Support Ticket Created</h2>
                </div>
                
                <div class='content'>
                    <h3>Dear {$data['customerName']},</h3>
                    <p>Thank you for contacting IndoSaga Furniture support! We've received your request and our team is here to help.</p>
                    
                    <div class='ticket-card'>
                        <h4>🎫 Your Ticket Details</h4>
                        <p><strong>Ticket Number:</strong> #{$data['ticketId']}</p>
                        <p><strong>Subject:</strong> {$data['subject']}</p>
                        <p><strong>Priority:</strong> " . ucfirst($data['priority']) . "</p>
                        <p><strong>Created:</strong> " . date('F j, Y \a\t g:i A') . "</p>
                    </div>
                    
                    <div class='response-info'>
                        <h4>⏱️ What Happens Next?</h4>
                        <ul>
                            <li>Our support team will review your request carefully</li>
                            <li>You'll receive a response within 2-24 hours (based on priority)</li>
                            <li>All communication will be sent to your email address</li>
                            <li>You can reply to this email thread to add more information</li>
                        </ul>
                    </div>
                    
                    <div class='contact-info'>
                        <h4>📞 Need Immediate Assistance?</h4>
                        <p>For urgent matters, you can also reach us directly:</p>
                        <p><strong>Customer Support Email:</strong> support@indosaga.com<br>
                        <strong>Phone:</strong> +91-XXXXXXXXXX<br>
                        <strong>WhatsApp:</strong> +91-XXXXXXXXXX<br>
                        <strong>Business Hours:</strong> Monday - Saturday, 9:00 AM - 7:00 PM</p>
                    </div>
                    
                    <h4>💡 Helpful Resources</h4>
                    <ul>
                        <li>Visit our FAQ section for common questions</li>
                        <li>Check your order status in your account dashboard</li>
                        <li>Browse our furniture care guides</li>
                        <li>View our warranty and return policy</li>
                    </ul>
                    
                    <p>We appreciate your patience and look forward to resolving your inquiry quickly!</p>
                    
                    <p>Best regards,<br>
                    <strong>IndoSaga Furniture Support Team</strong></p>
                </div>
                
                <div class='footer'>
                    <p>IndoSaga Furniture - Premium Handcrafted Furniture<br>
                    Please save this ticket number for future reference: #{$data['ticketId']}</p>
                </div>
            </div>
        </body>
        </html>";
        
        return ['subject' => $subject, 'body' => $body];
    }
}
?>