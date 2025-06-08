
import { useRoutes, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthProvider } from "@/context/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import OrderList from "@/pages/Orders/OrderList";
import OrderDetail from "@/pages/Orders/OrderDetail";
import OrderNew from "@/pages/Orders/OrderNew";
import OrderEdit from "@/pages/Orders/OrderEdit";
import CatalogList from "@/pages/Inventory/CatalogList";
import CatalogDetail from "@/pages/Inventory/CatalogDetail";
import CatalogNew from "@/pages/Inventory/CatalogNew";
import CatalogEdit from "@/pages/Inventory/CatalogEdit";
import ProductionDashboard from "@/pages/Production/ProductionDashboard";
import CuttingJob from "@/pages/Production/CuttingJob";
import PrintingJob from "@/pages/Production/PrintingJob";
import StitchingJob from "@/pages/Production/StitchingJob";
import Dispatch from "@/pages/Production/Dispatch";
import DispatchDetail from "@/pages/Production/DispatchDetail";
import Auth from "@/pages/Auth";
import SalesBills from "@/pages/Sales/SalesBills";
import SalesBillNew from "@/pages/Sales/SalesBillNew";
import ProtectedRoute from "@/components/ProtectedRoute";

const routes = [
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <AppLayout />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: "orders", element: <OrderList /> },
          { path: "orders/new", element: <OrderNew /> },
          { path: "orders/:id", element: <OrderDetail /> },
          { path: "orders/edit/:id", element: <OrderEdit /> },
          { path: "catalog", element: <CatalogList /> },
          { path: "catalog/new", element: <CatalogNew /> },
          { path: "catalog/:id", element: <CatalogDetail /> },
          { path: "catalog/edit/:id", element: <CatalogEdit /> },
          { path: "production", element: <ProductionDashboard /> },
          { path: "production/cutting", element: <CuttingJob /> },
          { path: "production/printing", element: <PrintingJob /> },
          { path: "production/stitching", element: <StitchingJob /> },
          { path: "production/dispatch", element: <Dispatch /> },
          { path: "dispatch/:id", element: <DispatchDetail /> },
          { path: "sales/bills", element: <SalesBills /> },
          { path: "sales/bills/new", element: <SalesBillNew /> },
        ],
      },
    ],
  },
];

const AppRoutes = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [initialUser, setInitialUser] = useState(null);
  
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session check error:", error);
          throw error;
        }
        
        console.log("Session check:", data.session ? "Authenticated" : "Not authenticated");
        
        if (data.session) {
          console.log("User ID:", data.session.user.id);
          
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.session.user.id)
            .maybeSingle();
          
          if (profileError) {
            console.error("Error fetching profile:", profileError);
          } else {
            console.log("User role:", profileData?.role || "Not set");
            setInitialUser({
              ...data.session.user,
              role: profileData?.role || 'production'
            });
          }
        }
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    const timer = setTimeout(() => {
      checkSession();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  const AppRouteContent = () => {
    const routeElement = useRoutes(routes);
    return routeElement || <Navigate to="/auth" replace />;
  };

  return (
    <AuthProvider initialUser={initialUser}>
      <AppRouteContent />
    </AuthProvider>
  );
};

export default AppRoutes;
