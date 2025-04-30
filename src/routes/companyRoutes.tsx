
import { RouteObject } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import CompanyList from "@/pages/Companies/CompanyList";
import CompanyNew from "@/pages/Companies/CompanyNew";
import CompanyOrders from "../pages/Companies/CompanyOrders";
import ProtectedRoute from "../components/ProtectedRoute";

const companyRoutes: RouteObject[] = [
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <AppLayout />,
        children: [
          {
            path: "companies",
            element: <CompanyList />
          },
          {
            path: "companies/new",
            element: <CompanyNew />
          },
          {
            path: "companies/:id/orders",
            element: <CompanyOrders />
          }
        ]
      }
    ]
  }
];

export default companyRoutes;
