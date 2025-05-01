
import { Navigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import AuthLayout from "@/components/AuthLayout";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/NotFound";
import OrderList from "@/pages/Orders/OrderList";
import OrderNew from "@/pages/Orders/OrderNew";
import OrderDetail from "@/pages/Orders/OrderDetail";
import OrderEdit from "@/pages/Orders/OrderEdit";
import InventoryLayout from "@/pages/Inventory/InventoryLayout";
import StockList from "@/pages/Inventory/StockList";
import StockNew from "@/pages/Inventory/StockNew";
import StockDetail from "@/pages/Inventory/StockDetail";
import CatalogList from "@/pages/Inventory/CatalogList";
import ProductionDashboard from "@/pages/Production/ProductionDashboard";
import JobCardList from "@/pages/Production/JobCardList";
import JobCardNew from "@/pages/Production/JobCardNew";
import JobCardDetail from "@/pages/Production/JobCardDetail";
import CuttingJob from "@/pages/Production/CuttingJob";
import PrintingJob from "@/pages/Production/PrintingJob";
import StitchingJob from "@/pages/Production/StitchingJob";
import Dispatch from "@/pages/Production/Dispatch";
import DispatchDetail from "@/pages/Production/DispatchDetail";
import CompanyList from "@/pages/Companies/CompanyList";
import CompanyNew from "@/pages/Companies/CompanyNew";
import CompanyOrders from "@/pages/Companies/CompanyOrders";
import SupplierList from "@/pages/SupplierList";
import SupplierNew from "@/pages/SupplierNew";
import VendorList from "@/pages/VendorList";
import VendorNew from "@/pages/VendorNew";
import Index from "@/pages/Index";
import ProtectedRoute from "@/components/ProtectedRoute";

const routes = [
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { path: "", element: <Index /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: "dashboard", element: <Dashboard /> },
          {
            path: "orders",
            children: [
              { path: "", element: <OrderList /> },
              { path: "new", element: <OrderNew /> },
              { path: ":id", element: <OrderDetail /> },
              { path: ":id/edit", element: <OrderEdit /> },
            ],
          },
          {
            path: "inventory",
            element: <InventoryLayout />,
            children: [
              { path: "", element: <Navigate to="stock" replace /> },
              { path: "stock", element: <StockList /> },
              { path: "stock/new", element: <StockNew /> },
              { path: "stock/:id", element: <StockDetail /> },
              { path: "catalog", element: <CatalogList /> },
            ],
          },
          {
            path: "production",
            children: [
              { path: "", element: <ProductionDashboard /> },
              { path: "job-cards", element: <JobCardList /> },
              { path: "job-cards/new", element: <JobCardNew /> },
              { path: "job-cards/:id", element: <JobCardDetail /> },
              { path: "cutting", element: <CuttingJob /> },
              { path: "printing", element: <PrintingJob /> },
              { path: "stitching", element: <StitchingJob /> },
              { path: "dispatch", element: <Dispatch /> },
              { path: "dispatch/:id", element: <DispatchDetail /> },
            ],
          },
          {
            path: "companies",
            children: [
              { path: "", element: <CompanyList /> },
              { path: "new", element: <CompanyNew /> },
              { path: ":id/orders", element: <CompanyOrders /> },
            ],
          },
          {
            path: "suppliers",
            children: [
              { path: "", element: <SupplierList /> },
              { path: "new", element: <SupplierNew /> },
            ],
          },
          {
            path: "vendors",
            children: [
              { path: "", element: <VendorList /> },
              { path: "new", element: <VendorNew /> },
            ],
          },
        ],
      },
    ],
  },
  {
    path: "/auth",
    element: <AuthLayout />,
    children: [{ path: "", element: <Auth /> }],
  },
  { path: "*", element: <NotFound /> },
];

export default routes;
