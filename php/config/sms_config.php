<?php
/**
 * SMS Configuration
 * Supports multiple SMS providers: Fast2SMS, Twilio, MSG91, TextLocal
 */

class SmsConfig {
    // Default SMS provider
    const DEFAULT_PROVIDER = 'fast2sms';
    
    // SMS providers configuration
    public static function getProviderConfig($provider = null) {
        $provider = $provider ?: self::DEFAULT_PROVIDER;
        
        $configs = [
            'fast2sms' => [
                'name' => 'Fast2SMS',
                'api_url' => 'https://www.fast2sms.com/dev/bulkV2',
                'method' => 'POST',
                'headers' => [
                    'authorization' => getenv('FAST2SMS_API_KEY') ?: '',
                    'Content-Type' => 'application/json'
                ],
                'enabled' => !empty(getenv('FAST2SMS_API_KEY'))
            ],
            'twilio' => [
                'name' => 'Twilio',
                'api_url' => 'https://api.twilio.com/2010-04-01/Accounts',
                'method' => 'POST',
                'account_sid' => getenv('TWILIO_ACCOUNT_SID') ?: '',
                'auth_token' => getenv('TWILIO_AUTH_TOKEN') ?: '',
                'from_number' => getenv('TWILIO_PHONE_NUMBER') ?: '',
                'enabled' => !empty(getenv('TWILIO_ACCOUNT_SID')) && !empty(getenv('TWILIO_AUTH_TOKEN'))
            ],
            'msg91' => [
                'name' => 'MSG91',
                'api_url' => 'https://api.msg91.com/api/v5/flow/',
                'method' => 'POST',
                'headers' => [
                    'authkey' => getenv('MSG91_API_KEY') ?: '',
                    'Content-Type' => 'application/json'
                ],
                'enabled' => !empty(getenv('MSG91_API_KEY'))
            ],
            'textlocal' => [
                'name' => 'TextLocal',
                'api_url' => 'https://api.textlocal.in/send/',
                'method' => 'POST',
                'api_key' => getenv('TEXTLOCAL_API_KEY') ?: '',
                'sender' => getenv('TEXTLOCAL_SENDER') ?: 'INDOSAGA',
                'enabled' => !empty(getenv('TEXTLOCAL_API_KEY'))
            ]
        ];
        
        return $configs[$provider] ?? null;
    }
    
    // Get list of enabled providers
    public static function getEnabledProviders() {
        $providers = ['fast2sms', 'twilio', 'msg91', 'textlocal'];
        $enabled = [];
        
        foreach ($providers as $provider) {
            $config = self::getProviderConfig($provider);
            if ($config && $config['enabled']) {
                $enabled[] = $provider;
            }
        }
        
        return $enabled;
    }
    
    // Get primary provider (first enabled one)
    public static function getPrimaryProvider() {
        $enabled = self::getEnabledProviders();
        return !empty($enabled) ? $enabled[0] : null;
    }
    
    // Message templates
    public static function getMessageTemplates() {
        return [
            'order_confirmation' => [
                'template' => "🎉 Order Confirmed! Your order #{orderId} for ₹{amount} has been placed successfully. Track your order at {trackingUrl}. IndoSaga Furniture - Premium Teak Wood Furniture.",
                'variables' => ['orderId', 'amount', 'trackingUrl']
            ],
            'order_shipped' => [
                'template' => "📦 Your order #{orderId} has been shipped! Expected delivery: {deliveryDate}. Track: {trackingUrl}. IndoSaga Furniture",
                'variables' => ['orderId', 'deliveryDate', 'trackingUrl']
            ],
            'order_delivered' => [
                'template' => "✅ Order #{orderId} delivered successfully! Thank you for choosing IndoSaga Furniture. Rate your experience: {ratingUrl}",
                'variables' => ['orderId', 'ratingUrl']
            ]
        ];
    }
    
    // Format phone number for Indian numbers
    public static function formatPhoneNumber($phone) {
        // Remove all non-numeric characters
        $phone = preg_replace('/[^0-9]/', '', $phone);
        
        // Handle Indian numbers
        if (strlen($phone) === 10) {
            // Add country code for 10-digit numbers
            return '91' . $phone;
        } elseif (strlen($phone) === 12 && substr($phone, 0, 2) === '91') {
            // Already has country code
            return $phone;
        } elseif (strlen($phone) === 13 && substr($phone, 0, 3) === '+91') {
            // Remove + sign
            return substr($phone, 1);
        }
        
        // Return as-is if format is unclear
        return $phone;
    }
    
    // Validate phone number
    public static function validatePhoneNumber($phone) {
        $formatted = self::formatPhoneNumber($phone);
        
        // Check if it's a valid Indian mobile number
        if (strlen($formatted) === 12 && substr($formatted, 0, 2) === '91') {
            $mobile = substr($formatted, 2);
            // Indian mobile numbers start with 6,7,8,9
            return in_array($mobile[0], ['6', '7', '8', '9']);
        }
        
        // For international numbers, just check length
        return strlen($formatted) >= 10 && strlen($formatted) <= 15;
    }
}
?>