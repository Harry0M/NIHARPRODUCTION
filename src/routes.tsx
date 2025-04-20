
import { RouteObject } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import OrderList from "./pages/Orders/OrderList";
import OrderNew from "./pages/Orders/OrderNew";
import OrderDetail from "./pages/Orders/OrderDetail";
import ProductionDashboard from "./pages/Production/ProductionDashboard";
import CuttingJob from "./pages/Production/CuttingJob";
import PrintingJob from "./pages/Production/PrintingJob";
import StitchingJob from "./pages/Production/StitchingJob";
import JobCardList from "./pages/Production/JobCardList";
import JobCardNew from "./pages/Production/JobCardNew";
import JobCardDetail from "./pages/Production/JobCardDetail";
import VendorList from "./pages/Vendors/VendorList";
import VendorNew from "./pages/Vendors/VendorNew";
import SupplierList from "./pages/Vendors/SupplierList";
import SupplierNew from "./pages/Vendors/SupplierNew";
import Dispatch from "./pages/Dispatch/Dispatch";
import InventoryList from "./pages/Inventory/InventoryList";
import InventoryNew from "./pages/Inventory/InventoryNew";
import Settings from "./pages/Settings/Settings";
import Auth from "./pages/Auth";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";

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
