
import React, { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface RoleBasedRouteProps {
  allowedRoles: string[];
  redirectTo?: string;
  children?: ReactNode;
}

const RoleBasedRoute = ({
  allowedRoles,
  redirectTo = "/dashboard",
  children
}: RoleBasedRouteProps) => {
  const { user, loading } = useAuth();

  // Show loading state if still checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user has the required role
  const hasRequiredRole = user && allowedRoles.includes(user.role || 'production');

  // Redirect if user doesn't have the required role
  if (!hasRequiredRole) {
    return <Navigate to={redirectTo} replace />;
  }

  // Render children or outlet
  return children ? <>{children}</> : <Outlet />;
};

export default RoleBasedRoute;
