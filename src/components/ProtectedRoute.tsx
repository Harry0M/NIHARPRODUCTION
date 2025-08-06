
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { UserPermissions } from "@/types/permissions";

interface ProtectedRouteProps {
  children?: React.ReactNode;
  requiredPermission?: keyof UserPermissions;
  requiredPermissions?: (keyof UserPermissions)[];
  requireAny?: boolean; // If true, user needs any of the permissions; if false, needs all
  adminOnly?: boolean;
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredPermissions = [],
  requireAny = false,
  adminOnly = false,
  fallbackPath = '/dashboard'
}) => {
  const { user, loading } = useAuth();
  const { hasPermission, hasAllPermissions, hasAnyPermission, isAdmin } = usePermissions();

  // Show loading state if still checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check admin access
  if (adminOnly && !isAdmin()) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check single permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check multiple permissions
  if (requiredPermissions.length > 0) {
    const hasAccess = requireAny 
      ? hasAnyPermission(requiredPermissions)
      : hasAllPermissions(requiredPermissions);
    
    if (!hasAccess) {
      return <Navigate to={fallbackPath} replace />;
    }
  }

  // Render children if provided, otherwise render Outlet for nested routes
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
