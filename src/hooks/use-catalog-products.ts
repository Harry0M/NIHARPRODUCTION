
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Define proper types for our data structures
interface Material {
  id: string;
  material_name: string;  // Changed from material_type to material_name
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
  // Additional form fields
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
      
      // Fetch all catalog products
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
          created_at,
          updated_at,
          created_by,
          cutting_charge,
          printing_charge,
          stitching_charge,
          transport_charge,
          height
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
      
      // Get all product IDs for fetching components
      const productIds = catalogData.map(product => product.id);
      
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
          material_linked
        `)
        .in('catalog_id', productIds);
        
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
        
        console.log(`Component ${component.id} has material_id:`, component.material_id);
        console.log(`Component ${component.id} material_linked:`, component.material_linked);
        console.log(`Associated material:`, componentWithMaterial.material);
        
        componentsByProduct[component.catalog_id].push(componentWithMaterial);
      });
      
      // Attach components to their respective products
      typedProducts.forEach(product => {
        product.catalog_components = componentsByProduct[product.id] || [];
      });
      
      console.log("Final catalog products with components:", typedProducts);
      return typedProducts;
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
        `);

      if (error) {
        console.error("Error fetching inventory items:", error);
        throw error;
      }
      
      console.log("Inventory items data:", data);
      return data || [];
    },
  });
};
