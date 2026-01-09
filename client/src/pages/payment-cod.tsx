import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Banknote, CheckCircle, Loader2, MapPin, Phone, User, Truck, Clock, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function CODPaymentPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [addressData, setAddressData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ["/api/cart"],
  });

  useEffect(() => {
    const stored = localStorage.getItem('checkoutAddress');
    if (stored) {
      setAddressData(JSON.parse(stored));
    } else {
      navigate('/address');
    }
  }, [navigate]);

  const total = (cartItems as any[]).reduce((sum: number, item: any) => 
    sum + (parseFloat(item.product?.price || "0") * item.quantity), 0
  );
  const shipping = 0; // Free shipping on all orders
  const codFee = 0; // No COD fees
  const finalTotal = total; // No extra charges

  const createCODOrder = useMutation({
    mutationFn: async () => {
      const orderItems = (cartItems as any[]).map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.price,
      }));

      // Use direct checkout endpoint for guest users
      const order = await apiRequest("POST", "/api/orders/direct-checkout", {
        ...addressData,
        paymentMethod: 'cod',
        orderItems,
        total: total // No COD charges
      });

      return order;
    },
    onSuccess: (order: any) => {
      // Clear localStorage
      localStorage.removeItem('checkoutAddress');
      localStorage.removeItem('selectedPaymentMethod');
      localStorage.removeItem('checkoutItems');
      localStorage.removeItem('checkoutType');

      // Navigate to success page with order ID
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      navigate(`/payment/success?orderId=${order.id}`);
    },
    onError: (error) => {
      console.error('COD order creation failed:', error);
      toast({
        title: "Order Failed",
        description: "Failed to place COD order. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    try {
      await createCODOrder.mutateAsync();
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading || !addressData) {
    return (
      <div className="py-20 bg-warmWhite min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading payment...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-20 bg-warmWhite min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm">
                <CheckCircle className="w-4 h-4" />
              </div>
              <span className="ml-2 text-sm font-medium text-green-600">Address</span>
            </div>
            <div className="w-12 h-px bg-green-500"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <span className="ml-2 text-sm font-medium text-primary">Payment</span>
            </div>
            <div className="w-12 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <span className="ml-2 text-sm text-gray-500">Success</span>
            </div>
          </div>
          
          <h1 className="text-4xl font-display font-bold text-darkBrown text-center mb-4">
            Cash on Delivery
          </h1>
          <p className="text-center text-gray-600">
            Pay when your order is delivered
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-darkBrown">
                  <Banknote className="mr-2 h-5 w-5" />
                  Cash on Delivery
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                  <div className="text-center mb-6">
                    <Banknote className="w-16 h-16 text-orange-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-orange-900 mb-2">
                      Pay at Your Doorstep
                    </h3>
                    <p className="text-orange-800">
                      No online payment required. Pay cash when your furniture is delivered.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Truck className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h4 className="font-medium text-blue-900 mb-1">Free Delivery</h4>
                    <p className="text-sm text-blue-700">At your doorstep</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-medium text-green-900 mb-1">Quick Delivery</h4>
                    <p className="text-sm text-green-700">5-7 business days</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Shield className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <h4 className="font-medium text-purple-900 mb-1">Quality Check</h4>
                    <p className="text-sm text-purple-700">Before payment</p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">Important Information</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• No extra charges for COD</li>
                    <li>• Keep exact change ready for delivery</li>
                    <li>• Inspect furniture before making payment</li>
                    <li>• Available only within serviceable areas</li>
                    <li>• COD orders cannot be modified once placed</li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-darkBrown mb-2">Delivery Address</h4>
                  <div className="text-sm text-gray-700">
                    <p className="font-medium">{addressData.customerName}</p>
                    <p>{addressData.customerPhone}</p>
                    <p className="mt-1">{addressData.shippingAddress}</p>
                    <p>Pincode: {addressData.pincode}</p>
                  </div>
                </div>

                <Button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className="w-full wood-texture text-white py-3 font-semibold text-lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Placing COD Order...
                    </>
                  ) : (
                    `Place COD Order - ₹${finalTotal.toFixed(2)}`
                  )}
                </Button>

                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/payment')}
                    className="text-primary border-primary"
                  >
                    ← Choose Different Payment Method
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-darkBrown">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 max-h-40 overflow-y-auto">
                  {(cartItems as any[]).map((item: any) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden">
                        <img 
                          src={item.product?.imageUrl || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"} 
                          alt={item.product?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-darkBrown truncate">
                          {item.product?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-primary">
                        ₹{(parseFloat(item.product?.price || "0") * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? "Free" : `₹${shipping}`}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>COD Fee</span>
                    <span>FREE</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold text-darkBrown border-t pt-2">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-xs text-gray-500 text-center mt-4">
                  💰 Pay cash on delivery
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}