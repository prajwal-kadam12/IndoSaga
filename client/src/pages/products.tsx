import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Camera, Upload, X, RefreshCw } from "lucide-react";
import ProductCard from "@/components/product-card";

export default function Products() {
  const [location] = useLocation();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [subcategoryId, setSubcategoryId] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [displayCount, setDisplayCount] = useState(8);
  
  // Camera functionality state
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isSearchingByImage, setIsSearchingByImage] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Read URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    if (categoryParam) {
      setCategoryId(categoryParam);
    }
  }, [location]);

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      if (!Array.isArray(data)) return [];
      
      // Remove duplicates by filtering to keep only the first occurrence of each category name
      const uniqueCategories = data.filter((category, index, self) => 
        self.findIndex(c => c.name === category.name) === index
      );
      return uniqueCategories;
    },
  });

  const { data: subcategories = [] } = useQuery({
    queryKey: ["/api/subcategories", categoryId],
    queryFn: async () => {
      if (categoryId === "all") return [];
      const response = await fetch(`/api/subcategories?categoryId=${categoryId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch subcategories');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: categoryId !== "all",
  });

  const { data: products = [], isLoading, refetch: refetchProducts } = useQuery({
    queryKey: ["/api/products", { search, categoryId, subcategoryId, ...parsePriceRange(priceRange) }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      
      // If subcategory is selected, only filter by subcategory (more specific)
      // Otherwise filter by category
      if (subcategoryId && subcategoryId !== "all") {
        params.append("subcategoryId", subcategoryId);
      } else if (categoryId && categoryId !== "all") {
        params.append("categoryId", categoryId);
      }
      
      const { minPrice, maxPrice } = parsePriceRange(priceRange);
      if (minPrice) params.append("minPrice", minPrice.toString());
      if (maxPrice) params.append("maxPrice", maxPrice.toString());
      
      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  function parsePriceRange(range: string) {
    switch (range) {
      case "10000-25000":
        return { minPrice: 10000, maxPrice: 25000 };
      case "25000-50000":
        return { minPrice: 25000, maxPrice: 50000 };
      case "50000+":
        return { minPrice: 50000, maxPrice: undefined };
      case "all":
      default:
        return { minPrice: undefined, maxPrice: undefined };
    }
  }

  // Camera functionality
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions or try uploading an image.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid image file.",
        variant: "destructive",
      });
    }
  };

  const searchByImage = async () => {
    if (!capturedImage) return;
    
    setIsSearchingByImage(true);
    
    try {
      // Convert base64 to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('image', blob, 'search-image.jpg');
      
      const searchResponse = await fetch('/api/products/search-by-image', {
        method: 'POST',
        body: formData,
      });
      
      if (searchResponse.ok) {
        const similarProducts = await searchResponse.json();
        
        console.log('Image search response:', similarProducts);
        
        if (similarProducts && similarProducts.length > 0) {
          // First, clear the filters that will trigger the useQuery to refetch
          setSearch("");
          setCategoryId("all");
          setSubcategoryId("all");
          setPriceRange("all");
          
          // Use setTimeout to ensure state updates happen first
          setTimeout(() => {
            // Clear all existing cache entries
            queryClient.removeQueries({ queryKey: ["/api/products"] });
            
            // Set the new data in cache with the exact key that useQuery will look for
            const exactCacheKey = ["/api/products", { search: "", categoryId: "all", subcategoryId: "all", minPrice: undefined, maxPrice: undefined }];
            queryClient.setQueryData(exactCacheKey, similarProducts);
            
            // Invalidate to trigger a re-render
            queryClient.invalidateQueries({ queryKey: ["/api/products"] });
            
            setDisplayCount(8);
          }, 100);
          
          toast({
            title: "Similar Products Found!",
            description: `Found ${similarProducts.length} similar products based on your image.`,
          });
        } else {
          // No similar products found - set empty array
          setSearch("");
          setCategoryId("all");
          setSubcategoryId("all");
          setPriceRange("all");
          
          setTimeout(() => {
            queryClient.removeQueries({ queryKey: ["/api/products"] });
            const exactCacheKey = ["/api/products", { search: "", categoryId: "all", subcategoryId: "all", minPrice: undefined, maxPrice: undefined }];
            queryClient.setQueryData(exactCacheKey, []);
            queryClient.invalidateQueries({ queryKey: ["/api/products"] });
          }, 100);
          
          toast({
            title: "No Similar Products Found",
            description: "We couldn't find products matching your image. Try uploading a different image or browse our categories.",
            variant: "destructive",
          });
        }
      } else {
        const errorData = await searchResponse.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || 'Failed to search by image');
      }
    } catch (error) {
      console.error('Error searching by image:', error);
      toast({
        title: "Search Error",
        description: "Unable to search by image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearchingByImage(false);
      setShowCameraModal(false);
      setCapturedImage(null);
    }
  };

  const resetImageSearch = () => {
    setCapturedImage(null);
    if (isCameraActive) {
      stopCamera();
    }
  };

  return (
    <div className="py-20 bg-gradient-to-br from-warmWhite via-beige to-amber-50 min-h-screen relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-amber-200 to-orange-200 rounded-full opacity-10 animate-pulse"></div>
      <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-orange-200 to-red-200 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-40 left-20 w-28 h-28 bg-gradient-to-br from-yellow-200 to-amber-200 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12 animate-fadeInUp">
          <div className="inline-flex items-center bg-gradient-to-r from-amber-100 to-orange-100 rounded-full px-6 py-2 mb-6 shadow-lg animate-slideInDown">
            <div className="w-3 h-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mr-3 animate-pulse"></div>
            <span className="text-amber-800 font-semibold text-sm">Premium Collection</span>
          </div>
          <h1 className="text-5xl font-display font-bold bg-gradient-to-r from-darkBrown via-primary to-accent bg-clip-text text-transparent mb-6 animate-slideInUp">Our Products</h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto leading-relaxed animate-slideInUp" style={{ animationDelay: '0.2s' }}>Explore our complete collection of premium IndoSaga furniture crafted with traditional expertise</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-gradient-to-r from-white via-warmWhite to-white rounded-3xl shadow-2xl p-8 mb-16 relative overflow-hidden group hover:shadow-3xl transition-all duration-500 animate-slideInUp border border-amber-100" style={{ animationDelay: '0.4s' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-amber-50/30 to-orange-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-200 to-orange-200 rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-500"></div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 relative group/search">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-amber-600 h-5 w-5 group-focus-within/search:text-primary transition-colors duration-300" />
                <Input
                  type="text"
                  placeholder="Search furniture..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 pr-16 py-4 border-2 border-amber-200 focus:border-amber-400 focus:ring-amber-200 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 text-darkBrown placeholder-amber-600 font-medium shadow-sm hover:shadow-md transition-all duration-300"
                  data-testid="input-search-products"
                />
                
                {/* Camera Search Button */}
                <Dialog open={showCameraModal} onOpenChange={setShowCameraModal}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-600 hover:text-amber-700 border border-amber-200 hover:border-amber-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
                      title="Search by taking a photo"
                    >
                      <Camera className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-amber-900 font-bold">Search by Image</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      {!capturedImage ? (
                        <>
                          {/* Camera View */}
                          {isCameraActive ? (
                            <div className="relative">
                              <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="w-full h-64 object-cover rounded-lg bg-gray-100"
                              />
                              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                                <Button onClick={capturePhoto} className="bg-white text-gray-900 hover:bg-gray-100">
                                  <Camera className="h-4 w-4 mr-2" />
                                  Capture
                                </Button>
                                <Button onClick={stopCamera} variant="outline" className="bg-white text-gray-900 hover:bg-gray-100">
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center space-y-4">
                              <div className="w-full h-64 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center">
                                <div className="text-center">
                                  <Camera className="h-16 w-16 text-amber-600 mx-auto mb-4" />
                                  <p className="text-amber-700 font-medium">Take a photo to find similar furniture</p>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3">
                                <Button onClick={startCamera} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                                  <Camera className="h-4 w-4 mr-2" />
                                  Open Camera
                                </Button>
                                <Button 
                                  onClick={() => fileInputRef.current?.click()} 
                                  variant="outline"
                                  className="border-amber-300 text-amber-700 hover:bg-amber-50"
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload Image
                                </Button>
                              </div>
                              
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                              />
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {/* Captured Image Preview */}
                          <div className="space-y-4">
                            <img 
                              src={capturedImage} 
                              alt="Captured for search" 
                              className="w-full h-64 object-cover rounded-lg"
                            />
                            
                            <div className="grid grid-cols-2 gap-3">
                              <Button 
                                onClick={searchByImage} 
                                disabled={isSearchingByImage}
                                className="bg-gradient-to-r from-accent to-primary hover:from-primary hover:to-accent text-white"
                              >
                                {isSearchingByImage ? (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Searching...
                                  </>
                                ) : (
                                  <>
                                    <Search className="h-4 w-4 mr-2" />
                                    Find Similar
                                  </>
                                )}
                              </Button>
                              <Button 
                                onClick={resetImageSearch} 
                                variant="outline"
                                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Retake
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Select value={categoryId} onValueChange={(value) => {
                  setCategoryId(value);
                  setSubcategoryId("all"); // Reset subcategory when category changes
                }}>
                  <SelectTrigger className="w-full sm:w-52 py-4 border-2 border-amber-200 focus:ring-amber-200 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 text-darkBrown font-medium shadow-sm hover:shadow-md transition-all duration-300 hover:border-amber-400" data-testid="select-category">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-amber-200 shadow-xl">
                    <SelectItem value="all" className="font-medium">All Categories</SelectItem>
                    {(categories as any[]).map((category: any) => (
                      <SelectItem key={category.id} value={category.id} className="font-medium">
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger className="w-full sm:w-52 py-4 border-2 border-amber-200 focus:ring-amber-200 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 text-darkBrown font-medium shadow-sm hover:shadow-md transition-all duration-300 hover:border-amber-400" data-testid="select-price-range">
                    <SelectValue placeholder="Price Range" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-amber-200 shadow-xl">
                    <SelectItem value="all" className="font-medium">All Prices</SelectItem>
                    <SelectItem value="10000-25000" className="font-medium">₹10,000 - ₹25,000</SelectItem>
                    <SelectItem value="25000-50000" className="font-medium">₹25,000 - ₹50,000</SelectItem>
                    <SelectItem value="50000+" className="font-medium">₹50,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Subcategories Section - Show when a category is selected */}
        {categoryId !== "all" && subcategories.length > 0 && (
          <div className="relative mb-8 animate-slideInUp">
            {/* Background with animated gradients */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-200 via-orange-200 to-amber-200 rounded-3xl opacity-20 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-white via-warmWhite to-amber-50 rounded-3xl shadow-2xl p-8 border-2 border-amber-200 overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-300 to-orange-300 rounded-full opacity-10 -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-orange-300 to-amber-300 rounded-full opacity-10 translate-y-12 -translate-x-12"></div>
              
              <div className="relative z-10">
                <div className="flex overflow-x-auto gap-6 pb-4 px-4">
                  {/* All Items Button */}
                  <button
                    onClick={() => setSubcategoryId("all")}
                    className={`group relative transition-all duration-300 hover:shadow-2xl w-36 h-48 rounded-2xl overflow-hidden shadow-lg flex-shrink-0 ${
                      subcategoryId === "all"
                        ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-2xl"
                        : "bg-white border-2 border-amber-200 hover:border-amber-400 hover:shadow-xl"
                    }`}
                  >
                    <div className="h-32 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                      <svg className="w-12 h-12 text-amber-600 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </div>
                    <div className="h-16 flex items-center justify-center p-2">
                      <span className={`text-center font-bold text-xs ${subcategoryId === "all" ? "text-white" : "text-amber-800"}`}>
                        All {categories.find(c => c.id === categoryId)?.name || "Items"}
                      </span>
                    </div>
                  </button>
                  
                  {/* Subcategory Cards */}
                  {subcategories.map((subcategory: any, index: number) => (
                    <div
                      key={subcategory.id}
                      className="animate-slideInUp"
                      style={{ 
                        animationDelay: `${index * 0.1}s`,
                        animationFillMode: 'both'
                      }}
                    >
                      <button
                        onClick={() => setSubcategoryId(subcategory.id)}
                        className={`group relative transition-all duration-300 hover:shadow-lg hover:border-amber-500 w-36 h-48 rounded-2xl overflow-hidden shadow-lg flex-shrink-0 ${
                          subcategoryId === subcategory.id
                            ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-2xl ring-2 ring-amber-300"
                            : "bg-white border-2 border-amber-200 hover:border-amber-400 hover:shadow-xl"
                        }`}
                      >
                        {/* Image Section - Larger Area */}
                        <div className="h-32 w-full bg-amber-50 flex items-center justify-center p-2">
                          {subcategory.imageUrl ? (
                            <img 
                              src={subcategory.imageUrl} 
                              alt={subcategory.name}
                              className="w-full h-full object-cover rounded-xl shadow-md group-hover:shadow-lg transition-all duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-amber-200 rounded-xl flex items-center justify-center">
                              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        
                        {/* Text Section - Compact Area */}
                        <div className="h-16 w-full flex items-center justify-center p-2">
                          <span className={`text-center font-bold text-xs leading-tight ${
                            subcategoryId === subcategory.id ? "text-white" : "text-amber-800"
                          }`}>
                            {subcategory.name}
                          </span>
                        </div>
                        
                        {/* Selection Indicator */}
                        {subcategoryId === subcategory.id && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Section */}
        <div className="relative">
          <div className="text-center mb-10 animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
            <div className="inline-flex items-center bg-gradient-to-r from-amber-200 to-orange-200 rounded-full px-6 py-2 mb-4 shadow-lg">
              <span className="text-amber-900 font-bold text-sm">
                {products.length > 0 ? `${products.length} Products Found` : 'Premium Furniture Collection'}
              </span>
            </div>
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-gradient-to-br from-white to-amber-50 rounded-3xl p-8 animate-pulse shadow-lg border border-amber-100" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="w-full h-52 bg-gradient-to-br from-amber-200 to-orange-200 rounded-2xl mb-6 opacity-30" />
                  <div className="h-6 bg-gradient-to-r from-amber-200 to-orange-200 rounded-lg mb-3 opacity-30" />
                  <div className="h-4 bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg mb-6 opacity-30" />
                  <div className="flex space-x-2">
                    <div className="h-12 bg-gradient-to-r from-amber-200 to-orange-200 rounded-xl flex-1 opacity-30" />
                    <div className="h-12 bg-gradient-to-r from-orange-200 to-red-200 rounded-xl flex-1 opacity-30" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 animate-fadeInUp">
              <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-3xl p-12 max-w-md mx-auto shadow-xl border border-amber-200">
                <div className="w-24 h-24 bg-gradient-to-br from-amber-300 to-orange-300 rounded-full mx-auto mb-6 flex items-center justify-center animate-bounce">
                  <svg className="w-12 h-12 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m0 0V9a2 2 0 012-2h2m0 0V6a2 2 0 012-2h2m0 0v1" />
                  </svg>
                </div>
                <h3 className="text-2xl font-display font-bold text-amber-900 mb-4">No products found</h3>
                <p className="text-amber-700 leading-relaxed">Try adjusting your search or filter criteria to find the perfect furniture piece.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8" data-testid="products-grid">
                {products.slice(0, displayCount).map((product: any, index: number) => (
                  <div 
                    key={product.id} 
                    className="animate-slideInUp" 
                    style={{ 
                      animationDelay: `${0.8 + (index * 0.1)}s`,
                      animationFillMode: 'both'
                    }}
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
              
              {/* Load More Button */}
              {products.length > displayCount && (
                <div className="text-center mt-16 animate-fadeInUp" style={{ animationDelay: '1s' }}>
                  <Button
                    onClick={() => setDisplayCount(prev => prev + 8)}
                    className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 hover:from-amber-200 hover:to-orange-200 hover:text-amber-900 border-2 border-amber-200 hover:border-amber-300 px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 group"
                    data-testid="button-load-more"
                  >
                    <Plus className="mr-2 h-5 w-5 group-hover:animate-pulse" />
                    Load More Products ({products.length - displayCount} remaining)
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
