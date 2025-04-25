
import { RouteObject } from "react-router-dom";
import OrderList from "@/pages/Orders/OrderList";
import OrderNew from "@/pages/Orders/OrderNew";
import OrderDetail from "@/pages/Orders/OrderDetail";
import OrderEdit from "@/pages/Orders/OrderEdit";
import ProductionDashboard from "@/pages/Production/ProductionDashboard";
import JobCardList from "@/pages/Production/JobCardList";
import JobCardNew from "@/pages/Production/JobCardNew";
import JobCardDetail from "@/pages/Production/JobCardDetail";
import CuttingJob from "@/pages/Production/CuttingJob";
import PrintingJob from "@/pages/Production/PrintingJob";
import StitchingJob from "@/pages/Production/StitchingJob";
import CompanyList from "@/pages/Companies/CompanyList";
import CompanyNew from "@/pages/Companies/CompanyNew";
import CompanyDetail from "@/pages/Companies/CompanyDetail";

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
    element: <ProductionDashboard />,
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
    path: "/production/cutting/:id",
    element: <CuttingJob />,
  },
  {
    path: "/production/printing/:id",
    element: <PrintingJob />,
  },
  {
    path: "/production/stitching/:id",
    element: <StitchingJob />,
  },
  {
    path: "/companies",
    element: <CompanyList />,
  },
  {
    path: "/companies/new",
    element: <CompanyNew />,
  },
  {
    path: "/companies/:id",
    element: <CompanyDetail />,
  }
];

export const protectedRoutes = [
  "/companies/new",
  "/companies/:id/edit",
];
