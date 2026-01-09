import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function Wishlist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: wishlistItems = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/wishlist"],
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiRequest("DELETE", `/api/wishlist/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
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
      window.location.href = "/cart";
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="py-20 bg-warmWhite min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6">
                  <div className="w-full h-48 bg-gray-200 rounded-lg mb-4" />
                  <div className="h-6 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded mb-4" />
                  <div className="h-10 bg-gray-200 rounded" />
                </div>
              ))}
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
          <h1 className="text-4xl font-display font-bold text-darkBrown mb-4">My Wishlist</h1>
          <p className="text-gray-600">Save your favorite furniture pieces for later</p>
        </div>

        {wishlistItems.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <div className="text-gray-400 mb-6">
                <Heart className="w-24 h-24 mx-auto" />
              </div>
              <h3 className="text-2xl font-display font-semibold text-darkBrown mb-4">Your wishlist is empty</h3>
              <p className="text-gray-600 mb-8">Start browsing and save items you love to buy them later.</p>
              <Link href="/products">
                <Button className="wood-texture text-white px-8 py-3" data-testid="button-browse-products">
                  Browse Products
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                <span className="font-semibold text-darkBrown" data-testid="wishlist-count">
                  {wishlistItems.length}
                </span> items in your wishlist
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" data-testid="wishlist-items-grid">
              {wishlistItems.map((item: any) => (
                <Card key={item.id} className="overflow-hidden hover-lift group">
                  <div className="relative">
                    <div className="aspect-w-16 aspect-h-12 overflow-hidden">
                      <img 
                        src={item.product?.imageUrl || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"} 
                        alt={item.product?.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromWishlistMutation.mutate(item.productId)}
                      disabled={removeFromWishlistMutation.isPending}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-600 bg-white/80 backdrop-blur-sm"
                      data-testid={`button-remove-wishlist-${item.id}`}
                    >
                      <Heart className="h-4 w-4 fill-current" />
                    </Button>
                  </div>
                  
                  <CardContent className="p-6">
                    <h3 className="text-lg font-display font-semibold text-darkBrown mb-2" data-testid={`wishlist-item-name-${item.id}`}>
                      {item.product?.name}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {item.product?.description}
                    </p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xl font-bold text-primary" data-testid={`wishlist-item-price-${item.id}`}>
                        ₹{item.product?.price}
                      </span>
                      {item.product?.originalPrice && item.product.originalPrice !== item.product.price && (
                        <span className="text-sm text-gray-500 line-through">
                          ₹{item.product.originalPrice}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => addToCartMutation.mutate(item.productId)}
                        disabled={addToCartMutation.isPending}
                        className="flex-1 bg-primary text-white hover:bg-opacity-90 transition-opacity"
                        data-testid={`button-add-to-cart-wishlist-${item.id}`}
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        {addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
                      </Button>
                      <Button
                        onClick={() => handleBuyNow(item.productId)}
                        disabled={addToCartMutation.isPending}
                        className="flex-1 wood-texture text-white hover:opacity-90 transition-opacity"
                        data-testid={`button-buy-now-wishlist-${item.id}`}
                      >
                        Buy Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <Card className="mt-12 bg-beige">
              <CardContent className="p-8 text-center">
                <h3 className="text-xl font-display font-semibold text-darkBrown mb-4">Love everything in your wishlist?</h3>
                <p className="text-gray-600 mb-6">Add all items to your cart for a convenient checkout experience.</p>
                <Button
                  onClick={() => {
                    wishlistItems.forEach((item: any) => {
                      addToCartMutation.mutate(item.productId);
                    });
                  }}
                  disabled={addToCartMutation.isPending}
                  className="wood-texture text-white px-8 py-3"
                  data-testid="button-add-all-to-cart"
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Add All to Cart
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
