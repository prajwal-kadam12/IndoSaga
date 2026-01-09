<?php
/**
 * Email Templates for Virtual Meeting Booking
 */

class MeetingEmailTemplates {
    
    /**
     * Admin notification for new meeting booking
     */
    public static function adminMeetingNotification($data) {
        $timestamp = date('Y-m-d H:i:s');
        
        $subject = "🗓️ New Virtual Meeting Booking - {$data['customerName']}";
        
        $body = "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; }
                .header { background: linear-gradient(135deg, #dc2626, #ea580c); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: white; padding: 25px; margin: 10px 0; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .details-card { background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 15px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .customer-card { background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #0ea5e9; margin: 15px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .action-card { background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 15px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .footer { text-align: center; color: #666; font-size: 12px; padding: 15px; background: #f8f9fa; border-radius: 8px; margin-top: 10px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>IndoSaga Furniture</h1>
                    <h2>New Meeting Booking Alert</h2>
                </div>
                
                <div class='content'>
                    <h3>📅 Virtual Meeting Booking Details</h3>
                    <p><strong>Booking Time:</strong> {$timestamp}</p>
                    
                    <div class='customer-card'>
                        <h4>👤 Customer Information</h4>
                        <p><strong>Name:</strong> {$data['customerName']}</p>
                        <p><strong>Email:</strong> {$data['customerEmail']}</p>
                        <p><strong>Phone:</strong> {$data['customerPhone']}</p>
                    </div>
                    
                    <div class='details-card'>
                        <h4>📋 Meeting Details</h4>
                        <p><strong>Date:</strong> {$data['appointmentDate']}</p>
                        <p><strong>Time:</strong> {$data['appointmentTime']}</p>
                        <p><strong>Type:</strong> " . ucfirst(str_replace('_', ' ', $data['meetingType'])) . "</p>
                        <p><strong>Notes:</strong> <em>{$data['notes']}</em></p>
                    </div>
                    
                    <div class='action-card'>
                        <h4>⚠️ Action Required</h4>
                        <p>Please prepare for the virtual meeting and contact the customer to confirm details.</p>
                    </div>
                </div>
                
                <div class='footer'>
                    <p>IndoSaga Furniture Admin Panel<br>
                    This is an automated notification from the website booking system.</p>
                </div>
            </div>
        </body>
        </html>";
        
        return ['subject' => $subject, 'body' => $body];
    }
    
    /**
     * User confirmation for meeting booking
     */
    public static function userMeetingConfirmation($data) {
        $formattedDate = date('l, F j, Y', strtotime($data['appointmentDate']));
        
        $subject = "✅ Your Virtual Meeting is Confirmed - IndoSaga Furniture";
        
        $body = "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; }
                .header { background: linear-gradient(135deg, #dc2626, #ea580c); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: white; padding: 25px; margin: 10px 0; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .meeting-card { background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #0ea5e9; margin: 15px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .instructions { background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 15px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .contact-card { background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 15px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .footer { text-align: center; color: #666; font-size: 12px; padding: 15px; background: #f8f9fa; border-radius: 8px; margin-top: 10px; }
                .btn { background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>🏡 IndoSaga Furniture</h1>
                    <h2>Meeting Confirmed!</h2>
                </div>
                
                <div class='content'>
                    <h3>Dear {$data['customerName']},</h3>
                    <p>Thank you for booking a virtual meeting with IndoSaga Furniture! We're excited to help you find the perfect furniture for your home.</p>
                    
                    <div class='meeting-card'>
                        <h4>📅 Your Meeting Details</h4>
                        <p><strong>📍 Date:</strong> {$formattedDate}</p>
                        <p><strong>🕐 Time:</strong> {$data['appointmentTime']}</p>
                        <p><strong>📞 Meeting Type:</strong> " . ucfirst(str_replace('_', ' ', $data['meetingType'])) . "</p>
                        <p><strong>📝 Your Notes:</strong> {$data['notes']}</p>
                    </div>
                    
                    <div class='instructions'>
                        <h4>📋 What to Expect</h4>
                        <ul>
                            <li>Our furniture expert will contact you 15 minutes before your scheduled time</li>
                            <li>We'll discuss your furniture needs and preferences</li>
                            <li>Get personalized recommendations from our premium collection</li>
                            <li>Learn about our handcrafted teak wood furniture</li>
                            <li>Special pricing and offers available during the meeting</li>
                        </ul>
                    </div>
                    
                    <div class='contact-card'>
                        <h4>📞 Contact Information</h4>
                        <p>If you need to reschedule or have any questions:</p>
                        <p><strong>Email:</strong> support@indosaga.com<br>
                        <strong>Phone:</strong> +91-XXXXXXXXXX<br>
                        <strong>WhatsApp:</strong> +91-XXXXXXXXXX</p>
                    </div>
                    
                    <p>We look forward to meeting you!</p>
                    
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