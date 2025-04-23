import { lazy } from "react";
import AppLayout from "@/components/layout/AppLayout";
import AuthLayout from "@/components/layout/AuthLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleBasedRoute from "@/components/RoleBasedRoute";
import AdminSignup from "./pages/AdminSignup";

// Lazy load pages to improve initial load time
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Orders = lazy(() => import("@/pages/Orders"));
const OrderDetail = lazy(() => import("@/pages/Orders/OrderDetail"));
const NewOrder = lazy(() => import("@/pages/Orders/NewOrder"));
const EditOrder = lazy(() => import("@/pages/Orders/EditOrder"));
const Production = lazy(() => import("@/pages/Production"));
const JobCards = lazy(() => import("@/pages/Production/JobCards"));
const JobCardDetail = lazy(() => import("@/pages/Production/JobCardDetail"));
const NewJobCard = lazy(() => import("@/pages/Production/NewJobCard"));
const EditJobCard = lazy(() => import("@/pages/Production/EditJobCard"));
const CuttingJobDetail = lazy(() => import("@/pages/Production/CuttingJobDetail"));
const NewCuttingJob = lazy(() => import("@/pages/Production/NewCuttingJob"));
const PrintingJobDetail = lazy(() => import("@/pages/Production/PrintingJobDetail"));
const NewPrintingJob = lazy(() => import("@/pages/Production/NewPrintingJob"));
const StitchingJobDetail = lazy(() => import("@/pages/Production/StitchingJobDetail"));
const NewStitchingJob = lazy(() => import("@/pages/Production/NewStitchingJob"));
const Vendors = lazy(() => import("@/pages/Vendors"));
const VendorDetail = lazy(() => import("@/pages/Vendors/VendorDetail"));
const NewVendor = lazy(() => import("@/pages/Vendors/NewVendor"));
const EditVendor = lazy(() => import("@/pages/Vendors/EditVendor"));
const Suppliers = lazy(() => import("@/pages/Suppliers"));
const SupplierDetail = lazy(() => import("@/pages/Suppliers/SupplierDetail"));
const NewSupplier = lazy(() => import("@/pages/Suppliers/NewSupplier"));
const EditSupplier = lazy(() => import("@/pages/Suppliers/EditSupplier"));
const Inventory = lazy(() => import("@/pages/Inventory"));
const InventoryDetail = lazy(() => import("@/pages/Inventory/InventoryDetail"));
const NewInventoryItem = lazy(() => import("@/pages/Inventory/NewInventoryItem"));
const EditInventoryItem = lazy(() => import("@/pages/Inventory/EditInventoryItem"));
const Dispatch = lazy(() => import("@/pages/Dispatch"));
const Settings = lazy(() => import("@/pages/Settings"));
const Auth = lazy(() => import("@/pages/Auth"));

