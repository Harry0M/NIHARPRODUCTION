
import { useEffect, useState } from "react";
import { RouterProvider } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { router } from "./routes";
import { supabase } from "@/integrations/supabase/client";
import { AuthProvider } from "@/context/AuthContext";

const AppRoutes = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [initialUser, setInitialUser] = useState(null);
  
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
          } else {
            console.log("User role:", profileData?.role || "Not set");
            setInitialUser({
              ...data.session.user,
              role: profileData?.role || 'production'
            });
          }
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Add a small delay to ensure Supabase client is fully initialized
    const timer = setTimeout(() => {
      checkSession();
    }, 100);
    
    return () => clearTimeout(timer);
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

  // Wrap the RouterProvider with AuthProvider
  return (
    <AuthProvider initialUser={initialUser}>
      <RouterProvider router={router} />
    </AuthProvider>
  );
};

export default AppRoutes;
