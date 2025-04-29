
import { lazy, Suspense, ReactNode } from 'react';
import { Navigate, RouteObject, useParams, useRoutes } from 'react-router-dom';

// Import local layouts that exist in the project
import { checkSupabaseConnection } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import StockJournalForm from './pages/Inventory/StockJournalForm';
import CatalogNew from './pages/Inventory/CatalogNew';
import StockList from './pages/Inventory/StockList';
import CatalogList from './pages/Inventory/CatalogList';
import Index from './pages/Index';
import InventoryLayout from './layouts/InventoryLayout';
import Auth from './pages/Auth';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Create simple layouts for the routes until the real ones are properly built
// Fix: Add proper type definition for children prop
interface LayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: LayoutProps) => <div className="p-6">{children}</div>;
const JobCardLayout = ({ children }: LayoutProps) => <div className="p-6">{children}</div>;
const OrderLayout = ({ children }: LayoutProps) => <div className="p-6">{children}</div>;
const VendorLayout = ({ children }: LayoutProps) => <div className="p-6">{children}</div>;
const CompanyLayout = ({ children }: LayoutProps) => <div className="p-6">{children}</div>;
const SupplierLayout = ({ children }: LayoutProps) => <div className="p-6">{children}</div>;
const TransactionLayout = ({ children }: LayoutProps) => <div className="p-6">{children}</div>;
const ProfileLayout = ({ children }: LayoutProps) => <div className="p-6">{children}</div>;
const DispatchLayout = ({ children }: LayoutProps) => <div className="p-6">{children}</div>;

// Simple placeholder page component for routes
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[50vh]">
    <h1 className="text-2xl font-bold mb-4">{title} Page</h1>
    <p className="text-muted-foreground">This page is under construction.</p>
  </div>
);

// Create lazy loading routes
const Home = () => <PlaceholderPage title="Home" />;
const Dashboard = () => <PlaceholderPage title="Dashboard" />;
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

// Function to handle catalog ID parameter
const CatalogOrdersWrapper = () => {
  const { id } = useParams();
  return <Navigate to={`/orders?catalogId=${id}`} replace />;
};

const routes: RouteObject[] = [
  {
    path: '/',
    element: <MainLayout><Index /></MainLayout>,
  },
  {
    path: 'auth/*',
    element: <Auth />,
  },
  {
    path: 'dashboard',
    element: <ProtectedRoute />,
    children: [
      { path: '', element: <AppLayout><Dashboard /></AppLayout> }
    ]
  },
  {
    path: 'orders',
    element: <ProtectedRoute />,
    children: [
      { 
        path: '', 
        element: <OrderLayout><Orders /></OrderLayout> 
      },
      { 
        path: ':id', 
        element: <OrderLayout><OrderDetails /></OrderLayout> 
      },
      { 
        path: 'new', 
        element: <OrderLayout><Suspense fallback={<>Loading...</>}><OrderNew /></Suspense></OrderLayout> 
      },
      { 
        path: ':id/edit', 
        element: <OrderLayout><OrderEdit /></OrderLayout> 
      },
    ]
  },
  {
    path: 'job-cards',
    element: <ProtectedRoute />,
    children: [
      { 
        path: '', 
        element: <JobCardLayout><JobCards /></JobCardLayout> 
      },
      { 
        path: ':id', 
        element: <JobCardLayout><JobCardDetails /></JobCardLayout> 
      },
      { 
        path: ':id/cutting-jobs', 
        element: <JobCardLayout><CuttingJobs /></JobCardLayout> 
      },
      { 
        path: ':id/printing-jobs', 
        element: <JobCardLayout><PrintingJobs /></JobCardLayout> 
      },
      { 
        path: ':id/stitching-jobs', 
        element: <JobCardLayout><StitchingJobs /></JobCardLayout> 
      },
    ]
  },
  {
    path: 'companies',
    element: <ProtectedRoute />,
    children: [
      { 
        path: '', 
        element: <CompanyLayout><Companies /></CompanyLayout> 
      },
      { 
        path: ':id', 
        element: <CompanyLayout><CompanyDetails /></CompanyLayout> 
      },
      { 
        path: 'new', 
        element: <CompanyLayout><CompanyNew /></CompanyLayout> 
      },
      { 
        path: ':id/edit', 
        element: <CompanyLayout><CompanyEdit /></CompanyLayout> 
      },
    ]
  },
  {
    path: 'suppliers',
    element: <ProtectedRoute />,
    children: [
      { 
        path: '', 
        element: <SupplierLayout><Suppliers /></SupplierLayout> 
      },
      { 
        path: ':id', 
        element: <SupplierLayout><SupplierDetails /></SupplierLayout> 
      },
      { 
        path: 'new', 
        element: <SupplierLayout><SupplierNew /></SupplierLayout> 
      },
      { 
        path: ':id/edit', 
        element: <SupplierLayout><SupplierEdit /></SupplierLayout> 
      },
    ]
  },
  {
    path: 'transactions',
    element: <ProtectedRoute />,
    children: [
      { 
        path: '', 
        element: <TransactionLayout><Transactions /></TransactionLayout> 
      },
      { 
        path: ':id', 
        element: <TransactionLayout><TransactionDetails /></TransactionLayout> 
      },
      { 
        path: 'new', 
        element: <TransactionLayout><TransactionNew /></TransactionLayout> 
      },
      { 
        path: ':id/edit', 
        element: <TransactionLayout><TransactionEdit /></TransactionLayout> 
      },
    ]
  },
  {
    path: 'profile',
    element: <ProtectedRoute />,
    children: [
      { 
        path: '', 
        element: <ProfileLayout><Profile /></ProfileLayout> 
      },
    ]
  },
  {
    path: 'dispatch',
    element: <ProtectedRoute />,
    children: [
      { 
        path: '', 
        element: <DispatchLayout><DispatchList /></DispatchLayout> 
      },
      { 
        path: ':id', 
        element: <DispatchLayout><DispatchDetails /></DispatchLayout> 
      },
      { 
        path: 'new', 
        element: <DispatchLayout><DispatchNew /></DispatchLayout> 
      },
    ]
  },
  {
    path: 'inventory',
    element: <ProtectedRoute />,
    children: [
      { 
        path: '', 
        element: <Navigate to="/inventory/stock" replace /> 
      },
      { 
        path: 'stock', 
        element: <InventoryLayout><StockList /></InventoryLayout> 
      },
      { 
        path: 'stock/new', 
        element: <InventoryLayout><StockJournalForm /></InventoryLayout> 
      },
      { 
        path: 'stock/:id', 
        element: <InventoryLayout><StockJournalForm /></InventoryLayout> 
      },
      { 
        path: 'catalog', 
        element: <InventoryLayout><CatalogList /></InventoryLayout> 
      },
      { 
        path: 'catalog/new', 
        element: <InventoryLayout><CatalogNew /></InventoryLayout> 
      },
      { 
        path: 'catalog/:id', 
        element: <InventoryLayout><CatalogOrdersWrapper /></InventoryLayout> 
      },
      { 
        path: 'catalog/:id/orders', 
        element: <InventoryLayout><CatalogOrders /></InventoryLayout> 
      },
    ]
  }
];

function Outlet() {
  return useRoutes([]);
}

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
