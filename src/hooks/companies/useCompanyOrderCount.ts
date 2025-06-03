import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showToast } from '@/components/ui/enhanced-toast';

interface OrderCountData {
  id: string;
  name: string;
  asCompany: number;
  asSalesAccount: number;
  totalOrders: number;
}

/**
 * Hook to fetch order counts related to companies
 * Retrieves counts for orders where the company is referenced as either:
 * 1. The primary company (company_id)
 * 2. The sales account (sales_account_id)
 */
export function useCompanyOrderCount(companyId?: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [orderCounts, setOrderCounts] = useState<OrderCountData[]>([]);

  useEffect(() => {
    const fetchOrderCounts = async () => {
      try {
        setLoading(true);
        setError(null);

        // If companyId is provided, we'll fetch counts for just that company
        // Otherwise, we'll fetch counts for all companies
        if (companyId) {
          // For a single company, do a direct fetch of all orders
          // We'll count them in JavaScript since it's a smaller dataset
          const { data: asCompany, error: errorAsCompany } = await supabase
            .from('orders')
            .select('id')
            .eq('company_id', companyId);

          const { data: asSalesAccount, error: errorAsSalesAccount } = await supabase
            .from('orders')
            .select('id')
            .eq('sales_account_id', companyId);

          if (errorAsCompany || errorAsSalesAccount) {
            throw new Error(errorAsCompany?.message || errorAsSalesAccount?.message);
          }

          // Get company details
          const { data: company, error: companyError } = await supabase
            .from('companies')
            .select('id, name')
            .eq('id', companyId)
            .single();

          if (companyError) {
            throw new Error(companyError.message);
          }

          const asCompanyCount = asCompany?.length || 0;
          const asSalesAccountCount = asSalesAccount?.length || 0;

          setOrderCounts([{
            id: company.id,
            name: company.name,
            asCompany: asCompanyCount,
            asSalesAccount: asSalesAccountCount,
            totalOrders: asCompanyCount + asSalesAccountCount
          }]);
        } else {
          // For all companies, we'll use a more efficient approach
          // We'll get all companies and then count orders for each
          
          // Fetch all companies
          const { data: companies, error: companiesError } = await supabase
            .from('companies')
            .select('id, name');

          if (companiesError) {
            throw new Error(companiesError.message);
          }

          // For each company, count related orders
          const countPromises = companies.map(async (company) => {
            const { count: asCompanyCount, error: countError1 } = await supabase
              .from('orders')
              .select('id', { count: 'exact', head: true })
              .eq('company_id', company.id);

            const { count: asSalesAccountCount, error: countError2 } = await supabase
              .from('orders')
              .select('id', { count: 'exact', head: true })
              .eq('sales_account_id', company.id);

            if (countError1 || countError2) {
              console.error('Error counting orders:', countError1 || countError2);
              return {
                id: company.id,
                name: company.name,
                asCompany: 0,
                asSalesAccount: 0,
                totalOrders: 0
              };
            }

            return {
              id: company.id,
              name: company.name,
              asCompany: asCompanyCount || 0,
              asSalesAccount: asSalesAccountCount || 0,
              totalOrders: (asCompanyCount || 0) + (asSalesAccountCount || 0)
            };
          });

          const results = await Promise.all(countPromises);
          setOrderCounts(results);
        }
      } catch (error) {
        console.error('Error fetching order counts:', error);
        setError(error instanceof Error ? error : new Error('Unknown error fetching order counts'));
        showToast({
          title: 'Error Fetching Order Counts',
          description: error instanceof Error ? error.message : 'Unknown error occurred',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrderCounts();
  }, [companyId]);

  return { orderCounts, loading, error };
}
