import { useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AuthRedirectHandler() {
  const { toast } = useToast();
  
  // Check authentication status
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  useEffect(() => {
    // Only run if user is authenticated
    if (!user) return;

    // Check for pending actions after login
    const pendingAction = sessionStorage.getItem('pendingAction');
    const pendingProductId = sessionStorage.getItem('pendingProductId');
    const pendingQuantity = sessionStorage.getItem('pendingQuantity');

    // Skip if these actions should be handled by callback.tsx
    // Only handle add-to-cart actions that weren't handled by callback
    if (pendingAction === 'add-to-cart' && pendingProductId) {
      // Clear the pending action first
      sessionStorage.removeItem('pendingAction');
      sessionStorage.removeItem('pendingProductId');
      sessionStorage.removeItem('pendingQuantity');

      // Add the product to cart
      handleAddToCart(pendingProductId, parseInt(pendingQuantity || '1'));
    }
    
    // Don't handle buy-now actions here - let callback.tsx handle them
    // Don't show "Welcome back!" message as it interferes with the buy-now flow
  }, [user]);

  const handleAddToCart = async (productId: string, quantity: number = 1) => {
    try {
      await apiRequest("POST", "/api/cart", { 
        productId,
        quantity
      });
      
      toast({
        title: "Added to cart",
        description: "Product has been added to your cart successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add product to cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  // This component doesn't render anything
  return null;
}