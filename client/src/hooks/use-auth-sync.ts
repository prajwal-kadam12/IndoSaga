import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useAuthSync() {
  const { user, isAuthenticated, isLoading } = useAuth0();
  const queryClient = useQueryClient();

  useEffect(() => {
    const syncAuth = async () => {
      if (isAuthenticated && user && !isLoading) {
        try {
          // Get localStorage cart items to migrate
          const localCartItems = JSON.parse(localStorage.getItem('localCart') || '[]');
          
          const response = await fetch('/api/auth/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              user, 
              localCartItems 
            }),
          });

          if (response.ok) {
            // Clear localStorage cart after successful migration
            if (localCartItems.length > 0) {
              localStorage.removeItem('localCart');
              console.log(`Successfully migrated ${localCartItems.length} cart items to authenticated account`);
              
              // Dispatch cart update event to refresh UI
              window.dispatchEvent(new Event('cartUpdated'));
              
              // Invalidate cart queries to refresh from database
              queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
            }
            
            // Invalidate auth queries to refresh user data
            queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
          }
        } catch (error) {
          console.error('Failed to sync authentication:', error);
        }
      }
    };

    syncAuth();
  }, [isAuthenticated, user, isLoading, queryClient]);
}