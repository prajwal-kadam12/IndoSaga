import React from 'react';
import { X, Download, Printer, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: any;
}

export default function ReceiptModal({ isOpen, onClose, orderData }: ReceiptModalProps) {
  if (!isOpen || !orderData) return null;

  const handleDownloadReceipt = () => {
    const receiptContent = generateReceiptContent();
    const blob = new Blob([receiptContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${orderData.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrintReceipt = () => {
    const receiptContent = generateReceiptContent();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const generateReceiptContent = () => {
    const currentDate = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - Order #${orderData.id}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            position: relative;
            background-image: url('data:image/svg+xml;base64,${btoa(`
              <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
                <text x="100" y="100" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="rgba(139, 69, 19, 0.1)" transform="rotate(-45 100 100)">
                  IndoSaga
                </text>
              </svg>
            `)}');
            background-repeat: repeat;
            background-position: center;
            background-size: 200px 200px;
          }
          .header { text-align: center; border-bottom: 2px solid #8B4513; padding-bottom: 20px; margin-bottom: 30px; position: relative; z-index: 1; background: rgba(255, 255, 255, 0.9); }
          .company-name { font-size: 28px; font-weight: bold; color: #8B4513; margin-bottom: 5px; }
          .company-tagline { color: #666; font-size: 14px; }
          .receipt-title { font-size: 24px; color: #8B4513; margin: 20px 0; position: relative; z-index: 1; }
          .order-info { display: flex; justify-content: space-between; margin-bottom: 30px; position: relative; z-index: 1; background: rgba(255, 255, 255, 0.9); padding: 15px; border-radius: 5px; }
          .info-section { flex: 1; }
          .info-label { font-weight: bold; color: #8B4513; }
          .info-value { color: #333; margin-bottom: 10px; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; position: relative; z-index: 1; background: rgba(255, 255, 255, 0.9); }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .items-table th { background-color: #f5f5f5; font-weight: bold; color: #8B4513; }
          .total-section { text-align: right; margin-top: 20px; position: relative; z-index: 1; background: rgba(255, 255, 255, 0.9); padding: 15px; border-radius: 5px; }
          .total-line { margin-bottom: 10px; }
          .grand-total { font-size: 18px; font-weight: bold; color: #8B4513; border-top: 2px solid #8B4513; padding-top: 10px; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; position: relative; z-index: 1; background: rgba(255, 255, 255, 0.9); border-radius: 5px; }
          .success-badge { background-color: #d4edda; color: #155724; padding: 10px; border-radius: 5px; text-align: center; margin-bottom: 20px; position: relative; z-index: 1; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">IndoSaga Furniture</div>
          <div class="company-tagline">Premium Teak Furniture Collection</div>
        </div>
        
        <div class="success-badge">
          ✅ Payment Successful - Order Confirmed
        </div>
        
        <h2 class="receipt-title">PAYMENT RECEIPT</h2>
        
        <div class="order-info">
          <div class="info-section">
            <div class="info-label">Order Details:</div>
            <div class="info-value">Order ID: ${orderData.id}</div>
            <div class="info-value">Tracking ID: ${orderData.trackingId || 'N/A'}</div>
            <div class="info-value">Date: ${currentDate}</div>
            <div class="info-value">Payment Method: ${orderData.paymentMethod?.toUpperCase() || 'N/A'}</div>
            <div class="info-value">Payment Status: ${orderData.paymentStatus || 'N/A'}</div>
          </div>
          
          <div class="info-section">
            <div class="info-label">Customer Details:</div>
            <div class="info-value">${orderData.customerName}</div>
            <div class="info-value">${orderData.customerPhone}</div>
            ${orderData.customerEmail ? `<div class="info-value">${orderData.customerEmail}</div>` : ''}
            <div class="info-value">${orderData.shippingAddress}</div>
            <div class="info-value">PIN: ${orderData.pincode}</div>
          </div>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${orderData.orderItems?.map((item: any) => `
              <tr>
                <td>${item.product?.name || 'Product'}</td>
                <td>${item.quantity}</td>
                <td>₹${parseFloat(item.price).toLocaleString('en-IN')}</td>
                <td>₹${(parseFloat(item.price) * item.quantity).toLocaleString('en-IN')}</td>
              </tr>
            `).join('') || '<tr><td colspan="4">No items found</td></tr>'}
          </tbody>
        </table>
        
        <div class="total-section">
          <div class="total-line">Subtotal: ₹${parseFloat(orderData.total).toLocaleString('en-IN')}</div>
          ${orderData.paymentMethod === 'cod' ? '<div class="total-line">COD Fee: ₹99</div>' : ''}
          <div class="grand-total">Grand Total: ₹${orderData.paymentMethod === 'cod' ? (parseFloat(orderData.total) + 99).toLocaleString('en-IN') : parseFloat(orderData.total).toLocaleString('en-IN')}</div>
        </div>
        
        <div style="margin-top: 30px; position: relative; z-index: 1; background: rgba(255, 255, 255, 0.9); padding: 15px; border-radius: 5px;">
          <h3 style="color: #8B4513; margin-bottom: 10px;">Important Instructions</h3>
          <ul style="font-size: 12px; margin-bottom: 20px;">
            <li>• <strong>Delivery Timeline:</strong> Your furniture will be delivered within 7-14 business days.</li>
            <li>• <strong>Contact for Queries:</strong> Call +91 88650 09032 or email info@indosaga.com</li>
            <li>• <strong>Inspection:</strong> Please inspect all items upon delivery before signing receipt.</li>
            <li>• <strong>Assembly:</strong> Free assembly service included with all furniture items.</li>
            <li>• <strong>Payment (COD):</strong> Please keep exact change ready at the time of delivery.</li>
            <li>• <strong>Installation:</strong> Our team will handle complete setup and installation.</li>
          </ul>
        </div>
        
        <div style="margin-top: 20px; position: relative; z-index: 1; background: rgba(255, 255, 255, 0.9); padding: 15px; border-radius: 5px;">
          <h3 style="color: #8B4513; margin-bottom: 10px;">Warranty & Guarantee</h3>
          <ul style="font-size: 12px; margin-bottom: 20px;">
            <li>• <strong>Structural Warranty:</strong> 10 years warranty on all structural components</li>
            <li>• <strong>Finish Warranty:</strong> 2 years warranty on wood finish and polish</li>
            <li>• <strong>Hardware Warranty:</strong> 5 years warranty on hinges, handles, and fittings</li>
            <li>• <strong>Quality Guarantee:</strong> 100% genuine teak wood with quality certificate</li>
            <li>• <strong>Replacement:</strong> Free replacement if any manufacturing defect found within 30 days</li>
            <li>• <strong>Service:</strong> Lifetime maintenance support and servicing available</li>
            <li>• <strong>Termite Protection:</strong> All products treated with anti-termite chemicals</li>
          </ul>
        </div>
        
        <div style="margin-top: 20px; position: relative; z-index: 1; background: rgba(255, 255, 255, 0.9); padding: 15px; border-radius: 5px;">
          <h3 style="color: #8B4513; margin-bottom: 10px;">Privacy Policy & Terms</h3>
          <ul style="font-size: 12px; margin-bottom: 20px;">
            <li>• <strong>Data Protection:</strong> Your personal information is secure and encrypted with us</li>
            <li>• <strong>Privacy:</strong> We do not share your data with third parties without consent</li>
            <li>• <strong>Communication:</strong> We may contact you for order updates and customer feedback</li>
            <li>• <strong>Returns:</strong> 15-day return policy for unused items in original condition</li>
            <li>• <strong>Cancellation:</strong> Orders can be cancelled within 24 hours of placement</li>
            <li>• <strong>Disputes:</strong> All disputes subject to Pune jurisdiction only</li>
            <li>• <strong>Terms:</strong> Purchase constitutes acceptance of our terms and conditions</li>
          </ul>
        </div>
        
        <div class="footer">
          <div style="text-align: center; margin-bottom: 20px; border-top: 2px solid #8B4513; padding-top: 15px;">
            <p style="font-weight: bold; color: #8B4513;">IndoSaga Furniture Pvt. Ltd.</p>
            <p style="font-size: 12px;">123 Furniture Street, Balewadi, Pune - 411045, Maharashtra</p>
            <p style="font-size: 12px;">Phone: +91 88650 09032 | Email: info@indosaga.com</p>
            <p style="font-size: 12px;">Website: www.indosaga.com | GSTIN: 27AAAAA0000A1Z5</p>
            <p style="font-size: 12px; color: #D2691E; margin-top: 10px;"><strong>Thank you for choosing IndoSaga Premium Teak Furniture!</strong></p>
          </div>
          <p style="margin-top: 20px; font-size: 10px; text-align: center;">This is a computer-generated receipt.</p>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div className="fixed inset-0 pt-16 sm:pt-18 lg:pt-20 xl:pt-24 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-darkBrown">Payment Receipt</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 receipt-modal-scroll">
          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-center">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-green-800">Payment Successful!</h3>
            <p className="text-green-600">Your order has been confirmed and is being processed.</p>
          </div>

          {/* Receipt Content */}
          <div className="border rounded-lg p-6 bg-gray-50 relative" 
               style={{
                 backgroundImage: `url("data:image/svg+xml;base64,${btoa(`
                   <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
                     <text x="100" y="100" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="rgba(139, 69, 19, 0.08)" transform="rotate(-45 100 100)">
                       IndoSaga
                     </text>
                   </svg>
                 `)}")`,
                 backgroundRepeat: 'repeat',
                 backgroundPosition: 'center',
                 backgroundSize: '200px 200px'
               }}>
            {/* Company Header */}
            <div className="text-center border-b border-gray-300 pb-4 mb-6 relative z-10 bg-white bg-opacity-90 rounded-lg p-4">
              <div className="flex items-center justify-center mb-2">
                <img 
                  src="/indosaga-logo.png" 
                  alt="IndoSaga Logo" 
                  className="h-12 w-12 mr-3"
                />
                <h1 className="text-3xl font-bold text-darkBrown">IndoSaga Furniture</h1>
              </div>
              <p className="text-gray-600">Premium Teak Furniture Collection</p>
            </div>

            {/* Order Info */}
            <div className="grid md:grid-cols-2 gap-6 mb-6 relative z-10 bg-white bg-opacity-90 rounded-lg p-4">
              <div>
                <h4 className="font-semibold text-darkBrown mb-3">Order Details</h4>
                <div className="space-y-2 text-sm">
                  <div>Order ID: <span className="font-medium">{orderData.id}</span></div>
                  {orderData.trackingId && (
                    <div>Tracking ID: <span className="font-medium">{orderData.trackingId}</span></div>
                  )}
                  <div>Date: <span className="font-medium">{new Date().toLocaleDateString('en-IN')}</span></div>
                  <div>Payment Method: <span className="font-medium">{orderData.paymentMethod?.toUpperCase()}</span></div>
                  <div>Payment Status: <span className="font-medium">{orderData.paymentStatus}</span></div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-darkBrown mb-3">Customer Details</h4>
                <div className="space-y-2 text-sm">
                  <div>{orderData.customerName}</div>
                  <div>{orderData.customerPhone}</div>
                  {orderData.customerEmail && <div>{orderData.customerEmail}</div>}
                  <div>{orderData.shippingAddress}</div>
                  <div>PIN: {orderData.pincode}</div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-6 relative z-10 bg-white bg-opacity-90 rounded-lg p-4">
              <h4 className="font-semibold text-darkBrown mb-3">Order Items</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left p-3 font-semibold">Item</th>
                      <th className="text-left p-3 font-semibold">Qty</th>
                      <th className="text-left p-3 font-semibold">Price</th>
                      <th className="text-left p-3 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderData.orderItems?.map((item: any, index: number) => (
                      <tr key={index} className="border-t">
                        <td className="p-3">{item.product?.name || 'Product'}</td>
                        <td className="p-3">{item.quantity}</td>
                        <td className="p-3">₹{parseFloat(item.price).toLocaleString('en-IN')}</td>
                        <td className="p-3">₹{(parseFloat(item.price) * item.quantity).toLocaleString('en-IN')}</td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan={4} className="p-3 text-center text-gray-500">No items found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total */}
            <div className="text-right relative z-10 bg-white bg-opacity-90 rounded-lg p-4">
              <div className="text-lg">
                Subtotal: <span className="font-semibold">₹{parseFloat(orderData.total).toLocaleString('en-IN')}</span>
              </div>
              {orderData.paymentMethod === 'cod' && (
                <div className="text-lg">
                  COD Fee: <span className="font-semibold">₹99</span>
                </div>
              )}
              <div className="text-xl font-bold text-darkBrown border-t border-gray-300 pt-2 mt-2">
                Grand Total: ₹{orderData.paymentMethod === 'cod' 
                  ? (parseFloat(orderData.total) + 99).toLocaleString('en-IN')
                  : parseFloat(orderData.total).toLocaleString('en-IN')
                }
              </div>
            </div>

            {/* Customer Instructions */}
            <div className="mt-6 relative z-10 bg-white bg-opacity-90 rounded-lg p-4">
              <h4 className="font-semibold text-darkBrown mb-3">Important Instructions</h4>
              <div className="space-y-2 text-sm text-gray-700">
                <p>• <strong>Delivery Timeline:</strong> Your furniture will be delivered within 7-14 business days.</p>
                <p>• <strong>Contact for Queries:</strong> Call +91 88650 09032 or email info@indosaga.com</p>
                <p>• <strong>Inspection:</strong> Please inspect all items upon delivery before signing receipt.</p>
                <p>• <strong>Assembly:</strong> Free assembly service included with all furniture items.</p>
                <p>• <strong>Payment (COD):</strong> Please keep exact change ready at the time of delivery.</p>
                <p>• <strong>Installation:</strong> Our team will handle complete setup and installation.</p>
              </div>
            </div>

            {/* Warranty & Guarantee */}
            <div className="mt-6 relative z-10 bg-white bg-opacity-90 rounded-lg p-4">
              <h4 className="font-semibold text-darkBrown mb-3">Warranty & Guarantee</h4>
              <div className="space-y-2 text-sm text-gray-700">
                <p>• <strong>Structural Warranty:</strong> 10 years warranty on all structural components</p>
                <p>• <strong>Finish Warranty:</strong> 2 years warranty on wood finish and polish</p>
                <p>• <strong>Hardware Warranty:</strong> 5 years warranty on hinges, handles, and fittings</p>
                <p>• <strong>Quality Guarantee:</strong> 100% genuine teak wood with quality certificate</p>
                <p>• <strong>Replacement:</strong> Free replacement if any manufacturing defect found within 30 days</p>
                <p>• <strong>Service:</strong> Lifetime maintenance support and servicing available</p>
                <p>• <strong>Termite Protection:</strong> All products treated with anti-termite chemicals</p>
              </div>
            </div>

            {/* Privacy Policy & Terms */}
            <div className="mt-6 relative z-10 bg-white bg-opacity-90 rounded-lg p-4">
              <h4 className="font-semibold text-darkBrown mb-3">Privacy Policy & Terms</h4>
              <div className="space-y-2 text-sm text-gray-700">
                <p>• <strong>Data Protection:</strong> Your personal information is secure and encrypted with us</p>
                <p>• <strong>Privacy:</strong> We do not share your data with third parties without consent</p>
                <p>• <strong>Communication:</strong> We may contact you for order updates and customer feedback</p>
                <p>• <strong>Returns:</strong> 15-day return policy for unused items in original condition</p>
                <p>• <strong>Cancellation:</strong> Orders can be cancelled within 24 hours of placement</p>
                <p>• <strong>Disputes:</strong> All disputes subject to Pune jurisdiction only</p>
                <p>• <strong>Terms:</strong> Purchase constitutes acceptance of our terms and conditions</p>
              </div>
            </div>

            {/* Company Contact Information */}
            <div className="mt-6 relative z-10 bg-white bg-opacity-90 rounded-lg p-4 border-t-2 border-darkBrown">
              <div className="text-center space-y-1 text-sm text-gray-600">
                <p className="font-semibold text-darkBrown">IndoSaga Furniture Pvt. Ltd.</p>
                <p>123 Furniture Street, Balewadi, Pune - 411045, Maharashtra</p>
                <p>Phone: +91 88650 09032 | Email: info@indosaga.com</p>
                <p>Website: www.indosaga.com | GSTIN: 27AAAAA0000A1Z5</p>
                <p className="text-xs mt-2 text-amber-600 font-medium">Thank you for choosing IndoSaga Premium Teak Furniture!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t bg-gray-50 flex-shrink-0">
          <p className="text-sm text-gray-600">
            Receipt generated on {new Date().toLocaleDateString('en-IN')}
          </p>
          <div className="flex space-x-3">
            <Button
              onClick={handlePrintReceipt}
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-white"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button
              onClick={handleDownloadReceipt}
              className="bg-primary text-white hover:bg-primary/90"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}