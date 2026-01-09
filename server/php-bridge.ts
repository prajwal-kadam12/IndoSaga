import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * PHP Email Bridge
 * Bridges Node.js with PHP email handlers for order notifications
 */

interface OrderData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  total: number;
  paymentStatus: string;
  paymentMethod?: string;
  transactionId?: string;
  shippingAddress?: string;
  orderItems?: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
}

interface CancellationData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  reason: string;
  details?: string;
  orderTotal?: number;
}

/**
 * Execute PHP script with JSON data
 */
async function executePHPScript(scriptPath: string, data: any): Promise<{ success: boolean; output: string; error?: string }> {
  return new Promise((resolve) => {
    const phpProcess = spawn('php', [scriptPath], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    // Send JSON data to PHP script via stdin
    phpProcess.stdin.write(JSON.stringify(data));
    phpProcess.stdin.end();

    // Collect stdout
    phpProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    // Collect stderr
    phpProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    phpProcess.on('close', (code) => {
      console.log(`📧 PHP Email Bridge - Script: ${scriptPath}, Exit Code: ${code}`);
      console.log(`📧 PHP Output: ${output}`);
      
      if (errorOutput) {
        console.error(`📧 PHP Error: ${errorOutput}`);
      }

      resolve({
        success: code === 0,
        output: output.trim(),
        error: code !== 0 ? errorOutput : undefined
      });
    });

    phpProcess.on('error', (error) => {
      console.error(`📧 PHP Process Error:`, error);
      resolve({
        success: false,
        output: '',
        error: error.message
      });
    });
  });
}

/**
 * Send order success email using PHP handler
 */
export async function sendOrderSuccessEmail(orderData: OrderData): Promise<{ success: boolean; message: string; emailIds?: any }> {
  try {
    console.log('📧 Triggering PHP order success email handler...');
    
    const scriptPath = path.join(process.cwd(), 'php', 'handlers', 'order_success.php');
    
    // Check if PHP script exists
    try {
      await fs.access(scriptPath);
    } catch (error) {
      console.error(`📧 PHP script not found: ${scriptPath}`);
      return {
        success: false,
        message: 'PHP email handler not found, falling back to Node.js mailer'
      };
    }

    const result = await executePHPScript(scriptPath, orderData);
    
    if (result.success) {
      console.log('📧 PHP order success email sent successfully');
      return {
        success: true,
        message: 'Order success emails sent via PHP',
        emailIds: result.output
      };
    } else {
      console.error('📧 PHP order success email failed:', result.error);
      return {
        success: false,
        message: `PHP email handler failed: ${result.error}`
      };
    }
  } catch (error: any) {
    console.error('📧 PHP bridge error for order success:', error);
    return {
      success: false,
      message: `PHP bridge error: ${error.message}`
    };
  }
}

/**
 * Send order cancellation email using PHP handler
 */
export async function sendOrderCancellationEmail(cancellationData: CancellationData): Promise<{ success: boolean; message: string; emailIds?: any }> {
  try {
    console.log('📧 Triggering PHP order cancellation email handler...');
    
    const scriptPath = path.join(process.cwd(), 'php', 'handlers', 'order_cancellation.php');
    
    // Check if PHP script exists
    try {
      await fs.access(scriptPath);
    } catch (error) {
      console.error(`📧 PHP script not found: ${scriptPath}`);
      return {
        success: false,
        message: 'PHP cancellation handler not found'
      };
    }

    const result = await executePHPScript(scriptPath, cancellationData);
    
    if (result.success) {
      console.log('📧 PHP order cancellation email sent successfully');
      return {
        success: true,
        message: 'Order cancellation emails sent via PHP',
        emailIds: result.output
      };
    } else {
      console.error('📧 PHP order cancellation email failed:', result.error);
      return {
        success: false,
        message: `PHP cancellation handler failed: ${result.error}`
      };
    }
  } catch (error: any) {
    console.error('📧 PHP bridge error for cancellation:', error);
    return {
      success: false,
      message: `PHP bridge error: ${error.message}`
    };
  }
}

/**
 * Fallback to Node.js email if PHP fails
 */
export async function sendEmailWithFallback(orderData: OrderData, emailType: 'success' | 'cancellation' = 'success'): Promise<{ success: boolean; message: string; emailIds?: any }> {
  let phpResult;
  
  if (emailType === 'success') {
    phpResult = await sendOrderSuccessEmail(orderData);
  } else {
    const cancellationData: CancellationData = {
      orderId: orderData.orderId,
      customerName: orderData.customerName,
      customerEmail: orderData.customerEmail,
      reason: 'Order cancelled by user',
      orderTotal: orderData.total
    };
    phpResult = await sendOrderCancellationEmail(cancellationData);
  }
  
  if (phpResult.success) {
    return phpResult;
  }
  
  // If PHP fails, log the attempt and let the existing Node.js email handler take over
  console.log('📧 PHP email failed, continuing with Node.js email fallback');
  return {
    success: false,
    message: 'PHP failed, using Node.js fallback',
    emailIds: null
  };
}

/**
 * Log PHP email activity
 */
export function logPHPEmailActivity(type: 'success' | 'cancellation', orderId: string, result: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${type.toUpperCase()} - Order ${orderId} - ${result.success ? 'SUCCESS' : 'FAILED'}: ${result.message}`;
  console.log(`📧 PHP Email Log: ${logMessage}`);
}