import { Link, useLocation } from "wouter";
import { Heart, ShoppingCart, User, Menu, X, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth0 } from "@auth0/auth0-react";
import { useToast } from "@/hooks/use-toast";

import type { CartItem, WishlistItem } from "@shared/schema";
// Removed problematic image import - using text-based logo instead

interface NavigationProps {
  onCartClick: () => void;
  onWishlistClick: () => void;
}

export default function Navigation({ onCartClick, onWishlistClick }: NavigationProps) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [localCartCount, setLocalCartCount] = useState(0);
  const [localWishlistCount, setLocalWishlistCount] = useState(0);
  
  const { logout } = useAuth0();
  const queryClient = useQueryClient();
  const { toast } = useToast();


  // Get cart count from API
  const { data: cartItems = [] } = useQuery<CartItem[]>({
    queryKey: ["/api/cart"],
    retry: false,
  });

  // Get wishlist count from API
  const { data: wishlistItems = [] } = useQuery<WishlistItem[]>({
    queryKey: ["/api/wishlist"],
    retry: false,
  });

  // Check authentication status
  const { data: user, isLoading: authLoading } = useQuery<any>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  // Load localStorage counts and listen for updates
  useEffect(() => {
    const updateLocalCounts = () => {
      const localCart = JSON.parse(localStorage.getItem('localCart') || '[]');
      const localWishlist = JSON.parse(localStorage.getItem('localWishlist') || '[]');
      
      // Remove duplicates from localStorage before counting
      const uniqueWishlist = localWishlist.filter((item: any, index: number, array: any[]) => 
        array.findIndex((i: any) => i.productId === item.productId) === index
      );
      
      // Update localStorage with deduplicated data
      if (uniqueWishlist.length !== localWishlist.length) {
        localStorage.setItem('localWishlist', JSON.stringify(uniqueWishlist));
      }
      
      setLocalCartCount(localCart.length);
      setLocalWishlistCount(uniqueWishlist.length);
    };

    // Load initial counts
    updateLocalCounts();

    // Listen for updates
    window.addEventListener('cartUpdated', updateLocalCounts);
    window.addEventListener('wishlistUpdated', updateLocalCounts);
    window.addEventListener('localWishlistUpdate', updateLocalCounts);

    return () => {
      window.removeEventListener('cartUpdated', updateLocalCounts);
      window.removeEventListener('wishlistUpdated', updateLocalCounts);
      window.removeEventListener('localWishlistUpdate', updateLocalCounts);
    };
  }, []);

  // Use API count if available, otherwise use localStorage count
  const cartCount = cartItems.length > 0 ? cartItems.length : localCartCount;
  const wishlistCount = wishlistItems.length > 0 ? wishlistItems.length : localWishlistCount;

  // Logout handler function
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

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    { href: "/deals", label: "₹1 Deal" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <nav className="bg-gradient-to-r from-white via-warmWhite to-white shadow-2xl sticky top-0 z-40 backdrop-blur-md border-b border-primary/20 animate-fadeIn group">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/3 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="flex justify-between items-center h-16 sm:h-18 lg:h-20 xl:h-24 relative z-10">
          
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3 group hover:scale-105 transition-all duration-500 animate-slideInLeft flex-shrink-0" data-testid="link-home">
            <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 xl:w-12 xl:h-12 rounded-full overflow-hidden ring-2 ring-primary/30 group-hover:ring-primary/70 transition-all duration-500 shadow-lg group-hover:shadow-primary/30 group-hover:shadow-xl flex-shrink-0">
              <img 
                src="/indosaga-logo.png" 
                alt="IndoSaga Furniture Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col justify-center leading-tight">
              <div className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-display font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent hover:from-accent hover:via-primary hover:to-accent transition-all duration-700 animate-slideInLeft drop-shadow-sm whitespace-nowrap">
                IndoSaga
              </div>
              <div className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-display font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent hover:from-accent hover:via-primary hover:to-accent transition-all duration-700 animate-slideInLeft drop-shadow-sm whitespace-nowrap">
                Furniture
              </div>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden xl:flex items-center space-x-6 animate-fadeIn flex-shrink-0">
            {navLinks.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-darkBrown hover:text-primary transition-all duration-500 font-semibold relative group px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 transform hover:scale-105 shadow-sm hover:shadow-lg hover:shadow-primary/20 text-sm ${
                  location === link.href ? "text-primary bg-gradient-to-r from-primary/15 to-accent/15 scale-105 shadow-md" : ""
                }`}
                style={{ 
                  animationDelay: `${index * 150}ms`,
                  animation: `slideInDown 0.8s ease-out ${index * 150}ms both`
                }}
                data-testid={`nav-${link.label.toLowerCase().replace("₹", "").replace(" ", "-")}`}
              >
                <span className="relative z-10 group-hover:animate-pulse whitespace-nowrap">{link.label}</span>
                <span className={`absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-primary via-accent to-primary transition-all duration-500 group-hover:w-full rounded-full ${
                  location === link.href ? "w-full" : ""
                }`}></span>
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></span>
              </Link>
            ))}
          </div>
          
          {/* Large Tablet Navigation */}
          <div className="hidden lg:flex xl:hidden items-center space-x-4 animate-fadeIn flex-shrink-0">
            {navLinks.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-darkBrown hover:text-primary transition-all duration-500 font-medium relative group px-2 py-1 rounded-lg hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 transform hover:scale-105 text-sm ${
                  location === link.href ? "text-primary bg-gradient-to-r from-primary/15 to-accent/15 scale-105" : ""
                }`}
                data-testid={`nav-${link.label.toLowerCase().replace("₹", "").replace(" ", "-")}`}
              >
                <span className="relative z-10 group-hover:animate-pulse whitespace-nowrap">{link.label}</span>
                <span className={`absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all duration-300 group-hover:w-full ${
                  location === link.href ? "w-full" : ""
                }`}></span>
              </Link>
            ))}
          </div>
          
          {/* Medium Tablet Navigation */}
          <div className="hidden md:flex lg:hidden items-center space-x-3 animate-fadeIn flex-shrink-0">
            {navLinks.slice(0, 4).map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-darkBrown hover:text-primary transition-all duration-500 font-medium relative group px-2 py-1 rounded-lg hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 transform hover:scale-105 text-xs ${
                  location === link.href ? "text-primary bg-gradient-to-r from-primary/15 to-accent/15" : ""
                }`}
                data-testid={`nav-${link.label.toLowerCase().replace("₹", "").replace(" ", "-")}`}
              >
                <span className="relative z-10 group-hover:animate-pulse whitespace-nowrap">{link.label}</span>
              </Link>
            ))}
          </div>
          
          {/* Small Tablet Navigation */}
          <div className="hidden sm:flex md:hidden items-center space-x-2 animate-fadeIn flex-shrink-0">
            {navLinks.slice(0, 3).map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-darkBrown hover:text-primary transition-all duration-500 font-medium relative group px-1 py-1 rounded-lg hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 text-xs ${
                  location === link.href ? "text-primary bg-gradient-to-r from-primary/15 to-accent/15" : ""
                }`}
                data-testid={`nav-${link.label.toLowerCase().replace("₹", "").replace(" ", "-")}`}
              >
                <span className="relative z-10 whitespace-nowrap">{link.label}</span>
              </Link>
            ))}
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden xl:flex items-center space-x-4 animate-slideInRight flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onWishlistClick}
              className="text-darkBrown hover:text-primary relative group px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 transition-all duration-500 transform hover:scale-105 font-medium shadow-sm hover:shadow-lg hover:shadow-primary/20 text-sm"
              data-testid="button-wishlist"
            >
              <Heart className="w-5 h-5 group-hover:animate-pulse" />
              <span className="group-hover:animate-pulse relative z-10 whitespace-nowrap ml-2">Wishlist</span>
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-primary to-accent text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold animate-bounce shadow-lg">
                  {wishlistCount}
                </span>
              )}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCartClick}
              className="text-darkBrown hover:text-primary relative group px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 transition-all duration-500 transform hover:scale-105 font-medium shadow-sm hover:shadow-lg hover:shadow-primary/20 text-sm"
              data-testid="button-cart"
            >
              <ShoppingCart className="w-5 h-5 group-hover:animate-pulse" />
              <span className="group-hover:animate-pulse relative z-10 whitespace-nowrap ml-2">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-primary to-accent text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold animate-bounce shadow-lg">
                  {cartCount}
                </span>
              )}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></span>
            </Button>
            {/* Authentication Buttons */}
            {!authLoading && (
              user ? (
                <div className="flex items-center space-x-2">
                  <Link href="/profile">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-darkBrown hover:text-primary group px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 transition-all duration-500 transform hover:scale-105 font-medium shadow-sm hover:shadow-lg hover:shadow-primary/20 relative text-sm"
                      data-testid="button-profile"
                    >
                      {user.picture ? (
                        <img 
                          src={user.picture} 
                          alt="Profile" 
                          className="w-5 h-5 rounded-full group-hover:animate-pulse" 
                        />
                      ) : (
                        <User className="w-5 h-5 group-hover:animate-pulse" />
                      )}
                      <span className="group-hover:animate-pulse relative z-10 whitespace-nowrap ml-2">
                        {user.given_name || user.name?.split(' ')[0] || user.email?.split('@')[0] || 'Profile'}
                      </span>
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></span>
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-darkBrown hover:text-red-600 group px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 transition-all duration-500 transform hover:scale-105 font-medium shadow-sm hover:shadow-lg text-sm"
                    data-testid="button-logout"
                  >
                    <LogOut className="w-5 h-5 group-hover:animate-pulse" />
                    <span className="group-hover:animate-pulse relative z-10 whitespace-nowrap ml-2">Logout</span>
                  </Button>
                </div>
              ) : (
                <a href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-darkBrown hover:text-primary group px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 transition-all duration-500 transform hover:scale-105 font-medium shadow-sm hover:shadow-lg hover:shadow-primary/20 relative text-sm"
                    data-testid="button-login"
                  >
                    <LogIn className="w-5 h-5 group-hover:animate-pulse" />
                    <span className="group-hover:animate-pulse relative z-10 whitespace-nowrap ml-2">Login</span>
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></span>
                  </Button>
                </a>
              )
            )}
          </div>
          
          {/* Large Tablet Actions */}
          <div className="hidden lg:flex xl:hidden items-center space-x-3 animate-slideInRight flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onWishlistClick}
              className="text-darkBrown hover:text-primary relative group px-2 py-2 rounded-lg hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 transition-all duration-300 transform hover:scale-105 font-medium text-sm"
              data-testid="button-wishlist"
            >
              <Heart className="w-4 h-4 group-hover:animate-pulse" />
              <span className="ml-1.5 hidden lg:inline">Wishlist</span>
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-primary to-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-bounce">
                  {wishlistCount}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCartClick}
              className="text-darkBrown hover:text-primary relative group px-2 py-2 rounded-lg hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 transition-all duration-300 transform hover:scale-105 font-medium text-sm"
              data-testid="button-cart"
            >
              <ShoppingCart className="w-4 h-4 group-hover:animate-pulse" />
              <span className="ml-1.5 hidden lg:inline">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-primary to-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-bounce">
                  {cartCount}
                </span>
              )}
            </Button>
            <Link href="/profile">
              <Button
                variant="ghost"
                size="sm"
                className="text-darkBrown hover:text-primary group px-2 py-2 rounded-lg hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 transition-all duration-300 transform hover:scale-105 font-medium text-sm"
                data-testid="button-profile"
              >
                <User className="w-4 h-4 group-hover:animate-pulse" />
                <span className="ml-1.5 hidden lg:inline">Profile</span>
              </Button>
            </Link>
          </div>
          
          {/* Medium Tablet Actions */}
          <div className="hidden md:flex lg:hidden items-center space-x-2 animate-slideInRight flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onWishlistClick}
              className="text-darkBrown hover:text-primary relative group px-2 py-1 rounded-lg hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 transition-all duration-300 font-medium text-xs"
              data-testid="button-wishlist"
            >
              <Heart className="w-4 h-4" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-primary to-accent text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold text-[8px]">
                  {wishlistCount}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCartClick}
              className="text-darkBrown hover:text-primary relative group px-2 py-1 rounded-lg hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 transition-all duration-300 font-medium text-xs"
              data-testid="button-cart"
            >
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-primary to-accent text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold text-[8px]">
                  {cartCount}
                </span>
              )}
            </Button>
            <Link href="/profile">
              <Button
                variant="ghost"
                size="sm"
                className="text-darkBrown hover:text-primary group px-2 py-1 rounded-lg hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 transition-all duration-300 font-medium text-xs"
                data-testid="button-profile"
              >
                <User className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          {/* Small Tablet Actions */}
          <div className="hidden sm:flex md:hidden items-center space-x-1 animate-slideInRight flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onWishlistClick}
              className="text-darkBrown hover:text-primary relative group px-1 py-1 rounded-lg hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 transition-all duration-300 font-medium text-xs"
              data-testid="button-wishlist"
            >
              <Heart className="w-3 h-3" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-primary to-accent text-white text-xs rounded-full w-3 h-3 flex items-center justify-center font-bold text-[6px]">
                  {wishlistCount}
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCartClick}
              className="text-darkBrown hover:text-primary relative group px-1 py-1 rounded-lg hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 transition-all duration-300 font-medium text-xs"
              data-testid="button-cart"
            >
              <ShoppingCart className="w-3 h-3" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-primary to-accent text-white text-xs rounded-full w-3 h-3 flex items-center justify-center font-bold text-[6px]">
                  {cartCount}
                </span>
              )}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="sm:hidden hover:bg-gradient-to-r hover:from-primary/10 hover:to-accent/10 transition-all duration-300 transform hover:scale-105 p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="sm:hidden bg-gradient-to-r from-white to-warmWhite border-t border-primary/20 py-4 backdrop-blur-sm animate-fadeIn">
            <div className="flex flex-col space-y-2">
              {navLinks.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-3 text-darkBrown hover:text-primary transition-all duration-300 rounded-lg mx-2 hover:bg-primary/5 font-medium transform hover:scale-[1.02] hover:shadow-sm ${
                    location === link.href ? "text-primary bg-primary/10 scale-[1.02]" : ""
                  }`}
                  style={{ 
                    animationDelay: `${index * 100}ms`,
                    animation: `slideInLeft 0.3s ease-out ${index * 100}ms both`
                  }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid={`mobile-nav-${link.label.toLowerCase().replace("₹", "").replace(" ", "-")}`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex items-center justify-center pt-4 border-t border-primary/20 gap-8">
                <Button
                  variant="ghost"
                  onClick={() => {
                    onWishlistClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex flex-col items-center space-y-1 text-darkBrown hover:text-primary relative group px-4 py-3 rounded-lg hover:bg-primary/5 transition-all duration-300 font-medium transform hover:scale-105"
                  data-testid="mobile-button-wishlist"
                >
                  <div className="relative">
                    <Heart className="w-6 h-6 group-hover:animate-pulse" />
                    {wishlistCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-gradient-to-r from-primary to-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-bounce shadow-lg">
                        {wishlistCount}
                      </span>
                    )}
                  </div>
                  <span className="group-hover:animate-pulse text-sm">Wishlist</span>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    onCartClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex flex-col items-center space-y-1 text-darkBrown hover:text-primary relative group px-4 py-3 rounded-lg hover:bg-primary/5 transition-all duration-300 font-medium transform hover:scale-105"
                  data-testid="mobile-button-cart"
                >
                  <div className="relative">
                    <ShoppingCart className="w-6 h-6 group-hover:animate-pulse" />
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-gradient-to-r from-primary to-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-bounce shadow-lg">
                        {cartCount}
                      </span>
                    )}
                  </div>
                  <span className="group-hover:animate-pulse text-sm">Cart</span>
                </Button>
                <Link href="/profile">
                  <Button
                    variant="ghost"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex flex-col items-center space-y-1 text-darkBrown hover:text-primary group px-4 py-3 rounded-lg hover:bg-primary/5 transition-all duration-300 font-medium transform hover:scale-105"
                    data-testid="mobile-button-profile"
                  >
                    <div className="relative">
                      <User className="w-6 h-6 group-hover:animate-pulse" />
                    </div>
                    <span className="group-hover:animate-pulse text-sm">Profile</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}