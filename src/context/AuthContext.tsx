
import React, { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { UserRole, UserPermissions, getPermissionsForRole } from "@/types/permissions";

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  userRole: UserRole;
  permissions: UserPermissions;
  signOut: () => Promise<void>;
  loading: boolean;
  setUser: (user: User | null) => void;
  updateUserRole: (role: UserRole) => Promise<void>;
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
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [permissions, setPermissions] = useState<UserPermissions>(getPermissionsForRole('admin'));
  const [loading, setLoading] = useState(!initialUser);
  
  // Get location and navigate within router context
  const navigate = useNavigate();
  const location = useLocation();

  // Load user role from metadata or default to admin for existing users
  const loadUserRole = async (currentUser: User | null) => {
    if (!currentUser) {
      setUserRole('admin');
      setPermissions(getPermissionsForRole('admin'));
      return;
    }

    // Check user metadata for role
    const role = currentUser.user_metadata?.role as UserRole || 'admin';
    setUserRole(role);
    setPermissions(getPermissionsForRole(role));
  };

  // Update user role (admin only function)
  const updateUserRole = async (role: UserRole) => {
    if (!user || permissions.canManageUsers !== true) {
      throw new Error('Unauthorized: Only admin can update user roles');
    }

    try {
      const { error } = await supabase.auth.updateUser({
        data: { role }
      });

      if (error) throw error;

      setUserRole(role);
      setPermissions(getPermissionsForRole(role));
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  };

  useEffect(() => {
    // Setup the auth subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);
        
        // Load user role and permissions
        await loadUserRole(currentUser);
        
        setLoading(false);
        
        // Sync auth state with routes - Using setTimeout to avoid React state update issues
        setTimeout(() => {
          if (event === "SIGNED_OUT") {
            navigate("/auth");
          } else if (event === "SIGNED_IN" && location.pathname === "/auth") {
            navigate("/dashboard");
          }
        }, 0);
      }
    );

    // Get current session
    const initializeAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);
      
      // Load user role and permissions
      await loadUserRole(currentUser);
      
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
    <AuthContext.Provider value={{ 
      session, 
      user, 
      userRole, 
      permissions, 
      signOut, 
      loading, 
      setUser, 
      updateUserRole 
    }}>
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
