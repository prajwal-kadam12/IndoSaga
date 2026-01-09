import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Check, Package, Truck, MapPin, Home, Clock } from 'lucide-react';

interface TrackingStage {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
  date?: string;
  location?: string;
  icon: React.ReactNode;
}

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: any;
}

const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  orderData
}) => {
  if (!orderData) return null;

  // Generate tracking ID if not present
  const trackingId = orderData.trackingId || `TR${orderData.id.slice(-8).toUpperCase()}`;
  
  // Calculate order progress based on status
  const getOrderStages = (orderStatus: string): TrackingStage[] => {
    const orderDate = new Date(orderData.createdAt);
    const statusLower = orderStatus.toLowerCase();
    
    const stages: TrackingStage[] = [
      {
        id: 'placed',
        title: 'Order Placed',
        description: 'We have received your order and payment',
        status: 'completed',
        date: orderDate.toLocaleDateString('en-IN', { 
          day: 'numeric', 
          month: 'short', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        location: 'Mumbai, India',
        icon: <Package className="w-5 h-5" />
      },
      {
        id: 'processing',
        title: 'Order Processing',
        description: 'Your order is being prepared for shipment',
        status: statusLower === 'pending' ? 'current' : 'completed',
        date: statusLower !== 'pending' ? new Date(orderDate.getTime() + 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { 
          day: 'numeric', 
          month: 'short', 
          hour: '2-digit',
          minute: '2-digit'
        }) : undefined,
        location: 'Warehouse, Mumbai',
        icon: <Clock className="w-5 h-5" />
      },
      {
        id: 'shipped',
        title: 'Shipped',
        description: 'Your order has been shipped and is on its way',
        status: statusLower === 'processing' ? 'current' : statusLower === 'shipped' || statusLower === 'delivered' ? 'completed' : 'pending',
        date: statusLower === 'shipped' || statusLower === 'delivered' ? new Date(orderDate.getTime() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { 
          day: 'numeric', 
          month: 'short', 
          hour: '2-digit',
          minute: '2-digit'
        }) : undefined,
        location: 'In Transit',
        icon: <Truck className="w-5 h-5" />
      },
      {
        id: 'out-for-delivery',
        title: 'Out for Delivery',
        description: 'Your package is out for delivery and will arrive today',
        status: statusLower === 'shipped' ? 'current' : statusLower === 'delivered' ? 'completed' : 'pending',
        date: statusLower === 'delivered' ? new Date(orderDate.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { 
          day: 'numeric', 
          month: 'short', 
          hour: '2-digit',
          minute: '2-digit'
        }) : undefined,
        location: 'Local Delivery Hub',
        icon: <MapPin className="w-5 h-5" />
      },
      {
        id: 'delivered',
        title: 'Delivered',
        description: 'Your order has been successfully delivered',
        status: statusLower === 'delivered' ? 'completed' : 'pending',
        date: statusLower === 'delivered' ? new Date(orderDate.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { 
          day: 'numeric', 
          month: 'short', 
          hour: '2-digit',
          minute: '2-digit'
        }) : undefined,
        location: 'Delivered to Customer',
        icon: <Home className="w-5 h-5" />
      }
    ];

    // Handle cancelled status
    if (statusLower === 'cancelled') {
      return stages.map((stage, index) => ({
        ...stage,
        status: index === 0 ? 'completed' : 'pending' as const
      }));
    }

    return stages;
  };

  const stages = getOrderStages(orderData.status || 'pending');
  const currentStageIndex = stages.findIndex(stage => stage.status === 'current');
  const progressPercentage = currentStageIndex >= 0 
    ? ((currentStageIndex + 0.5) / stages.length) * 100 
    : (stages.filter(s => s.status === 'completed').length / stages.length) * 100;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-500';
      case 'shipped': return 'bg-blue-500';
      case 'processing': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getExpectedDelivery = () => {
    const orderDate = new Date(orderData.createdAt);
    const deliveryDate = new Date(orderDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    return deliveryDate.toLocaleDateString('en-IN', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long', 
      year: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            Track Your Order
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Order ID</p>
                <p className="font-semibold">{orderData.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tracking ID</p>
                <p className="font-semibold text-primary">{trackingId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge className={`${getStatusColor(orderData.status)} text-white`}>
                  {orderData.status ? orderData.status.charAt(0).toUpperCase() + orderData.status.slice(1) : 'Pending'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Expected Delivery</p>
                <p className="font-semibold text-green-600">{getExpectedDelivery()}</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Order Progress</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Tracking Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Order Journey</h3>
            <div className="relative">
              {stages.map((stage, index) => (
                <div key={stage.id} className="flex items-start gap-4 pb-6 relative">
                  {/* Vertical Line */}
                  {index < stages.length - 1 && (
                    <div 
                      className={`absolute left-6 top-12 w-0.5 h-16 ${
                        stage.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  )}
                  
                  {/* Icon */}
                  <div 
                    className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${
                      stage.status === 'completed' 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : stage.status === 'current'
                        ? 'bg-primary border-primary text-white animate-pulse'
                        : 'bg-gray-100 border-gray-300 text-gray-500'
                    }`}
                  >
                    {stage.status === 'completed' ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      stage.icon
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className={`font-semibold ${
                          stage.status === 'completed' ? 'text-green-700' : 
                          stage.status === 'current' ? 'text-primary' : 'text-gray-500'
                        }`}>
                          {stage.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">{stage.description}</p>
                        {stage.location && (
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {stage.location}
                          </p>
                        )}
                      </div>
                      {stage.date && (
                        <div className="text-right text-sm text-gray-500">
                          {stage.date}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Items */}
          {orderData.orderItems && orderData.orderItems.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3">Items in this Order</h3>
              <div className="space-y-2">
                {orderData.orderItems.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-medium">{item.product?.name || 'Product'}</span>
                    <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Help Section */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Need Help?</h4>
            <p className="text-sm text-blue-700">
              If you have any questions about your order, please contact our customer support at 
              <span className="font-semibold"> +91 98765 43210</span> or email us at 
              <span className="font-semibold"> support@indosaga.com</span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderTrackingModal;