
import React from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import AppLayout from './components/layout/AppLayout';
import AuthLayout from './components/layout/AuthLayout';
import Dashboard from '@/pages/Dashboard';
import OrderList from '@/pages/Orders/OrderList';
import OrderNew from '@/pages/Orders/OrderNew';
import OrderDetail from '@/pages/Orders/OrderDetail';
import NotFound from '@/pages/NotFound';
import MaterialConsumption from '@/pages/Analysis/MaterialConsumption';
import CompanyList from '@/pages/Companies/CompanyList';
import JobCardList from '@/pages/Production/JobCardList';
import JobCardDetail from '@/pages/Production/JobCardDetail';
import JobCardNew from '@/pages/Production/JobCardNew';
import Auth from '@/pages/Auth';
import ProtectedRoute from '@/components/ProtectedRoute';
import StockList from '@/pages/Inventory/StockList';

// Create a router with auth-aware routes
export const router = createBrowserRouter([
  {
    // Public routes
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { index: true, element: <Auth /> },
    ],
  },
  {
    // Protected routes with auth check
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'dashboard', element: <Dashboard /> },
          { path: 'orders', element: <OrderList /> },
          { path: 'orders/new', element: <OrderNew /> },
          { path: 'orders/:id', element: <OrderDetail /> },
          { path: 'companies', element: <CompanyList /> },
          { path: 'production/job-cards', element: <JobCardList /> },
          { path: 'production/job-cards/new', element: <JobCardNew /> },
          { path: 'production/job-cards/:id', element: <JobCardDetail /> },
          { path: 'inventory', element: <StockList /> },
          { path: 'analysis/materials', element: <MaterialConsumption /> },
        ],
      },
    ],
    errorElement: <NotFound />,
  },
  {
    path: '*',
    element: <NotFound />,
  }
]);

export default router;
