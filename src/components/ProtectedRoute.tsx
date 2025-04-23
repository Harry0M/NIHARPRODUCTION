
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  console.log("ProtectedRoute - Loading:", loading, "User:", user ? "exists" : "none");

  // Show loading state if still checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-12 w-12 animate-spin border-b-2 border-primary" />
          <p className="text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log("ProtectedRoute - No user, redirecting to /auth");
    return <Navigate to="/auth" replace />;
  }

  // Render children if authenticated
  console.log("ProtectedRoute - User authenticated, rendering children");
  return <Outlet />;
};

export default ProtectedRoute;
