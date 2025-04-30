
import { RouteObject } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import VendorList from "../pages/VendorList";
import VendorNew from "../pages/VendorNew";
import SupplierList from "../pages/SupplierList";
import SupplierNew from "../pages/SupplierNew";
import ProtectedRoute from "../components/ProtectedRoute";

const supplierVendorRoutes: RouteObject[] = [
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <AppLayout />,
        children: [
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
          }
        ]
      }
    ]
  }
];

export default supplierVendorRoutes;
