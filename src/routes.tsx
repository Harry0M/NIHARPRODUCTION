
import { lazy } from "react";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleBasedRoute from "@/components/RoleBasedRoute";
import AdminSignup from "./pages/AdminSignup";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy load pages to improve initial load time
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Auth = lazy(() => import("@/pages/Auth"));

// Use index to match a default route (will redirect to dashboard)
const routes = [
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <AppLayout />,
        children: [
          {
            path: "",
            element: <Index />,
          },
          {
            path: "dashboard",
            element: <Dashboard />,
          },
        ],
      },
    ],
  },
  {
    path: "/admin-signup",
    element: <AdminSignup />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
