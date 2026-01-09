import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Smartphone, QrCode, CreditCard, Wallet } from 'lucide-react';

interface PaymentOption {
  id: string;
  icon: React.ComponentType<any>;
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
}

interface PaymentOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMethod: (method: string) => void;
  total: number;
}

export default function PaymentOptionsModal({ 
  isOpen, 
  onClose, 
  onSelectMethod, 
  total 
}: PaymentOptionsModalProps) {
  if (!isOpen) return null;

  const paymentOptions: PaymentOption[] = [
    {
      id: 'stripe',
      icon: CreditCard,
      title: 'Card Payment',
      subtitle: 'Pay with Credit/Debit Card - Secure & Fast',
      badge: 'Recommended',
      badgeColor: 'text-green-600'
    },
    {
      id: 'phonepe',
      icon: Smartphone,
      title: 'PhonePe',
      subtitle: 'Pay securely with PhonePe UPI',
      badge: 'UPI',
      badgeColor: 'text-blue-600'
    },
    {
      id: 'qr',
      icon: QrCode,
      title: 'UPI QR Code',
      subtitle: 'Scan QR code with any UPI app',
      badge: 'Instant',
      badgeColor: 'text-blue-600'
    },
    {
      id: 'gpay',
      icon: Smartphone,
      title: 'Google Pay',
      subtitle: 'Quick payment with Google Pay',
      badge: 'Fast',
      badgeColor: 'text-blue-600'
    },
    {
      id: 'cod',
      icon: Wallet,
      title: 'Cash on Delivery',
      subtitle: 'Pay when your order arrives',
      badge: 'Convenient',
      badgeColor: 'text-orange-600'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">Payment Options</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Total Amount */}
        <div className="px-6 py-4 bg-red-50 border-b">
          <div className="text-2xl font-bold text-red-600">₹{total}</div>
          <div className="text-sm text-gray-600">Choose Payment Method</div>
        </div>

        {/* Payment Options */}
        <div className="p-6 space-y-3">
          {paymentOptions.map((option) => (
            <div
              key={option.id}
              onClick={() => onSelectMethod(option.id)}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <option.icon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">{option.title}</div>
                  <div className="text-sm text-gray-500">{option.subtitle}</div>
                </div>
              </div>
              {option.badge && (
                <div className={`text-sm font-medium ${option.badgeColor}`}>
                  {option.badge}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}