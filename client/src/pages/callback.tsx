import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export default function Callback() {
  const { isAuthenticated, isLoading, error, user } = useAuth0();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleAddToCart = async (productId: string, quantity: number = 1) => {
    try {
      console.log('Adding to cart via API:', { productId, quantity });
      await apiRequest('POST', '/api/cart', { productId, quantity });
      
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: 'Added to Cart!',
        description: 'Product has been added to your cart successfully.',
      });
      // Navigate to cart after successful addition
      navigate('/cart');
    } catch (error) {
      console.error('Error adding to cart after auth:', error);
      toast({
        title: 'Error',
        description: 'Failed to add product to cart. Please try again.',
        variant: 'destructive',
      });
      navigate('/');
    }
  };

  const handleAppointmentBooking = async (appointmentData: any) => {
    try {
      const appointmentDateTime = new Date(`${appointmentData.appointmentDate}T${appointmentData.appointmentTime}`);
      
      const response = await apiRequest('POST', '/api/appointments', {
        ...appointmentData,
        appointmentDate: appointmentDateTime.toISOString(),
      });
      const result = await response.json();
      
      toast({
        title: '✅ Your appointment has been successfully booked!',
        description: `Appointment scheduled for ${new Date(appointmentData.appointmentDate).toLocaleDateString()} at ${appointmentData.appointmentTime}`,
      });
      
      // Store appointment success data and navigate to home with a success indicator
      sessionStorage.setItem('appointmentSuccess', JSON.stringify({
        id: result.id,
        customerName: appointmentData.customerName,
        date: appointmentData.appointmentDate,
        time: appointmentData.appointmentTime,
        type: appointmentData.meetingType,
        email: appointmentData.customerEmail
      }));
      
      navigate('/');
    } catch (error) {
      toast({
        title: 'Authentication required to confirm your appointment',
        description: 'Please try booking again.',
        variant: 'destructive',
      });
      navigate('/');
    }
  };

  const handleSupportTicketSubmission = async (ticketData: any) => {
    try {
      const response = await apiRequest('POST', '/api/support/tickets', ticketData);
      const result = await response.json();
      
      toast({
        title: '✅ Support ticket created successfully!',
        description: `Your ticket #${result.ticketId} has been submitted. We'll respond within 24 hours.`,
      });
      
      // Store ticket success data and navigate to home with a success indicator
      sessionStorage.setItem('ticketSuccess', JSON.stringify({
        ticketId: result.ticketId,
        customerName: ticketData.customerName,
        subject: ticketData.subject,
        priority: ticketData.priority,
        email: ticketData.customerEmail
      }));
      
      navigate('/');
    } catch (error) {
      toast({
        title: 'Authentication required to submit your support ticket',
        description: 'Please try submitting again.',
        variant: 'destructive',
      });
      navigate('/');
    }
  };

  useEffect(() => {
    const handleAuth = async () => {
      if (!isLoading) {
        if (error) {
          console.error('Auth0 error:', error);
          navigate('/login');
          return;
        }

        if (isAuthenticated && user) {
          console.log('Auth0 callback - handling authentication redirect');
          
          // FIRST: Check Auth0 appState for returnTo URL (this is the main checkout flow)
          const urlParams = new URLSearchParams(window.location.search);
          const state = urlParams.get('state');
          
          // Try to get Auth0 appState from URL or stored state
          let auth0ReturnTo = null;
          
          // First check for checkout product ID (highest priority)
          const checkoutProductId = sessionStorage.getItem('checkoutProductId');
          if (checkoutProductId) {
            auth0ReturnTo = `/product/${checkoutProductId}?checkout=true`;
            console.log('Found checkout product, redirecting to:', auth0ReturnTo);
            // Clean up the stored product ID
            sessionStorage.removeItem('checkoutProductId');
          } else {
            // TODO: In the future, properly handle Auth0 appState.returnTo
            // For now, fall back to sessionStorage methods
            console.log('No checkout product found, checking other redirect methods');
          }
          
          // If we have Auth0 returnTo, use it (this is the checkout flow)
          if (auth0ReturnTo) {
            console.log('Redirecting to Auth0 returnTo URL:', auth0ReturnTo);
            navigate(auth0ReturnTo);
            return;
          }
          
          // SECOND: Handle other pending actions from sessionStorage
          const pendingAction = sessionStorage.getItem('pendingAction');
          const pendingProductId = sessionStorage.getItem('pendingProductId');
          const pendingQuantity = sessionStorage.getItem('pendingQuantity');
          const pendingAppointmentData = sessionStorage.getItem('pendingAppointmentData');
          const pendingSupportTicketData = sessionStorage.getItem('pendingSupportTicketData');
          const returnUrl = sessionStorage.getItem('returnUrl');
          
          console.log('Checking pending actions:', { pendingAction, pendingProductId, returnUrl });
          
          if (pendingAction === 'book-appointment' && pendingAppointmentData) {
            sessionStorage.removeItem('pendingAction');
            sessionStorage.removeItem('pendingAppointmentData');
            
            const appointmentData = JSON.parse(pendingAppointmentData);
            await handleAppointmentBooking(appointmentData);
          } else if (pendingAction === 'submit-ticket' && pendingSupportTicketData) {
            sessionStorage.removeItem('pendingAction');
            sessionStorage.removeItem('pendingSupportTicketData');
            
            const ticketData = JSON.parse(pendingSupportTicketData);
            await handleSupportTicketSubmission(ticketData);
          } else if (pendingAction === 'add-to-cart' && pendingProductId) {
            sessionStorage.removeItem('pendingAction');
            sessionStorage.removeItem('pendingProductId');
            const quantity = parseInt(sessionStorage.getItem('pendingQuantity') || '1');
            sessionStorage.removeItem('pendingQuantity');
            
            // Add to cart directly and then navigate to cart
            console.log('Adding to cart after auth:', { pendingProductId, quantity });
            await handleAddToCart(pendingProductId, quantity);
          } else if (pendingAction === 'checkout') {
            sessionStorage.removeItem('pendingAction');
            navigate('/address');
          } else if (returnUrl) {
            sessionStorage.removeItem('returnUrl');
            navigate(returnUrl);
          } else {
            // Default to home if no specific action
            console.log('No pending actions, redirecting to home');
            navigate('/');
          }
        }
      }
    };
    
    handleAuth();
  }, [isAuthenticated, isLoading, error, user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-warmWhite flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-darkBrown mb-2">Completing Authentication</h2>
          <p className="text-gray-600">Please wait while we sign you in...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-warmWhite flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-darkBrown mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">There was a problem signing you in.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warmWhite flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}