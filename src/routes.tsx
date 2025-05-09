
import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/Layout';
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

// Create a simplified router with only the routes we know exist
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: '/orders', element: <OrderList /> },
      { path: '/orders/new', element: <OrderNew /> },
      { path: '/orders/:id', element: <OrderDetail /> },
      { path: '/companies', element: <CompanyList /> },
      { path: '/production/job-cards', element: <JobCardList /> },
      { path: '/production/job-cards/new', element: <JobCardNew /> },
      { path: '/production/job-cards/:id', element: <JobCardDetail /> },
      { path: '/analysis/materials', element: <MaterialConsumption /> },
    ],
  },
]);

export default router;
