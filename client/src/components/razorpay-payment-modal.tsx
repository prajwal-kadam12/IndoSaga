import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  Smartphone, 
  Building, 
  Truck, 
  X, 
  CheckCircle, 
  Loader2,
  QrCode,
  Banknote
} from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMethod: (method: string) => void;
  total: number;
  phoneNumber: string;
  customerDetails: any;
  productDetails: {
    id: string;
    name: string;
    price: number;
    isMultipleItems?: boolean;
    orderItems?: any[];
  };
}

export default function RazorpayPaymentModal({
  isOpen,
  onClose,
  onSelectMethod,
  total,
  phoneNumber,
  customerDetails,
  productDetails
}: PaymentModalProps) {
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [razorpayConfig, setRazorpayConfig] = useState<any>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Reset checkout state when modal opens to ensure clean state
  useEffect(() => {
    if (isOpen) {
      setIsCheckoutOpen(false);
    }
  }, [isOpen]);

  // Load Razorpay configuration
  useEffect(() => {
    const loadRazorpayConfig = async () => {
      try {
        const response = await fetch('/api/payment/config');
        const config = await response.json();
        setRazorpayConfig(config);
        
        // Load Razorpay script if not already loaded and enabled
        if (config.enabled && !window.Razorpay) {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => {
            console.log('Razorpay SDK loaded successfully');
          };
          document.body.appendChild(script);
        }
      } catch (error) {
        console.error('Failed to load Razorpay config:', error);
      }
    };

    if (isOpen) {
      loadRazorpayConfig();
    }
  }, [isOpen]);

  const handleMethodSelect = async (method: string) => {
    setSelectedMethod(method);
    setLoading(true);

    try {
      if (method === 'cod') {
        // Handle COD directly
        onSelectMethod('cod');
      } else {
        // Handle Razorpay payment methods
        await handleRazorpayPayment(method);
      }
    } catch (error) {
      console.error('Payment method selection failed:', error);
      toast({
        title: "Payment Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpayPayment = async (preferredMethod?: string) => {
    try {
      if (!razorpayConfig?.enabled) {
        throw new Error('Razorpay not configured');
      }

      // Create Razorpay order
      const response = await fetch('/api/create-razorpay-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: productDetails.id,
          quantity: productDetails?.isMultipleItems ? (productDetails.orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 1) : 1,
          currency: 'INR',
          isCartOrder: productDetails?.isMultipleItems || false,
          orderItems: productDetails?.isMultipleItems ? productDetails.orderItems?.map(item => ({
            productId: item.productId || item.id,
            quantity: item.quantity,
            price: item.price || item.total / item.quantity
          })) : undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // If it's a Razorpay authentication error, show COD option
        if (errorData.showCODOption) {
          toast({
            title: "Payment Gateway Issue",
            description: errorData.message,
            variant: "destructive",
          });
          // Don't throw error, let user see COD option
          return;
        }
        
        throw new Error(errorData.message || 'Failed to create payment order');
      }

      const orderData = await response.json();

      // Initialize Razorpay checkout
      const options = {
        key: razorpayConfig.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'IndoSaga Furniture',
        description: productDetails?.name || 'Product Purchase',
        order_id: orderData.id,
        prefill: {
          name: customerDetails?.name,
          email: customerDetails?.email,
          contact: customerDetails?.contact || phoneNumber,
        },
        notes: {
          address: customerDetails?.address,
          product_id: productDetails?.id,
          product_name: productDetails?.name,
          quantity: productDetails?.isMultipleItems ? productDetails.orderItems?.reduce((sum, item) => sum + item.quantity, 0) : '1',
          is_cart_order: productDetails?.isMultipleItems ? 'true' : 'false'
        },
        theme: {
          color: '#D97706' // Amber-orange color matching logo theme
        },
        method: preferredMethod ? {
          [preferredMethod]: true
        } : undefined,
        handler: function (response: any) {
          setIsCheckoutOpen(false); // Restore our modal visibility on success
          handlePaymentSuccess(response);
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            setIsCheckoutOpen(false); // Restore our modal visibility
            console.log('Payment modal dismissed');
            // Navigate to cancellation page when modal is dismissed
            onClose();
            window.location.href = '/order-cancelled?reason=Payment cancelled by user';
          }
        }
      };

      const rzp = new window.Razorpay(options);
      
      // Hide our modal before opening Razorpay to prevent z-index conflicts
      setIsCheckoutOpen(true);
      rzp.open();

    } catch (error) {
      console.error('Razorpay payment failed:', error);
      
      // Extract meaningful error message
      let errorMessage = "Unable to initialize payment. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      }
      
      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setIsCheckoutOpen(false); // Reset state on initialization failure
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (response: any) => {
    try {
      console.log('Payment success response from Razorpay:', response);
      
      // Check if this is a complete response with order verification data
      const hasCompleteData = response.razorpay_order_id && response.razorpay_payment_id && response.razorpay_signature;
      
      // If we have payment_id but missing order data, it means server-side order creation failed
      // but payment succeeded. Handle this as a direct payment verification.
      if (!hasCompleteData && response.razorpay_payment_id) {
        console.log('Payment succeeded but order creation failed on server. Using direct payment verification...');
        
        // Use direct payment verification endpoint
        const directVerifyResponse = await fetch('/api/verify-direct-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            razorpay_payment_id: response.razorpay_payment_id,
            customerDetails,
            productId: productDetails.id,
            quantity: productDetails?.isMultipleItems ? productDetails.orderItems?.reduce((sum, item) => sum + item.quantity, 0) : 1,
            orderItems: productDetails?.isMultipleItems ? productDetails.orderItems : undefined,
            isCartOrder: productDetails?.isMultipleItems || false,
            total: total
          }),
        });

        const directResult = await directVerifyResponse.json();

        if (directResult.success) {
          toast({
            title: "Payment Successful!",
            description: `Order ${directResult.orderId} created successfully. Confirmation emails have been sent.`,
          });
          
          // Close modal and navigate to success page
          onClose();
          window.location.href = `/order-success?orderId=${directResult.orderId}`;
          return;
        } else {
          throw new Error(directResult.message || 'Payment verification failed');
        }
      }
      
      // If we don't have payment_id at all, it's a complete failure
      if (!response.razorpay_payment_id) {
        console.error('No payment ID received from Razorpay');
        throw new Error('Payment data is completely missing. Please contact support.');
      }
      
      // If we have incomplete data but no payment_id, show error
      if (!hasCompleteData) {
        console.error('Missing required payment fields in Razorpay response:', {
          order_id: !!response.razorpay_order_id,
          payment_id: !!response.razorpay_payment_id,
          signature: !!response.razorpay_signature
        });
        
        throw new Error('Payment completed but verification data is incomplete. Please contact support with your payment details.');
      }
      
      // Verify payment with backend
      const verifyResponse = await fetch('/api/verify-razorpay-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          customerDetails,
          productId: productDetails.id,
          quantity: productDetails?.isMultipleItems ? productDetails.orderItems?.reduce((sum, item) => sum + item.quantity, 0) : 1,
          orderItems: productDetails?.isMultipleItems ? productDetails.orderItems : undefined,
          isCartOrder: productDetails?.isMultipleItems || false
        }),
      });

      const result = await verifyResponse.json();

      if (result.success) {
        toast({
          title: "Payment Successful!",
          description: `Order ${result.orderId} created successfully. Confirmation emails have been sent.`,
        });
        
        // Close modal and navigate to success page
        onClose();
        window.location.href = `/order-success?orderId=${result.orderId}`;
      } else {
        throw new Error(result.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification failed:', error);
      toast({
        title: "Payment Verification Failed",
        description: error instanceof Error ? error.message : "Your payment was processed but order creation failed. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || isCheckoutOpen) return null;

  // Ensure document.body is available before using createPortal
  if (typeof document === 'undefined' || !document.body) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto relative">
        <CardHeader>
          {/* Website Branding Header */}
          <div className="flex items-center mb-4 pb-4 border-b border-gray-200">
            <img 
              src="/images/indosaga-logo.png" 
              alt="IndoSaga Furniture" 
              className="h-12 w-12 mr-3 rounded-lg"
            />
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">IndoSaga Furniture</h1>
              <p className="text-sm text-gray-600">Premium Teak Wood Furniture</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <CardTitle className="text-center">
            Choose Payment Method
          </CardTitle>
          <div className="text-sm text-gray-600 text-center">
            Total: <span className="font-semibold text-lg text-orange-600">₹{total}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* UPI Payment */}
            {razorpayConfig?.enabled && (
              <Button
                onClick={() => handleMethodSelect('upi')}
                disabled={loading}
                className="w-full h-16 justify-start space-x-4 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-gray-800 border border-purple-200"
                variant="outline"
              >
                {loading && selectedMethod === 'upi' ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <QrCode className="h-6 w-6 text-purple-600" />
                )}
                <div className="text-left">
                  <div className="font-semibold">UPI Payment</div>
                  <div className="text-xs text-gray-600">Pay via UPI apps like GPay, PhonePe, Paytm</div>
                </div>
              </Button>
            )}

            {/* Credit/Debit Cards */}
            {razorpayConfig?.enabled && (
              <Button
                onClick={() => handleMethodSelect('card')}
                disabled={loading}
                className="w-full h-16 justify-start space-x-4 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 text-gray-800 border border-blue-200"
                variant="outline"
              >
                {loading && selectedMethod === 'card' ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <CreditCard className="h-6 w-6 text-blue-600" />
                )}
                <div className="text-left">
                  <div className="font-semibold">Credit / Debit Card</div>
                  <div className="text-xs text-gray-600">Visa, MasterCard, RuPay, AMEX</div>
                </div>
              </Button>
            )}

            {/* Net Banking */}
            {razorpayConfig?.enabled && (
              <Button
                onClick={() => handleMethodSelect('netbanking')}
                disabled={loading}
                className="w-full h-16 justify-start space-x-4 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 text-gray-800 border border-green-200"
                variant="outline"
              >
                {loading && selectedMethod === 'netbanking' ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Building className="h-6 w-6 text-green-600" />
                )}
                <div className="text-left">
                  <div className="font-semibold">Net Banking</div>
                  <div className="text-xs text-gray-600">All major banks supported</div>
                </div>
              </Button>
            )}

            {/* Wallet */}
            {razorpayConfig?.enabled && (
              <Button
                onClick={() => handleMethodSelect('wallet')}
                disabled={loading}
                className="w-full h-16 justify-start space-x-4 bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 text-gray-800 border border-orange-200"
                variant="outline"
              >
                {loading && selectedMethod === 'wallet' ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Banknote className="h-6 w-6 text-orange-600" />
                )}
                <div className="text-left">
                  <div className="font-semibold">Digital Wallets</div>
                  <div className="text-xs text-gray-600">Paytm, Mobikwik, FreeCharge, etc.</div>
                </div>
              </Button>
            )}

            {/* Cash on Delivery */}
            <Button
              onClick={() => handleMethodSelect('cod')}
              disabled={loading}
              className="w-full h-16 justify-start space-x-4 bg-gradient-to-r from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 text-gray-800 border border-amber-200"
              variant="outline"
            >
              {loading && selectedMethod === 'cod' ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Truck className="h-6 w-6 text-amber-600" />
              )}
              <div className="text-left">
                <div className="font-semibold">Cash on Delivery</div>
                <div className="text-xs text-gray-600">Pay when your order arrives</div>
              </div>
            </Button>
          </div>

          {!razorpayConfig?.enabled && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Online payment methods are currently unavailable. Please use Cash on Delivery.
              </p>
            </div>
          )}

          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Secure payment gateway</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>SSL encrypted transactions</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>,
    document.body
  );
}