
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Define proper types for our data structures
interface Material {
  id: string;
  material_type: string;
  color?: string | null;
  gsm?: string | null;
  quantity?: number;
  unit?: string;
}

interface CatalogComponent {
  id: string;
  component_type: string;
  size?: string | null;
  color?: string | null;
  gsm?: number | null;
  custom_name?: string | null;
  roll_width?: number | null;
  length?: number | null;
  width?: number | null;
  consumption?: number | null;
  material_id?: string | null;
  material?: Material;
}

interface CatalogProduct {
  id: string;
  name: string;
  description?: string | null;
  bag_length: number;
  bag_width: number;
  border_dimension?: number | null;
  default_quantity?: number | null;
  default_rate?: number | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  catalog_components?: CatalogComponent[];
}

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
          created_by,
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
      
      console.log("Raw catalog data:", data);
      
      // Get all unique material IDs to fetch in a single query
      const materialIds = new Set<string>();
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
        const materialsMap: Record<string, Material> = {};
        materialsData?.forEach(material => {
          materialsMap[material.id] = material as Material;
        });
        
        // Attach material data to each component
        (data as CatalogProduct[])?.forEach(product => {
          product.catalog_components?.forEach(component => {
            if (component.material_id && materialsMap[component.material_id]) {
              component.material = materialsMap[component.material_id];
              console.log(`Attached material to component ${component.id}:`, component.material);
            } else if (component.material_id) {
              console.warn(`Component ${component.id} references material_id ${component.material_id} but no material was found`);
            }
          });
        });
      } else {
        console.log("No material IDs found in components");
      }
      
      console.log("Catalog products data with materials:", data);
      return data as CatalogProduct[];
    },
    staleTime: 10000, // 10 seconds before refetching the same data
    refetchOnWindowFocus: false, // Disable automatic refetching when window gains focus
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
