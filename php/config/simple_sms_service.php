<?php
/**
 * Simple SMS Service for Order Notifications
 * All-in-one SMS service with multiple provider support
 */

class SimpleSmsService {
    
    /**
     * SMS Provider configurations
     */
    private static function getProviderConfigs() {
        return [
            'fast2sms' => [
                'api_url' => 'https://www.fast2sms.com/dev/bulkV2',
                'api_key' => getenv('FAST2SMS_API_KEY') ?: '',
                'enabled' => !empty(getenv('FAST2SMS_API_KEY'))
            ],
            'twilio' => [
                'api_url' => 'https://api.twilio.com/2010-04-01/Accounts',
                'account_sid' => getenv('TWILIO_ACCOUNT_SID') ?: '',
                'auth_token' => getenv('TWILIO_AUTH_TOKEN') ?: '',
                'from_number' => getenv('TWILIO_PHONE_NUMBER') ?: '',
                'enabled' => !empty(getenv('TWILIO_ACCOUNT_SID')) && !empty(getenv('TWILIO_AUTH_TOKEN'))
            ],
            'msg91' => [
                'api_url' => 'https://api.msg91.com/api/v5/flow/',
                'api_key' => getenv('MSG91_API_KEY') ?: '',
                'enabled' => !empty(getenv('MSG91_API_KEY'))
            ],
            'textlocal' => [
                'api_url' => 'https://api.textlocal.in/send/',
                'api_key' => getenv('TEXTLOCAL_API_KEY') ?: '',
                'sender' => getenv('TEXTLOCAL_SENDER') ?: 'INDOSAGA',
                'enabled' => !empty(getenv('TEXTLOCAL_API_KEY'))
            ]
        ];
    }
    
    /**
     * Get first enabled provider
     */
    private static function getEnabledProvider() {
        $configs = self::getProviderConfigs();
        
        foreach ($configs as $name => $config) {
            if ($config['enabled']) {
                return ['name' => $name, 'config' => $config];
            }
        }
        
        return null;
    }
    
    /**
     * Format phone number for Indian numbers
     */
    private static function formatPhoneNumber($phone) {
        // Remove all non-numeric characters
        $phone = preg_replace('/[^0-9]/', '', $phone);
        
        // Handle Indian numbers
        if (strlen($phone) === 10) {
            return '91' . $phone; // Add country code
        } elseif (strlen($phone) === 12 && substr($phone, 0, 2) === '91') {
            return $phone; // Already has country code
        } elseif (strlen($phone) === 13 && substr($phone, 0, 3) === '+91') {
            return substr($phone, 1); // Remove + sign
        }
        
        return $phone;
    }
    
    /**
     * Validate phone number
     */
    private static function validatePhoneNumber($phone) {
        $formatted = self::formatPhoneNumber($phone);
        
        // Check if it's a valid Indian mobile number
        if (strlen($formatted) === 12 && substr($formatted, 0, 2) === '91') {
            $mobile = substr($formatted, 2);
            return in_array($mobile[0], ['6', '7', '8', '9']);
        }
        
        return strlen($formatted) >= 10 && strlen($formatted) <= 15;
    }
    
    /**
     * Send SMS via Fast2SMS
     */
    private static function sendViaFast2SMS($phone, $message, $config) {
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
            CURLOPT_URL => $config['api_url'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_HTTPHEADER => [
                'authorization: ' . $config['api_key'],
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
            return ['success' => true, 'message_id' => $result['request_id'] ?? null];
        }
        
        return ['success' => false, 'error' => $result['message'] ?? 'Fast2SMS API error'];
    }
    
    /**
     * Send SMS via Twilio
     */
    private static function sendViaTwilio($phone, $message, $config) {
        $toNumber = '+' . $phone;
        $url = $config['api_url'] . '/' . $config['account_sid'] . '/Messages.json';
        
        $data = [
            'From' => $config['from_number'],
            'To' => $toNumber,
            'Body' => $message
        ];
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query($data),
            CURLOPT_USERPWD => $config['account_sid'] . ':' . $config['auth_token'],
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
            return ['success' => true, 'message_id' => $result['sid']];
        }
        
        return ['success' => false, 'error' => $result['message'] ?? 'Twilio API error'];
    }
    
