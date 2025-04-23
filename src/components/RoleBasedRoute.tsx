
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

  // Get user role, default to 'production' if not set
  const userRole = user?.role || 'production';

  // Define production sub-roles that should have equivalent permissions to 'production' role
  const productionEquivalentRoles = ['cutting', 'printing', 'stitching'];

  // Check if user has the required role directly or through equivalent roles
  const hasRequiredRole = user && (
    allowedRoles.includes(userRole) || 
    // If 'production' is allowed and user has a production sub-role, grant access
    (allowedRoles.includes('production') && productionEquivalentRoles.includes(userRole))
  );

  // Redirect if user doesn't have the required role
  if (!hasRequiredRole) {
    return <Navigate to={redirectTo} replace />;
  }

  // Render children or outlet
  return children ? <>{children}</> : <Outlet />;
};

export default RoleBasedRoute;
