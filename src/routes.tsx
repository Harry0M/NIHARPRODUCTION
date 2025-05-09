
import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from '@/pages/Dashboard';
import OrderList from '@/pages/Orders/OrderList';
import OrderNew from '@/pages/Orders/OrderNew';
import OrderDetail from '@/pages/Orders/OrderDetail';
import NotFound from '@/pages/NotFound';
import ProductCatalog from '@/pages/Catalog/ProductCatalog';
import CatalogDetail from '@/pages/Catalog/CatalogDetail';
import CatalogNew from '@/pages/Catalog/CatalogNew';
import StockList from '@/pages/inventory/StockList';
import StockForm from '@/pages/inventory/StockForm';
import StockDetail from '@/pages/inventory/StockDetail';
import CompanyList from '@/pages/Companies/CompanyList';
import CompanyDetail from '@/pages/Companies/CompanyDetail';
import CompanyForm from '@/pages/Companies/CompanyForm';
import TransactionsList from '@/pages/Transactions/TransactionsList';
import TransactionForm from '@/pages/Transactions/TransactionForm';
import JobCardList from '@/pages/Production/JobCardList';
import JobCardDetail from '@/pages/Production/JobCardDetail';
import JobCardNew from '@/pages/Production/JobCardNew';
import CuttingJobDetail from '@/pages/Production/CuttingJobDetail';
import PrintingJobDetail from '@/pages/Production/PrintingJobDetail';
import StitchingJobDetail from '@/pages/Production/StitchingJobDetail';
import MaterialConsumption from '@/pages/Analysis/MaterialConsumption';

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
      { path: '/catalog', element: <ProductCatalog /> },
      { path: '/catalog/new', element: <CatalogNew /> },
      { path: '/catalog/:id', element: <CatalogDetail /> },
      { path: '/inventory', element: <StockList /> },
      { path: '/inventory/new', element: <StockForm /> },
      { path: '/inventory/:id', element: <StockForm /> },
      { path: '/inventory/details/:id', element: <StockDetail /> },
      { path: '/companies', element: <CompanyList /> },
      { path: '/companies/new', element: <CompanyForm /> },
      { path: '/companies/:id', element: <CompanyDetail /> },
      { path: '/companies/:id/edit', element: <CompanyForm /> },
      { path: '/transactions', element: <TransactionsList /> },
      { path: '/transactions/new', element: <TransactionForm /> },
      { path: '/production/job-cards', element: <JobCardList /> },
      { path: '/production/job-cards/new', element: <JobCardNew /> },
      { path: '/production/job-cards/:id', element: <JobCardDetail /> },
      { path: '/production/cutting/:id', element: <CuttingJobDetail /> },
      { path: '/production/printing/:id', element: <PrintingJobDetail /> },
      { path: '/production/stitching/:id', element: <StitchingJobDetail /> },
      { path: '/analysis/materials', element: <MaterialConsumption /> },
    ],
  },
]);

export default router;
