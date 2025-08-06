
import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
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
  refreshSession: () => Promise<void>;
  isTokenExpired: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
  initialUser: User | null;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export { AuthContext };

// Create a version of AuthProvider that doesn't need router context
export const AuthProvider = ({ children, initialUser }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(initialUser);
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [permissions, setPermissions] = useState<UserPermissions>(getPermissionsForRole('admin'));
  const [loading, setLoading] = useState(!initialUser);
  const [isTokenExpired, setIsTokenExpired] = useState(false);
  
  // Get location and navigate within router context
  const navigate = useNavigate();
  const location = useLocation();

  // Check if token is close to expiry (within 5 minutes)
  const checkTokenExpiry = useCallback((session: Session | null) => {
    if (!session) {
      setIsTokenExpired(false);
      return;
    }
    
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at || 0;
    const fiveMinutes = 5 * 60; // 5 minutes in seconds
    
    setIsTokenExpired(expiresAt - now < fiveMinutes);
  }, []);

  // Refresh the session manually
  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Error refreshing session:', error);
        throw error;
      }
      
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        checkTokenExpiry(data.session);
        // Note: loadUserRole will be called from the effect
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
      // If refresh fails, sign out the user
      await supabase.auth.signOut();
    }
  }, [checkTokenExpiry]);

  // Load user role from profiles table or metadata, with better error handling
  const loadUserRole = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setUserRole('admin');
      setPermissions(getPermissionsForRole('admin'));
      return;
    }

    try {
      // First try to get role from profiles table with timeout
      const profileQuery = supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single();

      // Set a timeout for the database query
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile query timeout')), 5000);
      });

      let profile = null;
      let profileError = null;

      try {
        const result = await Promise.race([profileQuery, timeoutPromise]) as { data: { role?: string } | null; error: Error | null };
        profile = result.data;
        profileError = result.error;
      } catch (error) {
        console.warn('Profile query timed out or failed:', error);
        profileError = error;
      }

      let role: UserRole = 'admin'; // Default fallback

      if (!profileError && profile?.role) {
        // Use role from profiles table
        role = profile.role as UserRole;
        console.log('Role loaded from profiles table:', role);
      } else {
        // Fallback to user metadata
        role = currentUser.user_metadata?.role as UserRole || 'admin';
        console.log('Role loaded from metadata or default:', role);
        
        // If we have a role from metadata but profiles table failed, 
        // try to sync it in the background (don't wait for it)
        if (currentUser.user_metadata?.role && profileError) {
          supabase.from('profiles').upsert({
            id: currentUser.id,
            email: currentUser.email,
            role: currentUser.user_metadata.role,
            updated_at: new Date().toISOString()
          }).then(({ error }) => {
            if (error) {
              console.warn('Failed to sync role to profiles table:', error);
            } else {
              console.log('Role synced to profiles table');
            }
          });
        }
      }

      setUserRole(role);
      setPermissions(getPermissionsForRole(role));
    } catch (error) {
      console.error('Error loading user role:', error);
      // Fallback to default with metadata check
      const role = currentUser.user_metadata?.role as UserRole || 'admin';
      setUserRole(role);
      setPermissions(getPermissionsForRole(role));
    }
  }, []);

  // Update user role (admin only function) with better sync
  const updateUserRole = async (role: UserRole) => {
    if (!user || permissions.canManageUsers !== true) {
      throw new Error('Unauthorized: Only admin can update user roles');
    }

    try {
      // Update user metadata first
      const { error: authError } = await supabase.auth.updateUser({
        data: { role }
      });

      if (authError) throw authError;

      // Map frontend roles to database enum values
      const dbRoleMapping: Record<UserRole, string> = {
        'admin': 'admin',
        'staff': 'manager', // Map staff to manager in database
        'printer': 'production',
        'cutting': 'production', 
        'stitching': 'production',
      };

      const dbRole = dbRoleMapping[role];

      // Also update profiles table if the role exists in database enum
      if (dbRole) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            role: dbRole as Database["public"]["Enums"]["user_role"],
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          console.warn('Failed to update role in profiles table:', profileError);
        }
      }

      setUserRole(role);
      setPermissions(getPermissionsForRole(role));
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  };

  useEffect(() => {
    // Setup the auth subscription with enhanced token refresh handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state change:', event);
        
        // Handle different auth events
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setUserRole('admin');
          setPermissions(getPermissionsForRole('admin'));
          setIsTokenExpired(false);
          
          setTimeout(() => {
            navigate("/auth");
          }, 0);
          return;
        }
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(currentSession);
          const currentUser = currentSession?.user ?? null;
          setUser(currentUser);
          
          // Check token expiry
          checkTokenExpiry(currentSession);
          
          // Load user role and permissions
          await loadUserRole(currentUser);
          
          setLoading(false);
          
          // Navigate to dashboard on sign in
          if (event === 'SIGNED_IN' && location.pathname === "/auth") {
            setTimeout(() => {
              navigate("/dashboard");
            }, 0);
          }
        }
        
        // Handle session updates for all events
        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);
        checkTokenExpiry(currentSession);
      }
    );

    // Get current session and setup periodic token check
    const initializeAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);
      
      // Check token expiry
      checkTokenExpiry(currentSession);
      
      // Load user role and permissions
      await loadUserRole(currentUser);
      
      setLoading(false);
    };
    
    initializeAuth();

    // Setup periodic token expiry check (every minute)
    const tokenCheckInterval = setInterval(() => {
      // Get current session for token check
      supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
        checkTokenExpiry(currentSession);
      });
    }, 60000);

    return () => {
      subscription.unsubscribe();
      clearInterval(tokenCheckInterval);
    };
  }, [navigate, location.pathname, checkTokenExpiry, loadUserRole]);

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
      updateUserRole,
      refreshSession,
      isTokenExpired
    }}>
      {children}
    </AuthContext.Provider>
  );
};
