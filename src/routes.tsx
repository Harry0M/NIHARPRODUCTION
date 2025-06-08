
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
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

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" />;
  }

  return <>{children}</>;
};

export const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrderList /></ProtectedRoute>} />
        <Route path="/orders/new" element={<ProtectedRoute><OrderNew /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
        <Route path="/orders/edit/:id" element={<ProtectedRoute><OrderEdit /></ProtectedRoute>} />
        <Route path="/catalog" element={<ProtectedRoute><CatalogList /></ProtectedRoute>} />
        <Route path="/catalog/new" element={<ProtectedRoute><CatalogNew /></ProtectedRoute>} />
        <Route path="/catalog/:id" element={<ProtectedRoute><CatalogDetail /></ProtectedRoute>} />
        <Route path="/catalog/edit/:id" element={<ProtectedRoute><CatalogEdit /></ProtectedRoute>} />

        {/* Production Routes */}
        <Route path="/production" element={<ProtectedRoute><ProductionDashboard /></ProtectedRoute>} />
        <Route path="/production/cutting" element={<ProtectedRoute><CuttingJob /></ProtectedRoute>} />
        <Route path="/production/printing" element={<ProtectedRoute><PrintingJob /></ProtectedRoute>} />
        <Route path="/production/stitching" element={<ProtectedRoute><StitchingJob /></ProtectedRoute>} />
        <Route path="/production/dispatch" element={<ProtectedRoute><Dispatch /></ProtectedRoute>} />
        <Route path="/dispatch/:id" element={<ProtectedRoute><DispatchDetail /></ProtectedRoute>} />
        
        {/* Sales Routes */}
        <Route path="/sales/bills" element={<ProtectedRoute><SalesBills /></ProtectedRoute>} />
        <Route path="/sales/bills/new" element={<ProtectedRoute><SalesBillNew /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
};
