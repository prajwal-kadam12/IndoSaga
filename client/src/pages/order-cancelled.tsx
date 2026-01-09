import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, RefreshCcw, Home, ShoppingBag, Phone, Mail } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function OrderCancelledPage() {
  const [location, navigate] = useLocation();
  const [reason, setReason] = useState<string>("");
  const [orderId, setOrderId] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reasonParam = params.get('reason') || 'Payment was cancelled by user';
    const orderIdParam = params.get('orderId') || '';
    
    setReason(reasonParam);
    setOrderId(orderIdParam);
    
    // Show cancellation notice
    toast({
      title: "Order Cancelled",
      description: "Your order has been cancelled successfully.",
      variant: "destructive",
    });
  }, [toast]);

  const handleRetryPayment = () => {
    // Navigate back to checkout with preserved items
    navigate('/checkout');
  };

  const handleContactSupport = () => {
    navigate('/contact');
  };

  return (
    <div className="py-20 bg-gradient-to-br from-red-50 to-pink-100 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cancellation Message */}
        <div className="text-center mb-12">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          
          <h1 className="text-4xl font-display font-bold text-darkBrown mb-4">
            Order Cancelled
          </h1>
          
          <p className="text-xl text-gray-600 mb-2">
            Your payment was cancelled and no charges were made.
          </p>
          
          <p className="text-sm text-gray-500">
            {reason}
          </p>
          
          {orderId && (
            <p className="text-sm text-gray-400 mt-2">
              Reference: {orderId}
            </p>
          )}
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Retry Payment Card */}
          <Card className="border-2 border-amber-200 hover:border-amber-300 transition-colors">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <RefreshCcw className="w-6 h-6 text-amber-600" />
              </div>
              <CardTitle className="text-xl text-darkBrown">Try Again</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6">
                Your items are still in your cart. Complete your purchase with a different payment method.
              </p>
              <Button 
                onClick={handleRetryPayment}
                className="w-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:via-orange-700 hover:to-amber-800 text-white font-semibold"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Complete Purchase
              </Button>
            </CardContent>
          </Card>

          {/* Contact Support Card */}
          <Card className="border-2 border-blue-200 hover:border-blue-300 transition-colors">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Phone className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl text-darkBrown">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6">
                Having trouble with payment? Our support team is here to assist you.
              </p>
              <Button 
                onClick={handleContactSupport}
                variant="outline"
                className="w-full border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                <Mail className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              onClick={() => navigate('/')}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Home className="w-4 h-4" />
              <span>Back to Home</span>
            </Button>
            
            <Button 
              onClick={() => navigate('/products')}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Continue Shopping</span>
            </Button>
          </div>
        </div>

        {/* Support Information */}
        <Card className="mt-12 bg-gray-50 border-gray-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4 text-center">
              Need Additional Support?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <Phone className="w-5 h-5 mx-auto mb-2 text-gray-600" />
                <p className="text-sm text-gray-600">Call Us</p>
                <p className="font-semibold">+91 9876543210</p>
              </div>
              <div>
                <Mail className="w-5 h-5 mx-auto mb-2 text-gray-600" />
                <p className="text-sm text-gray-600">Email Us</p>
                <p className="font-semibold">support@indosaga.com</p>
              </div>
              <div>
                <XCircle className="w-5 h-5 mx-auto mb-2 text-gray-600" />
                <p className="text-sm text-gray-600">Order Issues</p>
                <p className="font-semibold">24/7 Support</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}