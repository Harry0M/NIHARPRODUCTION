import { createBrowserRouter, RouteObject } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthLayout } from "@/components/layout/AuthLayout";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import AnalysisDashboard from "@/pages/Analysis/AnalysisDashboard";
import { MaterialConsumption } from "@/pages/Analysis/MaterialConsumption";
import { PartnerPerformance } from "@/pages/Analysis/PartnerPerformance";
import { PartnersAnalysis } from "@/pages/Analysis/PartnersAnalysis";
import { RefillAnalysis } from "@/pages/Analysis/RefillAnalysis";
import { WastageAnalysis } from "@/pages/Analysis/WastageAnalysis";
import { TransactionHistory } from "@/pages/Analysis/TransactionHistory";
import { InventoryValue } from "@/pages/Analysis/InventoryValue";
import { OrderConsumption } from "@/pages/Analysis/OrderConsumption";
import { StockList } from "@/pages/Inventory/StockList";
import { StockNew } from "@/pages/Inventory/StockNew";
import { StockDetail } from "@/pages/Inventory/StockDetail";
import { CatalogList } from "@/pages/Inventory/CatalogList";
import { CatalogNew } from "@/pages/Inventory/CatalogNew";
import { CatalogDetail } from "@/pages/Inventory/CatalogDetail";
import { CatalogEdit } from "@/pages/Inventory/CatalogEdit";
import { CatalogOrders } from "@/pages/Inventory/CatalogOrders";
import { OrderList } from "@/pages/Orders/OrderList";
import { OrderNew } from "@/pages/Orders/OrderNew";
import { OrderDetail } from "@/pages/Orders/OrderDetail";
import { OrderEdit } from "@/pages/Orders/OrderEdit";
import { CompanyList } from "@/pages/Companies/CompanyList";
import { CompanyNew } from "@/pages/Companies/CompanyNew";
import { CompanyOrders } from "@/pages/Companies/CompanyOrders";
import { PartnersList } from "@/pages/Partners/PartnersList";
import { PartnerNew } from "@/pages/Partners/PartnerNew";
import SupplierList from "@/pages/SupplierList";
import SupplierNew from "@/pages/SupplierNew";
import VendorList from "@/pages/VendorList";
import VendorNew from "@/pages/VendorNew";
import { ProductionDashboard } from "@/pages/Production/ProductionDashboard";
import { JobCardList } from "@/pages/Production/JobCardList";
import { JobCardNew } from "@/pages/Production/JobCardNew";
import { JobCardDetail } from "@/pages/Production/JobCardDetail";
import { CuttingJob } from "@/pages/Production/CuttingJob";
import { PrintingJob } from "@/pages/Production/PrintingJob";
import { StitchingJob } from "@/pages/Production/StitchingJob";
import { Dispatch } from "@/pages/Production/Dispatch";
import { DispatchDetail } from "@/pages/Production/DispatchDetail";
import { CuttingJobForm } from "@/pages/Production/CuttingJobForm";
import { CuttingJobComponentForm } from "@/pages/Production/CuttingJobComponentForm";
import { CuttingJobOrderInfo } from "@/pages/Production/CuttingJobOrderInfo";
import { CuttingJobSelection } from "@/pages/Production/CuttingJobSelection";
import { PurchaseList } from "@/pages/Purchases/PurchaseList";
import { PurchaseNew } from "@/pages/Purchases/PurchaseNew";
import NotFound from "@/pages/NotFound";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <Auth />,
      },
    ],
  },
  {
    path: "/dashboard",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      // Analysis routes
      {
        path: "analysis",
        element: <AnalysisDashboard />,
      },
      {
        path: "analysis/material-consumption",
        element: <MaterialConsumption />,
      },
      {
        path: "analysis/order-consumption",
        element: <OrderConsumption />,
      },
      {
        path: "analysis/partner-performance",
        element: <PartnerPerformance />,
      },
      {
        path: "analysis/partners",
        element: <PartnersAnalysis />,
      },
      {
        path: "analysis/refill",
        element: <RefillAnalysis />,
      },
      {
        path: "analysis/wastage",
        element: <WastageAnalysis />,
      },
      {
        path: "analysis/transactions",
        element: <TransactionHistory />,
      },
      {
        path: "analysis/inventory-value",
        element: <InventoryValue />,
      },
      // Inventory routes
      {
        path: "inventory",
        element: <StockList />,
      },
      {
        path: "inventory/new",
        element: <StockNew />,
      },
      {
        path: "inventory/:id",
        element: <StockDetail />,
      },
      {
        path: "catalog",
        element: <CatalogList />,
      },
      {
        path: "catalog/new",
        element: <CatalogNew />,
      },
      {
        path: "catalog/:id",
        element: <CatalogDetail />,
      },
      {
        path: "catalog/:id/edit",
        element: <CatalogEdit />,
      },
      {
        path: "catalog/:id/orders",
        element: <CatalogOrders />,
      },
      // Orders routes
      {
        path: "orders",
        element: <OrderList />,
      },
      {
        path: "orders/new",
        element: <OrderNew />,
      },
      {
        path: "orders/:id",
        element: <OrderDetail />,
      },
      {
        path: "orders/:id/edit",
        element: <OrderEdit />,
      },
      // Companies routes
      {
        path: "companies",
        element: <CompanyList />,
      },
      {
        path: "companies/new",
        element: <CompanyNew />,
      },
      {
        path: "companies/:id/orders",
        element: <CompanyOrders />,
      },
      // Partners routes
      {
        path: "partners",
        element: <PartnersList />,
      },
      {
        path: "partners/new",
        element: <PartnerNew />,
      },
      // Suppliers routes
      {
        path: "suppliers",
        element: <SupplierList />,
      },
      {
        path: "suppliers/new",
        element: <SupplierNew />,
      },
      // Vendors routes
      {
        path: "vendors",
        element: <VendorList />,
      },
      {
        path: "vendors/new",
        element: <VendorNew />,
      },
      // Purchases routes
      {
        path: "purchases",
        element: <PurchaseList />,
      },
      {
        path: "purchases/new",
        element: <PurchaseNew />,
      },
      // Production routes
      {
        path: "production",
        element: <ProductionDashboard />,
      },
      {
        path: "production/job-cards",
        element: <JobCardList />,
      },
      {
        path: "production/job-cards/new",
        element: <JobCardNew />,
      },
      {
        path: "production/job-cards/:id",
        element: <JobCardDetail />,
      },
      {
        path: "production/cutting/:jobCardId",
        element: <CuttingJob />,
      },
      {
        path: "production/cutting-form/:jobCardId",
        element: <CuttingJobForm />,
      },
      {
        path: "production/cutting-component/:cuttingJobId/:componentId",
        element: <CuttingJobComponentForm />,
      },
      {
        path: "production/cutting-order-info/:jobCardId",
        element: <CuttingJobOrderInfo />,
      },
      {
        path: "production/cutting-selection/:jobCardId",
        element: <CuttingJobSelection />,
      },
      {
        path: "production/printing/:jobCardId",
        element: <PrintingJob />,
      },
      {
        path: "production/stitching/:jobCardId",
        element: <StitchingJob />,
      },
      {
        path: "production/dispatch",
        element: <Dispatch />,
      },
      {
        path: "production/dispatch/:id",
        element: <DispatchDetail />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
