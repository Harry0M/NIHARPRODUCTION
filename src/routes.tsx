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

const PrintingJob = () => <div>Printing Job (Coming Soon)</div>;
const StitchingJob = () => <div>Stitching Job (Coming Soon)</div>;
const JobCardDetail = () => <div>Job Card Detail (Coming Soon)</div>;
const VendorList = () => <div>Vendor List (Coming Soon)</div>;
const VendorNew = () => <div>New Vendor (Coming Soon)</div>;
const SupplierList = () => <div>Supplier List (Coming Soon)</div>;
const SupplierNew = () => <div>New Supplier (Coming Soon)</div>;
const Dispatch = () => <div>Dispatch (Coming Soon)</div>;
const InventoryList = () => <div>Inventory List (Coming Soon)</div>;
const InventoryNew = () => <div>New Inventory (Coming Soon)</div>;
const Settings = () => <div>Settings (Coming Soon)</div>;

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
