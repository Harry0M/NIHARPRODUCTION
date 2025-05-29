
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useInventoryAnalytics = () => {
  return useQuery({
    queryKey: ["inventory-analytics"],
    queryFn: async () => {
      console.log("Fetching inventory analytics...");
      
      // Fetch inventory data
      const { data: inventoryData, error: inventoryError } = await supabase
        .from("inventory")
        .select(`
          id,
          material_name,
          color,
          gsm,
          quantity,
          unit,
          alternate_unit,
          conversion_rate,
          track_cost,
          purchase_price,
          purchase_rate,
          selling_price,
          min_stock_level,
          reorder_level,
          reorder_quantity,
          roll_width,
          rate,
          status,
          category_id,
          location_id,
          supplier_id,
          created_at,
          updated_at,
          suppliers (
            id,
            name,
            contact_person,
            email,
            phone,
            address,
            payment_terms
          )
        `);

      if (inventoryError) {
        console.error("Error fetching inventory data:", inventoryError);
        throw inventoryError;
      }

      // Fetch consumption data
      const { data: consumptionData, error: consumptionError } = await supabase
        .from("material_consumption_analysis")
        .select("*");

      if (consumptionError) {
        console.error("Error fetching consumption data:", consumptionError);
        throw consumptionError;
      }

      // Fetch order consumption data
      const { data: orderConsumptionData, error: orderConsumptionError } = await supabase
        .from("order_material_breakdown")
        .select("*");

      if (orderConsumptionError) {
        console.error("Error fetching order consumption data:", orderConsumptionError);
        throw orderConsumptionError;
      }

      // Calculate inventory value data
      const inventoryValueData = inventoryData?.map(item => ({
        ...item,
        total_value: (item.quantity || 0) * (item.purchase_rate || item.purchase_price || 0)
      })) || [];

      // Calculate refill needs data
      const refillNeedsData = inventoryData?.filter(item => {
        const currentQuantity = item.quantity || 0;
        const reorderLevel = item.reorder_level || 0;
        return currentQuantity <= reorderLevel;
      }) || [];

      console.log("Analytics data fetched successfully");
      
      return {
        inventoryData: inventoryData || [],
        consumptionData: consumptionData || [],
        orderConsumptionData: orderConsumptionData || [],
        inventoryValueData,
        refillNeedsData,
        filters: {
          dateRange: { from: null, to: null },
          materialId: null,
          orderId: null
        },
        updateFilters: () => {},
        isLoading: false
      };
    },
    staleTime: 5000,
  });
};
