
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useCatalogProducts = () => {
  return useQuery({
    queryKey: ["catalog-products"],
    queryFn: async () => {
      console.log("Fetching catalog products...");
      const { data, error } = await supabase
        .from("catalog")
        .select(`
          id,
          name,
          description,
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
            consumption,
            material_id
          )
        `)
        .order('name');

      if (error) {
        console.error("Error fetching catalog products:", error);
        throw error;
      }
      
      // Get all unique material IDs to fetch in a single query
      const materialIds = new Set();
      data?.forEach(product => {
        product.catalog_components?.forEach(component => {
          if (component.material_id) {
            materialIds.add(component.material_id);
          }
        });
      });
      
      // If we have material IDs, fetch their details
      if (materialIds.size > 0) {
        const materialIdsArray = Array.from(materialIds);
        console.log("Fetching materials with IDs:", materialIdsArray);
        
        const { data: materialsData, error: materialsError } = await supabase
          .from("inventory")
          .select(`
            id, 
            material_type, 
            color, 
            gsm,
            quantity,
            unit
          `)
          .in('id', materialIdsArray);
        
        if (materialsError) {
          console.error("Error fetching materials:", materialsError);
          throw materialsError;
        }
        
        console.log("Materials data:", materialsData);
        
        // Map materials by ID for easy lookup
        const materialsMap = {};
        materialsData?.forEach(material => {
          materialsMap[material.id] = material;
        });
        
        // Attach material data to each component
        data?.forEach(product => {
          product.catalog_components?.forEach(component => {
            if (component.material_id && materialsMap[component.material_id]) {
              component.material = materialsMap[component.material_id];
            }
          });
        });
      }
      
      console.log("Catalog products data with materials:", data);
      return data;
    },
  });
};

export const useInventoryItems = () => {
  return useQuery({
    queryKey: ["inventory-items"],
    queryFn: async () => {
      console.log("Fetching inventory items...");
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

      if (error) {
        console.error("Error fetching inventory items:", error);
        throw error;
      }
      
      console.log("Inventory items data:", data);
      return data;
    },
  });
};
