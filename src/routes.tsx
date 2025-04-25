import { RouteObject } from "react-router-dom";
import OrderList from "@/pages/Orders/OrderList";
import OrderNew from "@/pages/Orders/OrderNew";
import OrderDetail from "@/pages/Orders/OrderDetail";
import OrderEdit from "@/pages/Orders/OrderEdit";
import ProductionHome from "@/pages/Production/ProductionHome";
import JobCardList from "@/pages/Production/JobCardList";
import JobCardNew from "@/pages/Production/JobCardNew";
import JobCardDetail from "@/pages/Production/JobCardDetail";
import InventoryList from "@/pages/Inventory/InventoryList";
import InventoryNew from "@/pages/Inventory/InventoryNew";
import InventoryEdit from "@/pages/Inventory/InventoryEdit";
import SupplierList from "@/pages/Suppliers/SupplierList";
import SupplierNew from "@/pages/Suppliers/SupplierNew";
import SupplierEdit from "@/pages/Suppliers/SupplierEdit";
import TransactionList from "@/pages/Transactions/TransactionList";
import TransactionNew from "@/pages/Transactions/TransactionNew";
import TransactionEdit from "@/pages/Transactions/TransactionEdit";
import VendorList from "@/pages/Vendors/VendorList";
import VendorNew from "@/pages/Vendors/VendorNew";
import VendorEdit from "@/pages/Vendors/VendorEdit";
import CuttingJobDetail from "@/pages/Production/CuttingJobDetail";
import PrintingJobDetail from "@/pages/Production/PrintingJobDetail";
import StitchingJobDetail from "@/pages/Production/StitchingJobDetail";
import CompanyList from "@/pages/Companies/CompanyList";
import CompanyNew from "@/pages/Companies/CompanyNew";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <OrderList />,
  },
  {
    path: "/orders",
    element: <OrderList />,
  },
  {
    path: "/orders/new",
    element: <OrderNew />,
  },
  {
    path: "/orders/:id",
    element: <OrderDetail />,
  },
  {
    path: "/orders/:id/edit",
    element: <OrderEdit />,
  },
  {
    path: "/production",
    element: <ProductionHome />,
  },
  {
    path: "/production/job-cards",
    element: <JobCardList />,
  },
  {
    path: "/production/job-cards/new",
    element: <JobCardNew />,
  },
  {
    path: "/production/job-cards/:id",
    element: <JobCardDetail />,
  },
  {
    path: "/production/cutting-jobs/:id",
    element: <CuttingJobDetail />,
  },
  {
    path: "/production/printing-jobs/:id",
    element: <PrintingJobDetail />,
  },
  {
    path: "/production/stitching-jobs/:id",
    element: <StitchingJobDetail />,
  },
  {
    path: "/inventory",
    element: <InventoryList />,
  },
  {
    path: "/inventory/new",
    element: <InventoryNew />,
  },
  {
    path: "/inventory/:id/edit",
    element: <InventoryEdit />,
  },
  {
    path: "/suppliers",
    element: <SupplierList />,
  },
  {
    path: "/suppliers/new",
    element: <SupplierNew />,
  },
  {
    path: "/suppliers/:id/edit",
    element: <SupplierEdit />,
  },
  {
    path: "/transactions",
    element: <TransactionList />,
  },
  {
    path: "/transactions/new",
    element: <TransactionNew />,
  },
  {
    path: "/transactions/:id/edit",
    element: <TransactionEdit />,
  },
  {
    path: "/vendors",
    element: <VendorList />,
  },
  {
    path: "/vendors/new",
    element: <VendorNew />,
  },
  {
    path: "/vendors/:id/edit",
    element: <VendorEdit />,
  },
  {
    path: "/companies",
    element: <CompanyList />,
  },
  {
    path: "/companies/new",
    element: <CompanyNew />,
  },
];

export const protectedRoutes = [
  "/inventory/new",
  "/inventory/:id/edit",
  "/suppliers/new",
  "/suppliers/:id/edit",
  "/transactions/new",
  "/transactions/:id/edit",
  "/vendors/new",
  "/vendors/:id/edit",
];
