
import { useRoutes } from "react-router-dom";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import routes from "./routes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { ExtendedUser } from "@/utils/roleAccess";

const AppRoutes = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { user, setUser } = useAuth();
  const element = useRoutes(routes);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session check error:", error);
          throw error;
        }
        
        console.log("Session check:", data.session ? "Authenticated" : "Not authenticated");
        
        // Add debugging info
        if (data.session) {
          console.log("User ID:", data.session.user.id);
          
          // Check for admin status using maybeSingle to handle empty results safely
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.session.user.id)
            .maybeSingle();
          
          if (profileError) {
            console.error("Error fetching profile:", profileError);
            // Even with an error, continue but log it
            setIsLoading(false);
          } else {
            console.log("User role:", profileData?.role || "Not set");
            
            // Update user context with role information
            if (data.session?.user) {
              setUser({
                ...data.session.user,
                role: profileData?.role || 'production'
              } as ExtendedUser);
            }
            setIsLoading(false);
          }
        } else {
          // No session - finish loading
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error checking session:", error);
        // Even on error, stop showing loading indicator after a delay
        setTimeout(() => setIsLoading(false), 500);
      }
    };
    
    // Add a small delay to ensure Supabase client is fully initialized
    const timer = setTimeout(() => {
      checkSession();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [setUser]);

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
