<?php
/**
 * Email Templates for Contact Us Enquiry
 */

class ContactEmailTemplates {
    
    /**
     * Admin notification for new contact enquiry
     */
    public static function adminContactNotification($data) {
        $timestamp = date('Y-m-d H:i:s');
        
        $subject = "📧 New Contact Enquiry - {$data['name']} - {$data['subject']}";
        
        $body = "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; }
                .header { background: linear-gradient(135deg, #0ea5e9, #0284c7); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: white; padding: 25px; margin: 10px 0; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .enquiry-card { background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #0ea5e9; margin: 15px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .contact-card { background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 15px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .message-card { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 15px 0; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .action-card { background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 15px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .footer { text-align: center; color: #666; font-size: 12px; padding: 15px; background: #f8f9fa; border-radius: 8px; margin-top: 10px; }
                .highlight { background: #e7f3ff; padding: 10px; border-radius: 5px; margin: 10px 0; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>IndoSaga Furniture</h1>
                    <h2>📬 New Contact Enquiry</h2>
                </div>
                
                <div class='content'>
                    <h3>💌 Contact Form Submission</h3>
                    <p><strong>Received Time:</strong> {$timestamp}</p>
                    
                    <div class='enquiry-card'>
                        <h4>📝 Enquiry Details</h4>
                        <p><strong>Subject:</strong> {$data['subject']}</p>
                        <p><strong>Interest Area:</strong> " . (isset($data['category']) ? $data['category'] : 'General Enquiry') . "</p>
                    </div>
                    
                    <div class='contact-card'>
                        <h4>👤 Contact Information</h4>
                        <p><strong>Name:</strong> {$data['name']}</p>
                        <p><strong>Email:</strong> {$data['email']}</p>
                        <p><strong>Phone:</strong> " . (isset($data['phone']) ? $data['phone'] : 'Not provided') . "</p>
                        <p><strong>Company:</strong> " . (isset($data['company']) ? $data['company'] : 'Not provided') . "</p>
                    </div>
                    
                    <div class='message-card'>
                        <h4>💬 Customer Message</h4>
                        <div class='highlight'>{$data['message']}</div>
                    </div>
                    
                    <div class='action-card'>
                        <h4>⚠️ Action Required</h4>
                        <p>Please respond to this enquiry within 24 hours to maintain excellent customer service.</p>
                        
                        <h4>📋 Response Guidelines</h4>
                        <ul>
                            <li>Acknowledge receipt and thank them for their interest</li>
                            <li>Provide detailed information about relevant products/services</li>
                            <li>Offer to schedule a consultation or showroom visit</li>
                            <li>Include relevant catalog or product brochures</li>
                            <li>Follow up within 3-5 days if no immediate response</li>
                        </ul>
                    </div>
                </div>
                
                <div class='footer'>
                    <p>IndoSaga Furniture Contact Management System<br>
                    This is an automated notification from the website contact form.</p>
                </div>
            </div>
        </body>
        </html>";
        
        return ['subject' => $subject, 'body' => $body];
    }
    
    /**
     * User acknowledgment for contact enquiry
     */
    public static function userContactAcknowledgment($data) {
        $subject = "✅ Thank you for contacting IndoSaga Furniture";
        
        $body = "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; }
                .header { background: linear-gradient(135deg, #0ea5e9, #0284c7); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: white; padding: 25px; margin: 10px 0; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .enquiry-card { background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #0ea5e9; margin: 15px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .response-info { background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 15px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .showcase { background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 15px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .footer { text-align: center; color: #666; font-size: 12px; padding: 15px; background: #f8f9fa; border-radius: 8px; margin-top: 10px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>🏡 IndoSaga Furniture</h1>
                    <h2>Thank You for Your Interest!</h2>
                </div>
                
                <div class='content'>
                    <h3>Dear {$data['name']},</h3>
                    <p>Thank you for reaching out to IndoSaga Furniture! We're delighted to hear from you and appreciate your interest in our premium handcrafted furniture.</p>
                    
                    <div class='enquiry-card'>
                        <h4>📝 Your Enquiry Summary</h4>
                        <p><strong>Subject:</strong> {$data['subject']}</p>
                        <p><strong>Submitted:</strong> " . date('F j, Y \a\t g:i A') . "</p>
                        <p><strong>Your Message:</strong></p>
                        <div style='background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 10px 0; font-style: italic; border-left: 3px solid #0ea5e9;'>{$data['message']}</div>
                    </div>
                    
                    <div class='response-info'>
                        <h4>⏱️ What's Next?</h4>
                        <ul>
                            <li>Our furniture experts will review your enquiry carefully</li>
                            <li>You'll receive a detailed response within 24 hours</li>
                            <li>We'll provide personalized recommendations based on your needs</li>
                            <li>If needed, we'll schedule a consultation or showroom visit</li>
                        </ul>
                    </div>
                    
                    <div class='showcase'>
                        <h4>🌟 Why Choose IndoSaga Furniture?</h4>
                        <ul>
                            <li><strong>Premium Quality:</strong> Handcrafted from finest teak wood</li>
                            <li><strong>Custom Designs:</strong> Tailored to your space and preferences</li>
                            <li><strong>Expert Craftsmanship:</strong> Traditional techniques with modern aesthetics</li>
                            <li><strong>Lifetime Durability:</strong> Built to last generations</li>
                            <li><strong>Complete Service:</strong> From design to delivery and assembly</li>
                        </ul>
                    </div>
                    
                    <h4>📞 Get in Touch</h4>
                    <p>While you wait for our detailed response, feel free to:</p>
                    <p><strong>Visit Our Showroom:</strong> [Showroom Address]<br>
                    <strong>Call Us:</strong> +91-XXXXXXXXXX<br>
                    <strong>WhatsApp:</strong> +91-XXXXXXXXXX<br>
                    <strong>Email:</strong> info@indosaga.com<br>
                    <strong>Business Hours:</strong> Monday - Saturday, 9:00 AM - 7:00 PM</p>
                    
                    <h4>🔗 Explore More</h4>
                    <ul>
                        <li>Browse our complete furniture catalog online</li>
                        <li>Read customer testimonials and reviews</li>
                        <li>View our latest furniture collections</li>
                        <li>Check out our furniture care guides</li>
                    </ul>
                    
                    <p>We look forward to helping you create your dream home with our beautiful furniture pieces!</p>
                    
                    <p>Warm regards,<br>
                    <strong>IndoSaga Furniture Team</strong></p>
                </div>
                
                <div class='footer'>
                    <p>IndoSaga Furniture - Premium Handcrafted Furniture<br>
                    Visit us: www.indosaga.com | Follow us on social media</p>
                </div>
            </div>
        </body>
        </html>";
        
        return ['subject' => $subject, 'body' => $body];
    }
}
?>