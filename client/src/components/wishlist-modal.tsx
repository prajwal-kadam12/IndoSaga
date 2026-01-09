import { Button } from "@/components/ui/button";
import { X, Heart, ShoppingCart, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import type { WishlistItem, Product } from "@shared/schema";

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WishlistModal({ isOpen, onClose }: WishlistModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [localWishlistItems, setLocalWishlistItems] = useState<any[]>([]);

  // Load local wishlist items from localStorage
  useEffect(() => {
    if (isOpen) {
      const localWishlist = JSON.parse(localStorage.getItem('localWishlist') || '[]');
      setLocalWishlistItems(localWishlist);
    }
  }, [isOpen]);

  // Listen for localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const localWishlist = JSON.parse(localStorage.getItem('localWishlist') || '[]');
      setLocalWishlistItems(localWishlist);
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for same-tab localStorage updates
    window.addEventListener('localWishlistUpdate', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localWishlistUpdate', handleStorageChange);
    };
  }, []);

  const { data: apiWishlistItems = [], isLoading } = useQuery<(WishlistItem & { product: Product })[]>({
    queryKey: ["/api/wishlist"],
    enabled: isOpen,
  });

  // Combine API and localStorage wishlist items, avoiding duplicates
  const combinedWishlistItems = apiWishlistItems.length > 0 ? apiWishlistItems : localWishlistItems;
  
  // Remove duplicates based on productId to avoid key conflicts
  const uniqueWishlistItems = combinedWishlistItems.filter((item, index, array) => 
    array.findIndex(i => i.productId === item.productId) === index
  );
  
  const wishlistItems = uniqueWishlistItems;

  const removeFromWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      try {
        await apiRequest("DELETE", `/api/wishlist/${productId}`);
      } catch (error: any) {
        if (error.message?.includes('Authentication required') || error.message?.includes('401')) {
          // User not logged in - use local storage for wishlist
          const localWishlist = JSON.parse(localStorage.getItem('localWishlist') || '[]');
          const updatedWishlist = localWishlist.filter((item: any) => item.productId !== productId);
          localStorage.setItem('localWishlist', JSON.stringify(updatedWishlist));
          
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
      toast({
        title: "Removed from wishlist",
        description: "Item has been removed from your wishlist.",
      });
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiRequest("POST", "/api/cart", { 
        productId,
        quantity: 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to cart",
        description: "Item has been moved to your cart.",
      });
    },
  });

  const handleBuyNow = (productId: string) => {
    addToCartMutation.mutate(productId);
    setTimeout(() => {
      onClose();
      window.location.href = "/cart";
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 pt-16 sm:pt-18 lg:pt-20 xl:pt-24 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl transform transition-transform duration-300 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-display font-semibold text-darkBrown">Wishlist</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            data-testid="button-close-wishlist"
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
          ) : wishlistItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Heart className="w-16 h-16 mx-auto" />
              </div>
              <h4 className="text-lg font-semibold text-gray-700 mb-2">Your wishlist is empty</h4>
              <p className="text-gray-500">Save items you love to buy them later!</p>
            </div>
          ) : (
            <div className="space-y-4" data-testid="wishlist-items">
              {wishlistItems.map((item: any, index: number) => (
                <div key={item.id || item.productId || index} className="bg-beige rounded-lg p-4">
                  <div className="flex items-center space-x-4 mb-3">
                    <img 
                      src={item.product?.imageUrl || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=80&h=80"} 
                      alt={item.product?.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-darkBrown" data-testid={`wishlist-item-name-${item.id}`}>
                        {item.product?.name}
                      </h4>
                      <p className="text-sm text-gray-600" data-testid={`wishlist-item-price-${item.id}`}>
                        ₹{item.product?.price}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromWishlistMutation.mutate(item.productId)}
                      disabled={removeFromWishlistMutation.isPending}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      data-testid={`button-remove-wishlist-${item.id}`}
                      title="Remove from wishlist"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => addToCartMutation.mutate(item.productId)}
                      disabled={addToCartMutation.isPending}
                      className="flex-1 bg-primary text-white text-sm py-2 hover:bg-opacity-90 transition-opacity"
                      data-testid={`button-move-to-cart-${item.id}`}
                    >
                      <ShoppingCart className="mr-2 h-3 w-3" />
                      {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
                    </Button>
                    <Button
                      onClick={() => handleBuyNow(item.productId)}
                      disabled={addToCartMutation.isPending}
                      className="flex-1 wood-texture text-white text-sm py-2 hover:opacity-90 transition-opacity"
                      data-testid={`button-buy-now-wishlist-${item.id}`}
                    >
                      Buy Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
