
import { useRoutes } from "react-router-dom";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import routes from "./routes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

const AppRoutes = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const element = useRoutes(routes);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        console.log("Session check:", data.session ? "Authenticated" : "Not authenticated");
        
        // Add this for debugging
        if (data.session) {
          console.log("User ID:", data.session.user.id);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSession();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  return element;
};

export default AppRoutes;
