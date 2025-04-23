
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { hasPermission } from "@/utils/roleAccess";

interface RoleBasedRouteProps {
  children: React.ReactNode;
  requiredFeature?: string;
}

const RoleBasedRoute = ({ children, requiredFeature }: RoleBasedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredFeature && !hasPermission(user.role, requiredFeature)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default RoleBasedRoute;
