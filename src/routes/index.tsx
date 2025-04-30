
import { RouteObject } from "react-router-dom";
import authRoutes from "./authRoutes";
import inventoryRoutes from "./inventoryRoutes";
import orderRoutes from "./orderRoutes";
import productionRoutes from "./productionRoutes";
import supplierVendorRoutes from "./supplierVendorRoutes";
import companyRoutes from "./companyRoutes";
import dashboardRoutes from "./dashboardRoutes";
import notFoundRoute from "./notFoundRoute";

// Combine all routes
const routes: RouteObject[] = [
  ...authRoutes,
  ...dashboardRoutes,
  ...orderRoutes,
  ...productionRoutes,
  ...supplierVendorRoutes,
  ...companyRoutes,
  ...inventoryRoutes,
  ...notFoundRoute
];

export default routes;
