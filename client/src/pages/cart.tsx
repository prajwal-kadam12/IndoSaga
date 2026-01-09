import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Minus, Plus, Trash2, ShoppingBag, CreditCard } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { useAuth0 } from "@auth0/auth0-react";

import { useState, useEffect } from "react";

export default function Cart() {
  const [location, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth0();
  const [localCartItems, setLocalCartItems] = useState<any[]>([]);

  // Try to get cart from API, fallback to localStorage
  const { data: apiCartItems = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/cart"],
    retry: false, // Don't retry on auth failure
  });

  // Load local cart items from localStorage and listen for updates
  useEffect(() => {
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
  }, []);

  // Use API cart if available, otherwise use localStorage cart
  const cartItems = apiCartItems.length > 0 ? apiCartItems : localCartItems;

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

  const handleCheckout = () => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      sessionStorage.setItem('pendingAction', 'checkout');
      navigate('/login');
      return;
    }
    
    // Store cart data for checkout and redirect to address form
    const checkoutItems = cartItems.map((item: any) => ({
      product: item.product,
      quantity: item.quantity,
      price: parseFloat(item.product?.price || "0"),
      total: parseFloat(item.product?.price || "0") * item.quantity
    }));
    
    localStorage.setItem('checkoutItems', JSON.stringify(checkoutItems));
    localStorage.removeItem('checkoutAddress'); // Clear any existing address
    localStorage.setItem('checkoutType', 'cart');
    
    navigate('/address');
  };

  const total = (cartItems as any[]).reduce((sum: number, item: any) => 
    sum + (parseFloat(item.product?.price || "0") * item.quantity), 0
  );

  const shipping = 0; // Free shipping on all orders
  const finalTotal = total;

  if (isLoading) {
    return (
      <div className="py-20 bg-warmWhite min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 mb-6">
                    <div className="flex space-x-4">
                      <div className="w-24 h-24 bg-gray-200 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="h-6 bg-gray-200 rounded" />
                        <div className="h-4 bg-gray-200 rounded w-2/3" />
                        <div className="h-4 bg-gray-200 rounded w-1/3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-2xl p-6 h-fit">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-12 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-20 bg-warmWhite min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-darkBrown mb-4">Shopping Cart</h1>
          <p className="text-gray-600">Review your items and proceed to checkout</p>
        </div>

        {cartItems.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <div className="text-gray-400 mb-6">
                <ShoppingBag className="w-24 h-24 mx-auto" />
              </div>
              <h3 className="text-2xl font-display font-semibold text-darkBrown mb-4">Your cart is empty</h3>
              <p className="text-gray-600 mb-8">Looks like you haven't added any furniture to your cart yet.</p>
              <Link href="/products">
                <Button className="wood-texture text-white px-8 py-3" data-testid="button-continue-shopping">
                  Continue Shopping
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6" data-testid="cart-items-list">
              {(cartItems as any[]).map((item: any) => (
                <Card key={item.id || item.productId} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="w-full sm:w-32 h-32 overflow-hidden rounded-lg">
                        <img 
                          src={item.product?.imageUrl || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"} 
                          alt={item.product?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-xl font-display font-semibold text-darkBrown mb-2" data-testid={`cart-item-name-${item.id}`}>
                          {item.product?.name}
                        </h3>
                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {item.product?.description}
                        </p>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex items-center space-x-4">
                            <span className="text-2xl font-bold text-primary" data-testid={`cart-item-price-${item.id}`}>
                              ₹{item.product?.price}
                            </span>
                            
                            <div className="flex items-center space-x-2">
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
                              <span className="text-lg font-medium min-w-8 text-center" data-testid={`cart-item-quantity-${item.id || item.productId}`}>
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
                          
                          <div className="flex items-center space-x-4">
                            <span className="text-lg font-semibold text-darkBrown" data-testid={`cart-item-total-${item.id}`}>
                              ₹{(parseFloat(item.product?.price || "0") * item.quantity).toFixed(2)}
                            </span>
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
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-xl font-display text-darkBrown">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({(cartItems as any[]).length} items)</span>
                    <span data-testid="cart-subtotal">₹{total.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span data-testid="cart-shipping">
                      {shipping === 0 ? "Free" : `₹${shipping}`}
                    </span>
                  </div>
                  
                  {shipping === 0 && (
                    <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                      🎉 You've qualified for free shipping!
                    </div>
                  )}
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-semibold text-darkBrown">
                      <span>Total</span>
                      <span data-testid="cart-total">₹{finalTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleCheckout}
                    className="w-full wood-texture text-white py-3 font-semibold hover:opacity-90 transition-opacity mt-6"
                    data-testid="button-proceed-to-checkout"
                  >
                    <CreditCard className="mr-2 h-5 w-5" />
                    Proceed to Checkout
                  </Button>
                  
                  <div className="text-center text-sm text-gray-500">
                    Secure payment powered by Razorpay
                  </div>
                  
                  <Link href="/products">
                    <Button
                      variant="outline"
                      className="w-full border-primary text-primary hover:bg-primary hover:text-white transition-colors"
                      data-testid="button-continue-shopping-summary"
                    >
                      Continue Shopping
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
