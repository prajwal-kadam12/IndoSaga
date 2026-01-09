import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function AuthTestButton() {
  const { toast } = useToast();

  const testLogin = () => {
    toast({
      title: "Redirecting to login...",
      description: "Testing Auth0 authentication",
    });
    
    // Direct redirect to login
    window.location.href = '/login';
  };

  return (
    <Button 
      onClick={testLogin}
      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
    >
      Test Auth0 Login
    </Button>
  );
}