<?php
/**
 * IndoSaga Email Service - PHPMailer Integration
 * Reusable mail service for sending emails via SMTP
 */

require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/email_config.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class MailService {
    private $config;
    private $mailer;
    
    public function __construct() {
        $this->config = include __DIR__ . '/email_config.php';
        $this->setupMailer();
    }
    
    /**
     * Setup PHPMailer with SMTP configuration
     */
    private function setupMailer() {
        $this->mailer = new PHPMailer(true);
        
        try {
            // Server settings
            $this->mailer->isSMTP();
            $this->mailer->SMTPDebug = 0; // Disable debug output
            
            $provider = $this->config['provider'];
            $smtpConfig = $this->config[$provider];
            
            $this->mailer->Host = $smtpConfig['host'];
            $this->mailer->SMTPAuth = $smtpConfig['auth'];
            $this->mailer->Username = $smtpConfig['username'];
            $this->mailer->Password = $smtpConfig['password'];
            $this->mailer->SMTPSecure = $smtpConfig['encryption'];
            $this->mailer->Port = $smtpConfig['port'];
            
            // Recipients defaults
            $this->mailer->setFrom($this->config['from_email'], $this->config['from_name']);
            
        } catch (Exception $e) {
            $this->logError("Mailer setup failed: " . $e->getMessage());
        }
    }
    
    /**
     * Send email function
     * @param string $to - Recipient email
     * @param string $subject - Email subject
     * @param string $body - HTML body
     * @param string $altBody - Plain text alternative
     * @return array - Success status and message
     */
    public function sendMail($to, $subject, $body, $altBody = '') {
        try {
            // Clear any previous recipients
            $this->mailer->clearAddresses();
            $this->mailer->clearAttachments();
            
            // Recipients
            $this->mailer->addAddress($to);
            
            // Content
            $this->mailer->isHTML(true);
            $this->mailer->Subject = $subject;
            $this->mailer->Body = $body;
            $this->mailer->AltBody = $altBody ?: strip_tags($body);
            
            // Send email
            $this->mailer->send();
            
            $this->logSuccess("Email sent successfully to: $to - Subject: $subject");
            
            return [
                'success' => true,
                'message' => 'Email sent successfully',
                'recipient' => $to
            ];
            
        } catch (Exception $e) {
            $errorMsg = "Email failed to: $to - Error: " . $e->getMessage();
            $this->logError($errorMsg);
            
            return [
                'success' => false,
                'message' => 'Email sending failed',
                'error' => $e->getMessage(),
                'recipient' => $to
            ];
        }
    }
    
    /**
     * Send dual emails (admin + user)
     * @param array $userEmail - User email data [to, subject, body]
     * @param array $adminEmail - Admin email data [to, subject, body]
     * @return array - Results for both emails
     */
    public function sendDualEmails($userEmail, $adminEmail) {
        $results = [
            'user_email' => $this->sendMail($userEmail['to'], $userEmail['subject'], $userEmail['body']),
            'admin_email' => $this->sendMail($adminEmail['to'], $adminEmail['subject'], $adminEmail['body'])
        ];
        
        $this->logInfo("Dual emails sent - User: {$userEmail['to']}, Admin: {$adminEmail['to']}");
        
        return $results;
    }
    
    /**
     * Log success messages
     */
    private function logSuccess($message) {
        if ($this->config['log_emails']) {
            $this->writeLog('SUCCESS', $message);
        }
    }
    
    /**
     * Log error messages
     */
    private function logError($message) {
        if ($this->config['log_emails']) {
            $this->writeLog('ERROR', $message);
        }
    }
    
    /**
     * Log info messages
     */
    private function logInfo($message) {
        if ($this->config['log_emails']) {
            $this->writeLog('INFO', $message);
        }
    }
    
    /**
     * Write to log file
     */
    private function writeLog($level, $message) {
        $timestamp = date('Y-m-d H:i:s');
        $logEntry = "[$timestamp] [$level] $message" . PHP_EOL;
        
        // Ensure log directory exists
        $logDir = dirname($this->config['log_path']);
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        file_put_contents($this->config['log_path'], $logEntry, FILE_APPEND | LOCK_EX);
    }
    
    /**
     * Get configuration
     */
    public function getConfig() {
        return $this->config;
    }
}

/**
 * Global function for quick email sending
 * @param string $to
 * @param string $subject  
 * @param string $body
 * @return array
 */
function sendMail($to, $subject, $body) {
    $mailService = new MailService();
    return $mailService->sendMail($to, $subject, $body);
}

// Ensure MailService class is available globally
if (!class_exists('MailService')) {
    throw new Exception('MailService class not properly loaded');
}
?>