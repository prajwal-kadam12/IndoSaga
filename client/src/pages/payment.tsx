import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote, CheckCircle, ArrowLeft, CreditCard, Smartphone, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import RazorpayPaymentModal from "@/components/razorpay-payment-modal";

export default function PaymentPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  const [addressData, setAddressData] = useState<any>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [isDirectCheckout, setIsDirectCheckout] = useState(false);
  const [isCartCheckout, setIsCartCheckout] = useState(false);
  const [buyNowItem, setBuyNowItem] = useState<any>(null);
  const [checkoutItems, setCheckoutItems] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");

  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ["/api/cart"],
    enabled: !isDirectCheckout && !isCartCheckout
  });

  // Helper function to safely map items for checkout
  const mapOrderItems = (items: any[]) => {
    if (isDirectCheckout) {
      return items.map((item: any) => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.price.toString(),
      }));
    } else if (isCartCheckout) {
      return items.map((item: any) => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.price.toString(),
      }));
    } else {
      return items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.product?.price || "0",
      }));
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('checkoutAddress');
    if (stored) {
      setAddressData(JSON.parse(stored));
    } else {
      navigate('/address');
    }

    // Check if this is direct checkout or cart checkout
    const checkoutType = localStorage.getItem('checkoutType');
    const buyNowData = localStorage.getItem('buyNowItem');
    const cartData = localStorage.getItem('checkoutItems');
    
    if (checkoutType === 'direct' && buyNowData) {
      setIsDirectCheckout(true);
      setBuyNowItem(JSON.parse(buyNowData));
    } else if (checkoutType === 'cart' && cartData) {
      setIsCartCheckout(true);
      setCheckoutItems(JSON.parse(cartData));
    }
  }, [navigate]);

  // Calculate totals based on checkout type
  const items = isDirectCheckout ? [buyNowItem] : 
                isCartCheckout ? checkoutItems : 
                (cartItems as any[]);
  const total = isDirectCheckout && buyNowItem ? 
    buyNowItem.total : 
    isCartCheckout ? 
      checkoutItems.reduce((sum: number, item: any) => sum + item.total, 0) :
      (cartItems as any[]).reduce((sum: number, item: any) => 
        sum + (parseFloat(item.product?.price || "0") * item.quantity), 0
    );
  const shipping = 0; // Free shipping on all orders
  const finalTotal = total;

  const handlePaymentMethod = async (method: string) => {
    if (!addressData) {
      toast({
        title: "Missing Information",
        description: "Please provide your address details first.",
        variant: "destructive",
      });
      navigate('/address');
      return;
    }

    setSelectedPaymentMethod(method);

    if (method === 'cod') {
      await handleCodPayment();
    } else {
      // Open payment modal for online payments
      setShowPaymentModal(true);
    }
  };

  const handleCodPayment = async () => {
    try {
      setIsProcessing(true);
      setSelectedMethod('cod');
      
      // Handle Cash on Delivery
      const orderData = {
        customerName: addressData.customerName || 'Customer',
        customerPhone: addressData.customerPhone || '0000000000',
        customerEmail: addressData.customerEmail || '',
        shippingAddress: addressData.shippingAddress || '',
        pincode: addressData.pincode || '000000',
        paymentMethod: 'cod',
        orderItems: mapOrderItems(items),
        total: finalTotal,
      };

      const endpoint = isDirectCheckout ? '/api/orders/direct-checkout' : '/api/orders/checkout';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: isDirectCheckout ? 'omit' : 'include',
        body: JSON.stringify(orderData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create order');
      }
      
      const order = await response.json();
      
      // Clear checkout data
      localStorage.removeItem('checkoutType');
      localStorage.removeItem('buyNowItem');
      localStorage.removeItem('checkoutItems');
      localStorage.removeItem('checkoutAddress');
      
      navigate(`/payment/success?orderId=${order.id}`);
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Order Failed",
        description: error.message || "Unable to create order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentModalMethod = async (method: string) => {
    setShowPaymentModal(false);
    
    if (method === 'cod') {
      await handleCodPayment();
    } else if (method.startsWith('razorpay_success:')) {
      // Payment was successful and verified by Razorpay modal
      try {
        const orderDetailsJson = method.split('razorpay_success:')[1];
        const orderDetails = JSON.parse(orderDetailsJson);
        
        // Clear checkout data
        localStorage.removeItem('checkoutType');
        localStorage.removeItem('buyNowItem');
        localStorage.removeItem('checkoutItems');
        localStorage.removeItem('checkoutAddress');
        
        // Navigate to success page
        navigate(`/payment/success?orderId=${orderDetails.orderId}`);
      } catch (error) {
        console.error('Error processing payment success:', error);
        toast({
          title: "Payment Processing Error",
          description: "Payment was successful but there was an error processing the order. Please contact support.",
          variant: "destructive",
        });
      }
    }
  };

  if (isLoading || !addressData) {
    return (
      <div className="py-20 bg-warmWhite min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8 mx-auto" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 sm:py-20 bg-warmWhite min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/address')}
          className="mb-6 text-brown-600 hover:text-brown-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Address
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brown-900 mb-4">Payment Method</h1>
          <p className="text-gray-600">Choose your preferred payment method</p>
        </div>

        <div className="grid gap-6 max-w-2xl mx-auto">
          {/* Order Summary */}
          <Card className="border-brown-200">
            <CardHeader>
              <CardTitle className="text-brown-900">Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>₹{finalTotal.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* UPI Payment */}
          <Card className="border-blue-200 bg-blue-50 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handlePaymentMethod('upi')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Smartphone className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-900">UPI Payment</h3>
                  <p className="text-blue-700">Pay using UPI apps like PhonePe, GPay, Paytm</p>
                  <p className="text-sm text-blue-600 mt-1">
                    Quick and secure payment with your preferred UPI app
                  </p>
                </div>
                {selectedPaymentMethod === 'upi' && (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Credit/Debit Card Payment */}
          <Card className="border-purple-200 bg-purple-50 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handlePaymentMethod('card')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-purple-900">Credit/Debit Card</h3>
                  <p className="text-purple-700">Pay securely with your card</p>
                  <p className="text-sm text-purple-600 mt-1">
                    Supports Visa, Mastercard, RuPay, and American Express
                  </p>
                </div>
                {selectedPaymentMethod === 'card' && (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Net Banking Payment */}
          <Card className="border-green-200 bg-green-50 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handlePaymentMethod('netbanking')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Building className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-900">Net Banking</h3>
                  <p className="text-green-700">Pay using your bank account</p>
                  <p className="text-sm text-green-600 mt-1">
                    Supports all major banks including SBI, HDFC, ICICI, and more
                  </p>
                </div>
                {selectedPaymentMethod === 'netbanking' && (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cash on Delivery Payment Method */}
          <Card className="border-orange-200 bg-orange-50 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handlePaymentMethod('cod')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Banknote className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-orange-900">Cash on Delivery</h3>
                  <p className="text-orange-700">Pay when your order is delivered</p>
                  <p className="text-sm text-orange-600 mt-1">
                    No online payment required. Pay cash to our delivery executive.
                  </p>
                </div>
                {selectedPaymentMethod === 'cod' && (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                )}
              </div>
              {isProcessing && selectedPaymentMethod === 'cod' && (
                <div className="mt-4 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2" />
                  <span className="text-orange-600">Processing Order...</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card className="border-brown-200">
            <CardHeader>
              <CardTitle className="text-brown-900">Delivery Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Delivery Address:</strong> {addressData.shippingAddress}</p>
                <p><strong>Pincode:</strong> {addressData.pincode}</p>
                <p><strong>Contact:</strong> {addressData.customerPhone}</p>
                <p className="text-green-600 font-medium mt-4">
                  ✓ Free delivery on all orders
                </p>
                <p className="text-blue-600 font-medium">
                  ✓ Estimated delivery: 5-7 business days
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && (
          <RazorpayPaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            onSelectMethod={handlePaymentModalMethod}
            total={finalTotal}
            phoneNumber={addressData.customerPhone || ''}
            customerDetails={{
              name: addressData.customerName || '',
              email: addressData.customerEmail || '',
              contact: addressData.customerPhone || '',
              address: addressData.shippingAddress || '',
              city: addressData.city || '',
              district: addressData.district || '',
              state: addressData.state || '',
              pincode: addressData.pincode || ''
            }}
            productDetails={{
              id: isDirectCheckout ? buyNowItem?.product?.id : 'checkout',
              name: isDirectCheckout ? buyNowItem?.product?.name : `${items.length} items`,
              price: finalTotal
            }}
          />
        )}
      </div>
    </div>
  );
}