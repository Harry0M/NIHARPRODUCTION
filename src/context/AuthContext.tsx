
import React, { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

// Extend the User type to include role information
interface ExtendedUser extends User {
  role?: 'admin' | 'production' | 'manager' | 'vendor' | 'cutting' | 'printing' | 'stitching';
}

interface AuthContextProps {
  session: Session | null;
  user: ExtendedUser | null;
  signOut: () => Promise<void>;
  loading: boolean;
  setUser: (user: ExtendedUser | null) => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("AuthProvider initializing");
    
    // First get the current session
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        
        // If we have a session, fetch the user's role
        if (currentSession?.user) {
          console.log("Found existing session for user:", currentSession.user.id);
          
          try {
            const { data: profileData, error } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', currentSession.user.id)
              .maybeSingle();
            
            if (error) {
              console.error("Error fetching user role:", error);
              setUser({
                ...currentSession.user,
                role: 'production'
              });
            } else {
              // Set the user with role information
              setUser({
                ...currentSession.user,
                role: profileData?.role || 'production'
              });
              console.log("User role set to:", profileData?.role || 'production');
            }
          } catch (err) {
            console.error("Error initializing auth:", err);
            setUser({
              ...currentSession.user,
              role: 'production'
            });
          }
        } else {
          console.log("No session found during initialization");
          setUser(null);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error during auth initialization:", error);
        setLoading(false);
      }
    };
    
    initializeAuth();
    
    // Then setup the auth subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state change:", event);
        
        setSession(currentSession);
        
        // If we have a session, fetch the user's role from the profiles table
        if (currentSession?.user) {
          // Prevent race conditions by using setTimeout
          setTimeout(async () => {
            try {
              const { data: profileData, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', currentSession.user.id)
                .maybeSingle();
              
              if (error) {
                console.error("Error fetching user role:", error);
                setUser({
                  ...currentSession.user,
                  role: 'production'
                });
              } else {
                // Set the user with role information
                setUser({
                  ...currentSession.user,
                  role: profileData?.role || 'production'
                });
              }
            } catch (err) {
              console.error("Error in auth state change:", err);
              setUser({
                ...currentSession.user,
                role: 'production'
              });
            }
          }, 0);
        } else {
          setUser(null);
        }
        
        // Sync auth state with routes
        if (event === "SIGNED_OUT") {
          navigate("/auth", { replace: true });
        } else if (event === "SIGNED_IN" && window.location.pathname === "/auth") {
          navigate("/dashboard", { replace: true });
        }
      }
    );

    return () => {
      console.log("Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <AuthContext.Provider value={{ session, user, signOut, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
