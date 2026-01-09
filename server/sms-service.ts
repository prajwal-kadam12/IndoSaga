/**
 * SMS Service for Order Notifications
 * Integrates with Fast2SMS API for sending order confirmations
 */

interface SMSOrderData {
  orderId: string;
  customerName: string;
  customerPhone: string;
  total: string | number;
  paymentStatus: string;
}

interface SMSResult {
  success: boolean;
  message?: string;
  error?: string;
  provider?: string;
  phone?: string;
}

// Format phone number for Indian numbers
function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  
  // Handle Indian numbers
  if (cleanPhone.length === 10) {
    return '91' + cleanPhone; // Add country code
  } else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
    return cleanPhone; // Already has country code
  } else if (cleanPhone.length === 13 && cleanPhone.startsWith('91')) {
    return cleanPhone.substring(1); // Remove + sign
  }
  
  return cleanPhone;
}

// Validate phone number
function validatePhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone);
  
  // Check if it's a valid Indian mobile number
  if (formatted.length === 12 && formatted.startsWith('91')) {
    const mobile = formatted.substring(2);
    return ['6', '7', '8', '9'].includes(mobile[0]);
  }
  
  return formatted.length >= 10 && formatted.length <= 15;
}

// Send SMS via Fast2SMS
async function sendViaFast2SMS(phone: string, message: string): Promise<SMSResult> {
  const apiKey = process.env.FAST2SMS_API_KEY;
  
  if (!apiKey) {
    return {
      success: false,
      error: 'Fast2SMS API key not configured',
      provider: 'fast2sms'
    };
  }

  const data = {
    route: 'v3',
    sender_id: 'INDOSAGA',
    message: message,
    language: 'english',
    flash: 0,
    numbers: phone
  };

  try {
    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (response.ok && result.return === true) {
      return {
        success: true,
        message: 'SMS sent successfully',
        provider: 'fast2sms',
        phone: phone
      };
    } else {
      return {
        success: false,
        error: result.message || 'SMS sending failed',
        provider: 'fast2sms',
        phone: phone
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
      provider: 'fast2sms',
      phone: phone
    };
  }
}

// Main SMS sending function
export async function sendSMS(phone: string, message: string): Promise<SMSResult> {
  if (!phone || !message) {
    return {
      success: false,
      error: 'Phone number and message are required'
    };
  }

  const formattedPhone = formatPhoneNumber(phone);
  
  if (!validatePhoneNumber(phone)) {
    return {
      success: false,
      error: 'Invalid phone number format'
    };
  }

  try {
    const result = await sendViaFast2SMS(formattedPhone, message);
    
    if (result.success) {
      console.log(`✅ SMS sent successfully to ${formattedPhone} via fast2sms`);
    } else {
      console.error(`❌ SMS failed to ${formattedPhone} via fast2sms: ${result.error}`);
    }
    
    return result;
  } catch (error) {
    console.error(`❌ SMS sending exception: ${error}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      provider: 'fast2sms',
      phone: formattedPhone
    };
  }
}

// Send order confirmation SMS
export async function sendOrderConfirmationSms(orderData: SMSOrderData): Promise<SMSResult> {
  // Check required data
  if (!orderData.customerPhone) {
    return {
      success: false,
      error: 'Customer phone number not provided'
    };
  }
  
  if (!orderData.orderId || !orderData.total) {
    return {
      success: false,
      error: 'Order ID or total amount missing'
    };
  }
  
  // Create message
  const orderId = orderData.orderId;
  const amount = typeof orderData.total === 'number' 
    ? `₹${orderData.total.toLocaleString('en-IN')}`
    : `₹${parseFloat(orderData.total).toLocaleString('en-IN')}`;
  const trackingUrl = `https://indosaga.com/orders/${orderId}`;
  
  const message = `🎉 Order Confirmed! Your order #${orderId} for ${amount} has been placed successfully. Track your order at ${trackingUrl}. IndoSaga Furniture - Premium Teak Wood Furniture.`;
  
  // Send SMS
  return await sendSMS(orderData.customerPhone, message);
}

// Get SMS configuration status
export function getSMSConfigurationStatus() {
  const apiKey = process.env.FAST2SMS_API_KEY;
  
  return {
    sms_enabled: !!apiKey,
    provider: 'fast2sms',
    configured: !!apiKey
  };
}