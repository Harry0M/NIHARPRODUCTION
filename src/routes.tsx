import { createBrowserRouter } from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";
import AuthLayout from "./components/layout/AuthLayout";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import OrderList from "./pages/Orders/OrderList";
import OrderNew from "./pages/Orders/OrderNew";
import OrderDetail from "./pages/Orders/OrderDetail";
import OrderEdit from "./pages/Orders/OrderEdit";
import StockList from "@/pages/Inventory/StockList";
import StockNew from "./pages/Inventory/StockNew";
import StockDetail from "./pages/Inventory/StockDetail";
import CatalogList from "./pages/Inventory/CatalogList";
import CatalogNew from "./pages/Inventory/CatalogNew";
import CatalogDetail from "./pages/Inventory/CatalogDetail";
import CatalogEdit from "./pages/Inventory/CatalogEdit";
import CatalogOrders from "./pages/Inventory/CatalogOrders";
import SupplierList from "./pages/SupplierList";
import SupplierNew from "./pages/SupplierNew";
import CompanyList from "./pages/Companies/CompanyList";
import CompanyNew from "./pages/Companies/CompanyNew";
import CompanyOrders from "./pages/Companies/CompanyOrders";
import VendorList from "./pages/VendorList";
import VendorNew from "./pages/VendorNew";
import ProductionDashboard from "./pages/Production/ProductionDashboard";
import JobCardList from "./pages/Production/JobCardList";
import JobCardNew from "./pages/Production/JobCardNew";
import JobCardDetail from "./pages/Production/JobCardDetail";
import CuttingJob from "./pages/Production/CuttingJob";
import PrintingJob from "./pages/Production/PrintingJob";
import StitchingJob from "./pages/Production/StitchingJob";
import CuttingJobSelection from "./pages/Production/CuttingJobSelection";
import CuttingJobComponentForm from "./pages/Production/CuttingJobComponentForm";
import CuttingJobOrderInfo from "./pages/Production/CuttingJobOrderInfo";
import CuttingJobForm from "./pages/Production/CuttingJobForm";
import Dispatch from "./pages/Production/Dispatch";
import DispatchDetail from "./pages/Production/DispatchDetail";
import CuttingJobDetailsForm from "./pages/Production/cutting/CuttingJobDetailsForm";
import PartnersList from "./pages/Partners/PartnersList";
import PartnerNew from "./pages/Partners/PartnerNew";
import NotFound from "./pages/NotFound";
import AnalysisDashboard from "./pages/Analysis/AnalysisDashboard";
import InventoryValue from "./pages/Analysis/InventoryValue";
import MaterialConsumption from "./pages/Analysis/MaterialConsumption";
import OrderConsumption from "./pages/Analysis/OrderConsumption";
import RefillAnalysis from "./pages/Analysis/RefillAnalysis";
import TransactionHistory from "./pages/Analysis/TransactionHistory";
import PartnerAnalysis from "./pages/Analysis/PartnerAnalysis";

import ProtectedRoute from "./components/ProtectedRoute";

// Export the router for use in AppRoutes.tsx
export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />
      },
      {
        path: "orders",
        children: [
          { path: "", element: <OrderList /> },
          { path: "new", element: <OrderNew /> },
          { path: ":id", element: <OrderDetail /> },
          { path: ":id/edit", element: <OrderEdit /> }
        ]
      },
      {
        path: "inventory",
        children: [
          { path: "stock", element: <StockList /> },
          { path: "stock/new", element: <StockNew /> },
          { path: "stock/:id", element: <StockDetail /> },
          { path: "catalog", element: <CatalogList /> },
          { path: "catalog/new", element: <CatalogNew /> },
          { path: "catalog/:id", element: <CatalogDetail /> },
          { path: "catalog/:id/edit", element: <CatalogEdit /> },
          { path: "catalog/:id/orders", element: <CatalogOrders /> }
        ]
      },
      {
        path: "suppliers",
        children: [
          { path: "", element: <SupplierList /> },
          { path: "new", element: <SupplierNew /> }
        ]
      },
      {
        path: "companies",
        children: [
          { path: "", element: <CompanyList /> },
          { path: "new", element: <CompanyNew /> },
          { path: ":id/orders", element: <CompanyOrders /> }
        ]
      },
      {
        path: "vendors",
        children: [
          { path: "", element: <VendorList /> },
          { path: "new", element: <VendorNew /> }
        ]
      },
      {
        path: "partners",
        children: [
          { path: "", element: <PartnersList /> },
          { path: "new", element: <PartnerNew /> }
        ]
      },
      {
        path: "production",
        children: [
          { path: "", element: <ProductionDashboard /> },
          { 
            path: "job-cards", 
            children: [
              { path: "", element: <JobCardList /> },
              { path: "new", element: <JobCardNew /> },
              { path: ":id", element: <JobCardDetail /> },
              { path: ":id/cutting", element: <CuttingJob /> },
              { path: ":id/printing", element: <PrintingJob /> },
              { path: ":id/stitching", element: <StitchingJob /> }
            ]
          },
          {
            path: "cutting",
            children: [
              { path: "", element: <CuttingJobSelection /> },
              { path: ":id/components", element: <CuttingJobComponentForm /> },
              { path: ":id/info", element: <CuttingJobOrderInfo /> },
              { path: ":id/form", element: <CuttingJobForm /> },
              { path: ":id/details", element: <CuttingJobDetailsForm /> }
            ]
          },
          {
            path: "dispatch",
            children: [
              { path: "", element: <Dispatch /> },
              { path: ":id", element: <DispatchDetail /> }
            ]
          }
        ]
      },
      {
        path: "analysis",
        children: [
          { path: "", element: <AnalysisDashboard /> },
          { path: "inventory-value", element: <InventoryValue /> },
          { path: "material-consumption", element: <MaterialConsumption /> },
          { path: "order-consumption", element: <OrderConsumption /> },
          { path: "refill-analysis", element: <RefillAnalysis /> },
          { path: "transaction-history", element: <TransactionHistory /> },
          { path: "partner-performance", element: <PartnerAnalysis /> }
        ]
      }
    ]
  },
  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      {
        path: "",
        element: <Auth />
      }
    ]
  },
  {
    path: "*",
    element: <NotFound />
  }
]);

// Export default for AppRoutes.tsx
export default router;
