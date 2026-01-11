import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { User, Package, Settings, LogOut, MapPin, Phone, Mail, Save, X, Heart, ShoppingCart, MessageCircle, Receipt, Camera, ImageIcon, Trash2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth0 } from "@auth0/auth0-react";
import type { Order } from "@shared/schema";
import ReceiptModal from "@/components/receipt-modal";
import OrderTrackingModal from "@/components/order-tracking-modal";
import OrderCancellationModal from "@/components/order-cancellation-modal";

// Extended order type that includes orderItems relation
type OrderWithItems = Order & {
  orderItems?: Array<{
    quantity: number;
    product?: {
      name: string;
    };
  }>;
};

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [showReceipt, setShowReceipt] = useState<boolean>(false);
  const [showTracking, setShowTracking] = useState<boolean>(false);
  const [showCancellation, setShowCancellation] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [trackingOrder, setTrackingOrder] = useState<any>(null);
  const [cancellationOrder, setCancellationOrder] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    profileImage: ""
  });

  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);

  // Auto-scroll to orders section if hash is present
  useEffect(() => {
    if (window.location.hash === '#orders') {
      setTimeout(() => {
        const ordersSection = document.getElementById('orders-section');
        if (ordersSection) {
          ordersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Show a toast message for successful order completion
          toast({
            title: "Order placed successfully!",
            description: "Your order has been confirmed. You can track it below.",
          });
        }
      }, 500); // Small delay to ensure component is fully rendered
    }
  }, [toast]);

  const { data: orders = [], isLoading: ordersLoading } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/orders"],
  });

  // Check authentication status using React Query (same as navigation)
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  // Use real user data from Auth0
  const currentUser = {
    name: user ? (
      (user as any).name ||
      (`${(user as any).given_name || ''} ${(user as any).family_name || ''}`.trim()) ||
      (user as any).email?.split('@')[0] ||
      'User'
    ) : "User",
    email: (user as any)?.email || "",
    phone: (user as any)?.phone || "",
    address: (user as any)?.address || "",
    joinDate: (user as any)?.createdAt ? new Date((user as any).createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : "Recently",
    profileImage: (user as any)?.profileImageUrl || (user as any)?.picture
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof editForm) => {
      const response = await apiRequest('PUT', '/api/auth/profile', {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address
      });

      return response.json();
    },
    onSuccess: (updatedUser) => {
      toast({
        title: "Profile updated successfully!",
        description: "Your profile information has been saved.",
      });
      setIsEditing(false);
      // Refresh user data queries
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating profile",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleEditClick = () => {
    setEditForm({
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone,
      address: currentUser.address,
      profileImage: currentUser.profileImage || ""
    });
    setProfileImagePreview(currentUser.profileImage || null);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!editForm.name.trim() || !editForm.email.trim()) {
      toast({
        title: "Please fill in required fields",
        description: "Name and email are required.",
        variant: "destructive",
      });
      return;
    }
    updateProfileMutation.mutate(editForm);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setProfileImageFile(null);
    setProfileImagePreview(null);
    setEditForm({
      name: currentUser.name,
      email: currentUser.email,
      phone: currentUser.phone,
      address: currentUser.address,
      profileImage: currentUser.profileImage || ""
    });
  };

  const handleInputChange = (field: keyof typeof editForm, value: string) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleProfileImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive"
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive"
        });
        return;
      }

      setProfileImageFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setProfileImagePreview(result);
        setEditForm(prev => ({
          ...prev,
          profileImage: result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfileImage = () => {
    setProfileImageFile(null);
    setProfileImagePreview(null);
    setEditForm(prev => ({
      ...prev,
      profileImage: ""
    }));
  };


  const { logout } = useAuth0();

  const handleLogout = async () => {
    try {
      // Show immediate feedback
      toast({
        title: "Logging out...",
        description: "Please wait while we log you out.",
      });

      // First clear all React Query cache immediately
      queryClient.clear();

      // Force invalidate specific auth queries
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.removeQueries({ queryKey: ["/api/auth/me"] });

      // Clear the server session using API
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      // Clear localStorage data
      localStorage.removeItem('localCart');
      localStorage.removeItem('localWishlist');

      // Force reload to ensure all components refresh
      setTimeout(() => {
        // Then clear Auth0 session and redirect
        logout({
          logoutParams: {
            returnTo: window.location.origin
          }
        });
      }, 100);

    } catch (error) {
      console.error('Logout error:', error);
      // If server logout fails, still clear everything
      queryClient.clear();
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.removeQueries({ queryKey: ["/api/auth/me"] });
      localStorage.removeItem('localCart');
      localStorage.removeItem('localWishlist');

      logout({
        logoutParams: {
          returnTo: window.location.origin
        }
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "pending":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleViewReceipt = (order: any) => {
    setSelectedOrder(order);
    setShowReceipt(true);
  };

  const handleTrackOrder = (order: any) => {
    setTrackingOrder(order);
    setShowTracking(true);
  };

  const handleCancelOrder = (order: any) => {
    setCancellationOrder(order);
    setShowCancellation(true);
  };

  const handleCancellationComplete = () => {
    // Refresh orders after cancellation
    queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
  };

  const handleViewDetails = (order: any) => {
    // Reuse the receipt modal for detailed order view
    handleViewReceipt(order);
  };

  return (
    <div className="py-20 bg-warmWhite min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold text-darkBrown mb-4">My Profile</h1>
          <p className="text-gray-600">Manage your account and view your orders</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Profile Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center mb-6">
                  <div className="w-24 h-24 wood-texture rounded-full mx-auto mb-4 flex items-center justify-center relative shadow-xl ring-4 ring-white">
                    <div className="w-full h-full rounded-full overflow-hidden">
                      {(isEditing ? profileImagePreview : currentUser.profileImage) ? (
                        <img
                          src={isEditing ? profileImagePreview! : currentUser.profileImage}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                          <User className="h-10 w-10 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Profile Picture Upload Options - Only show when editing */}
                    {isEditing && (
                      <div className="absolute bottom-0 right-0 flex -mr-4 mb-2 space-x-1 z-10">
                        {/* Gallery Upload */}
                        <label className="cursor-pointer group">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProfileImageUpload}
                            className="hidden"
                          />
                          <div className="w-9 h-9 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center text-white shadow-xl transition-all hover:scale-110 border-2 border-white">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        </label>

                        {/* Camera Upload */}
                        <label className="cursor-pointer group">
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleProfileImageUpload}
                            className="hidden"
                          />
                          <div className="w-9 h-9 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center text-white shadow-xl transition-all hover:scale-110 border-2 border-white">
                            <Camera className="w-4 h-4" />
                          </div>
                        </label>

                        {/* Remove Image */}
                        {(profileImagePreview || currentUser.profileImage) && (
                          <button
                            onClick={removeProfileImage}
                            className="w-9 h-9 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white shadow-xl transition-all hover:scale-110 border-2 border-white"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Upload Instructions - Only show when editing and no image */}
                  {isEditing && !profileImagePreview && !currentUser.profileImage && (
                    <p className="text-xs text-gray-500 mb-2">
                      Click gallery or camera icon to add profile picture
                    </p>
                  )}
                  <h3 className="text-xl font-display font-semibold text-darkBrown" data-testid="profile-name">
                    {currentUser.name}
                  </h3>
                  <p className="text-gray-600">Customer since {currentUser.joinDate}</p>
                  {(user as any)?.provider && (
                    <p className="text-sm text-gray-500">Signed in with {(user as any).provider.charAt(0).toUpperCase() + (user as any).provider.slice(1)}</p>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                      <Input
                        value={editForm.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter your name"
                        className="w-full"
                        data-testid="input-edit-name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                      <div className="flex items-center space-x-3">
                        <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <Input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="Enter your email"
                          className="flex-1"
                          data-testid="input-edit-email"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <div className="flex items-center space-x-3">
                        <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <Input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="Enter your phone number"
                          className="flex-1"
                          data-testid="input-edit-phone"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                      <div className="flex items-start space-x-3">
                        <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-3" />
                        <Textarea
                          value={editForm.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          placeholder="Enter your address"
                          rows={3}
                          className="flex-1 resize-none"
                          data-testid="textarea-edit-address"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600" data-testid="profile-email">{currentUser.email || "No email provided"}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600" data-testid="profile-phone">{currentUser.phone || "No phone number provided"}</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                      <span className="text-gray-600" data-testid="profile-address">{currentUser.address || "No address provided"}</span>
                    </div>
                  </div>
                )}

                {isEditing ? (
                  <div className="flex space-x-3 pt-4">
                    <Button
                      onClick={handleSave}
                      disabled={updateProfileMutation.isPending}
                      className="flex-1 bg-primary hover:bg-primary/90 text-white shadow-md transition-all hover:scale-[1.02] active:scale-95 font-semibold"
                      data-testid="button-save-profile"
                    >
                      {updateProfileMutation.isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      disabled={updateProfileMutation.isPending}
                      className="border-red-200 text-red-600 hover:bg-red-50 shadow-sm transition-all px-4 group"
                      title="Cancel Editing"
                      data-testid="button-cancel-edit"
                    >
                      <X className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleEditClick}
                    variant="outline"
                    className="w-full border-primary text-primary hover:bg-primary hover:text-white transition-all shadow-sm font-semibold mt-4"
                    data-testid="button-edit-profile"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Edit Profile Details
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/wishlist">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-darkBrown hover:bg-primary hover:text-white transition-all duration-200"
                    data-testid="button-view-wishlist"
                  >
                    <Heart className="mr-2 h-4 w-4" />
                    View Wishlist
                  </Button>
                </Link>
                <Link href="/cart">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-darkBrown hover:bg-primary hover:text-white transition-all duration-200"
                    data-testid="button-view-cart"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    View Cart
                  </Button>
                </Link>
                <Button
                  onClick={() => {
                    const ordersSection = document.getElementById('orders-section');
                    if (ordersSection) {
                      ordersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  variant="ghost"
                  className="w-full justify-start text-darkBrown hover:bg-primary hover:text-white transition-all duration-200"
                  data-testid="button-view-order-history"
                >
                  <Package className="mr-2 h-4 w-4" />
                  View Order History
                </Button>
                <Link href="/contact">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-darkBrown hover:bg-primary hover:text-white transition-all duration-200"
                    data-testid="button-contact-support"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Contact Support
                  </Button>
                </Link>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:bg-red-600 hover:text-white transition-all duration-200"
                  data-testid="button-logout"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Order History */}
          <div className="lg:col-span-2" id="orders-section">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Order History</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse">
                        <div className="flex justify-between items-start mb-2">
                          <div className="h-4 bg-gray-200 rounded w-32" />
                          <div className="h-6 bg-gray-200 rounded w-20" />
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-48 mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-24" />
                      </div>
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <Package className="w-16 h-16 mx-auto" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No orders yet</h3>
                    <p className="text-gray-500 mb-6">Start shopping to see your orders here!</p>
                    <Link href="/products">
                      <Button className="wood-texture text-white" data-testid="button-start-shopping">
                        Start Shopping
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4" data-testid="orders-list">
                    {orders.map((order) => (
                      <div key={order.id} className="bg-beige rounded-lg p-6 hover-lift transition-all">
                        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-semibold text-darkBrown" data-testid={`order-id-${order.id}`}>
                                Order #{order.id.slice(-8).toUpperCase()}
                              </h4>
                              <Badge className={getStatusColor(order.status || 'pending')} data-testid={`order-status-${order.id}`}>
                                {(order.status || 'pending').charAt(0).toUpperCase() + (order.status || 'pending').slice(1)}
                              </Badge>
                            </div>

                            <p className="text-gray-600 mb-2" data-testid={`order-items-${order.id}`}>
                              {order.orderItems?.length || 0} items - ₹{order.total}
                            </p>

                            <p className="text-sm text-gray-500" data-testid={`order-date-${order.id}`}>
                              Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              }) : 'Unknown date'}
                            </p>

                            {order.orderItems && order.orderItems.length > 0 && (
                              <div className="mt-3">
                                <div className="flex flex-wrap gap-3">
                                  {order.orderItems.slice(0, 3).map((item: any, index: number) => (
                                    <div
                                      key={index}
                                      className="flex items-center space-x-3 bg-white rounded-lg p-3 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200"
                                      onClick={() => {
                                        if (item.productId) {
                                          setLocation(`/product/${item.productId}`);
                                        }
                                      }}
                                      data-testid={`order-product-item-${order.id}-${index}`}
                                    >
                                      {/* Product Image */}
                                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                        {item.product?.imageUrl ? (
                                          <img
                                            src={item.product.imageUrl}
                                            alt={item.product?.name || "Product"}
                                            className="w-full h-full object-cover"
                                            data-testid={`order-product-image-${order.id}-${index}`}
                                          />
                                        ) : (
                                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                                            <span className="text-xs text-primary font-medium">IMG</span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Product Details */}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 truncate hover:text-primary transition-colors" data-testid={`order-product-name-${order.id}-${index}`}>
                                          {item.product?.name || "Product"}
                                        </p>
                                        <p className="text-xs text-gray-500" data-testid={`order-product-quantity-${order.id}-${index}`}>
                                          Quantity: {item.quantity}
                                        </p>
                                      </div>

                                      {/* Click indicator */}
                                      <div className="text-gray-400 hover:text-primary transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                      </div>
                                    </div>
                                  ))}
                                  {order.orderItems.length > 3 && (
                                    <div className="flex items-center bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-100">
                                      <span className="text-sm text-gray-600 font-medium">
                                        +{order.orderItems.length - 3} more items
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
                            <Button
                              onClick={() => handleViewReceipt(order)}
                              variant="outline"
                              size="sm"
                              className="border-primary text-primary hover:bg-primary hover:text-white transition-all duration-200"
                              data-testid={`button-view-receipt-${order.id}`}
                            >
                              <Receipt className="w-4 h-4 mr-1" />
                              Receipt
                            </Button>
                            <Button
                              onClick={() => handleTrackOrder(order)}
                              variant="outline"
                              size="sm"
                              className="border-primary text-primary hover:bg-primary hover:text-white transition-all duration-200"
                              data-testid={`button-track-order-${order.id}`}
                            >
                              Track Order
                            </Button>
                            <Button
                              onClick={() => handleViewDetails(order)}
                              variant="ghost"
                              size="sm"
                              className="text-darkBrown hover:bg-primary hover:text-white transition-all duration-200"
                              data-testid={`button-view-details-${order.id}`}
                            >
                              View Details
                            </Button>
                            {(order.status === 'pending' || order.status === 'processing' || order.status === 'confirmed') && (
                              <Button
                                onClick={() => handleCancelOrder(order)}
                                variant="outline"
                                size="sm"
                                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200"
                                data-testid={`button-cancel-order-${order.id}`}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Cancel Order
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        orderData={selectedOrder}
      />

      {/* Order Tracking Modal */}
      <OrderTrackingModal
        isOpen={showTracking}
        onClose={() => setShowTracking(false)}
        orderData={trackingOrder}
      />

      {/* Order Cancellation Modal */}
      <OrderCancellationModal
        isOpen={showCancellation}
        onClose={() => setShowCancellation(false)}
        orderData={cancellationOrder}
        onCancellationComplete={handleCancellationComplete}
      />
    </div>
  );
}
