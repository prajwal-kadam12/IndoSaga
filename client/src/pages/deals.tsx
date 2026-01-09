import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import ProductCard from "@/components/product-card";

// Custom hook for counting animation
const useCountingAnimation = (targetValue: number, isVisible: boolean, duration: number = 2000) => {
  const [currentValue, setCurrentValue] = useState(0);
  
  useEffect(() => {
    if (!isVisible) return;
    
    const startTime = Date.now();
    const startValue = 0;
    
    const updateCount = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const newValue = Math.floor(startValue + (targetValue - startValue) * easeOutQuart);
      
      setCurrentValue(newValue);
      
      if (progress < 1) {
        requestAnimationFrame(updateCount);
      } else {
        setCurrentValue(targetValue);
      }
    };
    
    requestAnimationFrame(updateCount);
  }, [targetValue, isVisible, duration]);
  
  return currentValue;
};

// Custom hook for intersection observer
const useIntersectionObserver = (threshold: number = 0.3) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold }
    );
    
    if (elementRef.current) {
      observer.observe(elementRef.current);
    }
    
    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [threshold]);
  
  return { isVisible, elementRef };
};

export default function Deals() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 1,
    minutes: 0,
    seconds: 0,
  });

  const { data: dealProducts = [] as any[], isLoading } = useQuery({
    queryKey: ["/api/products/deals"],
  });

  // Intersection observer for timer animation
  const { isVisible, elementRef } = useIntersectionObserver(0.3);
  
  // Animated counting values
  const animatedHours = useCountingAnimation(timeLeft.hours, isVisible, 1500);
  const animatedMinutes = useCountingAnimation(timeLeft.minutes, isVisible, 1800);
  const animatedSeconds = useCountingAnimation(timeLeft.seconds, isVisible, 2100);

  // Countdown timer - updates every second (normal speed)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else {
          // Timer reached zero, reset or handle end state
          return { hours: 0, minutes: 0, seconds: 0 };
        }
        
        return { hours, minutes, seconds };
      });
    }, 1000); // 1000ms = 1 second (normal speed)

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="py-20 bg-gradient-to-br from-primary/10 via-accent/10 to-warmWhite min-h-screen relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-10 left-10 w-40 h-40 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full opacity-10 animate-bounce" style={{ animationDuration: '3s' }}></div>
      <div className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-accent/20 to-primary/15 rounded-full opacity-15 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-20 left-20 w-28 h-28 bg-gradient-to-br from-accent/25 to-primary/10 rounded-full opacity-12 animate-ping" style={{ animationDelay: '2s', animationDuration: '2s' }}></div>
      <div className="absolute bottom-40 right-10 w-36 h-36 bg-gradient-to-br from-primary/15 to-accent/20 rounded-full opacity-8 animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '4s' }}></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16 animate-fadeInUp">
          {/* Flash Sale Badge */}
          <div className="inline-flex items-center bg-gradient-to-r from-primary to-accent text-white rounded-full px-8 py-3 mb-8 shadow-2xl animate-slideInDown transform hover:scale-105 transition-transform duration-300">
            <div className="w-4 h-4 bg-white rounded-full mr-3 animate-ping"></div>
            <span className="font-bold text-lg">🔥 FLASH SALE LIVE NOW!</span>
            <div className="w-4 h-4 bg-white rounded-full ml-3 animate-ping"></div>
          </div>
          
          <h1 className="text-6xl font-display font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-6 animate-slideInUp" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}>
            ₹1 Flash Deals
          </h1>
          <p className="text-2xl text-gray-700 max-w-2xl mx-auto leading-relaxed animate-slideInUp font-medium" style={{ animationDelay: '0.2s' }}>
            🚨 Limited time offers - Grab them before they're gone! 🚨
          </p>
          
          {/* Enhanced Timer */}
          <div ref={elementRef} className="flex justify-center space-x-6 mt-12 animate-slideInUp" style={{ animationDelay: '0.4s' }}>
            <div className="bg-gradient-to-r from-primary to-accent text-white rounded-2xl p-6 shadow-2xl relative overflow-hidden group hover:scale-110 hover:rotate-1 transition-all duration-500 animate-pulse hover:animate-none hover:shadow-accent/50 hover:shadow-2xl animate-bounce" style={{ animationDuration: '2s', animationDelay: '0.1s' }}>
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-accent/30 via-transparent to-primary/30 opacity-0 group-hover:opacity-50 animate-pulse transition-all duration-700"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary rounded-2xl opacity-20 group-hover:opacity-60 blur-sm transition-all duration-500"></div>
              <div className="relative z-10">
                <div className="text-4xl font-bold animate-pulse" data-testid="timer-hours">
                  {animatedHours.toString().padStart(2, '0')}
                </div>
                <div className="text-sm font-semibold mt-2">HOURS</div>
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent rounded-full animate-bounce group-hover:animate-spin group-hover:scale-125 transition-all duration-500"></div>
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-primary/80 rounded-full animate-ping opacity-40 group-hover:opacity-80"></div>
            </div>
            
            <div className="bg-gradient-to-r from-primary to-accent text-white rounded-2xl p-6 shadow-2xl relative overflow-hidden group hover:scale-110 hover:-rotate-1 transition-all duration-500 animate-pulse hover:animate-none hover:shadow-primary/50 hover:shadow-2xl animate-bounce" style={{ animationDuration: '2.2s', animationDelay: '0.3s' }}>
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-l from-primary/30 via-transparent to-accent/30 opacity-0 group-hover:opacity-50 animate-pulse transition-all duration-700"></div>
              <div className="absolute -inset-1 bg-gradient-to-l from-accent via-primary to-accent rounded-2xl opacity-20 group-hover:opacity-60 blur-sm transition-all duration-500"></div>
              <div className="relative z-10">
                <div className="text-4xl font-bold animate-pulse" data-testid="timer-minutes">
                  {animatedMinutes.toString().padStart(2, '0')}
                </div>
                <div className="text-sm font-semibold mt-2">MINUTES</div>
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full animate-bounce group-hover:animate-spin group-hover:scale-125 transition-all duration-500" style={{ animationDelay: '0.5s' }}></div>
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-accent/80 rounded-full animate-ping opacity-40 group-hover:opacity-80"></div>
            </div>
            
            <div className="bg-gradient-to-r from-primary to-accent text-white rounded-2xl p-6 shadow-2xl relative overflow-hidden group hover:scale-110 hover:rotate-2 transition-all duration-500 animate-pulse hover:animate-none hover:shadow-accent/50 hover:shadow-2xl animate-bounce" style={{ animationDuration: '1.8s', animationDelay: '0.5s' }}>
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30 opacity-0 group-hover:opacity-50 animate-pulse transition-all duration-700"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-accent via-primary to-accent rounded-2xl opacity-20 group-hover:opacity-60 blur-sm transition-all duration-500"></div>
              <div className="relative z-10">
                <div className="text-4xl font-bold animate-pulse" data-testid="timer-seconds">
                  {animatedSeconds.toString().padStart(2, '0')}
                </div>
                <div className="text-sm font-semibold mt-2">SECONDS</div>
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent rounded-full animate-bounce group-hover:animate-spin group-hover:scale-125 transition-all duration-500" style={{ animationDelay: '1s' }}></div>
              <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-primary/80 rounded-full animate-ping opacity-40 group-hover:opacity-80"></div>
            </div>
          </div>
          
          {/* Urgency Message */}
          <div className="mt-8 animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
            <div className="inline-flex items-center bg-gradient-to-r from-primary/10 to-accent/10 rounded-full px-6 py-3 shadow-lg border-2 border-accent/30 animate-pulse">
              <span className="text-primary font-bold text-lg">⚡ Only while stocks last! ⚡</span>
            </div>
          </div>
        </div>

        {/* Deal Products Section */}
        <div className="relative">
          <div className="text-center mb-12 animate-fadeInUp" style={{ animationDelay: '0.8s' }}>
            <div className="inline-flex items-center bg-gradient-to-r from-primary/20 to-accent/20 rounded-full px-8 py-3 mb-6 shadow-xl border border-accent/30">
              <span className="text-primary font-bold text-lg">
                🔥 {(dealProducts as any[]).length} INCREDIBLE DEALS AVAILABLE 🔥
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gradient-to-br from-white to-primary/5 rounded-3xl p-8 animate-pulse shadow-2xl border border-accent/20 relative overflow-hidden" style={{ animationDelay: `${i * 150}ms` }}>
                  <div className="absolute top-0 left-0 bg-gradient-to-r from-primary to-accent text-white px-4 py-2 text-xs font-bold rounded-br-2xl">
                    ₹1 DEAL
                  </div>
                  <div className="w-full h-64 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl mb-6 opacity-40" />
                  <div className="h-8 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl mb-4 opacity-40" />
                  <div className="h-6 bg-gradient-to-r from-accent/20 to-primary/15 rounded-lg mb-6 opacity-40" />
                  <div className="flex space-x-3">
                    <div className="h-14 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl flex-1 opacity-40" />
                    <div className="h-14 bg-gradient-to-r from-accent/20 to-primary/20 rounded-2xl flex-1 opacity-40" />
                  </div>
                </div>
              ))}
            </div>
          ) : (dealProducts as any[]).length === 0 ? (
            <div className="text-center py-20 animate-fadeInUp">
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl p-16 max-w-lg mx-auto shadow-2xl border border-accent/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full opacity-20 transform rotate-45"></div>
                <div className="w-32 h-32 bg-gradient-to-br from-primary to-accent rounded-full mx-auto mb-8 flex items-center justify-center animate-bounce relative z-10">
                  <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-3xl font-display font-bold text-primary mb-6">No Active Flash Deals</h3>
                <p className="text-primary/80 text-lg leading-relaxed">Amazing ₹1 deals are coming soon! Check back in a few hours for unbeatable offers.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10" data-testid="deals-grid">
              {(dealProducts as any[]).map((product: any, index: number) => (
                <div 
                  key={product.id} 
                  className="animate-slideInUp relative group h-full" 
                  style={{ 
                    animationDelay: `${1 + (index * 0.15)}s`,
                    animationFillMode: 'both'
                  }}
                >
                  {/* Enhanced Deal Glow Effect */}
                  <div className="absolute -inset-2 bg-gradient-to-r from-primary via-accent to-primary/80 rounded-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 animate-pulse"></div>
                  <div className="relative h-full">
                    <ProductCard product={product} showDealBadge={true} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enhanced Deal Terms */}
        <div className="mt-20 relative animate-fadeInUp" style={{ animationDelay: '1.5s' }}>
          <div className="bg-gradient-to-br from-white via-accent/5 to-primary/5 rounded-3xl p-10 shadow-2xl border border-accent/30 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-accent to-primary"></div>
            <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full opacity-20"></div>
            <div className="absolute bottom-4 left-4 w-12 h-12 bg-gradient-to-br from-accent/20 to-primary/15 rounded-full opacity-15"></div>
            
            <div className="relative z-10">
              <div className="flex items-center mb-8">
                <div className="w-3 h-3 bg-gradient-to-r from-primary to-accent rounded-full mr-4 animate-pulse"></div>
                <h3 className="text-3xl font-display font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">Deal Terms & Conditions</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-primary rounded-full mr-4 mt-2 flex-shrink-0 animate-pulse"></div>
                    <span className="text-gray-700 font-medium">Limited time offer valid only for the countdown duration</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-accent rounded-full mr-4 mt-2 flex-shrink-0 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <span className="text-gray-700 font-medium">Limited stock available - first come, first served</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-accent/80 rounded-full mr-4 mt-2 flex-shrink-0 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    <span className="text-gray-700 font-medium">Deal price applicable only during the flash sale period</span>
                  </li>
                </ul>
                
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-primary rounded-full mr-4 mt-2 flex-shrink-0 animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                    <span className="text-gray-700 font-medium">Standard shipping charges apply</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-accent rounded-full mr-4 mt-2 flex-shrink-0 animate-pulse" style={{ animationDelay: '0.8s' }}></div>
                    <span className="text-gray-700 font-medium">Cannot be combined with other offers</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-accent/80 rounded-full mr-4 mt-2 flex-shrink-0 animate-pulse" style={{ animationDelay: '1s' }}></div>
                    <span className="text-gray-700 font-medium">Products sold as-is with manufacturer warranty</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
