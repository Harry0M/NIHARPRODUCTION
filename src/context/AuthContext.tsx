
import React, { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  signOut: () => Promise<void>;
  loading: boolean;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // Keep this inside the component body

  useEffect(() => {
    // Setup the auth subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
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
      setUser(currentSession?.user ?? null);
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
