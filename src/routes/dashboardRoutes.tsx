
import { RouteObject, Navigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import Dashboard from "../pages/Dashboard";
import ProtectedRoute from "../components/ProtectedRoute";

// Placeholder for future development
const Settings = () => <div className="p-8 text-center"><h1 className="text-2xl font-bold mb-4">Settings</h1><p className="text-muted-foreground">This feature is coming soon.</p></div>;

const dashboardRoutes: RouteObject[] = [
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
            path: "settings",
            element: <Settings />
          }
        ]
      }
    ]
  }
];

export default dashboardRoutes;
