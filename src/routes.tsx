
import { RouteObject } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import OrderList from "./pages/Orders/OrderList";
import OrderNew from "./pages/Orders/OrderNew";
import OrderDetail from "./pages/Orders/OrderDetail";
import ProductionDashboard from "./pages/Production/ProductionDashboard";
import CuttingJob from "./pages/Production/CuttingJob";
import JobCardList from "./pages/Production/JobCardList";
import JobCardNew from "./pages/Production/JobCardNew";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import ProtectedRoute from "./components/ProtectedRoute";

// Create placeholder components for routes that aren't yet implemented
const PrintingJob = () => <div className="p-8 text-center"><h1 className="text-2xl font-bold mb-4">Printing Job</h1><p className="text-muted-foreground">This feature is coming soon.</p></div>;
const StitchingJob = () => <div className="p-8 text-center"><h1 className="text-2xl font-bold mb-4">Stitching Job</h1><p className="text-muted-foreground">This feature is coming soon.</p></div>;
const JobCardDetail = () => <div className="p-8 text-center"><h1 className="text-2xl font-bold mb-4">Job Card Details</h1><p className="text-muted-foreground">This feature is coming soon.</p></div>;
const VendorList = () => <div className="p-8 text-center"><h1 className="text-2xl font-bold mb-4">Vendor List</h1><p className="text-muted-foreground">This feature is coming soon.</p></div>;
const VendorNew = () => <div className="p-8 text-center"><h1 className="text-2xl font-bold mb-4">New Vendor</h1><p className="text-muted-foreground">This feature is coming soon.</p></div>;
const SupplierList = () => <div className="p-8 text-center"><h1 className="text-2xl font-bold mb-4">Supplier List</h1><p className="text-muted-foreground">This feature is coming soon.</p></div>;
const SupplierNew = () => <div className="p-8 text-center"><h1 className="text-2xl font-bold mb-4">New Supplier</h1><p className="text-muted-foreground">This feature is coming soon.</p></div>;
const Dispatch = () => <div className="p-8 text-center"><h1 className="text-2xl font-bold mb-4">Dispatch</h1><p className="text-muted-foreground">This feature is coming soon.</p></div>;
const InventoryList = () => <div className="p-8 text-center"><h1 className="text-2xl font-bold mb-4">Inventory List</h1><p className="text-muted-foreground">This feature is coming soon.</p></div>;
const InventoryNew = () => <div className="p-8 text-center"><h1 className="text-2xl font-bold mb-4">New Inventory</h1><p className="text-muted-foreground">This feature is coming soon.</p></div>;
const Settings = () => <div className="p-8 text-center"><h1 className="text-2xl font-bold mb-4">Settings</h1><p className="text-muted-foreground">This feature is coming soon.</p></div>;

const routes: RouteObject[] = [
  {
    path: "/auth",
    element: <Auth />
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <AppLayout />,
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
            element: <OrderList />
          },
          {
            path: "orders/new",
            element: <OrderNew />
          },
          {
            path: "orders/:id",
            element: <OrderDetail />
          },
          {
            path: "production",
            element: <ProductionDashboard />
          },
          {
            path: "production/job-cards",
            element: <JobCardList />
          },
          {
            path: "production/job-cards/new",
            element: <JobCardNew />
          },
          {
            path: "production/job-cards/:id",
            element: <JobCardDetail />
          },
          {
            path: "production/cutting/:id",
            element: <CuttingJob />
          },
          {
            path: "production/printing/:id",
            element: <PrintingJob />
          },
          {
            path: "production/stitching/:id",
            element: <StitchingJob />
          },
          {
            path: "vendors",
            element: <VendorList />
          },
          {
            path: "vendors/new",
            element: <VendorNew />
          },
          {
            path: "suppliers",
            element: <SupplierList />
          },
          {
            path: "suppliers/new",
            element: <SupplierNew />
          },
          {
            path: "dispatch",
            element: <Dispatch />
          },
          {
            path: "inventory",
            element: <InventoryList />
          },
          {
            path: "inventory/new",
            element: <InventoryNew />
          },
          {
            path: "settings",
            element: <Settings />
          }
        ]
      }
    ]
  },
  {
    path: "*",
    element: <NotFound />
  }
];

export default routes;
