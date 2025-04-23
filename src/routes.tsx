import { RouteObject } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import RoleBasedRoute from "./components/RoleBasedRoute";
import Dashboard from "./pages/Dashboard";
import OrderList from "./pages/Orders/OrderList";
import OrderNew from "./pages/Orders/OrderNew";
import OrderDetail from "./pages/Orders/OrderDetail";
import OrderEdit from "./pages/Orders/OrderEdit";
import ProductionDashboard from "./pages/Production/ProductionDashboard";
import CuttingJob from "./pages/Production/CuttingJob";
import PrintingJob from "./pages/Production/PrintingJob";
import StitchingJob from "./pages/Production/StitchingJob";
import JobCardList from "./pages/Production/JobCardList";
import JobCardNew from "./pages/Production/JobCardNew";
import JobCardDetail from "./pages/Production/JobCardDetail";
import Dispatch from "./pages/Production/Dispatch";
import DispatchDetail from "./pages/Production/DispatchDetail";
import VendorList from "./pages/VendorList";
import VendorNew from "./pages/VendorNew";
import SupplierList from "./pages/SupplierList";
import SupplierNew from "./pages/SupplierNew";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import ProtectedRoute from "./components/ProtectedRoute";

// Placeholder for future development
const InventoryList = () => <div className="p-8 text-center"><h1 className="text-2xl font-bold mb-4">Inventory List</h1><p className="text-muted-foreground">This feature is coming soon.</p></div>;
const InventoryNew = () => <div className="p-8 text-center"><h1 className="text-2xl font-bold mb-4">New Inventory</h1><p className="text-muted-foreground">This feature is coming soon.</p></div>;
const Settings = () => <div className="p-8 text-center"><h1 className="text-2xl font-bold mb-4">Settings</h1><p className="text-muted-foreground">This feature is coming soon.</p></div>;

const routes: RouteObject[] = [
  {
    path: "/auth",
    element: <Auth />
  },
  {
    element: <RoleBasedRoute><AppLayout /></RoleBasedRoute>,
    children: [
      {
        path: "",
        element: <Dashboard />
      },
      {
        path: "dashboard",
        element: <Dashboard />
      },
      {
        path: "orders",
        element: <RoleBasedRoute requiredFeature="orders"><OrderList /></RoleBasedRoute>
      },
      {
        path: "orders/new",
        element: <RoleBasedRoute requiredFeature="orders"><OrderNew /></RoleBasedRoute>
      },
      {
        path: "orders/:id",
        element: <RoleBasedRoute requiredFeature="orders"><OrderDetail /></RoleBasedRoute>
      },
      {
        path: "orders/:id/edit",
        element: <RoleBasedRoute requiredFeature="orders"><OrderEdit /></RoleBasedRoute>
      },
      {
        path: "production",
        element: <RoleBasedRoute requiredFeature="production"><ProductionDashboard /></RoleBasedRoute>
      },
      {
        path: "production/job-cards",
        element: <RoleBasedRoute requiredFeature="production"><JobCardList /></RoleBasedRoute>
      },
      {
        path: "production/job-cards/new",
        element: <RoleBasedRoute requiredFeature="production"><JobCardNew /></RoleBasedRoute>
      },
      {
        path: "production/job-cards/:id",
        element: <RoleBasedRoute requiredFeature="production"><JobCardDetail /></RoleBasedRoute>
      },
      {
        path: "production/cutting/:id",
        element: <RoleBasedRoute requiredFeature="production"><CuttingJob /></RoleBasedRoute>
      },
      {
        path: "production/printing/:id",
        element: <RoleBasedRoute requiredFeature="production"><PrintingJob /></RoleBasedRoute>
      },
      {
        path: "production/stitching/:id",
        element: <RoleBasedRoute requiredFeature="production"><StitchingJob /></RoleBasedRoute>
      },
      {
        path: "dispatch",
        element: <RoleBasedRoute requiredFeature="orders"><Dispatch /></RoleBasedRoute>
      },
      {
        path: "dispatch/:id",
        element: <RoleBasedRoute requiredFeature="orders"><DispatchDetail /></RoleBasedRoute>
      },
      {
        path: "vendors",
        element: <RoleBasedRoute requiredFeature="vendors"><VendorList /></RoleBasedRoute>
      },
      {
        path: "vendors/new",
        element: <RoleBasedRoute requiredFeature="vendors"><VendorNew /></RoleBasedRoute>
      },
      {
        path: "suppliers",
        element: <RoleBasedRoute requiredFeature="suppliers"><SupplierList /></RoleBasedRoute>
      },
      {
        path: "suppliers/new",
        element: <RoleBasedRoute requiredFeature="suppliers"><SupplierNew /></RoleBasedRoute>
      },
      {
        path: "inventory",
        element: <RoleBasedRoute requiredFeature="inventory"><InventoryList /></RoleBasedRoute>
      },
      {
        path: "inventory/new",
        element: <RoleBasedRoute requiredFeature="inventory"><InventoryNew /></RoleBasedRoute>
      },
      {
        path: "settings",
        element: <RoleBasedRoute requiredFeature="settings"><Settings /></RoleBasedRoute>
      }
    ]
  },
  {
    path: "*",
    element: <NotFound />
  }
];

export default routes;
