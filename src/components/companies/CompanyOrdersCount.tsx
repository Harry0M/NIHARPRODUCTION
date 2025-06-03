import React from 'react';
import { useCompanyOrderCount } from '@/hooks/companies/useCompanyOrderCount';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface CompanyOrdersCountProps {
  companyId?: string;
  showDetailView?: boolean;
  className?: string;
}

/**
 * Component to display the number of orders associated with companies
 * Can be used in both list view (all companies) or detail view (single company)
 */
export function CompanyOrdersCount({ 
  companyId, 
  showDetailView = false,
  className = ''
}: CompanyOrdersCountProps) {
  const { orderCounts, loading, error } = useCompanyOrderCount(companyId);
  const navigate = useNavigate();

  if (loading) {
    return <div className="flex justify-center p-4"><Spinner size="md" /></div>;
  }

  if (error) {
    return (
      <div className="text-red-500 p-2 text-sm">
        Error loading order counts: {error.message}
      </div>
    );
  }

  if (orderCounts.length === 0) {
    return <div className="text-gray-500 p-2 text-sm">No order data available</div>;
  }

  // For a single company (detail view)
  if (companyId || showDetailView) {
    const company = orderCounts[0];
    
    return (
      <Card className={`shadow-sm ${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Primary Company Orders:</span>
              <Badge variant={company.asCompany > 0 ? "default" : "outline"} className="ml-2">
                {company.asCompany}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Sales Account Orders:</span>
              <Badge variant={company.asSalesAccount > 0 ? "default" : "outline"} className="ml-2">
                {company.asSalesAccount}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="font-medium">Total Orders:</span>
              <Badge variant="secondary" className="ml-2 text-base">
                {company.totalOrders}
              </Badge>
            </div>
            
            {company.totalOrders > 0 && (
              <button
                onClick={() => navigate(`/orders?company=${company.id}`)}
                className="w-full mt-3 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-sm transition-colors"
              >
                View All Orders
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // For all companies (list view)
  return (
    <div className={`grid gap-4 ${className}`}>
      {orderCounts
        .sort((a, b) => b.totalOrders - a.totalOrders) // Sort by total orders, highest first
        .map(company => (
          <div 
            key={company.id}
            className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
            onClick={() => navigate(`/companies/${company.id}`)}
          >
            <div>
              <h3 className="font-medium">{company.name}</h3>
              <div className="text-xs text-gray-500 mt-1">
                <span className="mr-3">Company: {company.asCompany}</span>
                <span>Sales Account: {company.asSalesAccount}</span>
              </div>
            </div>
            <Badge variant={company.totalOrders > 0 ? "default" : "outline"} className="ml-2">
              {company.totalOrders} Orders
            </Badge>
          </div>
        ))}
    </div>
  );
}
