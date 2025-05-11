import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import AuthLayout from "./components/layout/AuthLayout";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Inventory Routes
import InventoryLayout from "./pages/Inventory/InventoryLayout";
import StockList from "./pages/Inventory/StockList";
import StockDetail from "./pages/Inventory/StockDetail";
import StockNew from "./pages/Inventory/StockNew";
import CatalogList from "./pages/Inventory/CatalogList";
import CatalogDetail from "./pages/Inventory/CatalogDetail";
import CatalogNew from "./pages/Inventory/CatalogNew";
import CatalogEdit from "./pages/Inventory/CatalogEdit";
import CatalogOrders from "./pages/Inventory/CatalogOrders";

// Order Routes
import OrderList from "./pages/Orders/OrderList";
import OrderNew from "./pages/Orders/OrderNew";
import OrderDetail from "./pages/Orders/OrderDetail";
import OrderEdit from "./pages/Orders/OrderEdit";

// Production Routes
import ProductionDashboard from "./pages/Production/ProductionDashboard";
import JobCardList from "./pages/Production/JobCardList";
import JobCardNew from "./pages/Production/JobCardNew";
import JobCardDetail from "./pages/Production/JobCardDetail";
import CuttingJob from "./pages/Production/CuttingJob";
import PrintingJob from "./pages/Production/PrintingJob";
import StitchingJob from "./pages/Production/StitchingJob";
import Dispatch from "./pages/Production/Dispatch";
import DispatchDetail from "./pages/Production/DispatchDetail";

// Partner Routes
import PartnersList from "./pages/Partners/PartnersList";
import PartnerNew from "./pages/Partners/PartnerNew";
import VendorList from "./pages/VendorList";
import VendorNew from "./pages/VendorNew";
import SupplierList from "./pages/SupplierList";
import SupplierNew from "./pages/SupplierNew";

// Company Routes
import CompanyList from "./pages/Companies/CompanyList";
import CompanyNew from "./pages/Companies/CompanyNew";
import CompanyOrders from "./pages/Companies/CompanyOrders";

// Analysis Routes
import AnalysisDashboard from "./pages/Analysis/AnalysisDashboard";
import InventoryValue from "./pages/Analysis/InventoryValue";
import MaterialConsumption from "./pages/Analysis/MaterialConsumption";
import OrderConsumption from "./pages/Analysis/OrderConsumption";
import PartnersAnalysis from "./pages/Analysis/PartnersAnalysis";
import RefillAnalysis from "./pages/Analysis/RefillAnalysis";
import TransactionHistory from "./pages/Analysis/TransactionHistory";
import PartnerPerformance from "./pages/Analysis/PartnerPerformance";
import WastageAnalysis from "./pages/Analysis/WastageAnalysis";

// Index Page
import Index from "./pages/Index";
import ProtectedRoute from "./components/ProtectedRoute";

