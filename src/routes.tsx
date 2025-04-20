
import { RouteObject } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import OrderList from "./pages/Orders/OrderList";
import OrderNew from "./pages/Orders/OrderNew";
import ProductionDashboard from "./pages/Production/ProductionDashboard";
import NotFound from "./pages/NotFound";

const routes: RouteObject[] = [
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
        path: "production",
        element: <ProductionDashboard />
      },
      // Add additional routes as needed
    ]
  },
  {
    path: "*",
    element: <NotFound />
  }
];

export default routes;
