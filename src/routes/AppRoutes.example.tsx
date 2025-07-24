import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  AdminOnlyRoute, 
  JobCardRoute, 
  PrintingJobRoute, 
  CuttingJobRoute, 
  StitchingJobRoute,
  InventoryRoute,
  OrdersRoute,
  UserManagementRoute
} from '@/components/RoleBasedRoutes';
import { UserManagement } from '@/components/UserManagement';

// Example route configuration with role-based protection
export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/auth" element={<AuthPage />} />
      
      {/* Protected routes - require authentication */}
      <Route element={<ProtectedRoute />}>
        {/* Dashboard - accessible to all authenticated users */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Job Cards - accessible to all roles */}
        <Route path="/job-cards" element={
          <JobCardRoute>
            <JobCards />
          </JobCardRoute>
        } />
        
        {/* Printing Jobs - only for admin and printer roles */}
        <Route path="/printing-jobs" element={
          <PrintingJobRoute>
            <PrintingJobs />
          </PrintingJobRoute>
        } />
        
        {/* Cutting Jobs - only for admin and cutting roles */}
        <Route path="/cutting-jobs" element={
          <CuttingJobRoute>
            <CuttingJobs />
          </CuttingJobRoute>
        } />
        
        {/* Stitching Jobs - only for admin and stitching roles */}
        <Route path="/stitching-jobs" element={
          <StitchingJobRoute>
            <StitchingJobs />
          </StitchingJobRoute>
        } />
        
        {/* Inventory - admin only */}
        <Route path="/inventory" element={
          <InventoryRoute>
            <Inventory />
          </InventoryRoute>
        } />
        
        {/* Orders - admin only */}
        <Route path="/orders" element={
          <OrdersRoute>
            <Orders />
          </OrdersRoute>
        } />
        
        {/* User Management - admin only */}
        <Route path="/users" element={
          <UserManagementRoute>
            <UserManagement />
          </UserManagementRoute>
        } />
        
        {/* Admin only section */}
        <Route path="/admin/*" element={
          <AdminOnlyRoute>
            <AdminPanel />
          </AdminOnlyRoute>
        } />
      </Route>
    </Routes>
  );
};

// Example components (these would be your actual page components)
const AuthPage = () => <div>Authentication Page</div>;
const Dashboard = () => <div>Dashboard</div>;
const JobCards = () => <div>Job Cards</div>;
const PrintingJobs = () => <div>Printing Jobs</div>;
const CuttingJobs = () => <div>Cutting Jobs</div>;
const StitchingJobs = () => <div>Stitching Jobs</div>;
const Inventory = () => <div>Inventory</div>;
const Orders = () => <div>Orders</div>;
const AdminPanel = () => <div>Admin Panel</div>;
