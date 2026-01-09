<?php
/**
 * IndoSaga Email Integration Setup Guide
 * Complete setup instructions and testing guide
 */
?>
<!DOCTYPE html>
<html>
<head>
    <title>IndoSaga Email Integration - Setup Guide</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px; }
        .section { background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #dc2626; }
        .code { background: #f1f5f9; padding: 15px; border-radius: 5px; font-family: monospace; overflow-x: auto; }
        .success { border-left-color: #22c55e; }
        .warning { border-left-color: #f59e0b; }
        .error { border-left-color: #ef4444; }
        .step { margin: 15px 0; padding: 10px; background: white; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f8f9fa; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏡 IndoSaga Furniture</h1>
        <h2>📧 Real-time Email Integration Setup Guide</h2>
    </div>

    <div class="section">
        <h3>📋 System Overview</h3>
        <p>This PHP email integration system sends instant emails to both admin and users for these 4 triggers:</p>
        <ul>
            <li><strong>Virtual Meeting Booking</strong> - When customer books a consultation</li>
            <li><strong>Order Success (Buy Now)</strong> - After successful payment</li>
            <li><strong>Support Ticket</strong> - When customer submits help request</li>
            <li><strong>Contact Us Enquiry</strong> - General contact form submissions</li>
        </ul>
    </div>

    <div class="section warning">
        <h3>⚠️ Prerequisites</h3>
        <ul>
            <li>PHP 7.4+ with composer</li>
            <li>PHPMailer library (already installed)</li>
            <li>SMTP email account (Gmail or SendGrid)</li>
            <li>Valid email credentials</li>
        </ul>
    </div>

    <div class="section">
        <h3>🔧 Step 1: SMTP Configuration</h3>
        
        <div class="step">
            <h4>Option A: Gmail SMTP (Recommended for Development)</h4>
            <p>1. Enable 2-Factor Authentication on your Gmail account</p>
            <p>2. Generate an App Password:</p>
            <ul>
                <li>Go to Google Account Settings</li>
                <li>Security → 2-Step Verification → App passwords</li>
                <li>Generate password for "Mail"</li>
                <li>Copy the 16-character password</li>
            </ul>
            
            <p>3. Add to your .env file:</p>
            <div class="code">
SMTP_USERNAME=your-gmail@gmail.com
SMTP_PASSWORD=your-16-char-app-password
            </div>
        </div>

        <div class="step">
            <h4>Option B: SendGrid SMTP (Recommended for Production)</h4>
            <p>1. Create SendGrid account (100 emails/day free)</p>
            <p>2. Get API key from SendGrid dashboard</p>
            <p>3. Add to your .env file:</p>
            <div class="code">
SENDGRID_API_KEY=your-sendgrid-api-key
            </div>
            <p>4. Update php/config/email_config.php:</p>
            <div class="code">
'provider' => 'sendgrid',  // Change from 'smtp' to 'sendgrid'
            </div>
        </div>
    </div>

    <div class="section">
        <h3>📁 Step 2: File Structure</h3>
        <div class="code">
php/
├── config/
│   ├── email_config.php     # SMTP settings
│   └── mail_service.php     # PHPMailer service
├── templates/
│   ├── meeting_templates.php
│   ├── order_templates.php
│   ├── support_templates.php
│   └── contact_templates.php
├── handlers/
│   ├── book_meeting.php     # Meeting booking endpoint
│   ├── order_success.php    # Order success endpoint
│   ├── support_ticket.php   # Support ticket endpoint
│   └── contact_us.php       # Contact form endpoint
├── logs/
│   ├── email.log           # PHPMailer logs
│   ├── meeting_bookings.log
│   ├── order_success.log
│   ├── support_tickets.log
│   ├── contact_enquiries.log
│   └── errors.log
└── test/
    └── test_emails.php      # Testing script
        </div>
    </div>

    <div class="section success">
        <h3>✅ Step 3: API Endpoints</h3>
        <table>
            <tr>
                <th>Trigger</th>
                <th>Endpoint</th>
                <th>Method</th>
                <th>Required Fields</th>
            </tr>
            <tr>
                <td>Meeting Booking</td>
                <td>/php/handlers/book_meeting.php</td>
                <td>POST</td>
                <td>customerName, customerEmail, appointmentDate, appointmentTime, meetingType</td>
            </tr>
            <tr>
                <td>Order Success</td>
                <td>/php/handlers/order_success.php</td>
                <td>POST</td>
                <td>orderId, customerName, customerEmail, total, paymentStatus</td>
            </tr>
            <tr>
                <td>Support Ticket</td>
                <td>/php/handlers/support_ticket.php</td>
                <td>POST</td>
                <td>customerName, customerEmail, subject, message</td>
            </tr>
            <tr>
                <td>Contact Us</td>
                <td>/php/handlers/contact_us.php</td>
                <td>POST</td>
                <td>name, email, subject, message</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <h3>🧪 Step 4: Testing</h3>
        <p>Use the built-in testing script:</p>
        <div class="code">
# Test all email handlers
php php/test/test_emails.php

# Or test individual handlers
curl -X POST http://localhost:5000/php/handlers/contact_us.php \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","subject":"Test","message":"Test message"}'
        </div>
    </div>

    <div class="section error">
        <h3>🐛 Troubleshooting</h3>
        <ul>
            <li><strong>Authentication failed:</strong> Check SMTP credentials in .env</li>
            <li><strong>Connection timeout:</strong> Verify SMTP host and port settings</li>
            <li><strong>Emails not received:</strong> Check spam folder, verify email addresses</li>
            <li><strong>SSL errors:</strong> Try changing encryption from 'tls' to 'ssl' or vice versa</li>
        </ul>
        
        <p><strong>Log Files:</strong></p>
        <ul>
            <li>PHPMailer logs: php/logs/email.log</li>
            <li>Error logs: php/logs/errors.log</li>
            <li>Activity logs: php/logs/*.log</li>
        </ul>
    </div>

    <div class="section success">
        <h3>🎯 Integration with Your Website</h3>
        
        <h4>JavaScript Example (Frontend):</h4>
        <div class="code">
// Meeting booking
async function bookMeeting(meetingData) {
    const response = await fetch('/php/handlers/book_meeting.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meetingData)
    });
    const result = await response.json();
    console.log('Meeting booked:', result);
}

// Order success
async function sendOrderConfirmation(orderData) {
    const response = await fetch('/php/handlers/order_success.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
    });
    const result = await response.json();
    console.log('Order emails sent:', result);
}
        </div>

        <h4>Node.js Integration Example:</h4>
        <div class="code">
// Add to your Node.js routes
app.post('/api/meeting-booked', async (req, res) => {
    // Your existing meeting booking logic...
    
    // Then trigger PHP email service
    const emailData = {
        customerName: req.body.customerName,
        customerEmail: req.body.customerEmail,
        appointmentDate: req.body.appointmentDate,
        appointmentTime: req.body.appointmentTime,
        meetingType: req.body.meetingType,
        notes: req.body.notes
    };
    
    try {
        const response = await fetch('http://localhost:5000/php/handlers/book_meeting.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailData)
        });
        const emailResult = await response.json();
        console.log('Meeting emails sent:', emailResult);
    } catch (error) {
        console.error('Email sending failed:', error);
    }
    
    res.json({ success: true, meeting: savedMeeting });
});
        </div>
    </div>

    <div class="section">
        <h3>📊 Monitoring & Analytics</h3>
        <p>Monitor email delivery through:</p>
        <ul>
            <li>Log files in php/logs/ directory</li>
            <li>Response status from API endpoints</li>
            <li>SMTP provider dashboard (Gmail/SendGrid)</li>
            <li>Email bounce/delivery reports</li>
        </ul>
    </div>

    <div class="section">
        <h3>🔒 Security Notes</h3>
        <ul>
            <li>Never commit SMTP credentials to version control</li>
            <li>Use environment variables for sensitive data</li>
            <li>Implement rate limiting for email endpoints</li>
            <li>Validate and sanitize all input data</li>
            <li>Use HTTPS for production deployments</li>
        </ul>
    </div>

    <div class="section success">
        <h3>✨ Features Included</h3>
        <ul>
            <li>✅ Dual email sending (Admin + User)</li>
            <li>✅ Professional HTML email templates</li>
            <li>✅ Comprehensive error handling</li>
            <li>✅ Detailed logging system</li>
            <li>✅ Input validation and sanitization</li>
            <li>✅ JSON API responses</li>
            <li>✅ CORS support for frontend integration</li>
            <li>✅ Multiple SMTP provider support</li>
            <li>✅ Unique ID generation for tracking</li>
            <li>✅ Mobile-responsive email templates</li>
        </ul>
    </div>

    <div class="footer" style="text-align: center; margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
        <p><strong>IndoSaga Email Integration System</strong><br>
        Ready for production use with real-time email delivery</p>
        <p style="font-size: 14px; color: #666;">
            Admin Email: kadamprajwal358@gmail.com | 
            System Version: 1.0 | 
            Last Updated: <?php echo date('F j, Y'); ?>
        </p>
    </div>
</body>
</html>