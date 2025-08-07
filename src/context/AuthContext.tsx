
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
  const [roleLoaded, setRoleLoaded] = useState(false);
  
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
  const loadUserRole = useCallback(async (currentUser: User | null, forceReload = false) => {
    if (!currentUser) {
      setUserRole('admin');
      setPermissions(getPermissionsForRole('admin'));
      setRoleLoaded(true);
      return;
    }

    // Skip if role already loaded and not forcing reload
    if (roleLoaded && !forceReload) {
      return;
    }

    try {
      // First try to get role from profiles table with timeout
      const profileQuery = supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single();

      // Set a timeout for the database query (reduced to 3 seconds for better UX)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile query timeout')), 3000);
      });

      let profile = null;
      let profileError = null;

      try {
        const result = await Promise.race([profileQuery, timeoutPromise]) as { data: { role?: string } | null; error: Error | null };
        profile = result.data;
        profileError = result.error;
      } catch (error) {
        console.debug('Profile query timed out or failed:', error);
        profileError = error;
      }

      let role: UserRole = 'admin'; // Default fallback

      if (!profileError && profile?.role) {
        // Map database enum values back to frontend roles
        // Prioritize database role over metadata since DB is the source of truth
        const dbRole = profile.role;
        const metadataRole = currentUser.user_metadata?.role as UserRole;
        
        if (dbRole === 'admin') {
          role = 'admin';
        } else if (dbRole === 'staff') {
          role = 'staff'; // Staff in DB = Staff in frontend (direct mapping)
        } else if (dbRole === 'production') {
          // For production, prefer metadata role only if it's a production type
          // Otherwise default to printer
          if (metadataRole && ['printer', 'cutting', 'stitching'].includes(metadataRole)) {
            role = metadataRole;
          } else {
            role = 'printer'; // Default production role
          }
        } else if (dbRole === 'vendor') {
          role = 'admin'; // Fallback for vendor
        } else {
          role = 'admin'; // Unknown role fallback
        }
        
        console.debug('Role loaded from profiles table:', dbRole, '→', role, '(metadata:', metadataRole, ')');
      } else {
        // Fallback to user metadata
        const metadataRole = currentUser.user_metadata?.role as UserRole;
        role = metadataRole || 'admin';
        console.debug('Role loaded from metadata or default:', role, '(metadata:', metadataRole, ')');
        
        // If we have a role from metadata but profiles table failed, 
        // try to sync it in the background (don't wait for it)
        if (metadataRole && profileError) {
          // Map frontend roles to database enum values for sync
          const dbRoleMapping: Record<UserRole, string> = {
            'admin': 'admin',
            'staff': 'staff', // Map staff to staff in database (direct mapping)
            'printer': 'production',
            'cutting': 'production', 
            'stitching': 'production',
          };

          const dbRole = dbRoleMapping[metadataRole];
          
          if (dbRole) {
            supabase.from('profiles').upsert({
              id: currentUser.id,
              email: currentUser.email,
              role: dbRole as Database["public"]["Enums"]["user_role"],
              updated_at: new Date().toISOString()
            }).then(({ error }) => {
              if (error) {
                console.debug('Failed to sync role to profiles table:', error);
              } else {
                console.debug('Role synced to profiles table:', metadataRole, '→', dbRole);
              }
            });
          }
        }
      }

      setUserRole(role);
      setPermissions(getPermissionsForRole(role));
      setRoleLoaded(true);
    } catch (error) {
      console.error('Error loading user role:', error);
      // Fallback to default with metadata check
      const role = currentUser.user_metadata?.role as UserRole || 'admin';
      setUserRole(role);
      setPermissions(getPermissionsForRole(role));
      setRoleLoaded(true);
    }
  }, [roleLoaded]);

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
        'staff': 'staff', // Map staff to staff in database (direct mapping)
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
        console.debug('Auth state change:', event);
        
        // Handle different auth events
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setUserRole('admin');
          setPermissions(getPermissionsForRole('admin'));
          setIsTokenExpired(false);
          setRoleLoaded(false);
          
          setTimeout(() => {
            navigate("/auth");
          }, 0);
          return;
        }
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          setSession(currentSession);
          const currentUser = currentSession?.user ?? null;
          setUser(currentUser);
          
          // Check token expiry
          checkTokenExpiry(currentSession);
          
          // Load user role and permissions (force reload for SIGNED_IN to ensure fresh data)
          const shouldForceReload = event === 'SIGNED_IN';
          await loadUserRole(currentUser, shouldForceReload);
          
          setLoading(false);
          
          // Navigate to dashboard on sign in (but not on initial session load)
          if (event === 'SIGNED_IN' && location.pathname === "/auth") {
            setTimeout(() => {
              navigate("/dashboard");
            }, 0);
          }
          
          return; // Exit early to avoid duplicate processing
        }
        
        // Handle any other session updates
        if (currentSession) {
          setSession(currentSession);
          const currentUser = currentSession?.user ?? null;
          setUser(currentUser);
          checkTokenExpiry(currentSession);
        }
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
      
      // Load user role and permissions (force reload during initialization)
      await loadUserRole(currentUser, true);
      
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
