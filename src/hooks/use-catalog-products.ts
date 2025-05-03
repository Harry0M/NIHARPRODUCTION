
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  catalog_id?: string;
}

export interface CatalogProduct {
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
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ["catalog-products"],
    queryFn: async () => {
      console.log("Fetching catalog products...");
      
      // First get the current user
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData.user?.id;
      
      console.log("Current user ID:", currentUserId);
      
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
          created_by
        `)
        .order('name');

      if (error) {
        console.error("Error fetching catalog products:", error);
        throw error;
      }
      
      console.log("Raw catalog data:", data);
      
      // Check if any catalog item is missing created_by and update it
      for (const product of data) {
        if (!product.created_by && currentUserId) {
          console.log(`Catalog ${product.id} is missing created_by, setting to current user...`);
          const { error: updateError } = await supabase
            .from("catalog")
            .update({ created_by: currentUserId })
            .eq("id", product.id);
            
          if (updateError) {
            console.error(`Failed to update created_by for catalog ${product.id}:`, updateError);
          } else {
            console.log(`Updated created_by for catalog ${product.id} to ${currentUserId}`);
            // Update local object to reflect the change
            product.created_by = currentUserId;
          }
        }
      }
      
      // Now fetch components for all products
      const productIds = data.map(product => product.id);
      
      if (productIds.length === 0) {
        return [] as CatalogProduct[];
      }
      
      const { data: componentsData, error: componentsError } = await supabase
        .from("catalog_components")
        .select(`
          id,
          catalog_id,
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
        `)
        .in('catalog_id', productIds);
        
      if (componentsError) {
        console.error("Error fetching catalog components:", componentsError);
        throw componentsError;
      }
      
      console.log("Catalog components data:", componentsData);
      
      // Group components by catalog_id
      const componentsByProduct: Record<string, CatalogComponent[]> = {};
      componentsData.forEach(component => {
        if (!componentsByProduct[component.catalog_id]) {
          componentsByProduct[component.catalog_id] = [];
        }
        componentsByProduct[component.catalog_id].push(component as CatalogComponent);
      });
      
      // Set components for each product
      const typedData = data as CatalogProduct[];
      typedData.forEach(product => {
        product.catalog_components = componentsByProduct[product.id] || [];
      });
      
      // Get all unique material IDs to fetch in a single query
      const materialIds = new Set<string>();
      componentsData.forEach(component => {
        if (component.material_id) {
          materialIds.add(component.material_id);
        }
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
        typedData.forEach(product => {
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
      
      console.log("Catalog products data with materials:", typedData);
      return typedData;
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
