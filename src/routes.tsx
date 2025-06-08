
import { Navigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import AuthLayout from "@/components/layout/AuthLayout";
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
import CatalogNew from "@/pages/Inventory/CatalogNew";
import CatalogDetail from "@/pages/Inventory/CatalogDetail";
import CatalogEdit from "@/pages/Inventory/CatalogEdit";
import CatalogOrders from "@/pages/Inventory/CatalogOrders";
import PurchaseList from "@/pages/Purchases/PurchaseList";
import PurchaseNew from "@/pages/Purchases/PurchaseNew";
import PurchaseDetail from "@/pages/Purchases/PurchaseDetail";
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
import CompanyDetails from "@/pages/Companies/CompanyDetails";
import CompanyEdit from "@/pages/Companies/CompanyEdit";
import CompanyOrders from "@/pages/Companies/CompanyOrders";
import PartnersList from "@/pages/Partners/PartnersList";
import PartnerNew from "@/pages/Partners/PartnerNew";
import PartnerDetails from "@/pages/Partners/PartnerDetails";
import PartnerPerformance from "@/pages/Analysis/PartnerPerformance";
import Index from "@/pages/Index";
import ProtectedRoute from "@/components/ProtectedRoute";
import AnalysisDashboard from "@/pages/Analysis/AnalysisDashboard";
import MaterialConsumption from "@/pages/Analysis/MaterialConsumption";
import OrderConsumption from "@/pages/Analysis/OrderConsumption";
import InventoryValue from "@/pages/Analysis/InventoryValue";
import RefillAnalysis from "@/pages/Analysis/RefillAnalysis";
import TransactionHistory from "@/pages/Analysis/TransactionHistory";
import PartnersAnalysis from "@/pages/Analysis/PartnersAnalysis";
import WastageAnalysis from "@/pages/Analysis/WastageAnalysis";
import PriceTrendAnalysis from "@/pages/Analysis/PriceTrendAnalysis";
import SellsList from "@/pages/Sells/SellsList";
import SellsCreateForm from "@/pages/Sells/SellsCreateForm";
import SalesInvoiceDetail from "@/pages/Sells/SalesInvoiceDetail";
import SalesInvoiceEdit from "@/pages/Sells/SalesInvoiceEdit";

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
              { path: "stock/:id/edit", element: <StockDetail /> },
              { path: "stock/:id", element: <StockDetail /> },
              { path: "catalog", element: <CatalogList /> },
              { path: "catalog/new", element: <CatalogNew /> },
              { path: "catalog/:id", element: <CatalogDetail /> },
              { path: "catalog/:id/edit", element: <CatalogEdit /> },
              { path: "catalog/:id/orders", element: <CatalogOrders /> },
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
              { path: "cutting/:id", element: <CuttingJob /> },
              { path: "printing", element: <PrintingJob /> },
              { path: "printing/:id", element: <PrintingJob /> },
              { path: "stitching", element: <StitchingJob /> },
              { path: "stitching/:id", element: <StitchingJob /> },
              { path: "dispatch", element: <Dispatch /> },
            ],
          },
          { 
            path: "dispatch", 
            children: [
              { path: "", element: <Dispatch /> },
              { path: ":id", element: <DispatchDetail /> },
            ],
          },
          {
            path: "analysis",
            children: [
              { path: "", element: <AnalysisDashboard /> },
              { path: "materials", element: <MaterialConsumption /> },
              { path: "orders", element: <OrderConsumption /> },
              { path: "value", element: <InventoryValue /> },
              { path: "refill", element: <RefillAnalysis /> },
              { path: "transactions", element: <TransactionHistory /> },
              { path: "wastage", element: <WastageAnalysis /> },
              { path: "partners", element: <PartnersAnalysis /> },
              { path: "partner/:id/:type", element: <PartnerPerformance /> },
              { path: "price-trends", element: <PriceTrendAnalysis /> },
            ],
          },
          {
            path: "companies",
            children: [
              { path: "", element: <CompanyList /> },
              { path: "new", element: <CompanyNew /> },
              { path: ":id", element: <CompanyDetails /> },
              { path: "edit/:id", element: <CompanyEdit /> },
              { path: ":id/orders", element: <CompanyOrders /> },
            ],
          },
          {
            path: "partners",
            children: [
              { path: "", element: <PartnersList /> },
              { path: "new", element: <PartnerNew /> },
              { path: ":type/:id", element: <PartnerDetails /> },
              { path: ":type/:id/edit", element: <PartnerNew /> },
              { path: ":id/performance", element: <PartnerPerformance /> },
            ],
          },
          {
            path: "purchases",
            children: [
              { path: "", element: <PurchaseList /> },
              { path: "new", element: <PurchaseNew /> },
              { path: ":id", element: <PurchaseDetail /> },
            ],
          },
          {
            path: "sells",
            children: [
              { path: "", element: <SellsList /> },
              { path: "create/:orderId", element: <SellsCreateForm /> },
              { path: "invoice/:invoiceId", element: <SalesInvoiceDetail /> },
              { path: "invoice/:invoiceId/edit", element: <SalesInvoiceEdit /> },
            ],
          },
          // Redirects from old routes
          {
            path: "suppliers",
            children: [
              { path: "", element: <Navigate to="/partners" replace /> },
              { path: "new", element: <Navigate to="/partners/new?type=supplier" replace /> },
            ],
          },
          {
            path: "vendors",
            children: [
              { path: "", element: <Navigate to="/partners" replace /> },
              { path: "new", element: <Navigate to="/partners/new?type=vendor" replace /> },
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