    /**
     * Send SMS via MSG91
     */
    private static function sendViaMsg91($phone, $message, $config) {
        $data = [
            'sender' => 'INDOSAGA',
            'route' => '4',
            'country' => '91',
            'sms' => [
                [
                    'message' => $message,
                    'to' => [$phone]
                ]
            ]
        ];
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $config['api_url'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_HTTPHEADER => [
                'authkey: ' . $config['api_key'],
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
            return ['success' => true, 'message_id' => $result['request_id'] ?? null];
        }
        
        return ['success' => false, 'error' => $result['message'] ?? 'MSG91 API error'];
    }
    
    /**
     * Send SMS via TextLocal
     */
    private static function sendViaTextLocal($phone, $message, $config) {
        $data = [
            'apikey' => $config['api_key'],
            'numbers' => $phone,
            'message' => $message,
            'sender' => $config['sender']
        ];
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $config['api_url'],
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
            return ['success' => true, 'message_id' => $result['batch_id'] ?? null];
        }
        
        return ['success' => false, 'error' => $result['errors'][0]['message'] ?? 'TextLocal API error'];
    }
    
    /**
     * Main method to send SMS
     */
    private static function sendSms($phone, $message) {
        // Get enabled provider
        $provider = self::getEnabledProvider();
        
        if (!$provider) {
            return [
                'success' => false,
                'error' => 'No SMS provider configured. Please set API keys in environment variables.',
                'skipped' => true
            ];
        }
        
        // Validate phone number
        if (!self::validatePhoneNumber($phone)) {
            return [
                'success' => false,
                'error' => "Invalid phone number format: $phone"
            ];
        }
        
        // Format phone number
        $formattedPhone = self::formatPhoneNumber($phone);
        
        // Send SMS based on provider
        try {
            switch ($provider['name']) {
                case 'fast2sms':
                    $result = self::sendViaFast2SMS($formattedPhone, $message, $provider['config']);
                    break;
                case 'twilio':
                    $result = self::sendViaTwilio($formattedPhone, $message, $provider['config']);
                    break;
                case 'msg91':
                    $result = self::sendViaMsg91($formattedPhone, $message, $provider['config']);
                    break;
                case 'textlocal':
                    $result = self::sendViaTextLocal($formattedPhone, $message, $provider['config']);
                    break;
                default:
                    return ['success' => false, 'error' => 'Unsupported SMS provider'];
            }
            
            if ($result['success']) {
                error_log("✅ SMS sent successfully to $formattedPhone via {$provider['name']}");
            } else {
                error_log("❌ SMS failed to $formattedPhone via {$provider['name']}: " . $result['error']);
            }
            
            $result['provider'] = $provider['name'];
            $result['phone'] = $formattedPhone;
            
            return $result;
            
        } catch (Exception $e) {
            error_log("❌ SMS sending exception: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'provider' => $provider['name'],
                'phone' => $formattedPhone
            ];
        }
    }
    
    /**
     * Send order confirmation SMS
     */
    public static function sendOrderConfirmationSms($orderData) {
        // Check required data
        if (empty($orderData['customerPhone'])) {
            return [
                'success' => false,
                'error' => 'Customer phone number not provided',
                'skipped' => true
            ];
        }
        
        if (empty($orderData['orderId']) || empty($orderData['total'])) {
            return [
                'success' => false,
                'error' => 'Order ID or total amount missing',
                'skipped' => true
            ];
        }
        
        // Create message
        $orderId = $orderData['orderId'];
        $amount = '₹' . number_format($orderData['total'], 2);
        $trackingUrl = "https://indosaga.com/orders/" . $orderId;
        
        $message = "🎉 Order Confirmed! Your order #$orderId for $amount has been placed successfully. Track your order at $trackingUrl. IndoSaga Furniture - Premium Teak Wood Furniture.";
        
        // Send SMS
        return self::sendSms($orderData['customerPhone'], $message);
    }
    
    /**
     * Get SMS configuration status
     */
    public static function getConfigurationStatus() {
        $configs = self::getProviderConfigs();
        $enabled = [];
        
        foreach ($configs as $name => $config) {
            if ($config['enabled']) {
                $enabled[] = $name;
            }
        }
        
        return [
            'enabled_providers' => $enabled,
            'primary_provider' => !empty($enabled) ? $enabled[0] : null,
            'total_providers' => count($configs),
            'sms_enabled' => !empty($enabled)
        ];
    }
}
?>