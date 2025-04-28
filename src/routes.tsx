import { RouteObject } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Production from "./pages/Production";
import Vendors from "./pages/Vendors";
import Suppliers from "./pages/Suppliers";
import Inventory from "./pages/Inventory";
import Settings from "./pages/Settings";
import Companies from "./pages/Companies";
import ProductionCutting from "./pages/Production/ProductionCutting";
import ProductionPrinting from "./pages/Production/ProductionPrinting";
import ProductionStitching from "./pages/Production/ProductionStitching";
import JobCards from "./pages/Production/JobCards";
import NewJobCard from "./pages/Production/NewJobCard";
import OrderDetails from "./pages/Orders/OrderDetails";
import Dispatch from "./pages/Dispatch";
import DispatchDetails from "./pages/Dispatch/DispatchDetails";
import NewOrder from "./pages/Orders/NewOrder";

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "orders",
        element: <Orders />,
      },
      {
        path: "orders/:id",
        element: <OrderDetails />,
      },
      {
        path: "orders/new",
        element: <NewOrder />,
      },
      {
        path: "production",
        element: <Production />,
      },
      {
        path: "production/cutting",
        element: <ProductionCutting />,
      },
      {
        path: "production/printing",
        element: <ProductionPrinting />,
      },
      {
        path: "production/stitching",
        element: <ProductionStitching />,
      },
      {
        path: "production/job-cards",
        element: <JobCards />,
      },
      {
        path: "production/job-cards/new",
        element: <NewJobCard />,
      },
      {
        path: "dispatch",
        element: <Dispatch />,
      },
      {
        path: "dispatch/:id",
        element: <DispatchDetails />,
      },
      {
        path: "vendors",
        element: <Vendors />,
      },
      {
        path: "suppliers",
        element: <Suppliers />,
      },
      {
        path: "inventory",
        element: <Inventory />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "companies",
        element: <Companies />,
      },
    ],
  },
];
