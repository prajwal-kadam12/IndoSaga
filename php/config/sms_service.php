<?php
/**
 * SMS Service
 * Handles SMS sending with multiple provider support
 */

require_once __DIR__ . '/sms_config.php';

class SmsService {
    private $provider;
    private $config;
    private $lastError;
    
    public function __construct($provider = null) {
        $this->provider = $provider ?: SmsConfig::getPrimaryProvider();
        $this->config = SmsConfig::getProviderConfig($this->provider);
        
        if (!$this->config || !$this->config['enabled']) {
            throw new Exception("SMS provider '{$this->provider}' is not enabled or configured");
        }
    }
    
    /**
     * Send SMS message
     */
    public function sendSms($to, $message, $template = null, $variables = []) {
        try {
            // Validate phone number
            if (!SmsConfig::validatePhoneNumber($to)) {
                throw new Exception("Invalid phone number format: $to");
            }
            
            // Format phone number
            $formattedPhone = SmsConfig::formatPhoneNumber($to);
            
            // Use template if provided
            if ($template) {
                $message = $this->renderTemplate($template, $variables);
            }
            
            // Send SMS based on provider
            $result = $this->sendViaProvider($formattedPhone, $message);
            
            if ($result['success']) {
                error_log("✅ SMS sent successfully to $formattedPhone via {$this->provider}");
                return [
                    'success' => true,
                    'message' => 'SMS sent successfully',
                    'provider' => $this->provider,
                    'phone' => $formattedPhone,
                    'message_id' => $result['message_id'] ?? null
                ];
            } else {
                throw new Exception($result['error'] ?? 'Failed to send SMS');
            }
            
        } catch (Exception $e) {
            $this->lastError = $e->getMessage();
            error_log("❌ SMS sending failed: " . $e->getMessage());
            
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'provider' => $this->provider,
                'phone' => $formattedPhone ?? $to
            ];
        }
    }
    
    /**
     * Send SMS via specific provider
     */
    private function sendViaProvider($phone, $message) {
        switch ($this->provider) {
            case 'fast2sms':
                return $this->sendViaFast2SMS($phone, $message);
            case 'twilio':
                return $this->sendViaTwilio($phone, $message);
            case 'msg91':
                return $this->sendViaMsg91($phone, $message);
            case 'textlocal':
                return $this->sendViaTextLocal($phone, $message);
            default:
                throw new Exception("Unsupported SMS provider: {$this->provider}");
        }
    }
    
    /**
     * Send via Fast2SMS
     */
    private function sendViaFast2SMS($phone, $message) {
        $data = [
            'route' => 'v3',
            'sender_id' => 'INDOSAGA',
            'message' => $message,
            'language' => 'english',
            'flash' => 0,
            'numbers' => $phone
        ];
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $this->config['api_url'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_HTTPHEADER => [
                'authorization: ' . $this->config['headers']['authorization'],
                'Content-Type: application/json'
            ],
            CURLOPT_TIMEOUT => 30
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($response === false) {
            return ['success' => false, 'error' => 'cURL error occurred'];
        }
        
        $result = json_decode($response, true);
        
        if ($httpCode === 200 && isset($result['return']) && $result['return'] === true) {
            return [
                'success' => true,
                'message_id' => $result['request_id'] ?? null,
                'response' => $result
            ];
        }
        
        return [
            'success' => false,
            'error' => $result['message'] ?? 'Fast2SMS API error',
            'response' => $result
        ];
    }
    
    /**
     * Send via Twilio
     */
    private function sendViaTwilio($phone, $message) {
        // Add + prefix for international format
        $toNumber = '+' . $phone;
        $fromNumber = $this->config['from_number'];
        
        $url = $this->config['api_url'] . '/' . $this->config['account_sid'] . '/Messages.json';
        
        $data = [
            'From' => $fromNumber,
            'To' => $toNumber,
            'Body' => $message
        ];
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query($data),
            CURLOPT_USERPWD => $this->config['account_sid'] . ':' . $this->config['auth_token'],
            CURLOPT_TIMEOUT => 30
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($response === false) {
            return ['success' => false, 'error' => 'cURL error occurred'];
        }
        
        $result = json_decode($response, true);
        
        if ($httpCode === 201 && isset($result['sid'])) {
            return [
                'success' => true,
                'message_id' => $result['sid'],
                'response' => $result
            ];
        }
        
        return [
            'success' => false,
            'error' => $result['message'] ?? 'Twilio API error',
            'response' => $result
        ];
    }
    
    /**
     * Send via MSG91
     */
    private function sendViaMsg91($phone, $message) {
        $data = [
            'template_id' => '60ba4e4c9b1d7e0c5c8b4567', // Generic template ID
            'sender' => 'INDOSAGA',
            'short_url' => 0,
            'mobiles' => $phone,
            'message' => $message
        ];
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $this->config['api_url'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_HTTPHEADER => [
                'authkey: ' . $this->config['headers']['authkey'],
                'Content-Type: application/json'
            ],
            CURLOPT_TIMEOUT => 30
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($response === false) {
            return ['success' => false, 'error' => 'cURL error occurred'];
        }
        
        $result = json_decode($response, true);
        
        if ($httpCode === 200 && isset($result['type']) && $result['type'] === 'success') {
            return [
                'success' => true,
                'message_id' => $result['request_id'] ?? null,
                'response' => $result
            ];
        }
        
        return [
            'success' => false,
            'error' => $result['message'] ?? 'MSG91 API error',
            'response' => $result
        ];
    }
    
    /**
     * Send via TextLocal
     */
    private function sendViaTextLocal($phone, $message) {
        $data = [
            'apikey' => $this->config['api_key'],
            'numbers' => $phone,
            'message' => $message,
            'sender' => $this->config['sender']
        ];
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $this->config['api_url'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query($data),
            CURLOPT_TIMEOUT => 30
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($response === false) {
            return ['success' => false, 'error' => 'cURL error occurred'];
        }
        
        $result = json_decode($response, true);
        
        if ($httpCode === 200 && isset($result['status']) && $result['status'] === 'success') {
            return [
                'success' => true,
                'message_id' => $result['batch_id'] ?? null,
                'response' => $result
            ];
        }
        
        return [
            'success' => false,
            'error' => $result['errors'][0]['message'] ?? 'TextLocal API error',
            'response' => $result
        ];
    }
    
    /**
     * Render message template
     */
    private function renderTemplate($templateName, $variables = []) {
        $templates = SmsConfig::getMessageTemplates();
        
        if (!isset($templates[$templateName])) {
            throw new Exception("SMS template '$templateName' not found");
        }
        
        $template = $templates[$templateName]['template'];
        
        // Replace variables in template
        foreach ($variables as $key => $value) {
            $template = str_replace('{' . $key . '}', $value, $template);
        }
        
        // Check for unreplaced variables
        if (preg_match('/\{[a-zA-Z_]+\}/', $template)) {
            error_log("Warning: Unreplaced variables found in SMS template: $template");
        }
        
        return $template;
    }
    
    /**
     * Get last error
     */
    public function getLastError() {
        return $this->lastError;
    }
    
    /**
     * Test SMS configuration
     */
    public function testConfiguration() {
        $testNumber = '919999999999'; // Test number
        $testMessage = 'Test message from IndoSaga Furniture SMS service.';
        
        // Don't actually send test SMS, just validate configuration
        return [
            'provider' => $this->provider,
            'config_valid' => $this->config['enabled'],
            'phone_validation' => SmsConfig::validatePhoneNumber($testNumber),
            'templates_available' => count(SmsConfig::getMessageTemplates()),
            'enabled_providers' => SmsConfig::getEnabledProviders()
        ];
    }
    
    /**
     * Static method to send order confirmation SMS
     */
    public static function sendOrderConfirmationSms($orderData) {
        try {
            // Check if SMS is enabled
            $enabledProviders = SmsConfig::getEnabledProviders();
            if (empty($enabledProviders)) {
                return [
                    'success' => false,
                    'error' => 'No SMS providers configured',
                    'skipped' => true
                ];
            }
            
            // Validate required data
            if (empty($orderData['customerPhone'])) {
                return [
                    'success' => false,
                    'error' => 'Customer phone number not provided',
                    'skipped' => true
                ];
            }
            
            $smsService = new self();
            
            // Prepare template variables
            $variables = [
                'orderId' => $orderData['orderId'],
                'amount' => '₹' . number_format($orderData['total'], 2),
                'trackingUrl' => 'https://indosaga.com/track/' . $orderData['orderId']
            ];
            
            // Send SMS using template
            return $smsService->sendSms(
                $orderData['customerPhone'],
                null,
                'order_confirmation',
                $variables
            );
            
        } catch (Exception $e) {
            error_log("SMS Service Error: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}
?>