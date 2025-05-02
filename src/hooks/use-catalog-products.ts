
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useCatalogProducts = () => {
  return useQuery({
    queryKey: ["catalog-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog")
        .select(`
          id,
          name,
          bag_length,
          bag_width,
          border_dimension,
          default_quantity,
          default_rate,
          created_at,
          updated_at,
          catalog_components (
            id,
            component_type,
            size,
            color,
            gsm,
            custom_name,
            roll_width,
            length,
            width,
            consumption
          )
        `);

      if (error) throw error;
      return data;
    },
  });
};

export const useInventoryItems = () => {
  return useQuery({
    queryKey: ["inventory-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select(`
          id,
          material_type,
          color,
          gsm,
          quantity,
          unit,
          alternate_unit,
          conversion_rate,
          track_cost,
          purchase_price,
          selling_price,
          suppliers (
            id,
            name
          )
        `);

      if (error) throw error;
      return data;
    },
  });
};
