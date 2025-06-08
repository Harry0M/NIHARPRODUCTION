
import React, { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  signOut: () => Promise<void>;
  loading: boolean;
  setUser: (user: User | null) => void;
}

interface AuthProviderProps {
  children: ReactNode;
  initialUser: any | null;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Create a version of AuthProvider that doesn't need router context
export const AuthProvider = ({ children, initialUser }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState(!initialUser);
  
  // Get location and navigate within router context
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Setup the auth subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
        
        // Sync auth state with routes - Using setTimeout to avoid React state update issues
        setTimeout(() => {
          if (event === "SIGNED_OUT") {
            navigate("/auth");
          } else if (event === "SIGNED_IN" && location.pathname === "/auth") {
            navigate("/"); // Navigate to root instead of /dashboard
          }
        }, 0);
      }
    );

    // Get current session
    const initializeAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    };
    
    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

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
