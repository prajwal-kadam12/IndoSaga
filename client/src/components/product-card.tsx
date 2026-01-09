import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart, X, CreditCard, Smartphone, Building, Truck, CheckCircle } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth0 } from "@auth0/auth0-react";
import { Link } from "wouter";
import RazorpayPaymentModal from "@/components/razorpay-payment-modal";

import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
  showDealBadge?: boolean;
}

export default function ProductCard({ product, showDealBadge = false }: ProductCardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth0();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [showOrderConfirm, setShowOrderConfirm] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    email: '',
    contact: '',
    address: '',
    city: '',
    district: '',
    state: '',
    pincode: ''
  });

  // This component handles authentication flows in the product detail page now
  // No complex authentication detection needed here anymore

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      // Redirect to login if not authenticated
      if (!isAuthenticated) {
        // Store current action in session storage to redirect back after login
        sessionStorage.setItem('pendingAction', 'add-to-cart');
        sessionStorage.setItem('pendingProductId', product.id);
        window.location.href = '/login';
        return { success: false, redirected: true };
      }

      // User is authenticated, add to cart normally
      await apiRequest("POST", "/api/cart", { 
        productId: product.id,
        quantity: 1
      });
      return { success: true, localStorage: false };
    },
    onSuccess: (result) => {
      if (result?.redirected) {
        return; // Don't show toast if redirected to login
      }
      
      if (result && !result.localStorage) {
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      }
      // Trigger a window event to notify cart page to refresh
      window.dispatchEvent(new Event('cartUpdated'));
      
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addToWishlistMutation = useMutation({
    mutationFn: async () => {
      try {
        if (isInWishlist) {
          await apiRequest("DELETE", `/api/wishlist/${product.id}`);
        } else {
          await apiRequest("POST", "/api/wishlist", { 
            productId: product.id
          });
        }
      } catch (error: any) {
        if (error.message?.includes('Authentication required') || error.message?.includes('401')) {
          // User not logged in - use local storage for wishlist
          const localWishlist = JSON.parse(localStorage.getItem('localWishlist') || '[]');
          
          if (isInWishlist) {
            const updatedWishlist = localWishlist.filter((item: any) => item.productId !== product.id);
            localStorage.setItem('localWishlist', JSON.stringify(updatedWishlist));
          } else {
            localWishlist.push({
              productId: product.id,
              product: product
            });
            localStorage.setItem('localWishlist', JSON.stringify(localWishlist));
          }
          
          // Dispatch custom event to update other components
          window.dispatchEvent(new CustomEvent('localWishlistUpdate'));
          return;
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      // Also dispatch the custom event to update localStorage-based components
      window.dispatchEvent(new CustomEvent('localWishlistUpdate'));
      setIsInWishlist(!isInWishlist);
      toast({
        title: isInWishlist ? "Removed from wishlist" : "Added to wishlist",
        description: `${product.name} has been ${isInWishlist ? "removed from" : "added to"} your wishlist.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update wishlist. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleBuyNow = () => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      // Store ONLY what we need for checkout redirect
      sessionStorage.setItem('checkoutProductId', product.id);
      window.location.href = '/login';
      return;
    }
    
    // Pre-fill user information if available
    if (user && (!customerDetails.name || !customerDetails.email)) {
      setCustomerDetails({
        ...customerDetails,
        name: user.name || `${user.given_name || ''} ${user.family_name || ''}`.trim(),
        email: user.email || '',
      });
    }
    
    // Show customer details form for authenticated users
    setShowCustomerForm(true);
  };

  // Handle direct to payment after authentication
  const handleDirectToPayment = () => {
    // Pre-fill user information from authenticated user
    if (user) {
      const updatedDetails = {
        name: user.name || `${user.given_name || ''} ${user.family_name || ''}`.trim(),
        email: user.email || '',
        contact: '',
        address: '',
        city: '',
        district: '',
        state: '',
        pincode: ''
      };
      setCustomerDetails(updatedDetails);
    }
    
    // Go directly to payment options
    setShowPaymentOptions(true);
  };

  const handleCustomerFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerDetails.name || !customerDetails.email || !customerDetails.contact || !customerDetails.address || !customerDetails.city || !customerDetails.district || !customerDetails.state || !customerDetails.pincode) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    setShowCustomerForm(false);
    // Show payment options modal
    setShowPaymentOptions(true);
  };



  const handlePaymentMethod = (method: string) => {
    setSelectedPaymentMethod(method);
    setShowPaymentOptions(false);
    
    if (method === 'cod') {
      handleCODOrder();
    } else if (method.startsWith('razorpay_success:')) {
      // Payment was successful and verified by Razorpay modal
      // Extract order details from the method string
      try {
        const orderDetailsJson = method.split('razorpay_success:')[1];
        const orderData = JSON.parse(orderDetailsJson);
        setShowOrderConfirm(true);
        setOrderDetails({
          ...orderData,
          product: product,
          customerDetails: customerDetails
        });
      } catch (error) {
        console.error('Failed to parse Razorpay success data:', error);
        // Fallback to basic confirmation
        setShowOrderConfirm(true);
        setOrderDetails({
          orderId: 'PAYMENT_SUCCESS',
          total: displayPrice,
          paymentMethod: 'Online Payment',
          paymentStatus: 'Paid',
          product: product,
          customerDetails: customerDetails
        });
      }
    }
    // All other Razorpay methods are handled by the modal itself
  };

  const handleCODOrder = async () => {
    try {
      // Validate required fields before sending
      if (!customerDetails.name || !customerDetails.contact || !customerDetails.address || !customerDetails.pincode) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields: Name, Phone, Address, and Pincode.",
          variant: "destructive",
        });
        return;
      }

      const orderData = {
        customerName: customerDetails.name,
        customerEmail: customerDetails.email,
        customerPhone: customerDetails.contact,
        shippingAddress: `${customerDetails.address}, ${customerDetails.city}, ${customerDetails.district}, ${customerDetails.state}`,
        pincode: customerDetails.pincode,
        paymentMethod: "cod",
        total: (parseFloat(displayPrice) + 99).toString(), // Add COD fee
        orderItems: [{
          productId: product.id,
          quantity: 1,
          price: displayPrice
        }]
      };

      console.log('Sending COD order with data:', orderData);

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include session cookies for authentication
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const order = await response.json();
        console.log('COD order created successfully:', order);
        setOrderDetails({
          ...order,
          paymentMethod: 'cod',
          product: product,
          customerDetails: {
            name: customerDetails.name,
            email: customerDetails.email,
            contact: customerDetails.contact,
            address: customerDetails.address,
            city: customerDetails.city,
            district: customerDetails.district,
            state: customerDetails.state,
            pincode: customerDetails.pincode
          }
        });
        setShowOrderConfirm(true);
        // Reset form
        setCustomerDetails({ name: '', email: '', contact: '', address: '', city: '', district: '', state: '', pincode: '' });
        
        toast({
          title: "Order Placed Successfully!",
          description: "Your Cash on Delivery order has been confirmed.",
        });
      } else {
        const errorData = await response.text();
        console.error('Failed to place COD order:', response.status, errorData);
        throw new Error(`Failed to place order: ${response.status}`);
      }
    } catch (error) {
      toast({
        title: "Order Failed",
        description: "Failed to place your order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      // Enhanced email automation for order confirmation
      console.log('📧 Email automation will be triggered for order confirmation');
      console.log('📨 User confirmation email will be sent to:', customerDetails.email);
      console.log('📨 Admin notification email will be sent to: kadamprajwal358@gmail.com');
      
      // Create final order after successful payment
      const orderData = {
        customerName: customerDetails.name,
        customerEmail: customerDetails.email,
        customerPhone: customerDetails.contact,
        shippingAddress: customerDetails.address,
        pincode: "110001",
        paymentMethod: "online",
        paymentId: paymentData.razorpay_payment_id,
        razorpayOrderId: paymentData.razorpay_order_id,
        razorpayPaymentId: paymentData.razorpay_payment_id,
        razorpaySignature: paymentData.razorpay_signature,
        total: parseFloat(displayPrice).toString(),
        orderItems: [{
          productId: product.id,
          quantity: 1,
          price: displayPrice
        }]
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include session cookies for authentication
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const order = await response.json();
        
        // Show email confirmation to user
        toast({
          title: "Order confirmed & emails sent!",
          description: "Order confirmation sent to you and our team has been notified.",
        });
        
        setOrderDetails({
          ...order,
          paymentMethod: 'online',
          product: product,
          customerDetails: {
            name: customerDetails.name,
            email: customerDetails.email,
            contact: customerDetails.contact,
            address: customerDetails.address,
            city: customerDetails.city,
            district: customerDetails.district,
            state: customerDetails.state,
            pincode: customerDetails.pincode
          }
        });
        setShowOrderConfirm(true);
        // Reset form
        setCustomerDetails({ name: '', email: '', contact: '', address: '', city: '', district: '', state: '', pincode: '' });
      } else {
        throw new Error('Failed to create order');
      }
    } catch (error) {
      console.error('Order creation error:', error);
      toast({
        title: "Order Creation Failed",
        description: "Payment was successful but order creation failed. Please contact support.",
        variant: "destructive",
      });
    }
  };

  const displayPrice = product.isDeal && product.dealPrice ? product.dealPrice : product.price;
  const hasDiscount = product.originalPrice && product.originalPrice !== product.price;

  return (
    <>
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover-lift group relative">
      {showDealBadge && product.isDeal && (
        <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold z-10">
          {product.dealPrice === "1.00" ? "₹1 DEAL" : "DEAL"}
        </div>
      )}
      
      <Link href={`/product/${product.id}`} className="block">
        <div className="aspect-w-16 aspect-h-12 overflow-hidden cursor-pointer">
          <img 
            src={product.imageUrl || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"} 
            alt={product.name}
            className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </Link>
      
      <div className="p-6">
        <Link href={`/product/${product.id}`} className="block hover:no-underline">
          <h3 className="text-xl font-display font-semibold text-darkBrown mb-2 hover:text-primary transition-colors cursor-pointer" data-testid={`product-name-${product.id}`}>
            {product.name}
          </h3>
        </Link>
        <p className="text-gray-600 mb-4 line-clamp-2" data-testid={`product-description-${product.id}`}>
          {product.description || "No description available"}
        </p>
        
        <div className="flex items-start justify-between mb-4 gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 flex-1 min-w-0">
            <span className="text-lg sm:text-2xl font-bold text-primary truncate" data-testid={`product-price-${product.id}`}>
              ₹{displayPrice}
            </span>
            {hasDiscount && (
              <span className="text-sm sm:text-lg text-gray-500 line-through truncate" data-testid={`product-original-price-${product.id}`}>
                ₹{product.originalPrice}
              </span>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addToWishlistMutation.mutate()}
            disabled={addToWishlistMutation.isPending}
            className={`p-2 flex-shrink-0 ${isInWishlist ? "text-red-500" : "text-gray-400"} hover:text-red-500`}
            data-testid={`button-wishlist-${product.id}`}
          >
            <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${isInWishlist ? "fill-current" : ""}`} />
          </Button>
        </div>

        {product.isDeal && product.stock && (
          <div className="text-sm text-gray-600 mb-4">
            <span data-testid={`product-stock-${product.id}`}>{product.stock}</span> left
          </div>
        )}
        
        <div className="flex space-x-2">
          <Button
            onClick={() => addToCartMutation.mutate()}
            disabled={addToCartMutation.isPending}
            className="flex-1 bg-primary text-white hover:bg-opacity-90 transition-opacity"
            data-testid={`button-add-to-cart-${product.id}`}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
          </Button>
          <Button
            onClick={handleBuyNow}
            disabled={addToCartMutation.isPending}
            className="flex-1 wood-texture text-white hover:opacity-90 transition-opacity"
            data-testid={`button-buy-now-${product.id}`}
          >
            Buy Now
          </Button>
        </div>
      </div>
    </div>

    {/* Enhanced Customer Details Form Modal */}
    {showCustomerForm && (
      <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm pt-24">
        <Card className="w-full max-w-md max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl border-0 bg-gradient-to-br from-white via-warmWhite to-white">
          <CardHeader className="flex flex-row items-center justify-between p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
            <div>
              <CardTitle className="text-xl text-darkBrown font-display">Enter Your Details</CardTitle>
              <p className="text-sm text-primary mt-1">Complete your purchase securely</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowCustomerForm(false)} className="hover:bg-amber-100 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[60vh] overflow-y-auto px-6 py-4 space-y-4">
              <form onSubmit={handleCustomerFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-darkBrown">Full Name *</label>
                    <Input
                      placeholder="Enter your full name"
                      value={customerDetails.name}
                      onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})}
                      required
                      className="rounded-lg border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-darkBrown">Email Address *</label>
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={customerDetails.email}
                      onChange={(e) => setCustomerDetails({...customerDetails, email: e.target.value})}
                      required
                      className="rounded-lg border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-darkBrown">Phone Number *</label>
                    <Input
                      type="tel"
                      placeholder="Enter your phone number"
                      value={customerDetails.contact}
                      onChange={(e) => setCustomerDetails({...customerDetails, contact: e.target.value})}
                      required
                      className="rounded-lg border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-darkBrown">Delivery Address *</label>
                    <Input
                      placeholder="Enter your complete delivery address"
                      value={customerDetails.address}
                      onChange={(e) => setCustomerDetails({...customerDetails, address: e.target.value})}
                      required
                      className="rounded-lg border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-darkBrown">City *</label>
                      <Input
                        placeholder="City"
                        value={customerDetails.city}
                        onChange={(e) => setCustomerDetails({...customerDetails, city: e.target.value})}
                        required
                        className="rounded-lg border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-darkBrown">District *</label>
                      <Input
                        placeholder="District"
                        value={customerDetails.district}
                        onChange={(e) => setCustomerDetails({...customerDetails, district: e.target.value})}
                        required
                        className="rounded-lg border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-darkBrown">State *</label>
                      <Input
                        placeholder="State"
                        value={customerDetails.state}
                        onChange={(e) => setCustomerDetails({...customerDetails, state: e.target.value})}
                        required
                        className="rounded-lg border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-darkBrown">Pincode *</label>
                      <Input
                        placeholder="Pincode"
                        value={customerDetails.pincode}
                        onChange={(e) => setCustomerDetails({...customerDetails, pincode: e.target.value})}
                        required
                        className="rounded-lg border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-100 mt-6">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-darkBrown">Total Amount:</span>
                    <span className="text-2xl font-bold text-primary">₹{displayPrice}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Inclusive of all taxes</p>
                </div>
                <div className="pt-4 pb-2 space-y-3">
                  <Button type="submit" className="w-full h-12 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:via-orange-700 hover:to-amber-800 text-white font-semibold shadow-lg rounded-xl transition-all duration-300">
                    Continue to Payment Options
                  </Button>
                  <Button 
                    type="button"
                    onClick={() => setShowCustomerForm(false)}
                    className="w-full h-12 bg-gradient-to-r from-gray-500 via-gray-600 to-gray-700 hover:from-gray-600 hover:via-gray-700 hover:to-gray-800 text-white font-semibold shadow-lg rounded-xl transition-all duration-300"
                    data-testid="button-back-customer-form"
                  >
                    ← Back
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    )}

    {/* Payment Options Modal */}
    <RazorpayPaymentModal
      isOpen={showPaymentOptions}
      onClose={() => setShowPaymentOptions(false)}
      onSelectMethod={handlePaymentMethod}
      total={parseFloat(displayPrice)}
      phoneNumber={customerDetails.contact}
      customerDetails={customerDetails}
      productDetails={product}
    />


    {/* Order Confirmation Modal */}
    {showOrderConfirm && orderDetails && (() => {
      // Ensure document.body is available before using createPortal
      if (typeof document === 'undefined' || !document.body) return null;
      
      return createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-1 sm:p-2 md:p-3 lg:p-4 backdrop-blur-sm" style={{ zIndex: 2147483647 }}>
        <Card className="w-full max-w-[95vw] sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-2xl h-[95vh] modal-mobile-compact overflow-hidden rounded-md sm:rounded-lg md:rounded-xl lg:rounded-2xl shadow-2xl border-0 bg-gradient-to-br from-white via-warmWhite to-white relative" 
              style={{ 
                backgroundImage: 'url(/indosaga-logo.png)', 
                backgroundSize: '120px', 
                backgroundRepeat: 'no-repeat', 
                backgroundPosition: 'center center'
              }}>
          <div className="absolute inset-0 bg-white bg-opacity-95 rounded-2xl"></div>
          <div className="relative z-10">
          <CardHeader className="text-center p-1 sm:p-2 md:p-3 lg:p-4 xl:p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 relative">
            <Button
              onClick={() => {
                setShowOrderConfirm(false);
                setOrderDetails(null);
              }}
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 p-0 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
            </Button>
            <div className="flex flex-col items-center space-y-0.5 sm:space-y-1 md:space-y-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 text-white" />
              </div>
              <CardTitle className="text-base sm:text-lg md:text-xl text-darkBrown font-display">Order Confirmed!</CardTitle>
              <p className="text-xs sm:text-sm text-gray-600">Your order has been successfully placed</p>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex flex-col">
            <div className="flex-1 overflow-y-auto px-1 sm:px-2 md:px-3 lg:px-4 xl:px-6 py-1 sm:py-2 md:py-3 lg:py-4 xl:py-6 space-y-1 sm:space-y-2 md:space-y-3 lg:space-y-4 modal-content-scroll scrollbar-hide" style={{maxHeight: 'calc(95vh - 260px)', margin: '1px', scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
              <div className="bg-gray-50 rounded-md sm:rounded-lg md:rounded-xl p-1 sm:p-2 md:p-3 lg:p-4 space-y-0.5 sm:space-y-1 md:space-y-2 lg:space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-1 sm:space-y-0">
                  <span className="text-xs sm:text-sm text-gray-600">Order ID:</span>
                  <span className="font-mono text-xs sm:text-sm font-semibold">{orderDetails.id?.slice(-8)}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-1 sm:space-y-0">
                  <span className="text-xs sm:text-sm text-gray-600">Payment Method:</span>
                  <span className="text-xs sm:text-sm font-medium capitalize">{orderDetails.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-1 sm:space-y-0">
                  <span className="text-xs sm:text-sm text-gray-600">Total Amount:</span>
                  <span className="text-base sm:text-lg font-bold text-primary">₹{orderDetails.total}</span>
                </div>
              </div>
              
              <div className="space-y-1 sm:space-y-2 md:space-y-3">
                <h4 className="font-semibold text-xs sm:text-sm md:text-base text-darkBrown">Product Details:</h4>
                <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 p-1 sm:p-2 md:p-3 bg-amber-50 rounded-md sm:rounded-lg border border-amber-200">
                  <img 
                    src={product.imageUrl || '/placeholder-furniture.jpg'} 
                    alt={product.name}
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-cover rounded"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-xs sm:text-sm">{product.name}</div>
                    <div className="text-xs text-gray-600">Qty: 1</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-1 sm:space-y-2 md:space-y-3">
                <h4 className="font-semibold text-xs sm:text-sm md:text-base text-darkBrown">Delivery Address:</h4>
                <div className="text-xs sm:text-sm text-gray-600 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-1 sm:p-2 md:p-3 rounded-md sm:rounded-lg">
                  <div className="font-medium text-darkBrown">{orderDetails.customerDetails?.name || customerDetails.name}</div>
                  <div>{orderDetails.customerDetails?.address || customerDetails.address}</div>
                  <div>{(orderDetails.customerDetails?.city || customerDetails.city)}, {(orderDetails.customerDetails?.district || customerDetails.district)}</div>
                  <div>{(orderDetails.customerDetails?.state || customerDetails.state)} - {(orderDetails.customerDetails?.pincode || customerDetails.pincode)}</div>
                  <div>Phone: {orderDetails.customerDetails?.contact || customerDetails.contact}</div>
                </div>
              </div>
              
              {orderDetails.paymentMethod === 'cod' && (
                <div className="bg-orange-50 border border-orange-200 rounded-md sm:rounded-lg p-1 sm:p-2 md:p-3 lg:p-4">
                  <div className="text-xs sm:text-sm text-orange-800">
                    <strong>Cash on Delivery:</strong> Please keep exact change ready. Our delivery partner will contact you before delivery.
                  </div>
                </div>
              )}
              
              {/* Product Care Instructions */}
              <div className="space-y-1 sm:space-y-2 md:space-y-3">
                <h4 className="font-semibold text-xs sm:text-sm md:text-base text-darkBrown">📋 Product Care & Instructions:</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-md sm:rounded-lg p-1 sm:p-2 md:p-3 lg:p-4 space-y-0.5 sm:space-y-1 md:space-y-2">
                  <div className="text-xs sm:text-sm text-blue-800">
                    <div className="mb-1 sm:mb-2"><strong>🌿 Teak Wood Care:</strong></div>
                    <ul className="space-y-1 ml-2 sm:ml-4">
                      <li>• Clean with dry/damp cloth regularly</li>
                      <li>• Apply teak oil every 6 months for longevity</li>
                      <li>• Avoid direct sunlight and moisture</li>
                      <li>• Use coasters to prevent water marks</li>
                    </ul>
                  </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-md sm:rounded-lg p-1 sm:p-2 md:p-3 lg:p-4 space-y-0.5 sm:space-y-1 md:space-y-2">
                  <div className="text-xs sm:text-sm text-green-800">
                    <div className="mb-1 sm:mb-2"><strong>📦 Delivery & Assembly:</strong></div>
                    <ul className="space-y-1 ml-2 sm:ml-4">
                      <li>• Free delivery within 7-14 working days</li>
                      <li>• Professional assembly service available</li>
                      <li>• Check items upon delivery</li>
                      <li>• 30-day return policy available</li>
                    </ul>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-md sm:rounded-lg p-1 sm:p-2 md:p-3 lg:p-4 space-y-0.5 sm:space-y-1 md:space-y-2">
                  <div className="text-xs sm:text-sm text-amber-800">
                    <div className="mb-1 sm:mb-2"><strong>🛡️ Warranty & Support:</strong></div>
                    <ul className="space-y-1 ml-2 sm:ml-4">
                      <li>• 2-year warranty on manufacturing defects</li>
                      <li>• 24/7 customer support: +91 98765 43210</li>
                      <li>• WhatsApp support available</li>
                      <li>• Email: support@indosaga.com</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-2 sm:p-3 md:p-4 lg:p-5 space-y-2 sm:space-y-3 border-t border-gray-100 bg-white rounded-b-lg sm:rounded-b-xl md:rounded-b-2xl flex-shrink-0 safe-area-inset-bottom mobile-button-spacing h-[160px] overflow-y-auto modal-button-scroll">
              <Button 
                onClick={() => {
                  // Generate and download receipt
                  const receiptData = {
                    orderId: orderDetails.id,
                    customerName: orderDetails.customerDetails?.name || customerDetails.name,
                    date: new Date().toLocaleDateString(),
                    items: [{ name: product.name, qty: 1, price: displayPrice }],
                    total: orderDetails.total,
                    paymentMethod: orderDetails.paymentMethod,
                    address: `${orderDetails.customerDetails?.address || customerDetails.address}, ${orderDetails.customerDetails?.city || customerDetails.city}, ${orderDetails.customerDetails?.state || customerDetails.state} - ${orderDetails.customerDetails?.pincode || customerDetails.pincode}`
                  };
                  
                  const receiptText = `
=======================================
    🏺 INDOSAGA FURNITURE 🏺
      Premium Teak Wood Specialist
        📧 ORDER RECEIPT 📧
=======================================

📅 Date: ${receiptData.date}
🆔 Order ID: ${receiptData.orderId?.slice(-8)}
👤 Customer: ${receiptData.customerName}

📦 PRODUCT DETAILS:
${receiptData.items.map(item => `${item.name} x${item.qty} - ₹${item.price}`).join('\n')}

💰 PAYMENT SUMMARY:
Subtotal: ₹${receiptData.total}
Delivery: FREE (Premium Service)
Extra Charges: NONE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Amount: ₹${receiptData.total}
Payment Method: ${receiptData.paymentMethod === 'cod' ? '💵 Cash on Delivery' : '💳 Online Payment'}

🏠 DELIVERY ADDRESS:
${receiptData.address}

📋 PRODUCT CARE INSTRUCTIONS:
🌿 TEAK WOOD CARE:
• Clean with dry/damp cloth regularly
• Apply teak oil every 6 months
• Avoid direct sunlight and moisture
• Use coasters to prevent water marks

📦 DELIVERY & ASSEMBLY:
• Free delivery within 7-14 working days
• Professional assembly service available
• Check items upon delivery
• 30-day return policy available

🛡️ WARRANTY & SUPPORT:
• 2-year warranty on manufacturing defects
• 24/7 customer support: +91 98765 43210
• WhatsApp support available
• Email: support@indosaga.com

🌟 Thank you for choosing IndoSaga! 🌟
🌐 Website: www.indosaga.com
📱 WhatsApp: +91 98765 43210
📧 Email: support@indosaga.com

=======================================
        Premium Teak Wood Furniture
     🏺 IndoSaga - Crafting Excellence 🏺
=======================================
                  `;
                  
                  const blob = new Blob([receiptText], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `receipt-${orderDetails.id?.slice(-8)}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                  
                  toast({
                    title: "Receipt Downloaded!",
                    description: "Your order receipt has been downloaded successfully.",
                  });
                }}
                className="w-full h-10 sm:h-11 md:h-12 text-xs sm:text-sm md:text-base bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:via-orange-700 hover:to-amber-800 text-white font-semibold shadow-lg rounded-lg sm:rounded-xl border-2 border-amber-200 hover:border-amber-300 transition-all duration-300"
              >
                📥 Download Receipt
              </Button>
              <Button 
                onClick={() => {
                  setShowOrderConfirm(false);
                  setOrderDetails(null);
                  // Navigate to profile orders section
                  window.location.href = '/profile#orders';
                }}
                className="w-full h-10 sm:h-11 md:h-12 text-xs sm:text-sm md:text-base bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 hover:from-green-700 hover:via-emerald-700 hover:to-green-800 text-white font-semibold shadow-lg rounded-lg sm:rounded-xl border-2 border-green-200 hover:border-green-300 transition-all duration-300"
                data-testid="button-view-order-history"
              >
                📋 View Order Details
              </Button>
            </div>
          </CardContent>
          </div>
        </Card>
      </div>,
      document.body
    );
    })()}

    </>
  );
}
