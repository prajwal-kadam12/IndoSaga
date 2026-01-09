import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CreditCard, Smartphone, QrCode, Banknote, CheckCircle, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function PaymentPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  const [addressData, setAddressData] = useState<any>(null);

  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ["/api/cart"],
  });

  const total = (cartItems as any[]).reduce((sum: number, item: any) => 
    sum + (parseFloat(item.product?.price || "0") * item.quantity), 0
  );
  const shipping = 0; // Free shipping on all orders
  const finalTotal = total;

  useEffect(() => {
    const stored = localStorage.getItem('checkoutAddress');
    if (stored) {
      setAddressData(JSON.parse(stored));
    } else {
      navigate('/address');
    }
  }, [navigate]);

  const paymentMethods = [
    {
      id: "upi",
      name: "UPI Payment",
      description: "Pay using UPI ID or VPA",
      icon: Smartphone,
      color: "bg-blue-50 border-blue-200 hover:bg-blue-100",
      iconColor: "text-blue-600",
      route: "/payment/upi"
    },
    {
      id: "card",
      name: "Credit/Debit Card",
      description: "Secure card payment",
      icon: CreditCard,
      color: "bg-green-50 border-green-200 hover:bg-green-100",
      iconColor: "text-green-600",
      route: "/payment/card"
    },
    {
      id: "qr",
      name: "QR Code",
      description: "Scan QR code with any UPI app",
      icon: QrCode,
      color: "bg-purple-50 border-purple-200 hover:bg-purple-100",
      iconColor: "text-purple-600",
      route: "/payment/qr"
    },
    {
      id: "cod",
      name: "Cash on Delivery",
      description: "Pay when your order is delivered",
      icon: Banknote,
      color: "bg-orange-50 border-orange-200 hover:bg-orange-100",
      iconColor: "text-orange-600",
      route: "/payment/cod"
    }
  ];

  const handlePaymentMethodSelect = (method: any) => {
    if (!addressData) {
      toast({
        title: "Missing Address",
        description: "Please fill your address information first.",
        variant: "destructive",
      });
      navigate('/address');
      return;
    }

    navigate(method.route);
  };

  if (isLoading || !addressData) {
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
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/address')}
            className="mb-6 p-0 text-gray-600 hover:text-gray-800"
            data-testid="button-back-address"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Address
          </Button>
          
          <div className="text-center">
            <h1 className="text-4xl font-display font-bold text-darkBrown mb-4">
              Choose Payment Method
            </h1>
            <p className="text-lg text-gray-600">
              Select your preferred payment method to complete the order
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Payment Methods */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <Card 
                  key={method.id} 
                  className={`cursor-pointer transition-all duration-200 border-2 ${method.color}`}
                  onClick={() => handlePaymentMethodSelect(method)}
                  data-testid={`payment-method-${method.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 rounded-full bg-white shadow-sm">
                          <method.icon className={`w-6 h-6 ${method.iconColor}`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {method.name}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {method.description}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Security Notice */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Secure Payment</h4>
                  <p className="text-blue-800 text-sm mt-1">
                    Your payment information is encrypted and processed securely through Razorpay.
                    We never store your payment details.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="border-0 shadow-lg sticky top-8">
              <CardHeader className="bg-gradient-to-r from-primary to-primary/90 text-white">
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Cart Items Preview */}
                  <div className="max-h-32 overflow-y-auto space-y-2 border rounded-lg p-3">
                    {(cartItems as any[]).slice(0, 3).map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="truncate">{item.product?.name}</span>
                        <span>×{item.quantity}</span>
                      </div>
                    ))}
                    {(cartItems as any[]).length > 3 && (
                      <p className="text-xs text-gray-500 text-center">
                        +{(cartItems as any[]).length - 3} more items
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{total.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total:</span>
                        <span>₹{finalTotal.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Address */}
                  {addressData && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Delivery Address</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p className="font-medium">{addressData.customerName}</p>
                        <p>{addressData.shippingAddress}</p>
                        <p>PIN: {addressData.pincode}</p>
                        <p>{addressData.customerPhone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}