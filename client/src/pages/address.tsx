import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShoppingBag, User, Phone, Mail, MapPin, Hash, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useAuth0 } from "@auth0/auth0-react";

import CustomerDetailsModal from "@/components/customer-details-modal";

export default function AddressPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth0();
  
  const [isBuyNow, setIsBuyNow] = useState(false);
  const [isCartCheckout, setIsCartCheckout] = useState(false);
  const [buyNowItem, setBuyNowItem] = useState<any>(null);
  const [checkoutItems, setCheckoutItems] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    shippingAddress: "",
    pincode: ""
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      // Store current page as return URL
      sessionStorage.setItem('returnUrl', location);
      navigate('/login');
      return;
    }
  }, [isAuthenticated, location, navigate]);

  // Pre-fill form with user data when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        customerName: user.name || user.given_name + ' ' + (user.family_name || '') || '',
        customerEmail: user.email || ''
      }));
    }
  }, [isAuthenticated, user]);

  // Check if this is a direct buy now flow or cart checkout
  useEffect(() => {
    const checkoutType = localStorage.getItem('checkoutType');
    const buyNowStored = localStorage.getItem('buyNowItem');
    const cartStored = localStorage.getItem('checkoutItems');
    
    if (checkoutType === 'direct' && buyNowStored) {
      setIsBuyNow(true);
      setBuyNowItem(JSON.parse(buyNowStored));
    } else if (checkoutType === 'cart' && cartStored) {
      setIsCartCheckout(true);
      setCheckoutItems(JSON.parse(cartStored));
    }
  }, []);

  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ["/api/cart"],
    enabled: !isBuyNow && !isCartCheckout // Only fetch cart if not in buy now or cart checkout mode
  });

  // Calculate totals based on buy now, cart checkout, or regular cart
  const items = isBuyNow ? [buyNowItem] : 
                isCartCheckout ? checkoutItems : 
                (cartItems as any[]);
  
  const total = isBuyNow && buyNowItem ? 
    buyNowItem.total : 
    isCartCheckout ? 
      checkoutItems.reduce((sum: number, item: any) => sum + item.total, 0) :
      (cartItems as any[]).reduce((sum: number, item: any) => 
        sum + (parseFloat(item.product?.price || "0") * item.quantity), 0
      );
  const shipping = 0; // Free shipping on all orders
  const finalTotal = total;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.customerName || !formData.customerPhone || !formData.shippingAddress || !formData.pincode) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (formData.customerPhone.length < 10) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid 10-digit phone number.",
        variant: "destructive"
      });
      return;
    }

    if (formData.pincode.length !== 6) {
      toast({
        title: "Invalid Pincode",
        description: "Please enter a valid 6-digit pincode.",
        variant: "destructive"
      });
      return;
    }

    // Store address data and checkout type in localStorage
    localStorage.setItem('checkoutAddress', JSON.stringify(formData));
    localStorage.setItem('checkoutType', isBuyNow ? 'direct' : 'cart');
    navigate('/payment');
  };

  const handleGoBack = () => {
    const checkoutType = localStorage.getItem('checkoutType');
    if (checkoutType === 'cart' || isCartCheckout) {
      navigate('/cart');
    } else {
      navigate('/products');
    }
  };

  if ((!isBuyNow && !isCartCheckout && isLoading) || 
      (!isBuyNow && !isCartCheckout && (cartItems as any[]).length === 0) || 
      (isBuyNow && !buyNowItem) || 
      (isCartCheckout && checkoutItems.length === 0)) {
    return (
      <div className="py-20 bg-warmWhite min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <ShoppingBag className="w-24 h-24 mx-auto text-gray-400 mb-6" />
            <h2 className="text-2xl font-display font-semibold text-darkBrown mb-4">
              {isLoading ? "Loading..." : "No items found"}
            </h2>
            <p className="text-gray-600 mb-8">
              {isLoading ? "Please wait while we load your items." : "Please add items to continue with checkout."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 sm:py-20 bg-warmWhite min-h-screen">
      <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-8">
        {/* Back Button */}
        <div className="mb-4 sm:mb-6">
          <Button
            onClick={handleGoBack}
            variant="ghost"
            className="flex items-center text-gray-600 hover:text-darkBrown"
            data-testid="button-go-back"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {isCartCheckout || localStorage.getItem('checkoutType') === 'cart' ? 'Back to Cart' : 'Back to Products'}
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="mb-4 sm:mb-8">
          <div className="flex items-center justify-center space-x-2 sm:space-x-4 mb-4 sm:mb-6">
            <div className="flex items-center">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-medium">
                1
              </div>
              <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-medium text-primary">Address</span>
            </div>
            <div className="w-6 sm:w-12 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium">
                2
              </div>
              <span className="ml-1 sm:ml-2 text-xs sm:text-sm text-gray-500">Payment</span>
            </div>
            <div className="w-6 sm:w-12 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium">
                3
              </div>
              <span className="ml-1 sm:ml-2 text-xs sm:text-sm text-gray-500">Success</span>
            </div>
          </div>
          
          <h1 className="text-2xl sm:text-4xl font-display font-bold text-darkBrown text-center mb-2 sm:mb-4">
            Shipping Address
          </h1>
          <p className="text-center text-gray-600 text-sm sm:text-base">
            Enter your details for delivery
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Address Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-darkBrown">
                  <MapPin className="mr-2 h-5 w-5" />
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-[80vh] overflow-y-auto">
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label htmlFor="customerName" className="flex items-center text-darkBrown">
                        <User className="mr-1 h-4 w-4" />
                        Full Name *
                      </Label>
                      <Input
                        id="customerName"
                        name="customerName"
                        value={formData.customerName}
                        onChange={handleInputChange}
                        placeholder="Enter your full name"
                        required
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="customerPhone" className="flex items-center text-darkBrown">
                        <Phone className="mr-1 h-4 w-4" />
                        Phone Number *
                      </Label>
                      <Input
                        id="customerPhone"
                        name="customerPhone"
                        value={formData.customerPhone}
                        onChange={handleInputChange}
                        placeholder="Enter 10-digit phone number"
                        type="tel"
                        maxLength={10}
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="customerEmail" className="flex items-center text-darkBrown">
                      <Mail className="mr-1 h-4 w-4" />
                      Email Address (Optional)
                    </Label>
                    <Input
                      id="customerEmail"
                      name="customerEmail"
                      value={formData.customerEmail}
                      onChange={handleInputChange}
                      placeholder="Enter your email address"
                      type="email"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="shippingAddress" className="flex items-center text-darkBrown">
                      <MapPin className="mr-1 h-4 w-4" />
                      Complete Address *
                    </Label>
                    <Textarea
                      id="shippingAddress"
                      name="shippingAddress"
                      value={formData.shippingAddress}
                      onChange={handleInputChange}
                      placeholder="House/Flat No., Street, Area, City, State"
                      rows={3}
                      required
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="pincode" className="flex items-center text-darkBrown">
                      <Hash className="mr-1 h-4 w-4" />
                      Pincode *
                    </Label>
                    <Input
                      id="pincode"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      placeholder="Enter 6-digit pincode"
                      maxLength={6}
                      required
                      className="mt-1"
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full wood-texture text-white py-3 font-semibold text-lg"
                  >
                    Continue to Payment
                  </Button>
                </form>
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
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {items.map((item: any, index: number) => (
                    <div key={item.id || index} className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
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
                          Qty: {item.quantity} × ₹{isBuyNow ? item.price : item.product?.price}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-primary">
                        ₹{isBuyNow ? item.total.toFixed(2) : (parseFloat(item.product?.price || "0") * item.quantity).toFixed(2)}
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
                  <div className="flex justify-between text-lg font-semibold text-darkBrown border-t pt-2">
                    <span>Total</span>
                    <span>₹{finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}