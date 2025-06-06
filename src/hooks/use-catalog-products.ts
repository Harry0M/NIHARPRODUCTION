import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Define proper types for our data structures
interface Material {
  id: string;
  material_name: string;
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
  material_linked?: boolean | null;
  material?: Material | null;
  catalog_id?: string;
  formula?: 'standard' | 'linear';
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
  selling_rate?: number | null;
  total_cost?: number | null;
  margin?: number | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  catalog_components?: CatalogComponent[];
  // New cost fields added
  cutting_charge?: number | null;
  printing_charge?: number | null;
  stitching_charge?: number | null;
  transport_charge?: number | null;
  height?: number | null;
}

export const useCatalogProducts = () => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ["catalog-products"],
    queryFn: async () => {
      console.log("Fetching catalog products...");
      
      // Fetch all catalog products with complete info directly from catalog table
      const { data: catalogData, error: catalogError } = await supabase
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
          selling_rate, 
          margin,
          total_cost,
          cutting_charge,
          printing_charge,
          stitching_charge,
          transport_charge,
          height,
          created_at,
          updated_at,
          created_by
        `)
        .order('name');

      if (catalogError) {
        console.error("Error fetching catalog products:", catalogError);
        throw catalogError;
      }
      
      console.log("Raw catalog data:", catalogData);
      
      // If no products, return empty array
      if (!catalogData || catalogData.length === 0) {
        return [] as CatalogProduct[];
      }
      
      // Get all product IDs to fetch components
      const allProductIds = catalogData.map(product => product.id);
      
      // Since we now fetch all data directly from catalog table, we can skip the product_details fetch
      console.log("Direct catalog data with dimensions:", catalogData);
      
      // Products are already complete with dimensions from catalog table
      const mergedProducts = catalogData;
      
      // Fetch all components for these products in a single query
      // Include material_linked field in the query
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
          material_id,
          material_linked,
          formula
        `)
        .in('catalog_id', allProductIds);
        
      if (componentsError) {
        console.error("Error fetching catalog components:", componentsError);
        throw componentsError;
      }
      
      console.log("Catalog components data:", componentsData);
      
      // Get all unique material IDs from components
      const materialIds = new Set<string>();
      componentsData?.forEach(component => {
        if (component.material_id) {
          materialIds.add(component.material_id);
        }
      });
      
      console.log("Material IDs from components:", Array.from(materialIds));
      
      // Create a map to store material data
      const materialsMap: Record<string, Material> = {};
      
      // If there are material IDs, fetch their data
      if (materialIds.size > 0) {
        const materialIdsArray = Array.from(materialIds);
        console.log("Fetching materials with IDs:", materialIdsArray);
        
        const { data: materialsData, error: materialsError } = await supabase
          .from("inventory")
          .select(`
            id, 
            material_name, 
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
        
        console.log("Materials data fetched successfully:", materialsData);
        
        // Store materials by ID for easy lookup
        if (materialsData) {
          materialsData.forEach(material => {
            if (material && typeof material === 'object' && 'id' in material) {
              materialsMap[material.id] = material as Material;
            }
          });
        }
      }
      
      // Create typed catalog products with associated components
      const typedProducts = catalogData as CatalogProduct[];
      
      // Group components by catalog_id
      const componentsByProduct: Record<string, CatalogComponent[]> = {};
      componentsData?.forEach(component => {
        if (!componentsByProduct[component.catalog_id]) {
          componentsByProduct[component.catalog_id] = [];
        }
        
        // Add material data to the component if available and material_linked is true
        const componentWithMaterial = {
          ...component,
          material: (component.material_id && component.material_linked) 
            ? materialsMap[component.material_id] || null 
            : null
        } as CatalogComponent;
        
        // Only log warnings when expected material_id is not found
        if (component.material_id && component.material_linked && !materialsMap[component.material_id]) {
          console.warn(`Component ${component.id} has material_id ${component.material_id} but no material data was found`); 
        }
        
        componentsByProduct[component.catalog_id].push(componentWithMaterial);
      });
      
      // Now add components to our merged products
      const finalProducts = mergedProducts.map(product => {
        return {
          ...product,
          catalog_components: componentsByProduct[product.id] || []
        } as CatalogProduct;
      });
      
      console.log("Final products data with components:", finalProducts.length);
      console.log("Sample product:", finalProducts[0]);
      return finalProducts;
    },
    staleTime: 5000, // Reduce stale time to 5 seconds for more frequent updates
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
          suppliers (
            id,
            name,
            contact_person,
            email,
            phone,
            address,
            payment_terms
          )
        `)
        .is('is_deleted', false);

      if (error) {
        console.error("Error fetching inventory items:", error);
        throw error;
      }
      
      console.log("Inventory items data:", data);
      return data || [];
    },
  });
};
