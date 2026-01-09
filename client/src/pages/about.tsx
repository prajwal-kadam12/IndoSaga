import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Leaf, Gem, Award, Users, Clock } from "lucide-react";
const handCarvedImage = "/images/hand-carved-furniture.jpg";

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

export default function About() {
  // Intersection observer for statistics animation
  const { isVisible, elementRef } = useIntersectionObserver(0.3);
  
  // Animated counting values for statistics
  const animatedTrees = useCountingAnimation(10000, isVisible, 2500);
  const animatedPercentage = useCountingAnimation(100, isVisible, 2000);
  const animatedYears = useCountingAnimation(50, isVisible, 1800);

  const advantages = [
    {
      icon: Shield,
      title: "Durability",
      description: "Natural oils make IndoSaga wood resistant to insects, decay, and weather conditions, ensuring your furniture lasts for generations."
    },
    {
      icon: Leaf,
      title: "Sustainability", 
      description: "We source our wood from responsibly managed forests with proper certifications, supporting environmental conservation."
    },
    {
      icon: Gem,
      title: "Beauty",
      description: "Unique grain patterns and rich color that develops character over time, making each piece truly one-of-a-kind."
    },
    {
      icon: Award,
      title: "Craftsmanship",
      description: "Handcrafted by master artisans with decades of experience, ensuring exceptional quality in every detail."
    },
    {
      icon: Users,
      title: "Heritage",
      description: "Three generations of furniture-making expertise passed down through our family, preserving traditional techniques."
    },
    {
      icon: Clock,
      title: "Timeless",
      description: "Classic designs that never go out of style, making your investment valuable for years to come."
    }
  ];

  const milestones = [
    { year: "1965", event: "Founded by master craftsman Raghunath Sharma" },
    { year: "1982", event: "Expanded to modern showroom in Mumbai" },
    { year: "1995", event: "Introduced sustainable sourcing practices" },
    { year: "2010", event: "Third generation joins the family business" },
    { year: "2020", event: "Launched online presence and nationwide delivery" },
    { year: "2024", event: "50,000+ happy customers and counting" }
  ];

  return (
    <div className="py-20 bg-gradient-to-br from-primary/10 via-accent/10 to-warmWhite min-h-screen relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-20 left-10 w-40 h-40 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full opacity-10 animate-pulse"></div>
      <div className="absolute top-60 right-20 w-32 h-32 bg-gradient-to-br from-accent/20 to-primary/15 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute bottom-40 left-1/4 w-24 h-24 bg-gradient-to-br from-accent/25 to-primary/10 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-60 right-1/3 w-36 h-36 bg-gradient-to-br from-primary/25 to-accent/20 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '3s' }}></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-20 animate-slideInUp">
          <div className="inline-flex items-center bg-gradient-to-r from-primary/10 to-accent/10 rounded-full px-8 py-3 mb-8 shadow-lg animate-slideInDown">
            <div className="w-4 h-4 bg-gradient-to-r from-primary to-accent rounded-full mr-4 animate-pulse"></div>
            <span className="text-primary font-bold text-lg">Heritage & Craftsmanship</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold bg-gradient-to-r from-darkBrown via-primary to-accent bg-clip-text text-transparent mb-8 animate-slideInUp">
            The Heritage of IndoSaga Wood
          </h1>
          <p className="text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed animate-slideInUp" style={{ animationDelay: '0.3s' }}>
            For over three generations, we have been crafting premium furniture from the finest IndoSaga (Teak) wood. 
            Our legacy began in 1965 when our founder discovered the exceptional qualities of this remarkable timber.
          </p>
        </div>

        {/* Story Section */}
        <div className="bg-gradient-to-r from-white via-warmWhite to-white rounded-3xl shadow-2xl p-12 mb-20 relative overflow-hidden group animate-slideInUp" style={{ animationDelay: '0.5s' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-500"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
            <div className="animate-slideInLeft">
              <div className="inline-flex items-center bg-gradient-to-r from-primary/20 to-accent/20 rounded-full px-6 py-2 mb-6 shadow-lg">
                <span className="text-primary font-bold text-sm">Our Heritage</span>
              </div>
              <h2 className="text-4xl font-display font-bold bg-gradient-to-r from-darkBrown via-primary to-accent bg-clip-text text-transparent mb-8">Our Story</h2>
              <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
                <p className="animate-slideInUp" style={{ animationDelay: '0.7s' }}>
                  <span className="text-2xl font-bold text-accent float-left mr-2">I</span>ndoSaga Furniture was born from a passion for preserving the ancient art of woodworking. 
                  Our founder, master craftsman <span className="font-semibold text-primary">Raghunath Sharma</span>, started with a simple vision: to create 
                  furniture that would be treasured for generations.
                </p>
                <p className="animate-slideInUp" style={{ animationDelay: '0.9s' }}>
                  What began as a small workshop in Mumbai has grown into one of India's most trusted 
                  names in premium teak furniture. Yet, we've never lost sight of our core values: 
                  <span className="font-semibold text-primary"> quality, craftsmanship, and sustainability</span>.
                </p>
                <p className="animate-slideInUp" style={{ animationDelay: '1.1s' }}>
                  Today, we continue to honor traditional techniques while embracing modern innovations, 
                  ensuring that every piece of IndoSaga furniture tells a story of excellence.
                </p>
              </div>
              
              <div className="mt-10 space-y-5">
                {[
                  "100% Natural IndoSaga Wood",
                  "Handcrafted by Master Artisans", 
                  "Lifetime Warranty",
                  "Sustainable Sourcing"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-4 group/item animate-slideInRight" style={{ animationDelay: `${1.3 + (index * 0.1)}s` }}>
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-lg group-hover/item:shadow-xl transition-all duration-300 group-hover/item:scale-110">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-700 font-semibold text-lg group-hover/item:text-primary transition-colors duration-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="animate-slideInRight" style={{ animationDelay: '0.6s' }}>
              <div className="relative group/image">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-3xl blur-lg opacity-30 group-hover/image:opacity-50 transition-opacity duration-500"></div>
                <img 
                  src={handCarvedImage} 
                  alt="Master craftsman hand-carving IndoSaga furniture with traditional tools" 
                  className="relative rounded-3xl shadow-2xl w-full h-96 object-cover transform transition-all duration-500 group-hover/image:scale-105 group-hover/image:shadow-3xl"
                />
                {/* Clean Border Effect Only */}
                <div className="absolute inset-0 rounded-3xl ring-4 ring-accent/30 ring-opacity-50 group-hover/image:ring-opacity-100 transition-all duration-500"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Why Choose IndoSaga Wood */}
        <div className="mb-24 animate-slideInUp" style={{ animationDelay: '1.5s' }}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-gradient-to-r from-primary/10 to-accent/10 rounded-full px-8 py-3 mb-6 shadow-lg animate-slideInDown" style={{ animationDelay: '1.6s' }}>
              <div className="w-4 h-4 bg-gradient-to-r from-primary to-accent rounded-full mr-4 animate-pulse"></div>
              <span className="text-primary font-bold text-lg">Premium Quality</span>
            </div>
            <h2 className="text-5xl font-display font-bold bg-gradient-to-r from-darkBrown via-primary to-accent bg-clip-text text-transparent mb-6 animate-slideInUp" style={{ animationDelay: '1.7s' }}>Why Choose IndoSaga Wood?</h2>
            <p className="text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed animate-slideInUp" style={{ animationDelay: '1.8s' }}>Discover the exceptional qualities that make IndoSaga the premium choice for discerning homeowners</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {advantages.map((advantage, index) => (
              <Card key={index} className="group border-0 shadow-xl hover:shadow-3xl transition-all duration-500 bg-gradient-to-br from-white via-warmWhite to-accent/5 relative overflow-hidden animate-slideInUp" style={{ animationDelay: `${2 + (index * 0.1)}s` }}>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-50/50 to-orange-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-200 to-orange-200 rounded-full opacity-10 group-hover:opacity-30 transition-opacity duration-500 transform translate-x-6 -translate-y-6"></div>
                
                <CardContent className="p-10 text-center relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-full mx-auto mb-8 flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-12">
                    <advantage.icon className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-primary mb-6 group-hover:text-primary/80 transition-colors duration-300">
                    {advantage.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-lg group-hover:text-gray-700 transition-colors duration-300">
                    {advantage.description}
                  </p>
                  
                  <div className="mt-6 w-full h-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full overflow-hidden">
                    <div className="w-0 h-full bg-gradient-to-r from-primary to-accent rounded-full group-hover:w-full transition-all duration-1000 ease-out"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Our Journey */}
        <div className="mb-24 animate-slideInUp" style={{ animationDelay: '2.5s' }}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-gradient-to-r from-primary/10 to-accent/10 rounded-full px-8 py-3 mb-6 shadow-lg animate-slideInDown" style={{ animationDelay: '2.6s' }}>
              <div className="w-4 h-4 bg-gradient-to-r from-primary to-accent rounded-full mr-4 animate-pulse"></div>
              <span className="text-primary font-bold text-lg">Legacy Timeline</span>
            </div>
            <h2 className="text-5xl font-display font-bold bg-gradient-to-r from-darkBrown via-primary to-accent bg-clip-text text-transparent mb-6 animate-slideInUp" style={{ animationDelay: '2.7s' }}>Our Journey</h2>
            <p className="text-2xl text-gray-700 max-w-3xl mx-auto leading-relaxed animate-slideInUp" style={{ animationDelay: '2.8s' }}>Milestones that shaped our legacy of excellence and innovation</p>
          </div>
          
          <div className="max-w-5xl mx-auto relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-primary via-accent to-primary rounded-full opacity-30"></div>
            
            <div className="space-y-16">
              {milestones.map((milestone, index) => (
                <div key={index} className={`relative group`}>
                  {/* Floating Particles */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className={`absolute w-2 h-2 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full animate-float opacity-40`} style={{ left: '10%', top: '20%', animationDelay: `${index * 0.5}s`, animationDuration: '4s' }}></div>
                    <div className={`absolute w-1 h-1 bg-gradient-to-r from-primary to-accent rounded-full animate-float opacity-60`} style={{ right: '15%', top: '60%', animationDelay: `${index * 0.3}s`, animationDuration: '6s' }}></div>
                    <div className={`absolute w-3 h-3 bg-gradient-to-r from-orange-300 to-amber-300 rounded-full animate-float opacity-30`} style={{ left: '80%', bottom: '30%', animationDelay: `${index * 0.7}s`, animationDuration: '5s' }}></div>
                  </div>
                  
                  <div className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'} group`}>
                    <div className="flex-1 px-8">
                      <div className={`relative bg-gradient-to-br from-white via-warmWhite to-accent/5 rounded-3xl p-10 shadow-2xl transition-all duration-700 hover:shadow-4xl group-hover:scale-105 group-hover:rotate-1 ${index % 2 === 0 ? 'text-right animate-slideInLeft hover:animate-none' : 'text-left animate-slideInRight hover:animate-none'} overflow-hidden`} style={{ animationDelay: `${3 + (index * 0.3)}s`, transformStyle: 'preserve-3d' }}>
                        {/* Dynamic Background Effects */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-50/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 animate-shimmer"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-80 transition-all duration-500 group-hover:animate-pulse"></div>
                        
                        {/* Floating Decorative Elements */}
                        <div className={`absolute ${index % 2 === 0 ? 'top-4 left-4' : 'top-4 right-4'} w-20 h-20 bg-gradient-to-br from-amber-200/20 to-orange-200/20 rounded-full opacity-20 group-hover:opacity-60 transition-all duration-700 group-hover:scale-150 group-hover:rotate-45 animate-float`} style={{ animationDuration: '8s' }}></div>
                        <div className={`absolute ${index % 2 === 0 ? 'bottom-6 right-6' : 'bottom-6 left-6'} w-12 h-12 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full opacity-30 group-hover:opacity-70 transition-all duration-500 group-hover:scale-125 animate-bounce`} style={{ animationDelay: `${index * 0.2}s` }}></div>
                        
                        {/* Enhanced Glow Border */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-accent/20 to-amber-400/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-sm group-hover:animate-pulse"></div>
                        
                        <div className="relative z-10 group-hover:transform group-hover:translateZ-10">
                          {/* Year with Enhanced Effects */}
                          <div className={`inline-block ${index % 2 === 0 ? 'float-right' : 'float-left'} mb-6`}>
                            <div className="relative bg-gradient-to-r from-primary to-accent rounded-2xl px-6 py-3 shadow-lg group-hover:shadow-2xl group-hover:scale-110 transition-all duration-500 overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div>
                              <h3 className="text-2xl font-bold text-white relative z-10 group-hover:animate-pulse">{milestone.year}</h3>
                            </div>
                          </div>
                          
                          <div className="clear-both">
                            <p className="text-gray-700 font-medium text-xl leading-relaxed group-hover:text-gray-800 transition-all duration-300 group-hover:transform group-hover:translateX-2">
                              {milestone.event}
                            </p>
                          </div>
                          
                          {/* Progress Bar Animation */}
                          <div className="mt-6 w-full h-2 bg-gradient-to-r from-gray-200 to-gray-100 rounded-full overflow-hidden">
                            <div className="w-0 h-full bg-gradient-to-r from-primary via-accent to-amber-400 rounded-full group-hover:w-full transition-all duration-1500 ease-out group-hover:animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Enhanced Center Circle with 3D Effects */}
                    <div className="flex-shrink-0 relative z-20">
                      <div className="relative">
                        {/* Outer Glow Rings */}
                        <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 via-accent/30 to-amber-400/30 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-500"></div>
                        <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full opacity-50 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-700"></div>
                        
                        {/* Main Circle */}
                        <div className="w-20 h-20 bg-gradient-to-br from-primary via-accent to-amber-500 rounded-full shadow-2xl flex items-center justify-center group-hover:scale-125 group-hover:rotate-180 transition-all duration-700 group-hover:shadow-4xl relative overflow-hidden" style={{ transformStyle: 'preserve-3d' }}>
                          {/* Inner Shimmer Effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer rounded-full"></div>
                          
                          {/* Inner Circle */}
                          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500 relative z-10">
                            <div className="w-6 h-6 bg-gradient-to-br from-primary to-accent rounded-full animate-pulse group-hover:animate-bounce" style={{ animationDelay: `${index * 0.2}s` }}></div>
                          </div>
                          
                          {/* Floating Numbers */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <span className="text-white font-bold text-sm group-hover:animate-bounce" style={{ animationDelay: '0.3s' }}>{index + 1}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 px-8"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sustainability Section */}
        <Card className="bg-gradient-to-br from-accent/10 via-warmWhite to-primary/5 border-0 shadow-3xl relative overflow-hidden animate-slideInUp" style={{ animationDelay: '4s' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 opacity-50"></div>
          <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full opacity-20 transform -translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/20 to-primary/15 rounded-full opacity-20 transform translate-x-12 translate-y-12"></div>
          
          <CardContent className="p-16 text-center relative z-10">
            <div className="max-w-4xl mx-auto">
              <div className="inline-flex items-center bg-gradient-to-r from-green-100 to-accent/10 rounded-full px-8 py-3 mb-8 shadow-lg animate-slideInDown" style={{ animationDelay: '4.1s' }}>
                <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-amber-500 rounded-full mr-4 animate-pulse"></div>
                <span className="text-green-800 font-bold text-lg">Eco-Friendly</span>
              </div>
              
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-amber-500 rounded-full mx-auto mb-8 flex items-center justify-center shadow-2xl animate-bounce" style={{ animationDelay: '4.2s' }}>
                <Leaf className="h-12 w-12 text-white" />
              </div>
              
              <h2 className="text-5xl font-display font-bold bg-gradient-to-r from-green-700 via-amber-700 to-orange-700 bg-clip-text text-transparent mb-8 animate-slideInUp" style={{ animationDelay: '4.3s' }}>
                Committed to Sustainability
              </h2>
              
              <p className="text-2xl text-gray-700 mb-12 leading-relaxed animate-slideInUp" style={{ animationDelay: '4.4s' }}>
                We believe in responsible forestry and sustainable practices. All our IndoSaga wood is sourced 
                from certified plantations where trees are replanted to ensure environmental balance. 
                Every purchase supports reforestation efforts and helps preserve our planet's natural resources.
              </p>
              
              <div ref={elementRef} className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {[
                  { number: animatedTrees, suffix: "+", label: "Trees Replanted", delay: '4.5s', color: "from-green-600 to-emerald-600", bgColor: "from-green-50 to-emerald-50", accentColor: "bg-green-500" },
                  { number: animatedPercentage, suffix: "%", label: "Certified Wood", delay: '4.7s', color: "from-amber-600 to-orange-600", bgColor: "from-amber-50 to-orange-50", accentColor: "bg-amber-500" },
                  { number: animatedYears, suffix: "+", label: "Years Experience", delay: '4.9s', color: "from-orange-600 to-red-600", bgColor: "from-orange-50 to-red-50", accentColor: "bg-orange-500" }
                ].map((stat, index) => (
                  <div key={index} className="text-center group animate-slideInUp animate-bounce hover:animate-none" style={{ animationDelay: stat.delay, animationDuration: `${2 + index * 0.3}s` }}>
                    <div className="bg-gradient-to-br from-white to-amber-50 rounded-2xl p-8 shadow-lg group-hover:shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:rotate-2 hover:-translate-y-2 relative overflow-hidden animate-pulse hover:animate-none">
                      {/* Enhanced Glow Effects */}
                      <div className={`absolute inset-0 bg-gradient-to-r ${stat.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                      <div className={`absolute -inset-1 bg-gradient-to-r ${stat.color} rounded-2xl opacity-20 group-hover:opacity-40 blur-sm transition-all duration-500`}></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-transparent to-white/30 opacity-0 group-hover:opacity-60 animate-pulse transition-all duration-700"></div>
                      
                      {/* Floating Decorative Elements */}
                      <div className={`absolute -top-3 -right-3 w-8 h-8 ${stat.accentColor} rounded-full animate-bounce group-hover:animate-spin group-hover:scale-125 transition-all duration-500 opacity-70`} style={{ animationDelay: `${index * 0.2}s` }}></div>
                      <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full animate-ping opacity-40 group-hover:opacity-80"></div>
                      <div className={`absolute top-1/2 -left-2 w-4 h-4 ${stat.accentColor} rounded-full animate-pulse opacity-30 group-hover:opacity-60`} style={{ animationDelay: `${index * 0.4}s` }}></div>
                      <div className={`absolute top-2 right-2 w-3 h-3 ${stat.accentColor} rounded-full animate-ping opacity-20 group-hover:opacity-50`} style={{ animationDelay: `${index * 0.6}s` }}></div>
                      
                      <div className="relative z-10">
                        <div className={`text-5xl font-bold text-transparent bg-gradient-to-r ${stat.color} bg-clip-text mb-4 group-hover:scale-110 transition-transform duration-300 animate-pulse`}>
                          {stat.number.toLocaleString()}{stat.suffix}
                        </div>
                        <div className="text-gray-600 font-semibold text-lg group-hover:text-gray-800 transition-colors duration-300">{stat.label}</div>
                      </div>
                      
                      {/* Background Pattern */}
                      <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                        <div className="absolute top-4 left-4 w-8 h-8 border-2 border-current rounded-full animate-spin" style={{ animationDuration: '8s' }}></div>
                        <div className="absolute bottom-4 right-4 w-6 h-6 border-2 border-current rounded-full animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
