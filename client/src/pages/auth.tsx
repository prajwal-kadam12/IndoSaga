import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
// Removed problematic image import - using text-based logo instead

interface AuthProps {
  onAuth: () => void;
}

export default function Auth({ onAuth }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
          ...(name && { firstName: name.split(' ')[0], lastName: name.split(' ').slice(1).join(' ') })
        }),
      });

      if (response.ok) {
        const userData = await response.json();
        login(userData);
        toast({
          title: isLogin ? "Welcome back!" : "Account created!",
          description: isLogin ? "You have been logged in successfully." : "Your account has been created and you are now logged in.",
        });
        onAuth();
        // Redirect to home page after successful login
        navigate('/');
      } else {
        const error = await response.json();
        toast({
          title: "Authentication failed",
          description: error.message || "Please check your credentials and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection error",
        description: "Unable to connect to the server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = (provider: string) => {
    window.location.href = `/api/auth/${provider}`;
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <Card className="w-full max-w-md mx-auto animate-fade-in my-4 sm:my-8">
        <CardContent className="p-4 sm:p-8 max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-full overflow-hidden bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-white font-bold text-lg sm:text-xl">IS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-darkBrown">IndoSaga Furniture</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">Premium Teak Wood Collection</p>
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-lg sm:text-xl font-display font-semibold text-darkBrown">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h2>
            
            {/* OAuth Login Buttons */}
            <div className="space-y-2 sm:space-y-3">
              <Button 
                onClick={() => handleOAuthLogin('google')}
                variant="outline"
                className="w-full border-gray-300 hover:bg-gray-50 transition-colors py-2.5 sm:py-3 text-sm sm:text-base"
                data-testid="button-google-login"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
              
              <Button 
                onClick={() => handleOAuthLogin('facebook')}
                variant="outline"
                className="w-full border-gray-300 hover:bg-gray-50 transition-colors py-2.5 sm:py-3 text-sm sm:text-base"
                data-testid="button-facebook-login"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Continue with Facebook
              </Button>

              <Button 
                onClick={() => handleOAuthLogin('github')}
                variant="outline"
                className="w-full border-gray-300 hover:bg-gray-50 transition-colors py-2.5 sm:py-3 text-sm sm:text-base"
                data-testid="button-github-login"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="#181717" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Continue with GitHub
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with email</span>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {!isLogin && (
                <Input
                  name="name"
                  type="text"
                  placeholder="Full name"
                  required
                  data-testid="input-fullname"
                  className="border-secondary focus:ring-primary py-2.5 sm:py-3 text-sm sm:text-base"
                />
              )}
              <Input
                name="email"
                type="email"
                placeholder="Email address"
                required
                data-testid="input-email"
                className="border-secondary focus:ring-primary py-2.5 sm:py-3 text-sm sm:text-base"
              />
              <Input
                name="password"
                type="password"
                placeholder="Password"
                required
                data-testid="input-password"
                className="border-secondary focus:ring-primary py-2.5 sm:py-3 text-sm sm:text-base"
              />
              <Button 
                type="submit" 
                className="w-full wood-texture hover:opacity-90 py-2.5 sm:py-3 text-sm sm:text-base"
                disabled={isLoading}
                data-testid={isLogin ? "button-login" : "button-signup"}
              >
                {isLoading ? "Loading..." : (isLogin ? "Sign In" : "Create Account")}
              </Button>
            </form>
            
            <p className="text-center text-gray-600 text-sm sm:text-base">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                className="text-primary font-semibold hover:underline"
                onClick={() => setIsLogin(!isLogin)}
                data-testid={isLogin ? "link-signup" : "link-login"}
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
