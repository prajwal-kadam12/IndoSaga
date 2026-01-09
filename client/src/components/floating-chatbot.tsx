import { useState } from "react";
import { MessageCircle, Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FloatingChatbotProps {
  onSupportClick: () => void;
  onBookCallClick: () => void;
}

export default function FloatingChatbot({ onSupportClick, onBookCallClick }: FloatingChatbotProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-24 right-4 md:right-8 z-50 flex flex-col items-end space-y-3">
      {/* Quick Action Buttons - Show when expanded */}
      {isExpanded && (
        <div className="flex flex-col space-y-2 animate-fadeIn">
          {/* Support Button - Green */}
          <Button
            onClick={() => {
              onSupportClick();
              setIsExpanded(false);
            }}
            className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-w-[100px] md:min-w-[120px]"
            data-testid="floating-support-button"
          >
            <span className="text-lg">💬</span>
            <span className="font-medium text-sm">Support</span>
          </Button>

          {/* Book Call Button - Blue */}
          <Button
            onClick={() => {
              onBookCallClick();
              setIsExpanded(false);
            }}
            className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 md:px-4 md:py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-w-[100px] md:min-w-[120px]"
            data-testid="floating-book-call-button"
          >
            <span className="text-lg">📞</span>
            <span className="font-medium text-sm">Book Call</span>
          </Button>
        </div>
      )}

      {/* Main Chatbot Toggle Button */}
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-14 h-14 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center"
        data-testid="floating-chatbot-toggle"
      >
        {isExpanded ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </Button>
    </div>
  );
}