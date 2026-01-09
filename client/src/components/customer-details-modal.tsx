import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CustomerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (customerData: any) => void;
  orderSummary: {
    items: any[];
    total: number;
  };
}

export default function CustomerDetailsModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  orderSummary 
}: CustomerDetailsModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    shippingAddress: "",
  });

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.customerName || !formData.customerPhone || !formData.shippingAddress) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (formData.customerPhone.length < 10) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid 10-digit phone number.",
        variant: "destructive"
      });
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 pt-16 sm:pt-18 lg:pt-20 xl:pt-24 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-orange-600">Customer Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Order Summary */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Order Summary</h3>
            {orderSummary.items.map((item: any, index: number) => (
              <div key={index} className="flex justify-between items-center py-2">
                <span>{item.product?.name || item.name} x {item.quantity}</span>
                <span>₹{item.price}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center font-bold">
                <span>Total:</span>
                <span className="text-red-600">₹{orderSummary.total}</span>
              </div>
            </div>
          </div>

          {/* Customer Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Full Name *</Label>
                <Input
                  id="customerName"
                  name="customerName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Phone Number *</Label>
                <Input
                  id="customerPhone"
                  name="customerPhone"
                  type="tel"
                  placeholder="Enter 10-digit phone number"
                  value={formData.customerPhone}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="customerEmail">Email Address</Label>
              <Input
                id="customerEmail"
                name="customerEmail"
                type="email"
                placeholder="Enter your email address"
                value={formData.customerEmail}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <Label htmlFor="shippingAddress">Delivery Address *</Label>
              <Textarea
                id="shippingAddress"
                name="shippingAddress"
                placeholder="Enter your complete delivery address"
                value={formData.shippingAddress}
                onChange={handleInputChange}
                rows={3}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              Proceed to Payment
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}