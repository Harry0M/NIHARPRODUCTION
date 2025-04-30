
import { RouteObject, Navigate } from "react-router-dom";
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
import CompanyList from "@/pages/Companies/CompanyList";
import CompanyNew from "@/pages/Companies/CompanyNew";
import CompanyOrders from "./pages/Companies/CompanyOrders";
import InventoryLayout from "./pages/Inventory/InventoryLayout";
import StockList from "./pages/Inventory/StockList";
import CatalogList from "./pages/Inventory/CatalogList";
import CatalogNew from "./pages/Inventory/CatalogNew";
import CatalogOrders from "./pages/Inventory/CatalogOrders";
import StockJournal from "./pages/Inventory/StockJournal";
import StockJournalList from "./pages/Inventory/StockJournalList";
import StockJournalDetail from "./pages/Inventory/StockJournalDetail";
import StockNew from "./pages/Inventory/StockNew";
import StockDetail from "./pages/Inventory/StockDetail";

// Placeholder for future development
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
            path: "/companies",
            element: <CompanyList />
          },
          {
            path: "/companies/new",
            element: <CompanyNew />
          },
          {
            path: "/companies/:id/orders",
            element: <CompanyOrders />
          },
          {
            path: "/inventory",
            element: <InventoryLayout />,
            children: [
              {
                path: "",
                element: <Navigate to="/inventory/stock" replace />
              },
              {
                path: "stock",
                element: <StockList />
              },
              {
                path: "stock/:id",
                element: <StockDetail />
              },
              {
                path: "stock/new",
                element: <StockNew />
              },
              {
                path: "stock/journal",
                element: <StockJournal />
              },
              {
                path: "stock/journal/list",
                element: <StockJournalList />
              },
              {
                path: "stock/journal/:id",
                element: <StockJournalDetail />
              },
              {
                path: "catalog",
                element: <CatalogList />
              },
              {
                path: "catalog/new",
                element: <CatalogNew />
              },
              {
                path: "catalog/:id/orders",
                element: <CatalogOrders />
              }
            ]
          },
          {
            path: "settings",
            element: <Settings />
          },
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