export const routes = [
  {
    path: "/inventory",
    element: <InventoryLayout />,
    children: [
      { path: "stock", element: <StockList /> },
      { path: "stock/:id", element: <StockDetail /> },
      { path: "stock/new", element: <StockNew /> },
      { path: "catalog", element: <CatalogList /> },
      { path: "catalog/:id", element: <CatalogDetail /> },
      { path: "catalog/new", element: <CatalogNew /> },
      { path: "catalog/:id/edit", element: <CatalogEdit /> },
      { path: "catalog/:id/orders", element: <CatalogOrders /> },
    ],
  },
  {
    path: "/orders",
    element: <ProtectedRoute />,
    children: [
      { index: true, element: <OrderList /> },
      { path: "new", element: <OrderNew /> },
      { path: ":id", element: <OrderDetail /> },
      { path: ":id/edit", element: <OrderEdit /> },
    ],
  },
  {
    path: "/production",
    element: <ProtectedRoute />,
    children: [
      { index: true, element: <ProductionDashboard /> },
      { path: "job-cards", element: <JobCardList /> },
      { path: "job-cards/new", element: <JobCardNew /> },
      { path: "job-cards/:id", element: <JobCardDetail /> },
      { path: "cutting/:id", element: <CuttingJob /> },
      { path: "printing/:id", element: <PrintingJob /> },
      { path: "stitching/:id", element: <StitchingJob /> },
	  { path: "dispatch", element: <Dispatch /> },
    { path: "dispatch/:id", element: <DispatchDetail /> },
    ],
  },
  {
    path: "/partners",
    element: <ProtectedRoute />,
    children: [
      { index: true, element: <PartnersList /> },
      { path: "new", element: <PartnerNew /> },
    ],
  },
  {
    path: "/vendors",
    element: <ProtectedRoute />,
    children: [
      { index: true, element: <VendorList /> },
      { path: "new", element: <VendorNew /> },
    ],
  },
  {
    path: "/suppliers",
    element: <ProtectedRoute />,
    children: [
      { index: true, element: <SupplierList /> },
      { path: "new", element: <SupplierNew /> },
    ],
  },
  {
    path: "/companies",
    element: <ProtectedRoute />,
    children: [
      { index: true, element: <CompanyList /> },
      { path: "new", element: <CompanyNew /> },
	  { path: ":id/orders", element: <CompanyOrders /> },
    ],
  },
];

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Index /> },
      { path: "dashboard", element: <Dashboard /> },
      
      // Analysis routes
      {
        path: "analysis",
        children: [
          { index: true, element: <AnalysisDashboard /> },
          { path: "inventory-value", element: <InventoryValue /> },
          { path: "material-consumption", element: <MaterialConsumption /> },
          { path: "order-consumption", element: <OrderConsumption /> },
          { path: "partners", element: <PartnersAnalysis /> },
          { path: "refill-analysis", element: <RefillAnalysis /> },
          { path: "transaction-history", element: <TransactionHistory /> },
          { path: "partner-performance", element: <PartnerPerformance /> },
          { path: "wastage", element: <WastageAnalysis /> }, // Add this new route
        ],
      },
      
      {
        path: "/inventory",
        element: <InventoryLayout />,
        children: [
          { path: "stock", element: <StockList /> },
          { path: "stock/:id", element: <StockDetail /> },
          { path: "stock/new", element: <StockNew /> },
          { path: "catalog", element: <CatalogList /> },
          { path: "catalog/:id", element: <CatalogDetail /> },
          { path: "catalog/new", element: <CatalogNew /> },
          { path: "catalog/:id/edit", element: <CatalogEdit /> },
          { path: "catalog/:id/orders", element: <CatalogOrders /> },
        ],
      },
      {
        path: "/orders",
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <OrderList /> },
          { path: "new", element: <OrderNew /> },
          { path: ":id", element: <OrderDetail /> },
          { path: ":id/edit", element: <OrderEdit /> },
        ],
      },
      {
        path: "/production",
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <ProductionDashboard /> },
          { path: "job-cards", element: <JobCardList /> },
          { path: "job-cards/new", element: <JobCardNew /> },
          { path: "job-cards/:id", element: <JobCardDetail /> },
          { path: "cutting/:id", element: <CuttingJob /> },
          { path: "printing/:id", element: <PrintingJob /> },
          { path: "stitching/:id", element: <StitchingJob /> },
          { path: "dispatch", element: <Dispatch /> },
          { path: "dispatch/:id", element: <DispatchDetail /> },
        ],
      },
      {
        path: "/partners",
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <PartnersList /> },
          { path: "new", element: <PartnerNew /> },
        ],
      },
      {
        path: "/vendors",
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <VendorList /> },
          { path: "new", element: <VendorNew /> },
        ],
      },
      {
        path: "/suppliers",
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <SupplierList /> },
          { path: "new", element: <SupplierNew /> },
        ],
      },
      {
        path: "/companies",
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <CompanyList /> },
          { path: "new", element: <CompanyNew /> },
          { path: ":id/orders", element: <CompanyOrders /> },
        ],
      },
    ],
  },
  {
    path: "/auth",
    element: <AuthLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Auth /> },
    ],
  }
]);

export default router;
