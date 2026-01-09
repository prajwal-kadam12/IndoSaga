import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Package, Truck, MapPin, Phone, Mail, Receipt } from "lucide-react";
import { useLocation } from "wouter";
import ReceiptModal from "@/components/receipt-modal";

export default function PaymentSuccessPage() {
  const [location, navigate] = useLocation();
  const [orderId, setOrderId] = useState<string>("");
  const [showReceipt, setShowReceipt] = useState<boolean>(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderIdParam = urlParams.get('orderId');
    if (orderIdParam) {
      setOrderId(orderIdParam);
      
      // Clear cart data after successful payment
      const checkoutType = localStorage.getItem('checkoutType');
      if (checkoutType === 'cart') {
        // Clear localStorage cart for cart checkout
        localStorage.removeItem('localCart');
        localStorage.removeItem('checkoutItems');
      }
      
      // Clean up checkout data
      localStorage.removeItem('buyNowItem');
      localStorage.removeItem('checkoutAddress');
      localStorage.removeItem('checkoutType');
    } else {
      navigate('/');
    }
  }, [navigate]);

  const { data: order, isLoading } = useQuery({
    queryKey: ["/api/orders", orderId],
    enabled: !!orderId,
  });

  // Type-safe order data
  const orderData = order as any;

  if (isLoading || !orderData) {
    return (
      <div className="py-20 bg-warmWhite min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8 mx-auto" />
            <div className="bg-gray-200 rounded-lg h-64" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-20 bg-warmWhite min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Message */}
        <div className="text-center mb-12">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          
          <h1 className="text-4xl font-display font-bold text-darkBrown mb-4">
            Order Confirmed!
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Thank you for your purchase. Your order has been successfully placed.
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 inline-block">
            <p className="text-green-800 font-medium">
              Order ID: <span className="font-bold">{orderData.id}</span>
            </p>
            {orderData.trackingId && (
              <p className="text-green-800 font-medium mt-1">
                Tracking ID: <span className="font-bold">{orderData.trackingId}</span>
              </p>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Details */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary to-primary/90 text-white">
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Order Total:</span>
                  <span className="font-bold text-lg">₹{parseFloat(orderData.total).toLocaleString('en-IN')}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium capitalize">{orderData.paymentMethod === 'cod' ? 'Cash on Delivery' : orderData.paymentMethod?.toUpperCase()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Payment Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    orderData.paymentStatus === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {orderData.paymentStatus}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Order Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    orderData.status === 'processing' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {orderData.status}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-secondary to-secondary/90 text-white">
              <CardTitle className="flex items-center">
                <Truck className="w-5 h-5 mr-2" />
                Delivery Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">{orderData.customerName}</p>
                    <p className="text-gray-600 text-sm">{orderData.shippingAddress}</p>
                    <p className="text-gray-600 text-sm">PIN: {orderData.pincode}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">{orderData.customerPhone}</span>
                </div>
                
                {orderData.customerEmail && (
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600">{orderData.customerEmail}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expected Delivery */}
        <Card className="border-0 shadow-lg mt-8">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Expected Delivery
              </h3>
              <p className="text-gray-600 mb-4">
                Your order will be delivered within 7-10 business days.
                {orderData.trackingId && " You can track your order using the tracking ID provided above."}
              </p>
              
              <div className="flex justify-center space-x-4">
                <Button 
                  onClick={() => setShowReceipt(true)}
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-white"
                  data-testid="button-view-receipt"
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  View Receipt
                </Button>
                <Button 
                  onClick={() => navigate('/profile#orders')}
                  variant="outline"
                  data-testid="button-view-orders"
                >
                  View My Orders
                </Button>
                <Button 
                  onClick={() => navigate('/')}
                  data-testid="button-continue-shopping"
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What's Next */}
        <div className="mt-12 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">What's Next?</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Order Processing</h4>
              <p className="text-sm text-gray-600">
                We'll prepare your order for shipment within 1-2 business days.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Shipping</h4>
              <p className="text-sm text-gray-600">
                Your order will be shipped and you'll receive tracking information.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Delivery</h4>
              <p className="text-sm text-gray-600">
                Your premium teak furniture will be delivered to your doorstep.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      <ReceiptModal 
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        orderData={orderData}
      />
    </div>
  );
}