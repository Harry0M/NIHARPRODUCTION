
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
          default_quantity,
          default_rate,
          catalog_components (
            id,
            component_type,
            size,
            color,
            gsm,
            custom_name
          )
        `);

      if (error) throw error;
      return data;
    },
  });
};
