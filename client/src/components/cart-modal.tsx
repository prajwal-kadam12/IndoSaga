import { Button } from "@/components/ui/button";
import { X, Minus, Plus, Trash2, CreditCard, Smartphone, Building, Truck, CheckCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import type { CartItem, Product } from "@shared/schema";

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartModal({ isOpen, onClose }: CartModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [localCartItems, setLocalCartItems] = useState<any[]>([]);
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

  // Try to get cart from API, fallback to localStorage
  const { data: apiCartItems = [], isLoading } = useQuery<(CartItem & { product: Product })[]>({
    queryKey: ["/api/cart"],
    enabled: isOpen,
    retry: false,
  });

  // Load local cart items from localStorage and listen for updates
  useEffect(() => {
    if (!isOpen) return;
    
    const loadLocalCart = () => {
      const localCart = JSON.parse(localStorage.getItem('localCart') || '[]');
      setLocalCartItems(localCart);
    };
    
    // Load initial cart
    loadLocalCart();
    
    // Listen for cart updates
    window.addEventListener('cartUpdated', loadLocalCart);
    
    return () => {
      window.removeEventListener('cartUpdated', loadLocalCart);
    };
  }, [isOpen]);

  // Use API cart if available, otherwise use localStorage cart
  const cartItems = apiCartItems.length > 0 ? apiCartItems : localCartItems;

  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to your cart before checkout.",
        variant: "destructive",
      });
      return;
    }

    // Prepare cart items for checkout
    const checkoutItems = cartItems.map((item: any) => ({
      product: item.product,
      quantity: item.quantity,
      price: parseFloat(item.product?.price || 0),
      total: parseFloat(item.product?.price || 0) * item.quantity
    }));

    // Store checkout data in localStorage
    localStorage.setItem('checkoutType', 'cart');
    localStorage.setItem('checkoutItems', JSON.stringify(checkoutItems));

    // Close cart modal and navigate to checkout
    onClose();
    navigate('/checkout');
  };

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      try {
        await apiRequest("PUT", `/api/cart/${id}`, { quantity });
      } catch (error: any) {
        if (error.message?.includes('Authentication required') || error.message?.includes('401')) {
          // Update localStorage cart
          const localCart = JSON.parse(localStorage.getItem('localCart') || '[]');
          const itemIndex = localCart.findIndex((item: any) => item.id === id || item.productId === id);
          if (itemIndex !== -1) {
            localCart[itemIndex].quantity = quantity;
            localStorage.setItem('localCart', JSON.stringify(localCart));
            setLocalCartItems([...localCart]);
            window.dispatchEvent(new Event('cartUpdated'));
          }
          return;
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        await apiRequest("DELETE", `/api/cart/${id}`);
      } catch (error: any) {
        if (error.message?.includes('Authentication required') || error.message?.includes('401')) {
          // Remove from localStorage cart
          const localCart = JSON.parse(localStorage.getItem('localCart') || '[]');
          const updatedCart = localCart.filter((item: any) => item.id !== id && item.productId !== id);
          localStorage.setItem('localCart', JSON.stringify(updatedCart));
          setLocalCartItems([...updatedCart]);
          window.dispatchEvent(new Event('cartUpdated'));
          return;
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart.",
      });
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const orderItems = cartItems.map((item) => {
        const product = item.product;
        const dealPrice = product?.isDeal && product?.dealPrice ? product.dealPrice : null;
        const price = dealPrice !== null ? dealPrice : product.price;
        return {
          productId: item.productId,
          quantity: item.quantity,
          price: price,
        };
      });

      const total = cartItems.reduce((sum: number, item) => {
        const product = item.product;
        const dealPrice = product?.isDeal && product?.dealPrice ? parseFloat(product.dealPrice) : null;
        const price = dealPrice !== null ? dealPrice : parseFloat(product.price);
        return sum + (price * (item.quantity || 0));
      }, 0);

      // Create Razorpay order
      const paymentOrder = await apiRequest("POST", "/api/payment/create-order", {
        amount: total,
        currency: "INR",
      }) as any;

      // Simulate Razorpay payment (in real app, this would open Razorpay modal)
      const mockPayment = {
        razorpay_order_id: paymentOrder.id,
        razorpay_payment_id: `pay_${Date.now()}`,
        razorpay_signature: "mock_signature",
      };

      // Verify payment
      const verifyResponse = await apiRequest("POST", "/api/payment/verify", mockPayment) as unknown as { success: boolean };

      // Create order
      const orderResponse = await apiRequest("POST", "/api/orders", {
        total: total.toString(),
        orderItems,
        paymentId: mockPayment.razorpay_payment_id,
        paymentStatus: "completed",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order placed successfully!",
        description: "Your order has been confirmed and will be processed soon.",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Payment failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Calculate total properly for both API and localStorage cart items
  const total = cartItems.reduce((sum: number, item) => {
    // Use deal price if available, otherwise use regular price
    const product = item.product;
    const dealPrice = product?.isDeal && product?.dealPrice ? parseFloat(product.dealPrice) : null;
    const price = dealPrice !== null ? dealPrice : parseFloat(product?.price || item.price || "0");
    const quantity = item.quantity || 1;
    return sum + (price * quantity);
  }, 0);

  // Payment method handlers
  const handlePaymentMethod = (method: string) => {
    setSelectedPaymentMethod(method);
    setShowPaymentOptions(false);
    setShowCustomerForm(true);
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
    
    if (selectedPaymentMethod === 'cod') {
      handleCODOrder();
    } else {
      handleDirectRazorpayPayment();
    }
  };

  const handleCODOrder = async () => {
    try {
      const orderItems = cartItems.map((item: any) => ({
        productId: item.productId || item.product.id,
        quantity: item.quantity,
        price: (() => {
          const product = item.product;
          const dealPrice = product?.isDeal && product?.dealPrice ? product.dealPrice : null;
          return dealPrice !== null ? dealPrice : product.price;
        })()
      }));

      const orderData = {
        customerName: customerDetails.name,
        customerEmail: customerDetails.email,
        customerPhone: customerDetails.contact,
        shippingAddress: `${customerDetails.address}, ${customerDetails.city}, ${customerDetails.district}, ${customerDetails.state} - ${customerDetails.pincode}`,
        pincode: customerDetails.pincode,
        paymentMethod: "cod",
        total: total, // No COD charges
        orderItems: orderItems
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        const order = await response.json();
        setOrderDetails({
          ...order,
          paymentMethod: 'cod',
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
        
        // Clear cart
        localStorage.removeItem('localCart');
        setLocalCartItems([]);
        window.dispatchEvent(new Event('cartUpdated'));
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
        
        // Reset form
        setCustomerDetails({ name: '', email: '', contact: '', address: '', city: '', district: '', state: '', pincode: '' });
      } else {
        throw new Error('Failed to create order');
      }
    } catch (error) {
      toast({
        title: "Order Failed",
        description: "Unable to place your order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDirectRazorpayPayment = async () => {
    console.log('Starting Razorpay payment process...');
    
    // Show loading state
    const loadingToast = toast({
      title: "Loading Payment...",
      description: "Please wait while we set up your payment.",
    });
    
    try {
      // Create Razorpay order directly
      const response = await fetch('/api/create-razorpay-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: total,
          currency: 'INR'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment order');
      }

      const orderData = await response.json();

      // Dismiss loading toast
      loadingToast.dismiss();
      
      // Use optimized Razorpay loader
      try {
        await initializeRazorpay(orderData);
      } catch (error: any) {
        console.error('Razorpay SDK error:', error);
        toast({
          title: "Payment System Error",
          description: "Unable to load payment system. Please refresh the page and try again.",
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      console.error('Payment initialization error:', error);
      loadingToast.dismiss();
      toast({
        title: "Payment Failed",
        description: "Unable to initialize payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const initializeRazorpay = async (orderData: any) => {
    let razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
    
    // Fallback: fetch from server if environment variable is not available
    if (!razorpayKey) {
      try {
        const configResponse = await fetch('/api/payment/config');
        if (configResponse.ok) {
          const config = await configResponse.json();
          razorpayKey = config.key;
        }
      } catch (error) {
        console.error('Failed to fetch payment config:', error);
      }
    }
    
    console.log('Environment check:', {
      hasViteKey: !!import.meta.env.VITE_RAZORPAY_KEY_ID,
      hasFallbackKey: !!razorpayKey,
      keyPrefix: razorpayKey?.substring(0, 12),
      hasRazorpay: !!window.Razorpay,
      orderData: orderData
    });
    
    if (!razorpayKey) {
      toast({
        title: "Configuration Error",
        description: "Razorpay key not configured. Please contact support.",
        variant: "destructive",
      });
      return;
    }
    
    if (!window.Razorpay) {
      toast({
        title: "Payment System Error",
        description: "Razorpay SDK not loaded. Please refresh and try again.",
        variant: "destructive",
      });
      return;
    }
    
    console.log('Initializing Razorpay with key:', razorpayKey?.substring(0, 12) + '...');
    console.log('Order data:', orderData);
    
    const options = {
      key: razorpayKey,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'IndoSaga Furniture',
      description: 'Cart Checkout',
      order_id: orderData.id,
      prefill: {
        name: customerDetails.name,
        email: customerDetails.email,
        contact: customerDetails.contact,
      },
      notes: {
        address: customerDetails.address,
        items: cartItems.length
      },
      theme: {
        color: '#D97706'
      },
      handler: function (response: any) {
        handlePaymentSuccess(response);
      },
      modal: {
        ondismiss: function() {
          // Only show error if payment actually failed/cancelled
          // Razorpay automatically handles successful payments
          console.log('Payment modal dismissed');
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function (response: any) {
        console.error('Payment failed:', response);
        toast({
          title: "Payment Failed",
          description: response.error?.description || "Payment processing failed. Please try again.",
          variant: "destructive",
        });
      });
      
      // Add success logging
      console.log('Opening Razorpay payment modal...');
      
      rzp.open();
      console.log('Razorpay modal opened successfully');
    } catch (error) {
      console.error('Error opening Razorpay modal:', error);
      toast({
        title: "Payment Error",
        description: "Unable to open payment modal. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      // Enhanced email automation for cart checkout
      console.log('📧 Email automation will be triggered for cart order confirmation');
      console.log('📨 User confirmation email will be sent to:', customerDetails.email);
      console.log('📨 Admin notification email will be sent to: kadamprajwal358@gmail.com');
      
      // Create final order after successful payment
      const orderItems = cartItems.map((item: any) => ({
        productId: item.productId || item.product.id,
        quantity: item.quantity,
        price: (() => {
          const product = item.product;
          const dealPrice = product?.isDeal && product?.dealPrice ? product.dealPrice : null;
          return dealPrice !== null ? dealPrice : product.price;
        })()
      }));

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
        total: total,
        orderItems: orderItems
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        // Show email confirmation to user
        toast({
          title: "Order confirmed & emails sent!",
          description: "Order confirmation sent to you and our team has been notified.",
        });
        
        // Clear the cart
        localStorage.removeItem('localCart');
        setLocalCartItems([]);
        window.dispatchEvent(new Event('cartUpdated'));
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
        
        // Reset form and close modal
        setCustomerDetails({ name: '', email: '', contact: '', address: '', city: '', district: '', state: '', pincode: '' });
        onClose();
      } else {
        throw new Error('Failed to create order');
      }
    } catch (error) {
      console.error('Cart order creation error:', error);
      toast({
        title: "Order Creation Failed",
        description: "Payment was successful but order creation failed. Please contact support.",
        variant: "destructive",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 pt-16 sm:pt-18 lg:pt-20 xl:pt-24 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl transform transition-transform duration-300 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-display font-semibold text-darkBrown">Shopping Cart</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            data-testid="button-close-cart"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse">
                  <div className="flex space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded" />
                      <div className="h-4 bg-gray-200 rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : cartItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6m0 0L2 5m5 8h10m-10 0v6a2 2 0 002 2h6a2 2 0 002-2v-6" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-700 mb-2">Your cart is empty</h4>
              <p className="text-gray-500">Add some beautiful furniture to get started!</p>
            </div>
          ) : (
            <div className="space-y-4" data-testid="cart-items">
              {cartItems.map((item: any) => (
                <div key={item.id || item.productId} className="bg-beige rounded-lg p-4">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={item.product?.imageUrl || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80"} 
                      alt={item.product?.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-darkBrown" data-testid={`cart-item-name-${item.id || item.productId}`}>
                        {item.product?.name}
                      </h4>
                      <p className="text-sm text-gray-600" data-testid={`cart-item-price-${item.id || item.productId}`}>
                        ₹{(() => {
                          const product = item.product;
                          const dealPrice = product?.isDeal && product?.dealPrice ? parseFloat(product.dealPrice) : null;
                          const price = dealPrice !== null ? dealPrice : parseFloat(product?.price || "0");
                          return price.toFixed(2);
                        })()}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantityMutation.mutate({ 
                            id: item.id || item.productId, 
                            quantity: Math.max(1, item.quantity - 1) 
                          })}
                          disabled={updateQuantityMutation.isPending || item.quantity <= 1}
                          className="w-8 h-8 p-0"
                          data-testid={`button-decrease-quantity-${item.id || item.productId}`}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium min-w-8 text-center" data-testid={`cart-item-quantity-${item.id || item.productId}`}>
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantityMutation.mutate({ 
                            id: item.id || item.productId, 
                            quantity: item.quantity + 1 
                          })}
                          disabled={updateQuantityMutation.isPending}
                          className="w-8 h-8 p-0"
                          data-testid={`button-increase-quantity-${item.id || item.productId}`}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItemMutation.mutate(item.id || item.productId)}
                      disabled={removeItemMutation.isPending}
                      className="text-red-500 hover:text-red-600"
                      data-testid={`button-remove-item-${item.id || item.productId}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {cartItems.length > 0 && (
          <div className="border-t p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-darkBrown">Total:</span>
              <span className="text-xl font-bold text-primary" data-testid="cart-total">
                ₹{total.toFixed(2)}
              </span>
            </div>
            <Button
              onClick={handleProceedToCheckout}
              className="w-full bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 text-white py-3 font-semibold shadow-lg mb-3"
              data-testid="button-checkout"
            >
              Proceed to Checkout
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full border-primary text-primary hover:bg-primary hover:text-white transition-colors"
              data-testid="button-continue-shopping"
            >
              Continue Shopping
            </Button>
          </div>
        )}
      </div>
    </div>

    {/* Customer Details Form Modal */}
    {showCustomerForm && (
      <div className="fixed inset-0 pt-16 sm:pt-18 lg:pt-20 xl:pt-24 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Enter Your Details</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowCustomerForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCustomerFormSubmit} className="space-y-4">
              <Input
                placeholder="Full Name"
                value={customerDetails.name}
                onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})}
                required
              />
              <Input
                type="email"
                placeholder="Email Address"
                value={customerDetails.email}
                onChange={(e) => setCustomerDetails({...customerDetails, email: e.target.value})}
                required
              />
              <Input
                type="tel"
                placeholder="Phone Number"
                value={customerDetails.contact}
                onChange={(e) => setCustomerDetails({...customerDetails, contact: e.target.value})}
                required
              />
              <Input
                placeholder="Delivery Address"
                value={customerDetails.address}
                onChange={(e) => setCustomerDetails({...customerDetails, address: e.target.value})}
                required
              />
              <Input
                placeholder="City"
                value={customerDetails.city}
                onChange={(e) => setCustomerDetails({...customerDetails, city: e.target.value})}
                required
              />
              <Input
                placeholder="District"
                value={customerDetails.district}
                onChange={(e) => setCustomerDetails({...customerDetails, district: e.target.value})}
                required
              />
              <Input
                placeholder="State"
                value={customerDetails.state}
                onChange={(e) => setCustomerDetails({...customerDetails, state: e.target.value})}
                required
              />
              <Input
                placeholder="Pincode"
                value={customerDetails.pincode}
                onChange={(e) => setCustomerDetails({...customerDetails, pincode: e.target.value})}
                required
              />
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="font-semibold">Total: ₹{total.toFixed(2)}</span>
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 text-white font-semibold shadow-lg">
                {selectedPaymentMethod === 'cod' ? 'Place COD Order' : 'Pay with Razorpay'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )}

    {/* Payment Options Modal */}
    {showPaymentOptions && (
      <div className="fixed inset-0 pt-16 sm:pt-18 lg:pt-20 xl:pt-24 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <Card className="w-full max-w-md rounded-2xl shadow-2xl border-0 bg-gradient-to-br from-white via-warmWhite to-white mt-4">
          <CardHeader className="text-center p-6 border-b">
            <Button
              onClick={() => setShowPaymentOptions(false)}
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 w-8 h-8 p-0 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4 text-gray-500" />
            </Button>
            <CardTitle className="text-xl text-darkBrown font-display">Choose Payment Method</CardTitle>
            <div className="mt-4 p-4 bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl">
              <div className="text-2xl font-bold text-primary">₹{total.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Total Amount</div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-3">
              {/* UPI Payment */}
              <Button
                onClick={() => handlePaymentMethod('upi')}
                className="w-full h-14 flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-amber-200 rounded-xl text-left transition-all duration-300"
                variant="ghost"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                    <Smartphone className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-darkBrown">UPI Payment</div>
                    <div className="text-sm text-gray-600">PhonePe, GooglePay, Paytm</div>
                  </div>
                </div>
                <div className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">Instant</div>
              </Button>

              {/* Credit/Debit Card */}
              <Button
                onClick={() => handlePaymentMethod('card')}
                className="w-full h-14 flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border border-orange-200 rounded-xl text-left transition-all duration-300"
                variant="ghost"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-darkBrown">Credit/Debit Card</div>
                    <div className="text-sm text-gray-600">Visa, MasterCard, RuPay</div>
                  </div>
                </div>
                <div className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">Secure</div>
              </Button>

              {/* Net Banking */}
              <Button
                onClick={() => handlePaymentMethod('netbanking')}
                className="w-full h-14 flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-amber-200 rounded-xl text-left transition-all duration-300"
                variant="ghost"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg flex items-center justify-center">
                    <Building className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-darkBrown">Net Banking</div>
                    <div className="text-sm text-gray-600">All major banks supported</div>
                  </div>
                </div>
                <div className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">Trusted</div>
              </Button>

              {/* Cash on Delivery */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or</span>
                </div>
              </div>
              
              <Button
                onClick={() => handlePaymentMethod('cod')}
                className="w-full h-14 flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-100 hover:from-orange-100 hover:to-amber-200 border border-orange-200 rounded-xl text-left transition-all duration-300"
                variant="ghost"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                    <Truck className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-darkBrown">Cash on Delivery</div>
                    <div className="text-sm text-gray-600">Pay when you receive</div>
                  </div>
                </div>
                <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Free</div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )}

    {/* Order Confirmation Modal */}
    {showOrderConfirm && orderDetails && (
      <div className="fixed inset-0 pt-16 sm:pt-18 lg:pt-20 xl:pt-24 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <Card className="w-full max-w-md max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl border-0 bg-gradient-to-br from-white via-warmWhite to-white mt-4">
          <CardHeader className="text-center p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 relative">
            <Button
              onClick={() => {
                setShowOrderConfirm(false);
                setOrderDetails(null);
                onClose();
              }}
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 w-8 h-8 p-0 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4 text-gray-500" />
            </Button>
            <div className="flex flex-col items-center space-y-2">
              <div className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl text-darkBrown font-display">Order Confirmed!</CardTitle>
              <p className="text-sm text-gray-600">Your order has been successfully placed</p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[60vh] overflow-y-auto px-6 py-4 space-y-6">
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Order ID:</span>
                  <span className="font-mono text-sm font-semibold">{orderDetails.id?.slice(-8)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Payment Method:</span>
                  <span className="text-sm font-medium capitalize">{orderDetails.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Amount:</span>
                  <span className="text-lg font-bold text-primary">₹{orderDetails.total}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-darkBrown">Cart Items:</h4>
                {cartItems.map((item: any) => (
                  <div key={item.id || item.productId} className="flex items-center space-x-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <img 
                      src={item.product?.imageUrl || '/placeholder-furniture.jpg'} 
                      alt={item.product?.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.product?.name}</div>
                      <div className="text-xs text-gray-600">Qty: {item.quantity}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-darkBrown">Delivery Address:</h4>
                <div className="text-sm text-gray-600 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-3 rounded-lg">
                  <div className="font-medium text-darkBrown">{orderDetails.customerDetails?.name}</div>
                  <div>{orderDetails.customerDetails?.address}</div>
                  <div>{orderDetails.customerDetails?.city}, {orderDetails.customerDetails?.district}</div>
                  <div>{orderDetails.customerDetails?.state} - {orderDetails.customerDetails?.pincode}</div>
                  <div>Phone: {orderDetails.customerDetails?.contact}</div>
                </div>
              </div>
              
              {orderDetails.paymentMethod === 'cod' && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="text-sm text-orange-800">
                    <strong>Cash on Delivery:</strong> Please keep exact change ready. Our delivery partner will contact you before delivery.
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 pt-4 space-y-3">
              <Button 
                onClick={() => {
                  // Generate and download receipt
                  const receiptData = {
                    orderId: orderDetails.id,
                    customerName: orderDetails.customerDetails?.name,
                    date: new Date().toLocaleDateString(),
                    items: cartItems.map((item: any) => ({ 
                      name: item.product?.name, 
                      qty: item.quantity, 
                      price: (() => {
                        const product = item.product;
                        const dealPrice = product?.isDeal && product?.dealPrice ? product.dealPrice : null;
                        return dealPrice !== null ? dealPrice : product.price;
                      })()
                    })),
                    total: orderDetails.total,
                    paymentMethod: orderDetails.paymentMethod,
                    address: `${orderDetails.customerDetails?.address}, ${orderDetails.customerDetails?.city}, ${orderDetails.customerDetails?.state} - ${orderDetails.customerDetails?.pincode}`
                  };
                  
                  const receiptText = `
=======================
    ORDER RECEIPT
=======================
Order ID: ${receiptData.orderId?.slice(-8)}
Date: ${receiptData.date}
Customer: ${receiptData.customerName}

ITEMS:
${receiptData.items.map(item => `${item.name} x${item.qty} - ₹${item.price}`).join('\n')}

Total: ₹${receiptData.total}
Payment: ${receiptData.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}

Delivery Address:
${receiptData.address}

Thank you for shopping with us!
=======================
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
                className="w-full h-12 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:via-orange-700 hover:to-amber-800 text-white font-semibold shadow-lg rounded-xl border-2 border-amber-200 hover:border-amber-300 transition-all duration-300"
              >
                📥 Download Receipt
              </Button>
              <Button 
                onClick={() => {
                  setShowOrderConfirm(false);
                  setOrderDetails(null);
                  onClose();
                }}
                className="w-full h-12 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-700 hover:via-orange-700 hover:to-amber-800 text-white font-semibold shadow-lg rounded-xl transition-all duration-300"
              >
                Continue Shopping
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )}
    </>
  );
}
