
import React, { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

// Extend the User type to include role information
interface ExtendedUser extends User {
  role?: 'admin' | 'production' | 'manager';
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
    // Setup the auth subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        
        // If we have a session, fetch the user's role from the profiles table
        if (currentSession?.user) {
          try {
            const { data: profileData, error } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', currentSession.user.id)
              .single();
            
            if (error) {
              console.error("Error fetching user role:", error);
              setUser(currentSession?.user ?? null);
            } else {
              // Set the user with role information
              setUser({
                ...currentSession.user,
                role: profileData?.role || 'production'
              });
            }
          } catch (err) {
            console.error("Error in auth state change:", err);
            setUser(currentSession?.user ?? null);
          }
        } else {
          setUser(null);
        }
        
        setLoading(false);
        
        // Sync auth state with routes
        if (event === "SIGNED_OUT") {
          navigate("/auth");
        } else if (event === "SIGNED_IN" && window.location.pathname === "/auth") {
          navigate("/dashboard");
        }
      }
    );

    // Get current session
    const initializeAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      
      // If we have a session, fetch the user's role
      if (currentSession?.user) {
        try {
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', currentSession.user.id)
            .single();
          
          if (error) {
            console.error("Error fetching user role:", error);
            setUser(currentSession?.user ?? null);
          } else {
            // Set the user with role information
            setUser({
              ...currentSession.user,
              role: profileData?.role || 'production'
            });
          }
        } catch (err) {
          console.error("Error initializing auth:", err);
          setUser(currentSession?.user ?? null);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    };
    
    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
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
