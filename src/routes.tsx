
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import Settings from "./pages/Settings";
import Production from "./pages/Production";
import Cutting from "./pages/Production/Cutting";
import Printing from "./pages/Production/Printing";
import Stitching from "./pages/Production/Stitching";
import Dispatch from "./pages/Production/Dispatch";
import DispatchDetail from "./pages/Production/DispatchDetail";
import Catalog from "./pages/Catalog";
import Login from "./pages/Login";
import AddOrder from "./pages/AddOrder";
import EditOrder from "./pages/EditOrder";
import AddProduct from "./pages/AddProduct";
import EditProduct from "./pages/EditProduct";
import AddCatalog from "./pages/AddCatalog";
import EditCatalog from "./pages/EditCatalog";
import SalesBills from "@/pages/Sales/SalesBills";
import SalesBillNew from "@/pages/Sales/SalesBillNew";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

export const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/orders/add" element={<ProtectedRoute><AddOrder /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
        <Route path="/orders/edit/:id" element={<ProtectedRoute><EditOrder /></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
        <Route path="/products/add" element={<ProtectedRoute><AddProduct /></ProtectedRoute>} />
        <Route path="/products/edit/:id" element={<ProtectedRoute><EditProduct /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

        {/* Production Routes */}
        <Route path="/production" element={<ProtectedRoute><Production /></ProtectedRoute>} />
        <Route path="/production/cutting" element={<ProtectedRoute><Cutting /></ProtectedRoute>} />
        <Route path="/production/printing" element={<ProtectedRoute><Printing /></ProtectedRoute>} />
        <Route path="/production/stitching" element={<ProtectedRoute><Stitching /></ProtectedRoute>} />
        <Route path="/production/dispatch" element={<ProtectedRoute><Dispatch /></ProtectedRoute>} />
        <Route path="/dispatch/:id" element={<ProtectedRoute><DispatchDetail /></ProtectedRoute>} />

        {/* Catalog Routes */}
        <Route path="/catalog" element={<ProtectedRoute><Catalog /></ProtectedRoute>} />
        <Route path="/catalog/add" element={<ProtectedRoute><AddCatalog /></ProtectedRoute>} />
        <Route path="/catalog/edit/:id" element={<ProtectedRoute><EditCatalog /></ProtectedRoute>} />
        
        {/* Sales Routes */}
        <Route path="/sales/bills" element={<ProtectedRoute><SalesBills /></ProtectedRoute>} />
        <Route path="/sales/bills/new" element={<ProtectedRoute><SalesBillNew /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
};
