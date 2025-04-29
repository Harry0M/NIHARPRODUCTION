
import { lazy, Suspense } from 'react';
import { Navigate, RouteObject, useParams } from 'react-router-dom';

// Import local layouts that exist in the project
import { Shell } from '@/components/ui/sidebar';
import { checkSupabaseConnection } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import StockJournalForm from './pages/Inventory/StockJournalForm';
import CatalogNew from './pages/Inventory/CatalogNew';
import StockList from './pages/Inventory/StockList';
import CatalogList from './pages/Inventory/CatalogList';
import Index from './pages/Index';

// Create simple layouts for the routes until the real ones are properly built
const MainLayout = ({ children }: { children: React.ReactNode }) => <div className="p-6">{children}</div>;
const AuthLayout = ({ children }: { children: React.ReactNode }) => <div className="p-6">{children}</div>;
const InventoryLayout = ({ children }: { children: React.ReactNode }) => <div className="p-6">{children}</div>;
const JobCardLayout = ({ children }: { children: React.ReactNode }) => <div className="p-6">{children}</div>;
const OrderLayout = ({ children }: { children: React.ReactNode }) => <div className="p-6">{children}</div>;
const VendorLayout = ({ children }: { children: React.ReactNode }) => <div className="p-6">{children}</div>;
const CompanyLayout = ({ children }: { children: React.ReactNode }) => <div className="p-6">{children}</div>;
const SupplierLayout = ({ children }: { children: React.ReactNode }) => <div className="p-6">{children}</div>;
const TransactionLayout = ({ children }: { children: React.ReactNode }) => <div className="p-6">{children}</div>;
const ProfileLayout = ({ children }: { children: React.ReactNode }) => <div className="p-6">{children}</div>;
const DispatchLayout = ({ children }: { children: React.ReactNode }) => <div className="p-6">{children}</div>;

// Simple placeholder page component for routes
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[50vh]">
    <h1 className="text-2xl font-bold mb-4">{title} Page</h1>
    <p className="text-muted-foreground">This page is under construction.</p>
  </div>
);

// Create lazy loading routes
const Home = () => <PlaceholderPage title="Home" />;
const SignIn = () => <PlaceholderPage title="Sign In" />;
const SignUp = () => <PlaceholderPage title="Sign Up" />;
const Orders = () => <PlaceholderPage title="Orders" />;
const OrderDetails = () => <PlaceholderPage title="Order Details" />;
const OrderEdit = () => <PlaceholderPage title="Order Edit" />;
const JobCards = () => <PlaceholderPage title="Job Cards" />;
const JobCardDetails = () => <PlaceholderPage title="Job Card Details" />;
const CuttingJobs = () => <PlaceholderPage title="Cutting Jobs" />;
const PrintingJobs = () => <PlaceholderPage title="Printing Jobs" />;
const StitchingJobs = () => <PlaceholderPage title="Stitching Jobs" />;
const Companies = () => <PlaceholderPage title="Companies" />;
const CompanyDetails = () => <PlaceholderPage title="Company Details" />;
const CompanyNew = () => <PlaceholderPage title="New Company" />;
const CompanyEdit = () => <PlaceholderPage title="Edit Company" />;
const Suppliers = () => <PlaceholderPage title="Suppliers" />;
const SupplierDetails = () => <PlaceholderPage title="Supplier Details" />;
const SupplierNew = () => <PlaceholderPage title="New Supplier" />;
const SupplierEdit = () => <PlaceholderPage title="Edit Supplier" />;
const Transactions = () => <PlaceholderPage title="Transactions" />;
const TransactionDetails = () => <PlaceholderPage title="Transaction Details" />;
const TransactionNew = () => <PlaceholderPage title="New Transaction" />;
const TransactionEdit = () => <PlaceholderPage title="Edit Transaction" />;
const Profile = () => <PlaceholderPage title="Profile" />;
const DispatchList = () => <PlaceholderPage title="Dispatch List" />;
const DispatchDetails = () => <PlaceholderPage title="Dispatch Details" />;
const DispatchNew = () => <PlaceholderPage title="New Dispatch" />;
const CatalogOrders = () => <PlaceholderPage title="Catalog Orders" />;
const OrderNew = lazy(() => import('@/pages/Orders/OrderNew'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: <MainLayout><Index /></MainLayout>,
  },
  {
    path: 'auth',
    element: <AuthLayout />,
    children: [
      { path: '', element: <Navigate to="/auth/signin" replace /> },
      { path: 'signin', element: <SignIn /> },
      { path: 'signup', element: <SignUp /> },
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
      { path: 'catalog/:id', element: <Navigate to={`/orders?catalogId=${useParams().id}`} replace /> },
      { path: 'catalog/:id/orders', element: <CatalogOrders /> },
    ]
  }
];

export default routes;

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
