
import { lazy, Suspense } from 'react';
import { Navigate, RouteObject, useRoutes, useParams } from 'react-router-dom';

import { MainLayout } from '@/layouts/MainLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { InventoryLayout } from '@/layouts/InventoryLayout';
import { JobCardLayout } from '@/layouts/JobCardLayout';
import { OrderLayout } from '@/layouts/OrderLayout';
import { VendorLayout } from '@/layouts/VendorLayout';
import { CompanyLayout } from '@/layouts/CompanyLayout';
import { SupplierLayout } from '@/layouts/SupplierLayout';
import { TransactionLayout } from '@/layouts/TransactionLayout';
import { ProfileLayout } from '@/layouts/ProfileLayout';
import { DispatchLayout } from '@/layouts/DispatchLayout';

import { Shell } from '@/components/Shell';
import { checkSupabaseConnection } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import StockJournalForm from './pages/Inventory/StockJournalForm';
import CatalogNew from './pages/Inventory/CatalogNew';
import StockList from './pages/Inventory/StockList';
import CatalogList from './pages/Inventory/CatalogList';

interface LayoutProps {
  children?: React.ReactNode;
}

const Home = lazy(() => import('@/pages/Home'));
const SignIn = lazy(() => import('@/pages/Auth/SignIn'));
const SignUp = lazy(() => import('@/pages/Auth/SignUp'));
const Orders = lazy(() => import('@/pages/Orders'));
const OrderDetails = lazy(() => import('@/pages/Orders/OrderDetails'));
const OrderNew = lazy(() => import('@/pages/Orders/OrderNew'));
const OrderEdit = lazy(() => import('@/pages/Orders/OrderEdit'));
const JobCards = lazy(() => import('@/pages/JobCards'));
const JobCardDetails = lazy(() => import('@/pages/JobCards/JobCardDetails'));
const CuttingJobs = lazy(() => import('@/pages/JobCards/CuttingJobs'));
const PrintingJobs = lazy(() => import('@/pages/JobCards/PrintingJobs'));
const StitchingJobs = lazy(() => import('@/pages/JobCards/StitchingJobs'));
const Companies = lazy(() => import('@/pages/Companies'));
const CompanyDetails = lazy(() => import('@/pages/Companies/CompanyDetails'));
const CompanyNew = lazy(() => import('@/pages/Companies/CompanyNew'));
const CompanyEdit = lazy(() => import('@/pages/Companies/CompanyEdit'));
const Suppliers = lazy(() => import('@/pages/Suppliers'));
const SupplierDetails = lazy(() => import('@/pages/Suppliers/SupplierDetails'));
const SupplierNew = lazy(() => import('@/pages/Suppliers/SupplierNew'));
const SupplierEdit = lazy(() => import('@/pages/Suppliers/SupplierEdit'));
const Transactions = lazy(() => import('@/pages/Transactions'));
const TransactionDetails = lazy(() => import('@/pages/Transactions/TransactionDetails'));
const TransactionNew = lazy(() => import('@/pages/Transactions/TransactionNew'));
const TransactionEdit = lazy(() => import('@/pages/Transactions/TransactionEdit'));
const Profile = lazy(() => import('@/pages/Profile'));
const DispatchList = lazy(() => import('@/pages/Dispatch/DispatchList'));
const DispatchDetails = lazy(() => import('@/pages/Dispatch/DispatchDetails'));
const DispatchNew = lazy(() => import('@/pages/Dispatch/DispatchNew'));
const CatalogOrders = lazy(() => import('@/pages/Inventory/CatalogOrders'));
const StockNew = lazy(() => import('@/pages/Inventory/StockNew'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { path: '', element: <Shell><Suspense fallback={<>Loading...</>}><Home /></Suspense></Shell> },
    ],
  },
  {
    path: 'auth',
    element: <AuthLayout />,
    children: [
      { path: '', element: <Navigate to="/auth/signin" replace /> },
      { path: 'signin', element: <Suspense fallback={<>Loading...</>}><SignIn /></Suspense> },
      { path: 'signup', element: <Suspense fallback={<>Loading...</>}><SignUp /></Suspense> },
    ],
  },
  {
    path: 'orders',
    element: <OrderLayout />,
    children: [
      { path: '', element: <Suspense fallback={<>Loading...</>}><Orders /></Suspense> },
      { path: ':id', element: <Suspense fallback={<>Loading...</>}><OrderDetails id={useParams().id} /></Suspense> },
      { path: 'new', element: <Suspense fallback={<>Loading...</>}><OrderNew /></Suspense> },
      { path: ':id/edit', element: <Suspense fallback={<>Loading...</>}><OrderEdit id={useParams().id} /></Suspense> },
    ]
  },
  {
    path: 'job-cards',
    element: <JobCardLayout />,
    children: [
      { path: '', element: <Suspense fallback={<>Loading...</>}><JobCards /></Suspense> },
      { path: ':id', element: <Suspense fallback={<>Loading...</>}><JobCardDetails id={useParams().id} /></Suspense> },
      { path: ':id/cutting-jobs', element: <Suspense fallback={<>Loading...</>}><CuttingJobs id={useParams().id} /></Suspense> },
      { path: ':id/printing-jobs', element: <Suspense fallback={<>Loading...</>}><PrintingJobs id={useParams().id} /></Suspense> },
      { path: ':id/stitching-jobs', element: <Suspense fallback={<>Loading...</>}><StitchingJobs id={useParams().id} /></Suspense> },
    ]
  },
  {
    path: 'companies',
    element: <CompanyLayout />,
    children: [
      { path: '', element: <Suspense fallback={<>Loading...</>}><Companies /></Suspense> },
      { path: ':id', element: <Suspense fallback={<>Loading...</>}><CompanyDetails id={useParams().id} /></Suspense> },
      { path: 'new', element: <Suspense fallback={<>Loading...</>}><CompanyNew /></Suspense> },
      { path: ':id/edit', element: <Suspense fallback={<>Loading...</>}><CompanyEdit id={useParams().id} /></Suspense> },
    ]
  },
  {
    path: 'suppliers',
    element: <SupplierLayout />,
    children: [
      { path: '', element: <Suspense fallback={<>Loading...</>}><Suppliers /></Suspense> },
      { path: ':id', element: <Suspense fallback={<>Loading...</>}><SupplierDetails id={useParams().id} /></Suspense> },
      { path: 'new', element: <Suspense fallback={<>Loading...</>}><SupplierNew /></Suspense> },
      { path: ':id/edit', element: <Suspense fallback={<>Loading...</>}><SupplierEdit id={useParams().id} /></Suspense> },
    ]
  },
  {
    path: 'transactions',
    element: <TransactionLayout />,
    children: [
      { path: '', element: <Suspense fallback={<>Loading...</>}><Transactions /></Suspense> },
      { path: ':id', element: <Suspense fallback={<>Loading...</>}><TransactionDetails id={useParams().id} /></Suspense> },
      { path: 'new', element: <Suspense fallback={<>Loading...</>}><TransactionNew /></Suspense> },
      { path: ':id/edit', element: <Suspense fallback={<>Loading...</>}><TransactionEdit id={useParams().id} /></Suspense> },
    ]
  },
  {
    path: 'profile',
    element: <ProfileLayout />,
    children: [
      { path: '', element: <Suspense fallback={<>Loading...</>}><Profile /></Suspense> },
    ]
  },
  {
    path: 'dispatch',
    element: <DispatchLayout />,
    children: [
      { path: '', element: <Suspense fallback={<>Loading...</>}><DispatchList /></Suspense> },
      { path: ':id', element: <Suspense fallback={<>Loading...</>}><DispatchDetails id={useParams().id} /></Suspense> },
      { path: 'new', element: <Suspense fallback={<>Loading...</>}><DispatchNew /></Suspense> },
    ]
  },
  {
    path: 'inventory',
    element: <InventoryLayout />,
    children: [
      { path: '', element: <Navigate to="/inventory/stock" replace /> },
      { path: 'stock', element: <StockList /> },
      { path: 'stock/new', element: <StockJournalForm /> },
      { path: 'stock/:id', element: <StockJournalForm id={useParams().id} /> },
      { path: 'catalog', element: <CatalogList /> },
      { path: 'catalog/new', element: <CatalogNew /> },
      { path: 'catalog/:id', element: <Navigate to={`/orders?catalogId=${useParams().id}`} replace /> },
      { path: 'catalog/:id/orders', element: <CatalogOrders id={useParams().id} /> },
    ]
  }
];

export function Router() {
  const element = useRoutes(routes);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      const connected = await checkSupabaseConnection();
      setIsConnected(connected);
    };

    checkConnection();
  }, []);

  return (
    <>
      {!isConnected && (
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>Database Connection Error</AlertTitle>
          <AlertDescription>
            Could not connect to the database. Please check your internet connection and database settings.
          </AlertDescription>
        </Alert>
      )}
      {element}
    </>
  );
}

export default routes;
