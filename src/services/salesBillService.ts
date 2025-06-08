// Database functions for sales bills
import { supabase } from "@/integrations/supabase/client";

// Function to fetch dispatch completed orders
export async function fetchCompletedDispatches(page = 1, pageSize = 10, searchTerm = '') {
  try {
    // Calculate pagination range
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // First get the total count
    let countQuery = supabase
      .from('order_dispatches')
      .select('id', { count: 'exact', head: true })
      .eq('quality_checked', true)
      .eq('quantity_checked', true);
    
    // Apply search filter if provided  
    if (searchTerm) {
      try {
        // We need to handle the search differently since foreign table filtering is complex
        const { data: orderIds, error: orderError } = await supabase
          .from('orders')
          .select('id')
          .or(`order_number.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%`);
        
        if (orderError) {
          console.error('Error searching for orders:', orderError);
          throw orderError;
        }
        
        if (orderIds && orderIds.length > 0) {
          countQuery = countQuery.in('order_id', orderIds.map(o => o.id));
        } else {
          // If no matching orders, return empty result
          return { data: [], totalCount: 0 };
        }
      } catch (error) {
        console.error('Error in order search filtering:', error);
        throw error;
      }
    }
    
    const { count, error: countError } = await countQuery;
    
    if (countError) throw countError;
  // Then fetch the data with order and dispatch batch details
    let query = supabase
      .from('order_dispatches')
      .select(`
        *,
        orders!order_id (
          id,
          order_number,
          company_name,
          customer_address,
          quantity,
          catalog_id,
          rate,
          transport_charge
        ),
        dispatch_batches (*)
      `)
      .eq('quality_checked', true)
      .eq('quantity_checked', true);
      
    // Apply the same search filter if provided
    if (searchTerm) {
      try {
        const { data: orderIds, error: orderError } = await supabase
          .from('orders')
          .select('id')
          .or(`order_number.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%`);
        
        if (orderError) {
          console.error('Error searching for orders:', orderError);
          throw orderError;
        }
        
        if (orderIds && orderIds.length > 0) {
          query = query.in('order_id', orderIds.map(o => o.id));
        }
      } catch (error) {
        console.error('Error in order search filtering for main query:', error);
        throw error;
      }
    }
      const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) {
      console.error('Error in dispatch query:', error);
      throw error;
    }
      // If we have catalog_id, fetch catalog name for each dispatch
    if (data && data.length > 0) {
      try {
        for (const dispatch of data) {
          // Check if we have an orders record with catalog_id
          if (dispatch.orders && dispatch.orders.catalog_id) {
            const catalogId = dispatch.orders.catalog_id;
            const { data: catalogData, error: catalogError } = await supabase
              .from('catalog')
              .select('name')
              .eq('id', catalogId)
              .single();
              
            if (catalogError) {
              console.warn(`Error fetching catalog for ID ${catalogId}:`, catalogError);
            } else if (catalogData) {
              dispatch.catalog_name = catalogData.name;
            }
          }
        }
      } catch (error) {
        console.error('Error fetching catalog names:', error);
        // Continue with the data we have even if catalog names couldn't be fetched
      }
    }
    
    return { 
      data: data || [], 
      totalCount: count || 0 
    };
  } catch (error) {
    console.error('Error fetching completed dispatches:', error);
    throw error;
  }
}

// Function to create a sales bill
export async function createSalesBill(billData: Partial<SalesBill>) {
  try {
    const { data, error } = await supabase
      .from('sales_bills')
      .insert([billData])
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error creating sales bill:', error);
    throw error;
  }
}

// Function to fetch sales bill by ID
export async function fetchSalesBillById(id: string) {
  try {
    const { data, error } = await supabase
      .from('sales_bills')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    return data as SalesBill;
  } catch (error) {
    console.error('Error fetching sales bill:', error);
    throw error;
  }
}

// Function to fetch all sales bills with pagination
export async function fetchSalesBills(page = 1, pageSize = 10, searchTerm = '') {
  try {
    // Calculate pagination range
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // First get the total count
    let countQuery = supabase
      .from('sales_bills')
      .select('id', { count: 'exact', head: true });
      
    if (searchTerm) {
      countQuery = countQuery.or(`company_name.ilike.%${searchTerm}%,bill_number.ilike.%${searchTerm}%,catalog_name.ilike.%${searchTerm}%`);
    }
    
    const { count, error: countError } = await countQuery;
    
    if (countError) throw countError;
    
    // Then fetch the paginated data
    let query = supabase
      .from('sales_bills')
      .select('*');
      
    if (searchTerm) {
      query = query.or(`company_name.ilike.%${searchTerm}%,bill_number.ilike.%${searchTerm}%,catalog_name.ilike.%${searchTerm}%`);
    }
    
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) throw error;
    
    return { 
      data: data || [], 
      totalCount: count || 0 
    };
  } catch (error) {
    console.error('Error fetching sales bills:', error);
    throw error;
  }
}

// Function to update sales bill status
export async function updateSalesBillStatus(id: string, status: string) {
  try {
    const { data, error } = await supabase
      .from('sales_bills')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return data as SalesBill;
  } catch (error) {
    console.error('Error updating sales bill status:', error);
    throw error;
  }
}

// Function to update sales bill payment status
export async function updateSalesBillPaymentStatus(id: string, paymentStatus: string) {
  try {
    const { data, error } = await supabase
      .from('sales_bills')
      .update({ payment_status: paymentStatus })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return data as SalesBill;
  } catch (error) {
    console.error('Error updating sales bill payment status:', error);
    throw error;
  }
}
