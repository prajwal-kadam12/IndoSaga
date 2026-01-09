import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CheckCircle, 
  Download, 
  ShoppingBag, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  CreditCard,
  Package,
  Truck
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function OrderSuccessPage() {
  const [location, navigate] = useLocation();
  const [orderId, setOrderId] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderIdParam = params.get('orderId');
    if (orderIdParam) {
      setOrderId(orderIdParam);
      // Show success toast
      toast({
        title: "Order placed successfully!",
        description: "Your order has been confirmed and will be processed soon.",
      });
    } else {
      navigate('/');
    }
  }, [navigate, toast]);

  const { data: order, isLoading, error } = useQuery({
    queryKey: [`/api/orders/${orderId}`],
    enabled: !!orderId,
  });

  // Type guard to ensure order has the required properties
  const isValidOrder = (order: any): order is {
    id: string;
    trackingId?: string;
    total: string;
    paymentMethod: string;
    createdAt: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    shippingAddress: string;
    pincode: string;
    orderItems?: Array<{
      id: string;
      quantity: number;
      price: string;
      product?: {
        name: string;
        imageUrl?: string;
      };
    }>;
  } => {
    return order && 
           typeof order === 'object' && 
           order.id && 
           order.total && 
           order.paymentMethod &&
           order.createdAt &&
           order.customerName;
  };

  if (isLoading || !orderId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order || !isValidOrder(order)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-bold text-red-600 mb-2">Order Not Found</h1>
            <p className="text-gray-600 mb-4">
              We couldn't find your order details. 
              {error && <span className="block text-sm mt-2">Error: {(error as Error).message}</span>}
            </p>
            <Button onClick={() => navigate('/')} className="bg-red-600 hover:bg-red-700">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const totalAmount = parseFloat(order.total);
  const codFee = 0; // No COD fees

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8 relative" 
         style={{ 
           backgroundImage: 'url(/indosaga-logo.png)', 
           backgroundSize: '150px', 
           backgroundRepeat: 'no-repeat', 
           backgroundPosition: 'center center'
         }}>
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-100 opacity-95"></div>
      <div className="max-w-4xl mx-auto px-4 relative z-10">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-8 text-white mb-6 relative" 
               style={{ 
                 backgroundImage: 'url(/indosaga-logo.png)', 
                 backgroundSize: '80px', 
                 backgroundRepeat: 'no-repeat', 
                 backgroundPosition: 'center center'
               }}>
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 opacity-90 rounded-lg"></div>
            <div className="relative z-10">
            <CheckCircle className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
            <p className="text-lg opacity-90">
              Your {order.paymentMethod === 'cod' ? 'Cash On Delivery' : 'Order'} has been placed successfully
            </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Order Information */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Order Information
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                  <div>
                    <span className="font-medium text-gray-700">Order ID:</span>
                    <span className="ml-2 text-gray-600">{order.trackingId || order.id}</span>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-gray-500 mr-3 ml-0.5" />
                  <div>
                    <span className="font-medium text-gray-700">Order Date:</span>
                    <span className="ml-2 text-gray-600">{formatDate(order.createdAt)}</span>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <CreditCard className="w-4 h-4 text-gray-500 mr-3 ml-0.5" />
                  <div>
                    <span className="font-medium text-gray-700">Payment Method:</span>
                    <span className="ml-2 text-orange-600 font-medium">
                      {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                <Truck className="w-5 h-5 mr-2" />
                Delivery Information
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <MapPin className="w-4 h-4 text-gray-500 mr-3 mt-1" />
                  <div>
                    <p className="font-medium text-gray-700">{order.customerName}</p>
                    <p className="text-gray-600 text-sm">{order.shippingAddress}</p>
                    <p className="text-gray-600 text-sm">Pincode: {order.pincode}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Phone className="w-4 h-4 text-gray-500 mr-3" />
                  <span className="text-gray-600">{order.customerPhone}</span>
                </div>
                
                {order.customerEmail && (
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-gray-500 mr-3" />
                    <span className="text-gray-600">{order.customerEmail}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Items */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Order Items</h3>
            
            <div className="space-y-4">
              {order.orderItems?.map((item: any) => (
                <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                    {item.product?.imageUrl ? (
                      <img 
                        src={item.product.imageUrl} 
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{item.product?.name || 'Product'}</h4>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">₹{parseFloat(item.price).toFixed(2)}</p>
                    <p className="text-sm text-gray-500">per item</p>
                  </div>
                </div>
              )) || (
                <div className="text-center py-4 text-gray-500">
                  No order items found
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Total Amount */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Total Amount</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">₹{totalAmount.toFixed(2)}</span>
              </div>
              
              
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium text-green-600">Free</span>
              </div>
              
              <hr className="my-2" />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-orange-600">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* COD Information */}
        {order.paymentMethod === 'cod' && (
          <Card className="mb-6 bg-yellow-50 border-yellow-200">
            <CardContent className="p-6">
              <h3 className="font-semibold text-yellow-900 mb-4 flex items-center">
                💰 Cash on Delivery Information
              </h3>
              
              <ul className="text-sm text-yellow-800 space-y-2">
                <li>• Estimated delivery: 5-7 business days</li>
                <li>• Please keep exact cash ready for payment</li>
                <li>• Inspect your furniture before making payment</li>
                <li>• COD orders cannot be cancelled once dispatched</li>
                <li>• Make sure someone is available at the delivery address</li>
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center relative p-6 rounded-xl"
             style={{ 
               backgroundImage: 'url(/indosaga-logo.png)', 
               backgroundSize: '100px', 
               backgroundRepeat: 'no-repeat', 
               backgroundPosition: 'center center'
             }}>
          <div className="absolute inset-0 bg-white bg-opacity-90 rounded-xl"></div>
          <div className="relative z-10 flex flex-col sm:flex-row gap-4 justify-center w-full">
          <Button 
            variant="outline" 
            className="flex items-center"
            onClick={() => window.print()}
            data-testid="button-download-receipt"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Receipt
          </Button>
          
          <Button 
            onClick={() => navigate('/profile#orders')}
            variant="outline"
            className="flex items-center border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white"
            data-testid="button-view-order-history"
          >
            <Package className="w-4 h-4 mr-2" />
            View Order History
          </Button>
          
          <Button 
            onClick={() => navigate('/')}
            className="bg-orange-600 hover:bg-orange-700 text-white flex items-center"
            data-testid="button-continue-shopping"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
