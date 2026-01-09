import { useEffect } from "react";
import { useLocation } from "wouter";

export default function RouteScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    // Scroll to top whenever the route changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant" // Use instant behavior for immediate scroll
    });
  }, [location]);

  return null; // This component doesn't render anything
}