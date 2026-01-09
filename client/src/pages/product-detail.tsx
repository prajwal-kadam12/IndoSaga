import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { useState, useEffect, useCallback } from "react";
import { useQuery as useAuthQuery } from "@tanstack/react-query";
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Heart, 
  ShoppingCart, 
  Share2, 
  Star, 
  Check, 
  Truck, 
  Shield, 
  Award,
  Info,
  Package,
  Ruler,
  Palette,
  Zap,
  RotateCw,
  MousePointer,
  Eye,
  Play,
  Pause,
  Camera,
  X,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Clock
} from "lucide-react";
import RazorpayPaymentModal from "@/components/razorpay-payment-modal";
import StripePaymentModal from "@/components/stripe-payment-modal";
import type { Product } from "@shared/schema";

export default function ProductDetail() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  // Customer details and Buy Now flow states
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [showOrderConfirm, setShowOrderConfirm] = useState(false);
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
  
  // Review form states
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewName, setReviewName] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImages, setReviewImages] = useState<File[]>([]);
  const [reviewImagePreviews, setReviewImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [allReviewImages, setAllReviewImages] = useState<string[]>([]);

  // Q&A form states
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [questionName, setQuestionName] = useState("");
  
  // Admin answer states
  const [showAdminView, setShowAdminView] = useState(false);
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  
  // Zoom effect states
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  
  // 360-degree view states
  const [is360View, setIs360View] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);

  const productId = params.id;

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: [`/api/products/${productId}`],
    enabled: !!productId,
  });

  // Fetch product reviews
  const { data: reviews = [], refetch: refetchReviews } = useQuery<any[]>({
    queryKey: [`/api/products/${productId}/reviews`],
    enabled: !!productId,
  });

  // Collect all review images when reviews change
  useEffect(() => {
    const allImages: string[] = [];
    reviews.forEach((review: any) => {
      if (review.images && review.images.length > 0) {
        allImages.push(...review.images);
      }
    });
    setAllReviewImages(allImages);
  }, [reviews]);

  // Navigation functions for image gallery
  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : allReviewImages.length - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev < allReviewImages.length - 1 ? prev + 1 : 0));
  };

  const openImageModal = (imageUrl: string) => {
    const imageIndex = allReviewImages.findIndex(img => img === imageUrl);
    setCurrentImageIndex(imageIndex >= 0 ? imageIndex : 0);
    setSelectedImageModal(imageUrl);
  };

  // Fetch product questions
  const { data: questions = [], refetch: refetchQuestions } = useQuery<any[]>({
    queryKey: [`/api/products/${productId}/questions`],
    enabled: !!productId,
  });

  // Image upload handler
  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;
    
    const selectedFiles = Array.from(files);
    const maxImages = 5;
    
    if (selectedFiles.length > maxImages) {
      toast({
        title: "Too Many Images",
        description: `Please select up to ${maxImages} images only.`,
        variant: "destructive",
      });
      return;
    }
    
    // Check file sizes (max 5MB each)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const validFiles = selectedFiles.filter(file => {
      if (file.size > maxSize) {
        toast({
          title: "File Too Large",
          description: `${file.name} is too large. Please select images under 5MB.`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });
    
    setReviewImages(prev => [...prev, ...validFiles].slice(0, maxImages));
    
    // Create preview URLs
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setReviewImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };
  
  // Remove image from upload
  const removeImage = (index: number) => {
    setReviewImages(prev => prev.filter((_, i) => i !== index));
    setReviewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };
  
  // Upload images to server
  const uploadImages = async (): Promise<string[]> => {
    if (reviewImages.length === 0) return [];
    
    setUploadingImages(true);
    try {
      const formData = new FormData();
      reviewImages.forEach(file => {
        formData.append('images', file);
      });
      
      const response = await fetch(`/api/products/${productId}/reviews/upload-images`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to upload images');
      const result = await response.json();
      return result.imageUrls || [];
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      });
      return [];
    } finally {
      setUploadingImages(false);
    }
  };

  // Create review mutation
  const createReviewMutation = useMutation({
    mutationFn: async (reviewData: { userName: string; rating: number; comment: string; images?: string[] }) => {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData),
      });
      if (!response.ok) throw new Error('Failed to create review');
      return response.json();
    },
    onSuccess: () => {
      refetchReviews();
      setShowReviewForm(false);
      setReviewName("");
      setReviewComment("");
      setReviewRating(5);
      setReviewImages([]);
      setReviewImagePreviews([]);
      toast({
        title: "Review Submitted!",
        description: "Thank you for your feedback. Your review has been added.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create question mutation
  const createQuestionMutation = useMutation({
    mutationFn: async (questionData: { userName: string; question: string }) => {
      const response = await fetch(`/api/products/${productId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionData),
      });
      if (!response.ok) throw new Error('Failed to create question');
      return response.json();
    },
    onSuccess: () => {
      refetchQuestions();
      setShowQuestionForm(false);
      setQuestionName("");
      setQuestionText("");
      toast({
        title: "Question Submitted",
        description: "Your question has been submitted and will be answered soon!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit question. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Answer question mutation (for admins)
  const answerQuestionMutation = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: string; answer: string }) => {
      const response = await fetch(`/api/products/questions/${questionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer }),
      });
      if (!response.ok) throw new Error('Failed to answer question');
      return response.json();
    },
    onSuccess: () => {
      refetchQuestions();
      setAnsweringQuestionId(null);
      setAnswerText("");
      toast({
        title: "Answer Submitted",
        description: "Your answer has been posted and customers can now see it!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit answer. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Check if product is in wishlist
  const { data: wishlistItems = [] } = useQuery<any[]>({
    queryKey: ["/api/wishlist"],
  });

  // Check if current product is in wishlist
  useEffect(() => {
    if (product && wishlistItems && Array.isArray(wishlistItems)) {
      const isInWishlist = wishlistItems.some((item: any) => item.productId === product.id);
      setIsWishlisted(isInWishlist);
    }
  }, [product, wishlistItems]);

  // Generate 360-degree view angles (simulated with rotation transforms)
  const total360Images = 36; // 10-degree increments
  const angleIncrement = 360 / total360Images;

  // Zoom effect handlers
  const handleImageMouseEnter = () => {
    if (!is360View) {
      setIsZooming(true);
    }
  };

  const handleImageMouseLeave = () => {
    setIsZooming(false);
  };

  const handleImageMouseMove = (e: React.MouseEvent) => {
    if (!isZooming || is360View) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setZoomPosition({ x, y });
  };

  // 360-degree view handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!is360View) return;
    setIsDragging(true);
    setDragStartX(e.clientX);
    setIsRotating(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!is360View || !isDragging) return;
    e.preventDefault();
    const deltaX = e.clientX - dragStartX;
    const sensitivity = 2;
    const newAngle = (currentAngle + (deltaX / sensitivity)) % 360;
    setCurrentAngle(newAngle < 0 ? newAngle + 360 : newAngle);
    setDragStartX(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const toggleAutoRotation = () => {
    setIsRotating(!isRotating);
  };

  const toggle360View = () => {
    const newIs360View = !is360View;
    setIs360View(newIs360View);
    setCurrentAngle(0);
    setIsRotating(false);
    
    if (newIs360View) {
      setShowInstructions(true);
      // Auto-hide instructions after 4 seconds
      setTimeout(() => {
        setShowInstructions(false);
      }, 4000);
    } else {
      setShowInstructions(false);
    }
  };

  // Touch event handlers for mobile support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!is360View) return;
    setIsDragging(true);
    setDragStartX(e.touches[0].clientX);
    setIsRotating(false);
    setShowInstructions(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!is360View || !isDragging) return;
    e.preventDefault();
    const deltaX = e.touches[0].clientX - dragStartX;
    const sensitivity = 2;
    const newAngle = (currentAngle + (deltaX / sensitivity)) % 360;
    setCurrentAngle(newAngle < 0 ? newAngle + 360 : newAngle);
    setDragStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Auto-rotation effect
  useEffect(() => {
    if (!is360View || !isRotating || isDragging) return;
    
    const interval = setInterval(() => {
      setCurrentAngle((prev) => (prev + angleIncrement) % 360);
    }, 100); // Smooth rotation

    return () => clearInterval(interval);
  }, [is360View, isRotating, isDragging, angleIncrement]);

  // Wishlist mutations
  const addToWishlistMutation = useMutation({
    mutationFn: async () => {
      try {
        const response = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product?.id }),
        });
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Authentication required");
          }
          throw new Error("Failed to add to wishlist");
        }
        return response.json();
      } catch (error: any) {
        if (error.message?.includes('Authentication required') || error.message?.includes('401')) {
          // User not logged in - use local storage for wishlist
          const localWishlist = JSON.parse(localStorage.getItem('localWishlist') || '[]');
          
          // Check if already in wishlist
          const alreadyExists = localWishlist.some((item: any) => item.productId === product?.id);
          if (!alreadyExists) {
            localWishlist.push({
              productId: product?.id,
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
      setIsWishlisted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      // Also dispatch the custom event to update localStorage-based components
      window.dispatchEvent(new CustomEvent('localWishlistUpdate'));
      toast({
        title: "Added to Wishlist!",
        description: `${product?.name} has been added to your wishlist.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add item to wishlist. Please try again.",
        variant: "destructive",
      });
    },
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: async () => {
      try {
        const response = await fetch(`/api/wishlist/${product?.id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Authentication required");
          }
          throw new Error("Failed to remove from wishlist");
        }
        return response.json();
      } catch (error: any) {
        if (error.message?.includes('Authentication required') || error.message?.includes('401')) {
          // User not logged in - use local storage for wishlist
          const localWishlist = JSON.parse(localStorage.getItem('localWishlist') || '[]');
          const updatedWishlist = localWishlist.filter((item: any) => item.productId !== product?.id);
          localStorage.setItem('localWishlist', JSON.stringify(updatedWishlist));
          
          // Dispatch custom event to update other components
          window.dispatchEvent(new CustomEvent('localWishlistUpdate'));
          return;
        }
        throw error;
      }
    },
    onSuccess: () => {
      setIsWishlisted(false);
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      // Also dispatch the custom event to update localStorage-based components
      window.dispatchEvent(new CustomEvent('localWishlistUpdate'));
      toast({
        title: "Removed from Wishlist",
        description: `${product?.name} has been removed from your wishlist.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove item from wishlist. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleToggleWishlist = () => {
    if (!product) return;
    
    if (isWishlisted) {
      removeFromWishlistMutation.mutate();
    } else {
      addToWishlistMutation.mutate();
    }
  };

  // Use Auth0 for authentication status
  const { isAuthenticated, user } = useAuth0();
  
  // Additional states for Buy Now flow
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [showStripePayment, setShowStripePayment] = useState(false);
  
  // Check authentication status from API as fallback
  const { data: apiUser } = useAuthQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });
  
  // Use Auth0 user if available, otherwise fallback to API user
  const currentUser = user || apiUser;

  // Check URL parameters and authentication status ONCE - with ref to prevent infinite loop
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const checkoutParam = urlParams.get('checkout');
    
    // Only proceed if we haven't already handled this checkout and form is not already shown
    if (checkoutParam === 'true' && isAuthenticated && currentUser && product && !showCustomerForm) {
      console.log('Direct checkout from Auth0 - showing form immediately');
      
      // Clear the checkout product ID since we're here now
      sessionStorage.removeItem('checkoutProductId');
      
      // Pre-fill user information
      const updatedDetails = {
        name: (currentUser as any).name || `${(currentUser as any).given_name || ''} ${(currentUser as any).family_name || ''}`.trim(),
        email: (currentUser as any).email || '',
        contact: '',
        address: '',
        city: '',
        district: '',
        state: '',
        pincode: ''
      };
      console.log('Pre-filling customer details:', updatedDetails);
      setCustomerDetails(updatedDetails);
      
      // Show the checkout form immediately
      setShowCustomerForm(true);
      
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [isAuthenticated, product?.id, user?.sub]); // Removed showCustomerForm from dependencies to prevent infinite loop
  
  const handleAddToCart = useCallback(async () => {
    if (!product) return;
    
    // Check if user is authenticated
    if (!isAuthenticated || !currentUser) {
      // Store pending action for after login
      sessionStorage.setItem('pendingAction', 'add-to-cart');
      sessionStorage.setItem('pendingProductId', product.id);
      sessionStorage.setItem('pendingQuantity', selectedQuantity.toString());
      sessionStorage.setItem('returnUrl', window.location.pathname);
      
      // Redirect to login
      window.location.href = '/login';
      return;
    }
    
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity: selectedQuantity,
        }),
      });

      if (response.ok) {
        toast({
          title: "Added to Cart!",
          description: `${product.name} has been added to your cart.`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      } else {
        throw new Error('Failed to add to cart');
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    }
  }, [product, isAuthenticated, currentUser, selectedQuantity, toast, queryClient]);

  // Separate effect for add to cart trigger
  useEffect(() => {
    const triggerAddToCart = sessionStorage.getItem('triggerAddToCart');
    
    if (triggerAddToCart === 'true' && isAuthenticated) {
      sessionStorage.removeItem('triggerAddToCart');
      setTimeout(() => {
        handleAddToCart();
      }, 500);
    }
  }, [isAuthenticated, handleAddToCart]); // Include handleAddToCart dependency

  // Handle Buy Now flow
  const handleBuyNow = () => {
    // Pre-fill user information if available
    if (currentUser && (!customerDetails.name || !customerDetails.email)) {
      setCustomerDetails({
        ...customerDetails,
        name: (currentUser as any).name || `${(currentUser as any).given_name || ''} ${(currentUser as any).family_name || ''}`.trim(),
        email: (currentUser as any).email || '',
      });
    }
    
    // Show customer details form for authenticated users
    setShowCustomerForm(true);
  };

  // Handle direct to payment after authentication
  const handleDirectToPayment = () => {
    console.log('handleDirectToPayment called', { currentUser, isAuthenticated });
    
    // Pre-fill user information from authenticated user
    if (currentUser) {
      const updatedDetails = {
        name: (currentUser as any).name || `${(currentUser as any).given_name || ''} ${(currentUser as any).family_name || ''}`.trim(),
        email: (currentUser as any).email || '',
        contact: '',
        address: '',
        city: '',
        district: '',
        state: '',
        pincode: ''
      };
      console.log('Setting customer details and showing customer form for address collection', updatedDetails);
      setCustomerDetails(updatedDetails);
      
      // Show customer details form to collect missing address and phone information
      setShowCustomerForm(true);
    } else {
      // Fallback: show customer form if no user data
      setShowCustomerForm(true);
    }
    
    console.log('Customer form should now be visible for address confirmation');
  };

  // Handle customer form submission
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

  // Handle payment method selection
  const handlePaymentMethod = (method: string) => {
    setSelectedPaymentMethod(method);
    
    // Handle Stripe payment
    if (method === 'stripe') {
      setShowPaymentOptions(false);
      setShowStripePayment(true);
    }
    // Handle COD
    else if (method === 'cod') {
      setShowPaymentOptions(false);
      handleDirectCODOrder();
    }
    // For other methods (Razorpay), the RazorpayPaymentModal will handle them
  };

  // Handle direct COD order
  const handleDirectCODOrder = async () => {
    if (!product) return;
    
    try {
      const orderData = {
        orderId: `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        customerName: customerDetails.name,
        customerEmail: customerDetails.email,
        customerPhone: customerDetails.contact,
        shippingAddress: `${customerDetails.address}, ${customerDetails.city}, ${customerDetails.district}, ${customerDetails.state}`,
        pincode: customerDetails.pincode,
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        total: parseFloat(displayPrice) * selectedQuantity + 99, // Add COD fee
        orderItems: [{
          productId: product.id,
          quantity: selectedQuantity,
          price: parseFloat(product.price),
          productName: product.name
        }]
      };

      const response = await fetch('/api/orders/cod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Order Placed Successfully!",
          description: `COD Order ${result.orderId} has been placed. You will pay ₹${orderData.total} on delivery.`,
        });
        
        setShowOrderConfirm(true);
        setOrderDetails(result.orderData);
      } else {
        throw new Error(result.message || 'Failed to place COD order');
      }
    } catch (error: any) {
      console.error('COD order failed:', error);
      toast({
        title: "Order Failed",
        description: error.message || "Failed to place COD order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (!product) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out this amazing ${product.name} from IndoSaga Furniture`,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied!",
        description: "Product link has been copied to clipboard.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-warmWhite py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-8 h-8 bg-gray-300 rounded"></div>
              <div className="h-6 bg-gray-300 rounded w-32"></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="w-full h-96 bg-gray-300 rounded-2xl"></div>
              <div className="space-y-6">
                <div className="h-8 bg-gray-300 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                <div className="h-6 bg-gray-300 rounded w-1/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-warmWhite py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
            <p className="text-gray-600 mb-8">The product you're looking for doesn't exist or has been removed.</p>
            <Link href="/products">
              <Button className="wood-texture text-white">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Products
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const displayPrice = product.isDeal && product.dealPrice
    ? Number(product.dealPrice).toFixed(2)
    : Number(product.price).toFixed(2);

  const hasDiscount = product.originalPrice && Number(product.originalPrice) > Number(displayPrice);
  const discountPercentage = hasDiscount 
    ? Math.round(((Number(product.originalPrice) - Number(displayPrice)) / Number(product.originalPrice)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-warmWhite py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center space-x-2 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/products")}
            className="text-primary hover:text-primary/80"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Enhanced Product Image with 360° View */}
          <div className="space-y-4">
            <Card className="overflow-hidden border-0 shadow-2xl rounded-3xl">
              <div className="aspect-square relative bg-gradient-to-br from-amber-50 to-orange-50">
                {/* 360-degree viewer or normal image */}
                <div
                  className={`w-full h-full relative overflow-hidden ${is360View ? 'cursor-grab' : 'cursor-crosshair'} ${isDragging ? 'cursor-grabbing' : ''}`}
                  onMouseDown={handleMouseDown}
                  onMouseMove={is360View ? handleMouseMove : handleImageMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onMouseEnter={handleImageMouseEnter}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <img
                    src={product.imageUrl || '/placeholder-furniture.jpg'}
                    alt={product.name}
                    className={`w-full h-full object-cover transition-transform duration-300 ${
                      is360View 
                        ? 'transform-gpu' 
                        : isZooming ? 'scale-150' : 'hover:scale-105 transition-transform duration-700'
                    }`}
                    style={is360View ? {
                      transform: `rotateY(${currentAngle}deg)`,
                      transformStyle: 'preserve-3d',
                      filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.1))'
                    } : isZooming ? {
                      transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                      transition: 'none'
                    } : {}}
                    draggable={false}
                    onMouseLeave={handleImageMouseLeave}
                  />
                  
                  {/* Large Zoom Overlay */}
                  {isZooming && !is360View && (
                    <div 
                      className="absolute top-4 right-4 w-80 h-80 border-4 border-white shadow-2xl rounded-xl overflow-hidden bg-white z-30 pointer-events-none"
                      style={{
                        backgroundImage: `url(${product.imageUrl || '/placeholder-furniture.jpg'})`,
                        backgroundSize: '300% 300%',
                        backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                        backgroundRepeat: 'no-repeat'
                      }}
                    >
                      <div className="absolute inset-0 border-2 border-amber-400 rounded-xl"></div>
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                        Magnified View
                      </div>
                    </div>
                  )}
                  
                  {/* Zoom Instructions */}
                  {isZooming && !is360View && (
                    <div className="absolute bottom-4 left-4 bg-black/70 text-white text-xs px-3 py-2 rounded-lg backdrop-blur-sm z-30 pointer-events-none">
                      <div className="flex items-center space-x-2">
                        <Eye className="w-3 h-3" />
                        <span>Zoom View Active</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Badges */}
                {product.isDeal && (
                  <Badge className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 text-sm font-semibold animate-pulse z-20">
                    {discountPercentage}% OFF
                  </Badge>
                )}
                {product.featured && (
                  <Badge className="absolute top-4 right-4 bg-amber-600 text-white px-3 py-1 text-sm font-semibold z-20">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                )}

                {/* 360-degree View Controls */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-20">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={toggle360View}
                      className="bg-black/70 text-white hover:bg-black/80 border-0 backdrop-blur-sm"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {is360View ? 'Normal View' : '360° View'}
                    </Button>
                  </div>

                  {/* 360-degree controls (show only when in 360 view) */}
                  {is360View && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={toggleAutoRotation}
                        className="bg-black/70 text-white hover:bg-black/80 border-0 backdrop-blur-sm"
                      >
                        {isRotating ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      <div className="text-xs text-white bg-black/70 px-2 py-1 rounded backdrop-blur-sm">
                        {Math.round(currentAngle)}°
                      </div>
                    </div>
                  )}
                </div>

                {/* 360-degree Instructions (show when first entering 360 view) */}
                {is360View && showInstructions && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10 transition-opacity duration-500">
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 m-8 text-center">
                      <MousePointer className="w-8 h-8 text-amber-600 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-gray-800 mb-2">360° Interactive View</p>
                      <p className="text-xs text-gray-600">
                        Drag to rotate • Click play for auto-rotation
                      </p>
                    </div>
                  </div>
                )}

                {/* Rotation indicator */}
                {is360View && (
                  <div className="absolute top-1/2 left-4 transform -translate-y-1/2 z-20">
                    <div className="bg-black/70 text-white p-2 rounded-full backdrop-blur-sm">
                      <RotateCw className={`w-5 h-5 ${isRotating ? 'animate-spin' : ''}`} />
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Product Gallery - Additional Images */}
            {product.images && product.images.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {product.images.slice(0, 3).map((image, index) => (
                  <Card key={index} className="overflow-hidden border-0 shadow-lg rounded-2xl">
                    <div className="aspect-square relative bg-gradient-to-br from-amber-50 to-orange-50">
                      <img
                        src={image}
                        alt={`${product.name} view ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-8">
            {/* Header */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <h1 className="text-4xl font-display font-bold text-darkBrown leading-tight">
                  {product.name}
                </h1>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleWishlist}
                    className={`p-2 ${isWishlisted ? "text-red-500" : "text-gray-400"} hover:text-red-500`}
                  >
                    <Heart className={`h-6 w-6 ${isWishlisted ? "fill-current" : ""}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                    className="p-2 text-gray-400 hover:text-primary"
                  >
                    <Share2 className="h-6 w-6" />
                  </Button>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="h-5 w-5 fill-current text-amber-500"
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">(4.9 out of 5 stars)</span>
                <span className="text-sm text-primary font-medium">234 reviews</span>
              </div>

              {/* Price */}
              <div className="flex items-end space-x-4">
                <span className="text-4xl font-bold text-primary">
                  ₹{displayPrice}
                </span>
                {hasDiscount && (
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl text-gray-500 line-through">
                      ₹{Number(product.originalPrice).toFixed(2)}
                    </span>
                    <Badge variant="destructive" className="text-sm font-semibold">
                      Save ₹{(Number(product.originalPrice) - Number(displayPrice)).toFixed(2)}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Stock Status */}
              <div className="flex items-center space-x-2">
                {product.inStock ? (
                  <>
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-green-600 font-medium">In Stock</span>
                    {product.stock && product.stock < 10 && (
                      <span className="text-orange-600 text-sm">
                        ({product.stock} left)
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <Info className="h-5 w-5 text-red-600" />
                    <span className="text-red-600 font-medium">Out of Stock</span>
                  </>
                )}
              </div>
            </div>

            <Separator />

            {/* Quick Features */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200">
                <Shield className="h-6 w-6 text-amber-600" />
                <div>
                  <div className="font-semibold text-darkBrown">Lifetime Warranty</div>
                  <div className="text-sm text-gray-600">Premium quality assured</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200">
                <Truck className="h-6 w-6 text-orange-600" />
                <div>
                  <div className="font-semibold text-darkBrown">Free Delivery</div>
                  <div className="text-sm text-gray-600">7-15 days nationwide</div>
                </div>
              </div>
            </div>


            {/* Quantity Selector & Actions */}
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <span className="font-semibold text-darkBrown">Quantity:</span>
                <div className="flex items-center border border-amber-200 rounded-lg overflow-hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                    className="px-3 py-2 hover:bg-amber-50"
                  >
                    -
                  </Button>
                  <span className="px-4 py-2 border-x border-amber-200 font-semibold min-w-[3rem] text-center">
                    {selectedQuantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedQuantity(selectedQuantity + 1)}
                    className="px-3 py-2 hover:bg-amber-50"
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  className="flex-1 h-14 bg-primary text-white hover:bg-primary/90 transition-colors font-semibold text-lg shadow-lg rounded-xl"
                >
                  <ShoppingCart className="mr-3 h-5 w-5" />
                  Add to Cart
                </Button>
                <Button
                  onClick={() => {
                    if (!isAuthenticated || !currentUser) {
                      // Store pending action for after login
                      sessionStorage.setItem('pendingAction', 'buy-now');
                      sessionStorage.setItem('pendingProductId', product.id);
                      sessionStorage.setItem('pendingQuantity', selectedQuantity.toString());
                      sessionStorage.setItem('returnUrl', window.location.pathname);
                      
                      // Redirect to login
                      window.location.href = '/login';
                    } else {
                      handleBuyNow();
                    }
                  }}
                  disabled={!product.inStock}
                  className="flex-1 h-14 wood-texture text-white hover:opacity-90 transition-opacity font-semibold text-lg shadow-lg rounded-xl"
                >
                  <Zap className="mr-3 h-5 w-5" />
                  Buy Now
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Information Tabs */}
        <div className="mt-16">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-6 bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl p-3 h-16">
              <TabsTrigger value="description" className="rounded-xl h-12 flex items-center justify-center text-center font-medium">Description</TabsTrigger>
              <TabsTrigger value="specifications" className="rounded-xl h-12 flex items-center justify-center text-center font-medium">Specifications</TabsTrigger>
              <TabsTrigger value="warranty" className="rounded-xl h-12 flex items-center justify-center text-center font-medium">Warranty</TabsTrigger>
              <TabsTrigger value="care" className="rounded-xl h-12 flex items-center justify-center text-center font-medium">Care Guide</TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-xl h-12 flex items-center justify-center text-center font-medium">Reviews</TabsTrigger>
              <TabsTrigger value="qna" className="rounded-xl h-12 flex items-center justify-center text-center font-medium">Q&A</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-8">
              <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-white to-amber-50">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-display font-semibold text-darkBrown mb-6 flex items-center">
                    <Info className="mr-3 h-6 w-6 text-amber-600" />
                    Product Description
                  </h3>
                  <div className="prose prose-lg max-w-none">
                    <p className="text-gray-700 leading-relaxed">
                      {product.description || "This premium teak wood furniture piece represents the finest in traditional Indian craftsmanship. Handcrafted by skilled artisans using sustainable teak wood, it combines timeless beauty with exceptional durability. Each piece showcases natural wood grain patterns and is finished with eco-friendly treatments for lasting protection."}
                    </p>
                    <h4 className="text-xl font-semibold text-darkBrown mt-8 mb-4">Key Features:</h4>
                    <ul className="space-y-3 text-gray-700">
                      <li className="flex items-start"><Award className="h-5 w-5 text-amber-600 mr-3 mt-0.5" />Premium grade teak wood construction</li>
                      <li className="flex items-start"><Check className="h-5 w-5 text-green-600 mr-3 mt-0.5" />Handcrafted by master artisans</li>
                      <li className="flex items-start"><Shield className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />Lifetime warranty coverage</li>
                      <li className="flex items-start"><Package className="h-5 w-5 text-purple-600 mr-3 mt-0.5" />Expert installation included</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="specifications" className="mt-8">
              <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-white to-orange-50">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-display font-semibold text-darkBrown mb-6 flex items-center">
                    <Ruler className="mr-3 h-6 w-6 text-orange-600" />
                    Technical Specifications
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex justify-between py-3 border-b border-amber-200">
                        <span className="font-semibold text-darkBrown">Material:</span>
                        <span className="text-gray-700">Premium Teak Wood</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-amber-200">
                        <span className="font-semibold text-darkBrown">Finish:</span>
                        <span className="text-gray-700">Natural Oil Finish</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-amber-200">
                        <span className="font-semibold text-darkBrown">Assembly:</span>
                        <span className="text-gray-700">Professional Required</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-amber-200">
                        <span className="font-semibold text-darkBrown">Warranty:</span>
                        <span className="text-gray-700">Lifetime Coverage</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between py-3 border-b border-orange-200">
                        <span className="font-semibold text-darkBrown">Origin:</span>
                        <span className="text-gray-700">Handcrafted in India</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-orange-200">
                        <span className="font-semibold text-darkBrown">Care:</span>
                        <span className="text-gray-700">Regular dusting, polish annually</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-orange-200">
                        <span className="font-semibold text-darkBrown">Delivery:</span>
                        <span className="text-gray-700">7-15 business days</span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-orange-200">
                        <span className="font-semibold text-darkBrown">Weight:</span>
                        <span className="text-gray-700">Varies by piece</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="warranty" className="mt-8">
              <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-white to-amber-50">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-display font-semibold text-darkBrown mb-6 flex items-center">
                    <Shield className="mr-3 h-6 w-6 text-amber-600" />
                    Warranty & Guarantee
                  </h3>
                  
                  {/* Warranty Overview */}
                  <div className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                    <h4 className="text-xl font-bold text-darkBrown mb-4 flex items-center">
                      <Award className="mr-2 h-5 w-5 text-amber-600" />
                      Lifetime Protection Plan
                    </h4>
                    <p className="text-gray-700 leading-relaxed">
                      Every IndoSaga furniture piece comes with our comprehensive lifetime warranty, covering manufacturing defects, 
                      structural integrity, and material quality. We stand behind our craftsmanship with a 100% satisfaction guarantee.
                    </p>
                  </div>

                  {/* Warranty Features */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-darkBrown text-lg mb-3">What's Covered:</h4>
                      <ul className="space-y-3 text-gray-700">
                        <li className="flex items-start"><Check className="h-5 w-5 text-amber-500 mr-3 mt-0.5" />Manufacturing defects</li>
                        <li className="flex items-start"><Check className="h-5 w-5 text-amber-500 mr-3 mt-0.5" />Structural integrity issues</li>
                        <li className="flex items-start"><Check className="h-5 w-5 text-amber-500 mr-3 mt-0.5" />Material quality problems</li>
                        <li className="flex items-start"><Check className="h-5 w-5 text-amber-500 mr-3 mt-0.5" />Hardware and joint failures</li>
                        <li className="flex items-start"><Check className="h-5 w-5 text-amber-500 mr-3 mt-0.5" />Finish deterioration (normal wear excluded)</li>
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-semibold text-darkBrown text-lg mb-3">Our Promise:</h4>
                      <ul className="space-y-3 text-gray-700">
                        <li className="flex items-start"><Star className="h-5 w-5 text-orange-500 mr-3 mt-0.5" />Free repair or replacement</li>
                        <li className="flex items-start"><Star className="h-5 w-5 text-orange-500 mr-3 mt-0.5" />30-day money-back guarantee</li>
                        <li className="flex items-start"><Star className="h-5 w-5 text-orange-500 mr-3 mt-0.5" />Expert installation included</li>
                        <li className="flex items-start"><Star className="h-5 w-5 text-orange-500 mr-3 mt-0.5" />24/7 customer support</li>
                        <li className="flex items-start"><Star className="h-5 w-5 text-orange-500 mr-3 mt-0.5" />Annual maintenance visits</li>
                      </ul>
                    </div>
                  </div>

                  {/* Claim Process */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200 mb-8">
                    <h4 className="font-semibold text-darkBrown mb-4 flex items-center">
                      <Info className="mr-2 h-5 w-5 text-amber-600" />
                      How to Claim Warranty
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="bg-white p-3 rounded-lg border border-amber-200 mb-2">
                          <Phone className="h-6 w-6 text-amber-600 mx-auto" />
                        </div>
                        <div className="font-medium text-darkBrown">1. Contact Us</div>
                        <div className="text-sm text-gray-600">Call or email our support team</div>
                      </div>
                      <div className="text-center">
                        <div className="bg-white p-3 rounded-lg border border-amber-200 mb-2">
                          <Eye className="h-6 w-6 text-orange-600 mx-auto" />
                        </div>
                        <div className="font-medium text-darkBrown">2. Inspection</div>
                        <div className="text-sm text-gray-600">Expert assessment of the issue</div>
                      </div>
                      <div className="text-center">
                        <div className="bg-white p-3 rounded-lg border border-amber-200 mb-2">
                          <Package className="h-6 w-6 text-amber-600 mx-auto" />
                        </div>
                        <div className="font-medium text-darkBrown">3. Solution</div>
                        <div className="text-sm text-gray-600">Repair or replacement arranged</div>
                      </div>
                      <div className="text-center">
                        <div className="bg-white p-3 rounded-lg border border-amber-200 mb-2">
                          <Check className="h-6 w-6 text-orange-600 mx-auto" />
                        </div>
                        <div className="font-medium text-darkBrown">4. Completion</div>
                        <div className="text-sm text-gray-600">Issue resolved at no cost</div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 rounded-xl border border-primary/20">
                    <h4 className="font-semibold text-darkBrown mb-4">Warranty Support Contact</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                          <Phone className="h-5 w-5 text-primary mx-auto mb-2" />
                          <div className="font-medium text-primary">1800-INDOSAGA</div>
                          <div className="text-sm text-gray-600">Toll-free hotline</div>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                          <Mail className="h-5 w-5 text-accent mx-auto mb-2" />
                          <div className="font-medium text-accent">warranty@indosaga.com</div>
                          <div className="text-sm text-gray-600">Email support</div>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="bg-white p-3 rounded-lg shadow-sm">
                          <Clock className="h-5 w-5 text-amber-600 mx-auto mb-2" />
                          <div className="font-medium text-amber-600">24/7 Available</div>
                          <div className="text-sm text-gray-600">Round-the-clock service</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="care" className="mt-8">
              <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-white to-amber-50">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-display font-semibold text-darkBrown mb-6 flex items-center">
                    <Palette className="mr-3 h-6 w-6 text-amber-600" />
                    Care & Maintenance Guide
                  </h3>
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200">
                      <h4 className="font-semibold text-darkBrown mb-3">Daily Care:</h4>
                      <ul className="space-y-2 text-gray-700">
                        <li>• Dust regularly with a soft, dry cloth</li>
                        <li>• Wipe spills immediately with a damp cloth</li>
                        <li>• Avoid placing hot items directly on the surface</li>
                        <li>• Keep away from direct sunlight and moisture</li>
                      </ul>
                    </div>
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-xl border border-orange-200">
                      <h4 className="font-semibold text-darkBrown mb-3">Seasonal Maintenance:</h4>
                      <ul className="space-y-2 text-gray-700">
                        <li>• Apply teak oil every 6-12 months</li>
                        <li>• Use furniture polish for enhanced shine</li>
                        <li>• Check and tighten joints annually</li>
                        <li>• Professional cleaning recommended yearly</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="mt-8">
              <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-white to-orange-50">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-display font-semibold text-darkBrown mb-6 flex items-center">
                    <Star className="mr-3 h-6 w-6 text-amber-500" />
                    Customer Reviews
                  </h3>
                  
                  {/* Review Summary */}
                  <div className="flex items-center justify-between mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl font-bold text-darkBrown">4.9</div>
                      <div>
                        <div className="flex items-center mb-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} className="h-5 w-5 fill-current text-amber-500" />
                          ))}
                        </div>
                        <div className="text-sm text-gray-600">Based on 234 reviews</div>
                      </div>
                    </div>
                    <Button 
                      className="wood-texture text-white"
                      onClick={() => setShowReviewForm(!showReviewForm)}
                      data-testid="button-write-review"
                    >
                      {showReviewForm ? "Cancel Review" : "Write a Review"}
                    </Button>
                  </div>

                  {/* Review Form */}
                  {showReviewForm && (
                    <Card className="mb-8 border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold text-darkBrown mb-4">Write Your Review</h3>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="reviewName" className="text-darkBrown font-medium">Your Name</Label>
                            <Input
                              id="reviewName"
                              value={reviewName}
                              onChange={(e) => setReviewName(e.target.value)}
                              placeholder="Enter your name"
                              className="mt-1 border-amber-200 focus:border-amber-400"
                              data-testid="input-review-name"
                            />
                          </div>
                          
                          <div>
                            <Label className="text-darkBrown font-medium">Rating</Label>
                            <div className="flex items-center space-x-1 mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => setReviewRating(star)}
                                  className="focus:outline-none hover:scale-110 transition-transform"
                                  data-testid={`star-rating-${star}`}
                                >
                                  <Star 
                                    className={`h-6 w-6 ${
                                      star <= reviewRating 
                                        ? 'fill-current text-amber-500' 
                                        : 'text-gray-300 hover:text-amber-300'
                                    }`} 
                                  />
                                </button>
                              ))}
                              <span className="ml-2 text-sm text-gray-600">({reviewRating} star{reviewRating !== 1 ? 's' : ''})</span>
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="reviewComment" className="text-darkBrown font-medium">Your Review</Label>
                            <Textarea
                              id="reviewComment"
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              placeholder="Share your experience with this product..."
                              rows={4}
                              className="mt-1 border-amber-200 focus:border-amber-400 resize-none"
                              data-testid="textarea-review-comment"
                            />
                          </div>
                          
                          {/* Image Upload Section */}
                          <div>
                            <Label className="text-darkBrown font-medium flex items-center space-x-2">
                              <Camera className="h-4 w-4" />
                              <span>Add Photos (Optional)</span>
                            </Label>
                            <p className="text-sm text-gray-600 mb-2">Share photos of your purchased product (max 5 images, 5MB each)</p>
                            
                            <div className="mt-2">
                              <input
                                type="file"
                                id="reviewImages"
                                multiple
                                accept="image/*"
                                onChange={(e) => handleImageUpload(e.target.files)}
                                className="hidden"
                              />
                              <Label
                                htmlFor="reviewImages"
                                className="inline-flex items-center justify-center px-4 py-2 border-2 border-dashed border-amber-300 rounded-lg cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-colors"
                              >
                                <Camera className="h-5 w-5 mr-2 text-amber-600" />
                                Choose Images
                              </Label>
                            </div>
                            
                            {/* Image Previews */}
                            {reviewImagePreviews.length > 0 && (
                              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {reviewImagePreviews.map((preview, index) => (
                                  <div key={index} className="relative group">
                                    <img
                                      src={preview}
                                      alt={`Preview ${index + 1}`}
                                      className="w-full h-20 object-cover rounded-lg border border-amber-200"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeImage(index)}
                                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex space-x-3 pt-2">
                            <Button
                              onClick={async () => {
                                if (!reviewName.trim() || !reviewComment.trim()) {
                                  toast({
                                    title: "Missing Information",
                                    description: "Please fill in your name and review comment.",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                
                                // Upload images first if any
                                const uploadedImageUrls = await uploadImages();
                                
                                createReviewMutation.mutate({
                                  userName: reviewName.trim(),
                                  rating: reviewRating,
                                  comment: reviewComment.trim(),
                                  images: uploadedImageUrls
                                });
                              }}
                              className="bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary text-white"
                              data-testid="button-submit-review"
                              disabled={createReviewMutation.isPending || uploadingImages}
                            >
                              {uploadingImages ? "Uploading Images..." : 
                               createReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                            </Button>
                            <Button
                              onClick={() => {
                                setShowReviewForm(false);
                                setReviewName("");
                                setReviewComment("");
                                setReviewRating(5);
                                setReviewImages([]);
                                setReviewImagePreviews([]);
                              }}
                              variant="outline"
                              className="border-amber-300 text-amber-700 hover:bg-amber-50"
                              data-testid="button-cancel-review"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* All Reviews (Database + Sample) */}
                  <div className="space-y-6">
                    {[...reviews, 
                      {
                        userName: "Rajesh Kumar",
                        rating: 5,
                        createdAt: "2023-11-15T10:30:00Z",
                        comment: "Absolutely beautiful craftsmanship! The teak wood quality is exceptional and the finish is perfect. Delivery was on time and installation was professional."
                      },
                      {
                        userName: "Priya Sharma",
                        rating: 5,
                        createdAt: "2023-10-20T14:45:00Z", 
                        comment: "Love this piece! It's exactly as described and the natural wood grain is gorgeous. Great value for money and excellent customer service."
                      }
                    ].map((review, index) => (
                      <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                              {review.userName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-darkBrown">{review.userName}</div>
                              <div className="flex items-center space-x-2">
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star 
                                      key={star} 
                                      className={`h-4 w-4 ${star <= review.rating ? 'fill-current text-amber-500' : 'text-gray-300'}`} 
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-gray-500">
                                  {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : review.date}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-3">{review.comment}</p>
                        
                        {/* Display review images */}
                        {review.images && review.images.length > 0 && (
                          <div className="mt-3">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                              {review.images.map((imageUrl: string, imgIndex: number) => (
                                <div key={imgIndex} className="relative group cursor-pointer" onClick={() => openImageModal(imageUrl)}>
                                  <img
                                    src={imageUrl}
                                    alt={`Review image ${imgIndex + 1}`}
                                    className="w-full h-20 sm:h-24 object-cover rounded-lg border border-gray-200 hover:border-amber-300 transition-colors"
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                                    <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Click images to view full size</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="qna" className="mt-8">
              <Card className="border-0 shadow-lg rounded-2xl bg-gradient-to-br from-white to-purple-50">
                <CardContent className="p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-display font-semibold text-darkBrown flex items-center">
                      <Eye className="mr-3 h-6 w-6 text-purple-600" />
                      Product Q&A
                    </h3>
                    <div className="flex space-x-3">
                      {/* Admin View Toggle */}
                      <Button
                        onClick={() => setShowAdminView(!showAdminView)}
                        variant={showAdminView ? "default" : "outline"}
                        className={showAdminView ? "bg-green-600 hover:bg-green-700 text-white px-4 py-2" : "border-green-600 text-green-600 hover:bg-green-50 px-4 py-2"}
                      >
                        {showAdminView ? "Exit Admin" : "Admin Mode"}
                      </Button>
                      
                      {/* Ask Question Button */}
                      {!showAdminView && (
                        <Button
                          onClick={() => setShowQuestionForm(!showQuestionForm)}
                          className="wood-texture text-white px-6 py-3 font-semibold"
                        >
                          {showQuestionForm ? "Cancel" : "Ask a Question"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Question Form */}
                  {showQuestionForm && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
                      <h4 className="font-semibold text-darkBrown mb-4">Ask Your Question</h4>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="question-name">Your Name</Label>
                          <Input
                            id="question-name"
                            value={questionName}
                            onChange={(e) => setQuestionName(e.target.value)}
                            placeholder="Enter your name"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="question-text">Your Question</Label>
                          <Textarea
                            id="question-text"
                            value={questionText}
                            onChange={(e) => setQuestionText(e.target.value)}
                            placeholder="What would you like to know about this product?"
                            rows={4}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex space-x-3">
                          <Button
                            onClick={() => {
                              if (questionName.trim() && questionText.trim()) {
                                createQuestionMutation.mutate({
                                  userName: questionName.trim(),
                                  question: questionText.trim()
                                });
                              } else {
                                toast({
                                  title: "Missing Information",
                                  description: "Please fill in both your name and question.",
                                  variant: "destructive",
                                });
                              }
                            }}
                            disabled={createQuestionMutation.isPending}
                            className="wood-texture text-white"
                          >
                            {createQuestionMutation.isPending ? "Submitting..." : "Submit Question"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowQuestionForm(false);
                              setQuestionName("");
                              setQuestionText("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Questions List */}
                  <div className="space-y-6">
                    {questions.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-gray-500 mb-2">No questions yet</div>
                        <div className="text-sm text-gray-400">Be the first to ask about this product!</div>
                      </div>
                    ) : (
                      questions.map((question: any, index: number) => (
                        <div key={question.id || index} className="border-b border-purple-100 pb-6 last:border-b-0">
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium text-darkBrown">Q: {question.question}</div>
                              <div className="text-sm text-gray-500">
                                by {question.userName} • {new Date(question.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          
                          {question.answer ? (
                            <div className="ml-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                              <div className="font-medium text-amber-800 mb-2">Answer:</div>
                              <div className="text-gray-700">{question.answer}</div>
                              {question.answeredAt && (
                                <div className="text-sm text-amber-600 mt-2">
                                  Answered on {new Date(question.answeredAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          ) : (
                            <>
                              {/* Customer View - Waiting for Answer */}
                              {!showAdminView && (
                                <div className="ml-4 p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border border-orange-200">
                                  <div className="text-orange-600 text-sm">Waiting for answer...</div>
                                </div>
                              )}
                              
                              {/* Admin View - Answer Form */}
                              {showAdminView && (
                                <div className="ml-4">
                                  {answeringQuestionId === question.id ? (
                                    <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                                      <div className="font-medium text-amber-800 mb-3">Provide Answer:</div>
                                      <Textarea
                                        value={answerText}
                                        onChange={(e) => setAnswerText(e.target.value)}
                                        placeholder="Type your detailed answer here..."
                                        rows={4}
                                        className="mb-3"
                                      />
                                      <div className="flex space-x-3">
                                        <Button
                                          onClick={() => {
                                            if (answerText.trim()) {
                                              answerQuestionMutation.mutate({
                                                questionId: question.id,
                                                answer: answerText.trim()
                                              });
                                            } else {
                                              toast({
                                                title: "Answer Required",
                                                description: "Please provide an answer before submitting.",
                                                variant: "destructive",
                                              });
                                            }
                                          }}
                                          disabled={answerQuestionMutation.isPending}
                                          className="bg-amber-600 hover:bg-amber-700 text-white"
                                        >
                                          {answerQuestionMutation.isPending ? "Submitting..." : "Submit Answer"}
                                        </Button>
                                        <Button
                                          variant="outline"
                                          onClick={() => {
                                            setAnsweringQuestionId(null);
                                            setAnswerText("");
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                                      <div className="flex justify-between items-center">
                                        <div className="text-orange-600 text-sm font-medium">⚠️ Needs Answer</div>
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            setAnsweringQuestionId(question.id);
                                            setAnswerText("");
                                          }}
                                          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2"
                                        >
                                          Answer Question
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        <div className="mt-16">
          <h2 className="text-3xl font-display font-bold text-darkBrown mb-8 text-center">You Might Also Like</h2>
          <div className="text-center">
            <Link href="/products">
              <Button className="wood-texture text-white px-8 py-3 font-semibold">
                View All Products
              </Button>
            </Link>
          </div>
        </div>

        {/* Customer Details Form Modal */}
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
        {product && (
          <RazorpayPaymentModal
            isOpen={showPaymentOptions}
            onClose={() => setShowPaymentOptions(false)}
            onSelectMethod={handlePaymentMethod}
            total={parseFloat(displayPrice) * selectedQuantity}
            phoneNumber={customerDetails.contact}
            customerDetails={customerDetails}
            productDetails={{
              ...product,
              price: parseFloat(product.price)
            }}
          />
        )}

        {/* Stripe Payment Modal */}
        {product && (
          <StripePaymentModal
            isOpen={showStripePayment}
            onClose={() => setShowStripePayment(false)}
            productId={product.id}
            productName={product.name}
            productPrice={displayPrice}
            quantity={selectedQuantity}
            customerDetails={customerDetails}
            onPaymentSuccess={(orderData) => {
              setShowStripePayment(false);
              setShowOrderConfirm(true);
              setOrderDetails(orderData);
            }}
          />
        )}

        {/* Unified Image Gallery Modal */}
        {selectedImageModal && allReviewImages.length > 0 && (
          <Dialog open={!!selectedImageModal} onOpenChange={() => setSelectedImageModal(null)}>
            <DialogContent className="max-w-4xl w-full p-2">
              <VisuallyHidden>
                <DialogTitle>Review Image {currentImageIndex + 1} of {allReviewImages.length}</DialogTitle>
              </VisuallyHidden>
              <div className="relative">
                <img
                  src={allReviewImages[currentImageIndex]}
                  alt={`Review image ${currentImageIndex + 1} - Full size`}
                  className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                />
                
                {/* Navigation Buttons */}
                {allReviewImages.length > 1 && (
                  <>
                    {/* Previous Button */}
                    <Button
                      onClick={handlePreviousImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white border-0 rounded-full w-12 h-12 p-0 flex items-center justify-center"
                      data-testid="button-previous-image"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    
                    {/* Next Button */}
                    <Button
                      onClick={handleNextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white border-0 rounded-full w-12 h-12 p-0 flex items-center justify-center"
                      data-testid="button-next-image"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </>
                )}
                
                {/* Image Counter */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {allReviewImages.length}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}