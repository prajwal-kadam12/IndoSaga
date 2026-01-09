<?php
/**
 * Email Configuration for IndoSaga Real-time Email Integration
 * Configure SMTP settings for sending emails via Gmail/SendGrid
 */

// Email Configuration Constants
if (!defined('ADMIN_EMAIL')) {
    define('ADMIN_EMAIL', 'kadamprajwal358@gmail.com');
}
if (!defined('FROM_EMAIL')) {
    define('FROM_EMAIL', 'noreply@indosaga.com');
}
if (!defined('FROM_NAME')) {
    define('FROM_NAME', 'IndoSaga Furniture');
}

// SMTP Configuration
$emailConfig = [
    // Gmail SMTP Configuration (recommended for development)
    'smtp' => [
        'host' => 'smtp.gmail.com',
        'port' => 587,
        'encryption' => 'tls', // or 'ssl'
        'auth' => true,
        'username' => '', // Set in .env: SMTP_USERNAME
        'password' => '', // Set in .env: SMTP_PASSWORD (use App Password for Gmail)
    ],
    
    // SendGrid SMTP Alternative
    'sendgrid' => [
        'host' => 'smtp.sendgrid.net',
        'port' => 587,
        'encryption' => 'tls',
        'auth' => true,
        'username' => 'apikey',
        'password' => '', // Set in .env: SENDGRID_API_KEY
    ],
    
    // Active provider (smtp or sendgrid)
    'provider' => 'smtp',
    
    // Email settings
    'from_email' => FROM_EMAIL,
    'from_name' => FROM_NAME,
    'admin_email' => ADMIN_EMAIL,
    
    // Logging
    'log_emails' => true,
    'log_path' => __DIR__ . '/../logs/email.log',
];

// Load environment variables from system environment (Replit)
// In Replit, environment variables are available through getenv() and $_ENV
if (!isset($_ENV['SMTP_USERNAME']) && getenv('SMTP_USERNAME')) {
    $_ENV['SMTP_USERNAME'] = getenv('SMTP_USERNAME');
}
if (!isset($_ENV['SMTP_PASSWORD']) && getenv('SMTP_PASSWORD')) {
    $_ENV['SMTP_PASSWORD'] = getenv('SMTP_PASSWORD');
}
if (!isset($_ENV['SENDGRID_API_KEY']) && getenv('SENDGRID_API_KEY')) {
    $_ENV['SENDGRID_API_KEY'] = getenv('SENDGRID_API_KEY');
}

// Also try loading from .env file if exists
if (file_exists(__DIR__ . '/../../.env')) {
    $envFile = file_get_contents(__DIR__ . '/../../.env');
    $envLines = explode("\n", $envFile);
    
    foreach ($envLines as $line) {
        $line = trim($line);
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($value);
        }
    }
}

// Set SMTP credentials from environment variables
if (isset($_ENV['SMTP_USERNAME'])) {
    $emailConfig['smtp']['username'] = $_ENV['SMTP_USERNAME'];
}
if (isset($_ENV['SMTP_PASSWORD'])) {
    $emailConfig['smtp']['password'] = $_ENV['SMTP_PASSWORD'];
}
if (isset($_ENV['SENDGRID_API_KEY'])) {
    $emailConfig['sendgrid']['password'] = $_ENV['SENDGRID_API_KEY'];
}

return $emailConfig;
?>