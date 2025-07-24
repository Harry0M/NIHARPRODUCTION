import React from 'react';
import ProtectedRoute from './ProtectedRoute';

// Specific route protection components for common use cases
export const AdminOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute adminOnly>{children}</ProtectedRoute>
);

export const JobCardRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredPermission="canAccessJobCards">{children}</ProtectedRoute>
);

export const PrintingJobRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute 
    requiredPermissions={['canAccessJobCards', 'canAccessPrintingJobs']}
  >
    {children}
  </ProtectedRoute>
);

export const CuttingJobRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute 
    requiredPermissions={['canAccessJobCards', 'canAccessCuttingJobs']}
  >
    {children}
  </ProtectedRoute>
);

export const StitchingJobRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute 
    requiredPermissions={['canAccessJobCards', 'canAccessStitchingJobs']}
  >
    {children}
  </ProtectedRoute>
);

export const InventoryRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredPermission="canAccessInventory">{children}</ProtectedRoute>
);

export const OrdersRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredPermission="canAccessOrders">{children}</ProtectedRoute>
);

export const UserManagementRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredPermission="canManageUsers">{children}</ProtectedRoute>
);

export const PurchasesRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredPermission="canAccessPurchases">{children}</ProtectedRoute>
);

export const PartnersRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredPermission="canAccessPartners">{children}</ProtectedRoute>
);

export const AnalysisRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredPermission="canAccessAnalysis">{children}</ProtectedRoute>
);

export const CompaniesRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredPermission="canAccessCompanies">{children}</ProtectedRoute>
);

export const SellsRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredPermission="canAccessSells">{children}</ProtectedRoute>
);
