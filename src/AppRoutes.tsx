import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import AuthLayout from "@/layouts/AuthLayout";
import Auth from "@/pages/Auth";
import DashboardPage from "@/pages/Dashboard";
import Orders from "@/pages/Orders/Orders";
import OrderNew from "@/pages/Orders/OrderNew";
import CompanyList from "@/pages/Companies/CompanyList";
import CompanyNew from "@/pages/Companies/CompanyNew";
import CompanyDetail from "@/pages/Companies/CompanyDetail";
import CompanyEdit from "@/pages/Companies/CompanyEdit";
import ProductionDashboard from "@/pages/Production/ProductionDashboard";
import JobCardsList from "@/pages/Production/JobCardsList";
import CuttingJobNew from "@/pages/Production/CuttingJobNew";
import PrintingJobNew from "@/pages/Production/PrintingJobNew";
import StitchingJobNew from "@/pages/Production/StitchingJobNew";
import DispatchForm from "@/pages/Production/DispatchForm";
import DispatchList from "@/pages/Production/DispatchList";
import InventoryList from "@/pages/Inventory/InventoryList";
import StockList from "@/pages/Inventory/StockList";
import CatalogList from "@/pages/Inventory/CatalogList";
import CatalogNew from "@/pages/Inventory/CatalogNew/CatalogNew";
import CatalogDetail from "@/pages/Inventory/CatalogDetail";
import PurchaseList from "@/pages/Inventory/Purchase/PurchaseList";
import PurchaseNew from "@/pages/Inventory/Purchase/PurchaseNew";
import PurchaseDetail from "@/pages/Inventory/Purchase/PurchaseDetail";
import AnalysisDashboard from "@/pages/Analysis/AnalysisDashboard";
import InventoryValue from "@/pages/Analysis/InventoryValue";
import MaterialConsumption from "@/pages/Analysis/MaterialConsumption";
import OrderConsumption from "@/pages/Analysis/OrderConsumption";
import RefillAnalysis from "@/pages/Analysis/RefillAnalysis";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import CatalogEditNew from "@/pages/Inventory/CatalogEdit/CatalogEditNew";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route index element={<Auth />} />
      </Route>

      {/* Protected Routes */}
      <Route 
        path="/*" 
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<DashboardPage />} />
        
        {/* Orders Routes */}
        <Route path="orders" element={<Orders />} />
        <Route path="orders/new" element={<OrderNew />} />
        
        {/* Companies Routes */}
        <Route path="companies" element={<CompanyList />} />
        <Route path="companies/new" element={<CompanyNew />} />
        <Route path="companies/:id" element={<CompanyDetail />} />
        <Route path="companies/:id/edit" element={<CompanyEdit />} />
        
        {/* Production Routes */}
        <Route path="production" element={<ProductionDashboard />} />
        <Route path="production/job-cards" element={<JobCardsList />} />
        <Route path="production/cutting/:id" element={<CuttingJobNew />} />
        <Route path="production/printing/:id" element={<PrintingJobNew />} />
        <Route path="production/stitching/:id" element={<StitchingJobNew />} />
        <Route path="production/dispatch/:id" element={<DispatchForm />} />
        <Route path="production/dispatches" element={<DispatchList />} />
        
        {/* Inventory Routes */}
        <Route path="inventory" element={<InventoryList />} />
        <Route path="inventory/stock" element={<StockList />} />
        <Route path="inventory/catalog" element={<CatalogList />} />
        <Route path="inventory/catalog/new" element={<CatalogNew />} />
        <Route path="inventory/catalog/:id" element={<CatalogDetail />} />
        <Route path="inventory/catalog/:id/edit" element={<CatalogEditNew />} />
        <Route path="inventory/purchase" element={<PurchaseList />} />
        <Route path="inventory/purchase/new" element={<PurchaseNew />} />
        <Route path="inventory/purchase/:id" element={<PurchaseDetail />} />
        
        {/* Analysis Routes */}
        <Route path="analysis" element={<AnalysisDashboard />} />
        <Route path="analysis/inventory-value" element={<InventoryValue />} />
        <Route path="analysis/material-consumption" element={<MaterialConsumption />} />
        <Route path="analysis/order-consumption" element={<OrderConsumption />} />
        <Route path="analysis/refill-analysis" element={<RefillAnalysis />} />
        
        {/* Default redirect */}
        <Route index element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
