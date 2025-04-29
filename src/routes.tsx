
import { lazy, Suspense } from 'react';
import { Navigate, RouteObject, useRoutes, useParams } from 'react-router-dom';

import { MainLayout } from './layouts/MainLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { InventoryLayout } from './layouts/InventoryLayout';
import { JobCardLayout } from './layouts/JobCardLayout';
import { OrderLayout } from './layouts/OrderLayout';
import { VendorLayout } from './layouts/VendorLayout';
import { CompanyLayout } from './layouts/CompanyLayout';
import { SupplierLayout } from './layouts/SupplierLayout';
import { TransactionLayout } from './layouts/TransactionLayout';
import { ProfileLayout } from './layouts/ProfileLayout';
import { DispatchLayout } from './layouts/DispatchLayout';

import { Shell } from './components/Shell';
import { checkSupabaseConnection } from './integrations/supabase/client';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert';
import { Info } from 'lucide-react';

// Direct imports for inventory pages
import StockJournalForm from './pages/Inventory/StockJournalForm';
import CatalogNew from './pages/Inventory/CatalogNew';
import StockList from './pages/Inventory/StockList';
import CatalogList from './pages/Inventory/CatalogList';
import CatalogOrders from './pages/Inventory/CatalogOrders';
import StockNew from './pages/Inventory/StockNew';

// Lazy loaded pages
const Home = lazy(() => import('./pages/Home'));
const SignIn = lazy(() => import('./pages/Auth/SignIn'));
const SignUp = lazy(() => import('./pages/Auth/SignUp'));

// Placeholder components for missing pages
const PlaceholderPage = ({ title = "Page Coming Soon" }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
    <h1 className="text-2xl font-bold mb-4">{title}</h1>
    <p className="text-muted-foreground text-center max-w-md">
      This page is currently under development. Please check back later.
    </p>
  </div>
);

// Create placeholders for missing pages
const Orders = () => <PlaceholderPage title="Orders" />;
const OrderDetails = () => <PlaceholderPage title={`Order Details: ${useParams().id}`} />;
const OrderNew = lazy(() => import('./pages/Orders/OrderNew'));
const OrderEdit = () => <PlaceholderPage title={`Edit Order: ${useParams().id}`} />;

const JobCards = () => <PlaceholderPage title="Job Cards" />;
const JobCardDetails = () => <PlaceholderPage title={`Job Card Details: ${useParams().id}`} />;
const CuttingJobs = () => <PlaceholderPage title={`Cutting Jobs: ${useParams().id}`} />;
const PrintingJobs = () => <PlaceholderPage title={`Printing Jobs: ${useParams().id}`} />;
const StitchingJobs = () => <PlaceholderPage title={`Stitching Jobs: ${useParams().id}`} />;

const Companies = () => <PlaceholderPage title="Companies" />;
const CompanyDetails = () => <PlaceholderPage title={`Company Details: ${useParams().id}`} />;
const CompanyNew = () => <PlaceholderPage title="New Company" />;
const CompanyEdit = () => <PlaceholderPage title={`Edit Company: ${useParams().id}`} />;

const Suppliers = () => <PlaceholderPage title="Suppliers" />;
const SupplierDetails = () => <PlaceholderPage title={`Supplier Details: ${useParams().id}`} />;
const SupplierNew = () => <PlaceholderPage title="New Supplier" />;
const SupplierEdit = () => <PlaceholderPage title={`Edit Supplier: ${useParams().id}`} />;

const Transactions = () => <PlaceholderPage title="Transactions" />;
const TransactionDetails = () => <PlaceholderPage title={`Transaction Details: ${useParams().id}`} />;
const TransactionNew = () => <PlaceholderPage title="New Transaction" />;
const TransactionEdit = () => <PlaceholderPage title={`Edit Transaction: ${useParams().id}`} />;

const Profile = () => <PlaceholderPage title="User Profile" />;
const DispatchList = () => <PlaceholderPage title="Dispatch List" />;
const DispatchDetails = () => <PlaceholderPage title={`Dispatch Details: ${useParams().id}`} />;
const DispatchNew = () => <PlaceholderPage title="New Dispatch" />;

// Create a component for catalog redirect that safely uses the useParams hook
const CatalogRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/orders?catalogId=${id}`} replace />;
};

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
      { path: '', element: <Orders /> },
      { path: ':id', element: <OrderDetails /> },
      { path: 'new', element: <Suspense fallback={<>Loading...</>}><OrderNew /></Suspense> },
      { path: ':id/edit', element: <OrderEdit /> },
    ]
  },
  {
    path: 'job-cards',
    element: <JobCardLayout />,
    children: [
      { path: '', element: <JobCards /> },
      { path: ':id', element: <JobCardDetails /> },
      { path: ':id/cutting-jobs', element: <CuttingJobs /> },
      { path: ':id/printing-jobs', element: <PrintingJobs /> },
      { path: ':id/stitching-jobs', element: <StitchingJobs /> },
    ]
  },
  {
    path: 'companies',
    element: <CompanyLayout />,
    children: [
      { path: '', element: <Companies /> },
      { path: ':id', element: <CompanyDetails /> },
      { path: 'new', element: <CompanyNew /> },
      { path: ':id/edit', element: <CompanyEdit /> },
    ]
  },
  {
    path: 'suppliers',
    element: <SupplierLayout />,
    children: [
      { path: '', element: <Suppliers /> },
      { path: ':id', element: <SupplierDetails /> },
      { path: 'new', element: <SupplierNew /> },
      { path: ':id/edit', element: <SupplierEdit /> },
    ]
  },
  {
    path: 'transactions',
    element: <TransactionLayout />,
    children: [
      { path: '', element: <Transactions /> },
      { path: ':id', element: <TransactionDetails /> },
      { path: 'new', element: <TransactionNew /> },
      { path: ':id/edit', element: <TransactionEdit /> },
    ]
  },
  {
    path: 'profile',
    element: <ProfileLayout />,
    children: [
      { path: '', element: <Profile /> },
    ]
  },
  {
    path: 'dispatch',
    element: <DispatchLayout />,
    children: [
      { path: '', element: <DispatchList /> },
      { path: ':id', element: <DispatchDetails /> },
      { path: 'new', element: <DispatchNew /> },
    ]
  },
  {
    path: 'inventory',
    element: <InventoryLayout />,
    children: [
      { path: '', element: <Navigate to="/inventory/stock" replace /> },
      { path: 'stock', element: <StockList /> },
      { path: 'stock/new', element: <StockJournalForm /> },
      { path: 'stock/:id', element: <StockJournalForm /> },
      { path: 'catalog', element: <CatalogList /> },
      { path: 'catalog/new', element: <CatalogNew /> },
      { path: 'catalog/:id', element: <CatalogRedirect /> },
      { path: 'catalog/:id/orders', element: <CatalogOrders /> },
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
