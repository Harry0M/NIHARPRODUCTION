
import { RouteObject } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
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
            path: "orders/:id/edit",
            element: <OrderEdit />
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
            path: "dispatch",
            element: <Dispatch />
          },
          {
            path: "dispatch/:id",
            element: <DispatchDetail />
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
