
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { DispatchedOrder, SalesBill, SalesBillFormData } from '@/types/sales-bill';

export const useDispatchedOrders = () => {
  const [dispatchedOrders, setDispatchedOrders] = useState<DispatchedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDispatchedOrders();
  }, []);

  const fetchDispatchedOrders = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('order_dispatches')
        .select(`
          id,
          order_id,
          delivery_date,
          orders (
            id,
            order_number,
            company_name,
            quantity,
            catalog_id,
            companies (
              address
            ),
            catalog (
              id,
              name,
              selling_rate
            )
          )
        `)
        .order('delivery_date', { ascending: false });

      if (error) throw error;

      const formattedOrders: DispatchedOrder[] = (data || []).map((dispatch: any) => ({
        id: dispatch.id,
        dispatch_id: dispatch.id,
        order_id: dispatch.order_id,
        order_number: dispatch.orders?.order_number || '',
        company_name: dispatch.orders?.company_name || '',
        company_address: dispatch.orders?.companies?.address || '',
        catalog_name: dispatch.orders?.catalog?.name || '',
        catalog_id: dispatch.orders?.catalog_id,
        quantity: dispatch.orders?.quantity || 0,
        catalog_selling_rate: dispatch.orders?.catalog?.selling_rate || 0,
        dispatch_date: dispatch.delivery_date
      }));

      setDispatchedOrders(formattedOrders);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching dispatched orders:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    dispatchedOrders,
    loading,
    error,
    refetch: fetchDispatchedOrders
  };
};

export const useSalesBills = () => {
  const [salesBills, setSalesBills] = useState<SalesBill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSalesBills = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('sales_bills')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSalesBills(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching sales bills:', err);
    } finally {
      setLoading(false);
    }
  };

  const createSalesBill = async (formData: SalesBillFormData): Promise<boolean> => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('sales_bills')
        .insert([formData]);

      if (error) throw error;

      toast({
        title: "Sales bill created successfully",
        description: "The sales bill has been saved.",
      });

      await fetchSalesBills();
      return true;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error creating sales bill",
        description: err.message,
        variant: "destructive",
      });
      console.error('Error creating sales bill:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateSalesBill = async (id: string, formData: Partial<SalesBillFormData>): Promise<boolean> => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('sales_bills')
        .update(formData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sales bill updated successfully",
        description: "The sales bill has been updated.",
      });

      await fetchSalesBills();
      return true;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Error updating sales bill",
        description: err.message,
        variant: "destructive",
      });
      console.error('Error updating sales bill:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesBills();
  }, []);

  return {
    salesBills,
    loading,
    error,
    createSalesBill,
    updateSalesBill,
    refetch: fetchSalesBills
  };
};