const routes = [
  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      {
        path: "",
        element: <Auth />,
      },
    ],
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
            path: "dashboard",
            element: <Dashboard />,
          },
          {
            path: "orders",
            element: <RoleBasedRoute allowedRoles={['admin', 'manager', 'production', 'vendor', 'cutting', 'printing', 'stitching']}>
              <Orders />
            </RoleBasedRoute>
          },
          {
            path: "orders/new",
            element: <RoleBasedRoute allowedRoles={['admin', 'manager']}><NewOrder /></RoleBasedRoute>
          },
          {
            path: "orders/:id",
            element: <RoleBasedRoute allowedRoles={['admin', 'manager', 'production', 'vendor', 'cutting', 'printing', 'stitching']}><OrderDetail /></RoleBasedRoute>
          },
          {
            path: "orders/:id/edit",
            element: <RoleBasedRoute allowedRoles={['admin', 'manager']}><EditOrder /></RoleBasedRoute>
          },
          {
            path: "production",
            element: <RoleBasedRoute allowedRoles={['admin', 'manager', 'production', 'cutting', 'printing', 'stitching']}><Production /></RoleBasedRoute>
          },
          {
            path: "production/job-cards",
            element: <RoleBasedRoute allowedRoles={['admin', 'manager', 'production', 'cutting', 'printing', 'stitching']}><JobCards /></RoleBasedRoute>
          },
          {
            path: "production/job-cards/new",
            element: <RoleBasedRoute allowedRoles={['admin', 'manager']}><NewJobCard /></RoleBasedRoute>
          },
          {
            path: "production/job-cards/:id",
            element: <RoleBasedRoute allowedRoles={['admin', 'manager', 'production', 'cutting', 'printing', 'stitching']}><JobCardDetail /></RoleBasedRoute>
          },
           {
            path: "production/job-cards/:id/edit",
            element: <RoleBasedRoute allowedRoles={['admin', 'manager']}><EditJobCard /></RoleBasedRoute>
          },
          {
            path: "production/cutting/:id",
            element: <RoleBasedRoute allowedRoles={['admin', 'manager', 'production', 'cutting']}><CuttingJobDetail /></RoleBasedRoute>
          },
          {
            path: "production/cutting/new",
            element: <RoleBasedRoute allowedRoles={['admin', 'manager', 'production', 'cutting']}><NewCuttingJob /></RoleBasedRoute>
          },
          {
            path: "production/printing/:id",
            element: <RoleBasedRoute allowedRoles={['admin', 'manager', 'production', 'printing']}><PrintingJobDetail /></RoleBasedRoute>
          },
          {
            path: "production/printing/new",
            element: <RoleBasedRoute allowedRoles={['admin', 'manager', 'production', 'printing']}><NewPrintingJob /></RoleBasedRoute>
          },
          {
            path: "production/stitching/:id",
            element: <RoleBasedRoute allowedRoles={['admin', 'manager', 'production', 'stitching']}><StitchingJobDetail /></RoleBasedRoute>
          },
          {
            path: "production/stitching/new",
            element: <RoleBasedRoute allowedRoles={['admin', 'manager', 'production', 'stitching']}><NewStitchingJob /></RoleBasedRoute>
          },
          {
            path: "vendors",
            element: <RoleBasedRoute allowedRoles={['admin', 'manager']}><Vendors /></RoleBasedRoute>
          },
          {
            path: "vendors/new",
            element: <RoleBasedRoute allowedRoles={['admin', 'manager']}><NewVendor /></RoleBasedRoute>
          },
          {
            path: "vendors/:id",
            element: <RoleBasedRoute allowedRoles={['admin', 'manager']}><VendorDetail /></RoleBasedRoute>
          },
          {
            path: "vendors/:id/edit",
            element: <RoleBasedRoute allowedRoles={['admin', 'manager']}><EditVendor /></RoleBasedRoute>
          },
          {
            path: "suppliers",
            element: <RoleBasedRoute allowedRoles={['admin', 'manager']}><Suppliers /></RoleBasedRoute>
          },
          {
            path: "suppliers/new",
            element: <RoleBasedRoute allowedRoles={['admin', 'manager']}><NewSupplier /></RoleBasedRoute>
          },
          {
            path: "suppliers/:id",
            element: <RoleBasedRoute allowedRoles={['admin', 'manager']}><SupplierDetail /></RoleBasedRoute>
          },
          {
            path: "suppliers/:id/edit",
            element: <RoleBasedRoute allowedRoles={['admin', 'manager']}><EditSupplier /></RoleBasedRoute>
          },
          {
            path: "inventory",
            element: <RoleBasedRoute allowedRoles={['admin']}><Inventory /></RoleBasedRoute>
          },
          {
            path: "inventory/new",
            element: <RoleBasedRoute allowedRoles={['admin']}><NewInventoryItem /></RoleBasedRoute>
          },
          {
            path: "inventory/:id",
            element: <RoleBasedRoute allowedRoles={['admin']}><InventoryDetail /></RoleBasedRoute>
          },
          {
            path: "inventory/:id/edit",
            element: <RoleBasedRoute allowedRoles={['admin']}><EditInventoryItem /></RoleBasedRoute>
          },
          {
            path: "dispatch",
            element: <RoleBasedRoute allowedRoles={['admin', 'manager', 'production']}><Dispatch /></RoleBasedRoute>
          },
          {
            path: "settings",
            element: <RoleBasedRoute allowedRoles={['admin']}><Settings /></RoleBasedRoute>
          },
        ],
      },
    ],
  },
  {
    path: "/admin-signup",
    element: <AdminSignup />,
  },
];

export default routes;
