import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/product-card";
import AuthTestButton from "@/components/auth-test-button";
import { Link } from "wouter";
import { ArrowRight, Star, Users, Award, Truck, Shield, Clock, CheckCircle, Bed, Armchair, Table, Archive, Sofa, Shirt, X, Calendar, Video, Headphones } from "lucide-react";
import { useState, useEffect } from "react";
import type { Product, Category } from "@shared/schema";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

// Import real furniture images for hero slideshow
const bedImage = "/images/bed-home.jpg";
const diningTableImage = "/images/dining-table-home.webp";
const jhulaImage = "/images/jhula-home.jpg";
const poojaGharImage = "/images/pooja-ghar-home.jpg";
const sofaImage = "/images/sofa-home.jpg";

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showAppointmentSuccess, setShowAppointmentSuccess] = useState(false);
  const [appointmentSuccessData, setAppointmentSuccessData] = useState<any>(null);
  const [showTicketSuccess, setShowTicketSuccess] = useState(false);
  const [ticketSuccessData, setTicketSuccessData] = useState<any>(null);
  
  const { data: featuredProducts = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/featured"],
    queryFn: async () => {
      const response = await fetch('/api/products/featured');
      if (!response.ok) {
        throw new Error('Failed to fetch featured products');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
  });

  // Check for success notifications on page load
  useEffect(() => {
    const appointmentSuccess = sessionStorage.getItem('appointmentSuccess');
    if (appointmentSuccess) {
      try {
        const successData = JSON.parse(appointmentSuccess);
        setAppointmentSuccessData(successData);
        setShowAppointmentSuccess(true);
        sessionStorage.removeItem('appointmentSuccess');
      } catch (error) {
        console.error('Error parsing appointment success data:', error);
      }
    }

    const ticketSuccess = sessionStorage.getItem('ticketSuccess');
    if (ticketSuccess) {
      try {
        const successData = JSON.parse(ticketSuccess);
        setTicketSuccessData(successData);
        setShowTicketSuccess(true);
        sessionStorage.removeItem('ticketSuccess');
      } catch (error) {
        console.error('Error parsing ticket success data:', error);
      }
    }
  }, []);

  // Slideshow images for hero section - Premium Teak Wood Furniture
  const heroImages = [
    bedImage,        // Premium teak wood bed
    diningTableImage, // Beautiful dining table set
    jhulaImage,      // Traditional wooden jhula
    sofaImage        // Premium teak wood sofa set
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);

  // Category icon mapping
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('bed')) return Bed;
    if (name.includes('chair') || name.includes('seating')) return Armchair;
    if (name.includes('dining') || name.includes('table')) return Table;
    if (name.includes('cabinet') || name.includes('wardrobe')) return Archive;
    if (name.includes('sofa')) return Sofa;
    return Shirt; // Default icon
  };

  // Handle category click
  const handleCategoryClick = (categoryId: string, categoryName: string) => {
    setLocation(`/products?category=${categoryId}&categoryName=${encodeURIComponent(categoryName)}`);
  };

  // Customer testimonials data
  const testimonials = [
    {
      name: "Rajesh Kumar",
      location: "Mumbai",
      initials: "RK",
      rating: 5,
      review: "Absolutely stunning dining table! The teak wood quality is exceptional and the craftsmanship is top-notch. It's been 3 years and it still looks brand new."
    },
    {
      name: "Priya Sharma",
      location: "Delhi",
      initials: "PS",
      rating: 5,
      review: "Got the entire bedroom set from IndoSaga. The finish is beautiful and delivery was prompt. Excellent customer service throughout the process!"
    },
    {
      name: "Amit Mehta",
      location: "Bangalore",
      initials: "AM",
      rating: 5,
      review: "Love my new sofa set! The teak frame is solid and the upholstery is premium quality. Worth every penny spent. Highly recommended!"
    },
    {
      name: "Sneha Patel",
      location: "Ahmedabad",
      initials: "SP",
      rating: 5,
      review: "The wardrobe is magnificent! Perfect craftsmanship and the teak wood has a beautiful natural grain. Installation was seamless and professional."
    },
    {
      name: "Vikram Singh",
      location: "Pune",
      initials: "VS",
      rating: 5,
      review: "Ordered a complete office setup including desk and chairs. The quality exceeded my expectations. Each piece is a work of art!"
    },
    {
      name: "Kavita Reddy",
      location: "Hyderabad",
      initials: "KR",
      rating: 5,
      review: "Our entire living room was transformed with IndoSaga furniture. The TV unit and coffee table are absolutely gorgeous. Lifetime investment!"
    },
    {
      name: "Arjun Nair",
      location: "Chennai",
      initials: "AN",
      rating: 5,
      review: "The bed frame is incredibly sturdy and beautiful. The headboard design is unique and the storage compartments are very practical. Love it!"
    },
    {
      name: "Deepika Joshi",
      location: "Kolkata",
      initials: "DJ",
      rating: 5,
      review: "Fantastic dining chair set! The cushioning is comfortable and the teak finish matches perfectly with our table. Great value for money."
    }
  ];

  // Auto-advance slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, [heroImages.length]);

  // Auto-advance testimonials carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 4000); // Change testimonial every 4 seconds

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const scrollToProducts = () => {
    document.getElementById("featured-products")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="bg-warmWhite">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-start overflow-hidden">
        {/* Slideshow Background Images */}
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `url(${image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center center',
              backgroundRepeat: 'no-repeat',
              backgroundColor: '#8B4513' // Fallback brown color if image doesn't load
            }}
          />
        ))}
        <div className="absolute inset-0 bg-black/40" style={{ backdropFilter: 'blur(0.5px)' }} />
        
        {/* Slideshow Navigation Dots */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentImageIndex 
                  ? 'bg-white scale-125' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
        
        <div className="relative z-10 text-left text-white px-8 md:px-16 animate-fade-in max-w-4xl">
          {/* Premium Badge */}
          <div className="inline-flex items-center bg-white/20 backdrop-blur-md rounded-full px-4 py-2 mb-6">
            <Award className="h-4 w-4 text-yellow-300 mr-2" />
            <span className="text-sm font-medium">Premium Teak Wood Collection</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 leading-tight" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
            Premium <span className="text-orange-400">IndoSaga</span><br />
            <span className="text-4xl md:text-5xl text-amber-200">Furniture</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl leading-relaxed" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
            Discover the timeless beauty of handcrafted teak wood furniture that lasts generations. 
            <span className="text-amber-200 font-semibold"> Over 50 years of excellence.</span>
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-start gap-4 mb-8">
            <Button
              onClick={scrollToProducts}
              className="wood-texture text-white px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition-all hover-lift shadow-xl"
              data-testid="button-explore-collection"
            >
              Explore Collection
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Link href="/deals">
              <Button
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg font-semibold transition-all hover-lift shadow-xl"
                data-testid="button-flash-deals"
              >
                ₹1 Flash Deals
                <Star className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <AuthTestButton />
          </div>
          
          {/* Quick Stats */}
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center bg-white/10 backdrop-blur-md rounded-lg px-3 py-2">
              <Users className="h-4 w-4 mr-2 text-green-300" />
              <span>50,000+ Happy Customers</span>
            </div>
            <div className="flex items-center bg-white/10 backdrop-blur-md rounded-lg px-3 py-2">
              <Star className="h-4 w-4 mr-2 text-yellow-300" />
              <span>4.9★ Rating</span>
            </div>
            <div className="flex items-center bg-white/10 backdrop-blur-md rounded-lg px-3 py-2">
              <Truck className="h-4 w-4 mr-2 text-blue-300" />
              <span>Free Delivery</span>
            </div>
          </div>
        </div>
      </section>

      {/* Explore More Furniture Range Section - Redesigned */}
      <section className="py-16 bg-gradient-to-br from-warmWhite via-amber-50 to-beige relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-10 left-10 w-40 h-40 bg-gradient-to-br from-amber-300/20 to-orange-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-gradient-to-br from-orange-300/20 to-red-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center bg-gradient-to-r from-amber-100 to-orange-100 rounded-full px-6 py-2 mb-6 shadow-lg">
              <div className="w-3 h-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mr-3 animate-pulse"></div>
              <span className="text-amber-800 font-semibold text-sm">Furniture Collection</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold bg-gradient-to-r from-darkBrown via-primary to-accent bg-clip-text text-transparent mb-4">
              Explore Our Furniture Range
            </h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Discover our diverse collection of premium teak wood furniture for every room in your home
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
            {categories.map((category, index) => {
              const IconComponent = getCategoryIcon(category.name);
              return (
                <div
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id, category.name)}
                  className="group cursor-pointer transform transition-all duration-500 hover:scale-110 animate-fadeInUp"
                  style={{ animationDelay: `${index * 100}ms` }}
                  data-testid={`category-${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="relative h-32 w-full bg-gradient-to-br from-white to-amber-50 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-amber-200 hover:border-primary group-hover:bg-gradient-to-br group-hover:from-amber-50 group-hover:to-orange-50 overflow-hidden">
                    {/* Floating Background Elements */}
                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-amber-200/30 to-orange-200/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                    <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-gradient-to-br from-orange-200/30 to-red-200/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                    
                    <div className="flex flex-col items-center justify-center h-full text-center relative z-10 p-4">
                      <div className="w-12 h-12 mb-3 bg-gradient-to-br from-primary via-accent to-orange-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 transform-gpu">
                        <IconComponent className="h-6 w-6 text-white drop-shadow-lg" />
                      </div>
                      <h3 className="text-sm font-bold text-darkBrown group-hover:text-primary transition-colors duration-300 leading-tight">
                        {category.name}
                      </h3>
                      <div className="w-6 h-0.5 bg-gradient-to-r from-primary to-accent mx-auto rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-x-0 group-hover:scale-x-100 mt-2"></div>
                    </div>
                    
                    {/* Hover Effect Shine */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-700"></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <Link href="/products">
              <Button 
                className="bg-gradient-to-r from-primary to-accent hover:from-accent hover:to-primary text-white px-10 py-4 font-bold rounded-full shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 group relative overflow-hidden"
                data-testid="button-view-all-categories"
              >
                <span className="relative z-10 flex items-center">
                  View All Products
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-accent to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section id="featured-products" className="py-20 bg-beige">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl font-display font-bold text-darkBrown mb-4">Featured Collection</h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Handpicked pieces that showcase the natural beauty and durability of IndoSaga wood
            </p>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                  <div className="w-full h-64 bg-gray-200 rounded-lg mb-4" />
                  <div className="h-6 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded mb-4" />
                  <div className="h-10 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/products">
              <Button 
                className="wood-texture text-white px-8 py-4 font-semibold hover:opacity-90 transition-opacity"
                data-testid="button-view-all-products"
              >
                View All Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>


      {/* Why Choose Us Section */}
      <section className="py-20 bg-warmWhite">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-darkBrown mb-4">Why Choose IndoSaga?</h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              Experience the difference of premium teak wood furniture crafted with traditional expertise
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover-lift transition-all duration-300">
              <div className="w-16 h-16 wood-texture rounded-full mx-auto mb-6 flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-darkBrown mb-4">Lifetime Warranty</h3>
              <p className="text-gray-600">We stand behind our craftsmanship with a comprehensive lifetime warranty on all teak furniture.</p>
            </div>
            
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover-lift transition-all duration-300">
              <div className="w-16 h-16 wood-texture rounded-full mx-auto mb-6 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-darkBrown mb-4">100% Authentic Teak</h3>
              <p className="text-gray-600">Only premium grade teak wood sourced from sustainable plantations with proper certifications.</p>
            </div>
            
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover-lift transition-all duration-300">
              <div className="w-16 h-16 wood-texture rounded-full mx-auto mb-6 flex items-center justify-center">
                <Truck className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-darkBrown mb-4">Free Installation</h3>
              <p className="text-gray-600">Complimentary delivery and professional installation by our skilled craftsmen across India.</p>
            </div>
            
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover-lift transition-all duration-300">
              <div className="w-16 h-16 wood-texture rounded-full mx-auto mb-6 flex items-center justify-center">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-darkBrown mb-4">Quick Delivery</h3>
              <p className="text-gray-600">Fast nationwide delivery within 7-15 days with real-time tracking and updates.</p>
            </div>
            
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover-lift transition-all duration-300">
              <div className="w-16 h-16 wood-texture rounded-full mx-auto mb-6 flex items-center justify-center">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-darkBrown mb-4">Award Winning</h3>
              <p className="text-gray-600">Recognized for excellence in furniture design and customer satisfaction across India.</p>
            </div>
            
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover-lift transition-all duration-300">
              <div className="w-16 h-16 wood-texture rounded-full mx-auto mb-6 flex items-center justify-center">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-darkBrown mb-4">Expert Craftsmen</h3>
              <p className="text-gray-600">Three generations of master artisans ensuring every piece meets our exacting standards.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Testimonials Circular Carousel */}
      <section className="py-32 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-100/50 to-orange-100/30"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-display font-bold text-darkBrown mb-4">What Our Customers Say</h2>
            <p className="text-xl text-amber-800">Real experiences from our satisfied customers</p>
          </div>
          
          {/* Circular Testimonials Container */}
          <div className="relative flex items-center justify-center" style={{ minHeight: '900px', padding: '80px 0' }}>
            {/* Orbiting Testimonial Cards - Now 6 cards */}
            <div className="absolute inset-0 flex items-center justify-center z-10">
              {testimonials.slice(0, 6).map((testimonial, index) => {
                const angle = (index * 60) + (currentTestimonialIndex * 15); // 6 cards with 60-degree spacing
                const radius = 380; // Significantly increased radius for better separation
                const x = Math.cos((angle * Math.PI) / 180) * radius;
                const y = Math.sin((angle * Math.PI) / 180) * radius;
                
                return (
                  <div
                    key={index}
                    className="absolute w-32 h-32 transition-all duration-1000 ease-in-out cursor-pointer group z-30"
                    style={{
                      transform: `translate(${x}px, ${y}px)`,
                      left: '50%',
                      top: '50%',
                      marginLeft: '-64px', // Half of w-32 (128px/2)
                      marginTop: '-64px',  // Half of h-32 (128px/2)
                    }}
                    onClick={() => setCurrentTestimonialIndex(index)}
                  >
                    <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl shadow-xl border border-amber-300 p-3 hover:shadow-2xl hover:scale-110 transition-all duration-300 group-hover:border-amber-500 backdrop-blur-sm">
                      <div className="text-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-1 shadow-lg">
                          <span className="text-sm font-bold text-white">{testimonial.initials}</span>
                        </div>
                        <div className="text-xs font-semibold text-darkBrown">{testimonial.name}</div>
                        <div className="text-xs text-amber-700">{testimonial.location}</div>
                        <div className="flex justify-center mt-1">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="h-2.5 w-2.5 text-amber-500 fill-current" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Central Main Testimonial */}
            <div className="relative z-20 max-w-md mx-auto">
              <div className="bg-gradient-to-br from-white to-amber-50 p-8 rounded-3xl shadow-2xl border-2 border-amber-200/50 backdrop-blur-sm transform hover:scale-105 transition-all duration-500">
                {/* Quote Icon */}
                <div className="text-6xl text-amber-600/30 font-serif absolute -top-4 -left-2">"</div>
                
                {/* Stars */}
                <div className="flex justify-center mb-6">
                  <div className="flex text-amber-500">
                    {[...Array(testimonials[currentTestimonialIndex]?.rating || 5)].map((_, i) => (
                      <Star key={i} className="h-6 w-6 fill-current animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                    ))}
                  </div>
                </div>
                
                {/* Review Text */}
                <p className="text-amber-900 text-lg leading-relaxed mb-6 text-center font-medium min-h-[120px] flex items-center">
                  "{testimonials[currentTestimonialIndex]?.review}"
                </p>
                
                {/* Customer Info */}
                <div className="flex items-center justify-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-600 to-orange-700 rounded-full flex items-center justify-center mr-4 shadow-lg">
                    <span className="text-xl font-bold text-white">{testimonials[currentTestimonialIndex]?.initials}</span>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-darkBrown text-lg">{testimonials[currentTestimonialIndex]?.name}</div>
                    <div className="text-amber-700 text-sm">{testimonials[currentTestimonialIndex]?.location}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Dots */}
          <div className="flex justify-center mt-12 space-x-3">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonialIndex(index)}
                className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  index === currentTestimonialIndex 
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 scale-125 shadow-lg' 
                    : 'bg-amber-300 hover:bg-amber-400'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>

          {/* Customer Stats */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center bg-gradient-to-r from-white/90 to-amber-50/90 backdrop-blur-sm rounded-full px-8 py-4 shadow-xl border border-amber-200">
              <Star className="h-6 w-6 text-amber-500 fill-current mr-3" />
              <span className="font-bold text-darkBrown text-lg">4.9/5 Rating</span>
              <span className="mx-4 text-amber-400">•</span>
              <Users className="h-6 w-6 text-orange-600 mr-3" />
              <span className="font-bold text-darkBrown text-lg">50,000+ Reviews</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access Section */}
      <section className="py-20 bg-gradient-to-br from-warmWhite to-beige">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-darkBrown mb-4 animate-fadeInUp">Explore More</h2>
            <p className="text-lg text-gray-700 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>Discover everything IndoSaga has to offer</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link href="/deals" className="group" style={{ animationDelay: '0.1s' }}>
              <div className="h-80 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-8 text-center transition-all duration-500 group-hover:border-amber-400 group-hover:shadow-2xl group-hover:shadow-amber-200/50 relative overflow-hidden transform group-hover:scale-105 animate-slideInUp">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-100/20 to-orange-100/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 text-xs font-bold rounded-bl-2xl shadow-lg animate-pulse">
                  HOT<span className="ml-1">🔥</span>
                </div>
                <div className="relative z-10">
                  <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-500 animate-bounce">🔥</div>
                  <h3 className="text-2xl font-display font-bold text-amber-700 mb-3 group-hover:text-amber-800 transition-colors duration-300">₹1 Flash Deals</h3>
                  <p className="text-gray-600 mb-6 group-hover:text-gray-700 transition-colors duration-300">Limited time offers on premium furniture</p>
                  <div className="text-sm text-amber-600 font-semibold bg-amber-100 px-4 py-2 rounded-full inline-block group-hover:bg-amber-200 transition-all duration-300 animate-pulse">
                    Save up to 95%
                  </div>
                </div>
              </div>
            </Link>
            
            <Link href="/about" className="group" style={{ animationDelay: '0.3s' }}>
              <div className="h-80 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 border-2 border-amber-300 rounded-2xl p-8 text-center transition-all duration-500 group-hover:border-amber-500 group-hover:shadow-2xl group-hover:shadow-amber-300/50 relative overflow-hidden transform group-hover:scale-105 animate-slideInUp">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-200/20 to-orange-200/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute top-4 left-4 w-16 h-16 bg-gradient-to-br from-amber-200 to-orange-200 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                <div className="absolute bottom-4 right-4 w-12 h-12 bg-gradient-to-br from-orange-200 to-red-200 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-500 group-hover:animate-pulse">🌳</div>
                  <h3 className="text-2xl font-display font-bold text-amber-800 mb-3 group-hover:text-amber-900 transition-colors duration-300">IndoSaga Heritage</h3>
                  <p className="text-gray-600 mb-6 group-hover:text-gray-700 transition-colors duration-300">Learn about our premium teak wood</p>
                  <div className="text-sm text-amber-700 font-semibold bg-amber-200 px-4 py-2 rounded-full inline-block group-hover:bg-amber-300 transition-all duration-300">
                    50+ Years of Excellence
                  </div>
                </div>
              </div>
            </Link>
            
            <Link href="/contact" className="group" style={{ animationDelay: '0.5s' }}>
              <div className="h-80 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 border-2 border-orange-200 rounded-2xl p-8 text-center transition-all duration-500 group-hover:border-orange-400 group-hover:shadow-2xl group-hover:shadow-orange-200/50 relative overflow-hidden transform group-hover:scale-105 animate-slideInUp">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-100/20 to-amber-100/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-orange-200 to-amber-200 rounded-full opacity-10 group-hover:opacity-30 transition-opacity duration-500"></div>
                <div className="absolute bottom-4 left-4 w-14 h-14 bg-gradient-to-br from-amber-200 to-yellow-200 rounded-full opacity-15 group-hover:opacity-35 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-500 group-hover:animate-bounce">🏪</div>
                  <h3 className="text-2xl font-display font-bold text-orange-700 mb-3 group-hover:text-orange-800 transition-colors duration-300">Visit Showroom</h3>
                  <p className="text-gray-600 mb-6 group-hover:text-gray-700 transition-colors duration-300">Experience furniture in person</p>
                  <div className="text-sm text-orange-600 font-semibold bg-orange-200 px-4 py-2 rounded-full inline-block group-hover:bg-orange-300 transition-all duration-300 animate-pulse">
                    Free Consultation
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 bg-gradient-to-r from-darkBrown to-brown-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1549497538-303791108f95?ixlib=rb-4.0.3&auto=format&fit=crop&w=2560&h=600')] bg-cover bg-center opacity-10"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold mb-4">Our Achievements</h2>
            <p className="text-xl text-gray-300">Built on trust, delivered with excellence</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center transform hover:scale-105 transition-transform duration-300">
              <div className="text-4xl font-bold text-primary mb-2">50+</div>
              <div className="text-lg font-semibold mb-1">Years Experience</div>
              <div className="text-sm text-gray-300">Crafting Excellence</div>
            </div>
            <div className="text-center transform hover:scale-105 transition-transform duration-300">
              <div className="text-4xl font-bold text-primary mb-2">50K+</div>
              <div className="text-lg font-semibold mb-1">Happy Customers</div>
              <div className="text-sm text-gray-300">Satisfied Families</div>
            </div>
            <div className="text-center transform hover:scale-105 transition-transform duration-300">
              <div className="text-4xl font-bold text-primary mb-2">1000+</div>
              <div className="text-lg font-semibold mb-1">Furniture Designs</div>
              <div className="text-sm text-gray-300">Unique Creations</div>
            </div>
            <div className="text-center transform hover:scale-105 transition-transform duration-300">
              <div className="text-4xl font-bold text-primary mb-2">4.9★</div>
              <div className="text-lg font-semibold mb-1">Customer Rating</div>
              <div className="text-sm text-gray-300">Google Reviews</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-darkBrown text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4 group hover:scale-105 transition-all duration-500">
                <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-primary/30 group-hover:ring-primary/70 transition-all duration-500 shadow-lg group-hover:shadow-primary/30 group-hover:shadow-xl flex-shrink-0">
                  <img 
                    src="/indosaga-logo.png" 
                    alt="IndoSaga Furniture Logo" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col justify-center leading-tight">
                  <div className="text-xl font-display font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent hover:from-accent hover:via-primary hover:to-accent transition-all duration-700 drop-shadow-sm whitespace-nowrap">
                    IndoSaga
                  </div>
                  <div className="text-xl font-display font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent hover:from-accent hover:via-primary hover:to-accent transition-all duration-700 drop-shadow-sm whitespace-nowrap">
                    Furniture
                  </div>
                </div>
              </div>
              <p className="text-gray-300 mb-4">Premium teak wood furniture crafted with love and tradition for over 50 years.</p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold font-display mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent hover:from-accent hover:via-primary hover:to-accent transition-all duration-700">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="/" className="text-gray-300 hover:text-primary transition-colors">Home</Link></li>
                <li><Link href="/products" className="text-gray-300 hover:text-primary transition-colors">Products</Link></li>
                <li><Link href="/deals" className="text-gray-300 hover:text-primary transition-colors">₹1 Deals</Link></li>
                <li><Link href="/about" className="text-gray-300 hover:text-primary transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="text-gray-300 hover:text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold font-display mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent hover:from-accent hover:via-primary hover:to-accent transition-all duration-700">Categories</h4>
              <ul className="space-y-2">
                <li><span className="text-gray-300 hover:text-primary transition-colors cursor-pointer">Dining Tables</span></li>
                <li><span className="text-gray-300 hover:text-primary transition-colors cursor-pointer">Chairs</span></li>
                <li><span className="text-gray-300 hover:text-primary transition-colors cursor-pointer">Wardrobes</span></li>
                <li><span className="text-gray-300 hover:text-primary transition-colors cursor-pointer">Beds</span></li>
                <li><span className="text-gray-300 hover:text-primary transition-colors cursor-pointer">Sofas</span></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold font-display mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent hover:from-accent hover:via-primary hover:to-accent transition-all duration-700">Contact Info</h4>
              <div className="space-y-2 text-gray-300">
                <p>📍 123 Furniture Street, Mumbai</p>
                <p>📞 +91 98765 43210</p>
                <p>✉️ info@sagwanfurniture.com</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-600 mt-8 pt-8 text-center">
            <p className="text-gray-300">&copy; 2024 IndoSaga Furniture. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Appointment Success Modal */}
      {showAppointmentSuccess && appointmentSuccessData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn">
            {/* Header */}
            <div className="bg-gradient-to-r from-accent to-primary p-6 rounded-t-3xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
              <div className="relative z-10 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 rounded-full p-3">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">✅ Your appointment has been successfully booked!</h2>
                  </div>
                </div>
                <Button
                  onClick={() => setShowAppointmentSuccess(false)}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 rounded-full w-10 h-10 p-0"
                  data-testid="button-close-appointment-success"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="p-8">
              <div className="text-center mb-8">
                <div className="bg-primary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                
                <p className="text-primary text-lg mb-6">
                  Your virtual meeting has been confirmed and scheduled successfully.
                </p>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-left mb-6">
                  <h4 className="font-bold text-primary mb-4">Appointment Details:</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="space-y-2">
                        <div><strong>Name:</strong> {appointmentSuccessData.customerName}</div>
                        <div><strong>Date:</strong> {new Date(appointmentSuccessData.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div>
                      <div className="space-y-2">
                        <div><strong>Time:</strong> {appointmentSuccessData.time}</div>
                        <div><strong>Type:</strong> {appointmentSuccessData.type.replace('_', ' ').toUpperCase()}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left mb-6">
                  <div className="flex items-start space-x-3">
                    <Video className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-blue-800 font-medium">
                        A confirmation email with the video call link has been sent to your registered email address.
                      </p>
                      <p className="text-sm text-blue-600 mt-2">
                        Email: {appointmentSuccessData.email}
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setShowAppointmentSuccess(false)}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg transition-all duration-300"
                  data-testid="button-close-appointment-success-main"
                >
                  Got it, thanks!
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Support Ticket Success Modal */}
      {showTicketSuccess && ticketSuccessData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-accent p-6 rounded-t-3xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
              <div className="relative z-10 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 rounded-full p-3">
                    <Headphones className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">✅ Support ticket created successfully!</h2>
                  </div>
                </div>
                <Button
                  onClick={() => setShowTicketSuccess(false)}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 rounded-full w-10 h-10 p-0"
                  data-testid="button-close-ticket-success"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="p-8">
              <div className="text-center mb-8">
                <div className="bg-primary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                
                <p className="text-primary text-lg mb-6">
                  Your support request has been submitted and we'll respond within 24 hours.
                </p>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-left mb-6">
                  <h4 className="font-bold text-primary mb-4">Ticket Details:</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="space-y-2">
                        <div><strong>Ticket ID:</strong> {ticketSuccessData.ticketId}</div>
                        <div><strong>Name:</strong> {ticketSuccessData.customerName}</div>
                      </div>
                    </div>
                    <div>
                      <div className="space-y-2">
                        <div><strong>Subject:</strong> {ticketSuccessData.subject}</div>
                        <div><strong>Priority:</strong> <span className="uppercase text-xs font-semibold px-2 py-1 rounded bg-gray-100">{ticketSuccessData.priority}</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-left mb-6">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-primary font-medium">
                        A confirmation email has been sent to your registered email address.
                      </p>
                      <p className="text-sm text-green-600 mt-2">
                        Email: {ticketSuccessData.email}
                      </p>
                      <p className="text-sm text-green-600 mt-2">
                        Please save the ticket ID <strong>{ticketSuccessData.ticketId}</strong> for future reference.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setShowTicketSuccess(false)}
                  className="bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg transition-all duration-300"
                  data-testid="button-close-ticket-success-main"
                >
                  Got it, thanks!
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
