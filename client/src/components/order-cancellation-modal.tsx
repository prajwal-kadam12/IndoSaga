import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, AlertTriangle, Mail, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface OrderCancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: any;
  onCancellationComplete: () => void;
}

export default function OrderCancellationModal({ 
  isOpen, 
  onClose, 
  orderData,
  onCancellationComplete 
}: OrderCancellationModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    reason: "",
    details: "",
    customerEmail: "",
    customerName: ""
  });

  // Get current user data to auto-populate form
  const { data: user, isError: isAuthError, isLoading: isAuthLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
    enabled: isOpen, // Only fetch when modal is open
  });

  // Auto-populate customer information when modal opens
  useEffect(() => {
    if (isOpen && !isAuthLoading) {
      if (user && !isAuthError) {
        // User is authenticated - auto-populate with server data
        const currentUser = {
          name: user ? ((user as any).name || `${(user as any).given_name || ''} ${(user as any).family_name || ''}`.trim() || 'User') : "User",
          email: (user as any)?.email || "",
        };
        
        setFormData(prev => ({
          ...prev,
          customerName: currentUser.name,
          customerEmail: currentUser.email
        }));
      } else if (isAuthError) {
        // User is not authenticated - clear form and they must enter manually
        setFormData(prev => ({
          ...prev,
          customerName: "",
          customerEmail: ""
        }));
      }
    }
  }, [isOpen, user, isAuthError, isAuthLoading]);

  const cancellationReasons = [
    "Changed my mind",
    "Found a better price elsewhere", 
    "Product not needed anymore",
    "Delivery time is too long",
    "Quality concerns",
    "Financial reasons",
    "Ordered by mistake",
    "Other"
  ];

  const handleCancelOrder = async () => {
    if (!formData.reason) {
      toast({
        variant: "destructive",
        title: "Reason Required",
        description: "Please select a reason for cancellation."
      });
      return;
    }

    if (!formData.customerEmail || !formData.customerName) {
      toast({
        variant: "destructive", 
        title: "Contact Information Required",
        description: "Please provide your email and name for confirmation."
      });
      return;
    }

    setIsLoading(true);
    try {
      // SECURITY FIX: Only send reason and details - server will use authenticated user data
      const response = await apiRequest("POST", `/api/orders/${orderData.id}/cancel`, {
        reason: formData.reason,
        details: formData.details
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Order Cancelled Successfully",
          description: "Cancellation confirmation emails have been sent."
        });
        onCancellationComplete();
        onClose();
        
        // Reset form
        setFormData({
          reason: "",
          details: "",
          customerEmail: "",
          customerName: ""
        });
      } else {
        throw new Error(result.message || "Failed to cancel order");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Cancellation Failed",
        description: error.message || "Unable to cancel the order. Please contact support."
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 pt-16 sm:pt-18 lg:pt-20 xl:pt-24 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Cancel Order</h3>
              <p className="text-sm text-gray-500">Order #{orderData?.id?.slice(-8).toUpperCase()}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800">Important Information</h4>
                <ul className="mt-2 text-sm text-amber-700 space-y-1">
                  <li>• Order cancellation is subject to our cancellation policy</li>
                  <li>• Refund processing may take 5-7 business days</li>
                  <li>• You will receive a confirmation email shortly</li>
                  <li>• For urgent cancellations, contact our support team</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Contact Information</h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <Input
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  placeholder="Enter your full name"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <Input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                  placeholder="Enter your email address"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Cancellation Reason */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Reason for Cancellation *</h4>
            <div className="grid grid-cols-1 gap-2">
              {cancellationReasons.map((reason) => (
                <label key={reason} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    value={reason}
                    checked={formData.reason === reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Additional Details */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Additional Details (Optional)</h4>
            <Textarea
              value={formData.details}
              onChange={(e) => setFormData({...formData, details: e.target.value})}
              placeholder="Please provide any additional information about the cancellation..."
              rows={3}
              className="w-full"
            />
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Order Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Order Total:</span>
                <span className="font-medium">₹{orderData?.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-amber-600">{orderData?.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Items:</span>
                <span className="font-medium">{orderData?.orderItems?.length || 0} items</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="px-6"
          >
            Keep Order
          </Button>
          <Button
            onClick={handleCancelOrder}
            disabled={isLoading}
            className="px-6 bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Cancelling...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <X className="w-4 h-4" />
                <span>Cancel Order</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}