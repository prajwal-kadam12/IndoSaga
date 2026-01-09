import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";
import Auth0ProviderWrapper from "@/components/auth0-provider";
import { isAuth0Configured } from "@/lib/auth0-config";
import { useAuthSync } from "@/hooks/use-auth-sync";

import Navigation from "@/components/navigation";
import CartModal from "@/components/cart-modal";
import WishlistModal from "@/components/wishlist-modal";
import HelpdeskModal from "@/components/helpdesk-modal";
import AppointmentModal from "@/components/appointment-modal";
import VideoCallModal from "@/components/video-call-modal";
import FloatingChatbot from "@/components/floating-chatbot";
import ScrollToTop from "@/components/scroll-to-top";
import RouteScrollToTop from "@/components/route-scroll-to-top";
import AuthRedirectHandler from "@/components/auth-redirect-handler";
import Home from "@/pages/home";
import Products from "@/pages/products";
import ProductDetail from "@/pages/product-detail";
import Cart from "@/pages/cart";
import Wishlist from "@/pages/wishlist";
import Profile from "@/pages/profile";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Deals from "@/pages/deals";
import Login from "@/pages/login";
import Callback from "@/pages/callback";

import NotFound from "@/pages/not-found";
import AddressPage from "@/pages/address";
import PaymentPage from "@/pages/payment";
import CODPaymentPage from "@/pages/payment-cod";
import PaymentSuccessPage from "@/pages/payment-success";
import OrderSuccessPage from "@/pages/order-success";
import OrderCancelledPage from "@/pages/order-cancelled";
import CheckoutPage from "@/pages/checkout";

function AppContent() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isHelpdeskOpen, setIsHelpdeskOpen] = useState(false);
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [videoCallDetails, setVideoCallDetails] = useState({ appointmentId: "", customerName: "" });
  
  // Sync Auth0 user with server session when available
  useAuthSync();

  return (
    <div className="min-h-screen bg-warmWhite">
      <Navigation 
        onCartClick={() => setIsCartOpen(true)}
        onWishlistClick={() => setIsWishlistOpen(true)}
      />
      
      <main>
        <Switch>
        <Route path="/" component={Home} />
        <Route path="/IndoSaga/" component={Home} />
        <Route path="/products" component={Products} />
        <Route path="/product/:id" component={ProductDetail} />
        <Route path="/cart" component={Cart} />
        <Route path="/wishlist" component={Wishlist} />
        <Route path="/profile" component={Profile} />
        <Route path="/orders" component={Profile} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route path="/deals" component={Deals} />
        
        {/* Auth Routes */}
        <Route path="/login" component={Login} />
        <Route path="/callback" component={Callback} />
        
        {/* Checkout Flow Routes */}
        <Route path="/checkout" component={CheckoutPage} />
        <Route path="/address" component={AddressPage} />
        <Route path="/payment" component={PaymentPage} />
        <Route path="/payment/cod" component={CODPaymentPage} />
        <Route path="/payment/success" component={PaymentSuccessPage} />
        <Route path="/order-success" component={OrderSuccessPage} />
        <Route path="/order-cancelled" component={OrderCancelledPage} />
        
        <Route component={NotFound} />
        </Switch>
      </main>

      <CartModal 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
      />
      <WishlistModal 
        isOpen={isWishlistOpen} 
        onClose={() => setIsWishlistOpen(false)} 
      />
      <HelpdeskModal 
        isOpen={isHelpdeskOpen} 
        onClose={() => setIsHelpdeskOpen(false)} 
      />
      <AppointmentModal 
        isOpen={isAppointmentOpen} 
        onClose={() => setIsAppointmentOpen(false)} 
      />
      <VideoCallModal 
        isOpen={isVideoCallOpen} 
        onClose={() => setIsVideoCallOpen(false)}
        appointmentId={videoCallDetails.appointmentId}
        customerName={videoCallDetails.customerName}
      />
      <FloatingChatbot 
        onSupportClick={() => setIsHelpdeskOpen(true)}
        onBookCallClick={() => setIsAppointmentOpen(true)}
      />
      <ScrollToTop />
      <RouteScrollToTop />
      <AuthRedirectHandler />
      
      <Toaster />
    </div>
  );
}

function App() {
  // Always use Auth0Provider - no more demo mode
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Auth0ProviderWrapper>
          <AppContent />
        </Auth0ProviderWrapper>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
