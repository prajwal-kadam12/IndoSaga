import { useState, useEffect } from "react";
import { useStripe, useElements, PaymentElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Loader2, X } from "lucide-react";

// Load Stripe outside of a component's render to avoid recreating the Stripe object
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : Promise.resolve(null);

interface StripePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  productPrice: string;
  quantity: number;
  customerDetails: {
    name: string;
    email: string;
    contact: string;
    address: string;
    city: string;
    district: string;
    state: string;
    pincode: string;
  };
  onPaymentSuccess: (orderData: any) => void;
}

function CheckoutForm({
  productId,
  productName,
  productPrice,
  quantity,
  customerDetails,
  onPaymentSuccess,
  onClose
}: Omit<StripePaymentModalProps, 'isOpen'>) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    // Create PaymentIntent when component mounts
    const createPaymentIntent = async () => {
      try {
        const response = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId,
            quantity,
            currency: 'inr'
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create payment intent');
        }

        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error: any) {
        console.error('Error creating payment intent:', error);
        toast({
          title: "Payment Setup Failed",
          description: error.message || "Could not initialize payment. Please try again.",
          variant: "destructive",
        });
        onClose();
      }
    };

    createPaymentIntent();
  }, [productId, quantity, toast, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
        },
        redirect: 'if_required',
      });

      if (error) {
        console.error('Payment confirmation error:', error);
        toast({
          title: "Payment Failed",
          description: error.message || "Payment could not be processed. Please try again.",
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded, verify with backend
        try {
          const verifyResponse = await fetch("/api/verify-stripe-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              payment_intent_id: paymentIntent.id,
              customerDetails,
              productId,
              quantity
            }),
          });

          const verifyData = await verifyResponse.json();

          if (verifyData.success) {
            toast({
              title: "Payment Successful!",
              description: "Your order has been confirmed. You will receive an email confirmation shortly.",
            });
            // Navigate to order success page
            onClose();
            window.location.href = `/order-success?orderId=${verifyData.orderData.orderId}`;
          } else {
            throw new Error(verifyData.message || 'Payment verification failed');
          }
        } catch (verifyError: any) {
          console.error('Payment verification error:', verifyError);
          toast({
            title: "Verification Failed",
            description: verifyError.message || "Payment completed but order verification failed. Please contact support.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error('Payment processing error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Setting up payment...</p>
        </div>
      </div>
    );
  }

  const totalAmount = parseFloat(productPrice) * quantity;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>{productName}</span>
              <span>₹{productPrice}</span>
            </div>
            <div className="flex justify-between">
              <span>Quantity</span>
              <span>{quantity}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 border rounded-lg">
          <PaymentElement />
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!stripe || isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              `Pay ₹${totalAmount.toFixed(2)}`
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function StripePaymentModal(props: StripePaymentModalProps) {
  if (!props.isOpen) return null;

  const stripeOptions = {
    clientSecret: '', // This will be set in CheckoutForm
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#0570de',
        colorBackground: '#ffffff',
        colorText: '#30313d',
        colorDanger: '#df1b41',
        fontFamily: 'Ideal Sans, system-ui, sans-serif',
        spacingUnit: '2px',
        borderRadius: '4px',
      },
    },
  };

  const handleClose = () => {
    // Navigate to cancellation page when modal is closed
    props.onClose();
    window.location.href = '/order-cancelled?reason=Payment cancelled by user';
  };

  return (
    <Dialog open={props.isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Secure Payment
          </DialogTitle>
        </DialogHeader>

        <Elements stripe={stripePromise} options={stripeOptions}>
          <CheckoutForm {...props} />
        </Elements>
      </DialogContent>
    </Dialog>
  );
}