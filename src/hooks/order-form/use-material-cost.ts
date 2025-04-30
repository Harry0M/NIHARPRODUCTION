
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Component, MaterialUsage } from "@/types/order";

export function useMaterialCost(
  components: Record<string, any>,
  customComponents: Component[],
  quantity: string,
  setTotalMaterialCost: (cost: number) => void
) {
  // Fetch inventory data for calculations
  const { data: inventoryItems } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate total material cost and material usage whenever components or quantity changes
  useEffect(() => {
    calculateTotalMaterialCost();
  }, [components, customComponents, quantity, inventoryItems]);

  const calculateTotalMaterialCost = () => {
    if (!inventoryItems) return;
    
    let totalCost = 0;
    const orderQuantity = parseInt(quantity) || 0;
    const materialUsage: Record<string, MaterialUsage> = {};
    
    // Calculate cost from standard components
    Object.values(components).forEach(component => {
      if (component.material_id && component.consumption) {
        const material = inventoryItems.find(item => item.id === component.material_id);
        if (material && material.purchase_price) {
          const consumption = parseFloat(String(component.consumption)) || 0;
          totalCost += consumption * parseFloat(String(material.purchase_price));
          
          // Track material usage
          if (!materialUsage[material.id]) {
            materialUsage[material.id] = {
              material_id: material.id,
              material_name: material.material_type || '',
              material_color: material.color || '',
              material_gsm: material.gsm || '',
              consumption: consumption,
              available_quantity: material.quantity || 0,
              unit: material.unit || ''
            };
          } else {
            materialUsage[material.id].consumption += consumption;
          }
        }
      }
    });
    
    // Calculate cost from custom components
    customComponents.forEach(component => {
      if (component.material_id && component.consumption) {
        const material = inventoryItems.find(item => item.id === component.material_id);
        if (material && material.purchase_price) {
          const consumption = parseFloat(String(component.consumption)) || 0;
          totalCost += consumption * parseFloat(String(material.purchase_price));
          
          // Track material usage
          if (!materialUsage[material.id]) {
            materialUsage[material.id] = {
              material_id: material.id,
              material_name: material.material_type || '',
              material_color: material.color || '',
              material_gsm: material.gsm || '',
              consumption: consumption,
              available_quantity: material.quantity || 0,
              unit: material.unit || ''
            };
          } else {
            materialUsage[material.id].consumption += consumption;
          }
        }
      }
    });
    
    setTotalMaterialCost(totalCost);
    // Save material usage data to localStorage for use in other components
    localStorage.setItem('orderMaterialUsage', JSON.stringify(Object.values(materialUsage)));
  };

  return { 
    inventoryItems,
    calculateMaterialUsage: () => {
      if (!inventoryItems) return [];
      
      const materialUsage: Record<string, MaterialUsage> = {};
      
      // Process standard components
      Object.values(components).forEach(component => {
        if (component.material_id && component.consumption) {
          const material = inventoryItems.find(item => item.id === component.material_id);
          if (material) {
            const consumption = parseFloat(String(component.consumption)) || 0;
            if (!materialUsage[material.id]) {
              materialUsage[material.id] = {
                material_id: material.id,
                material_name: material.material_type || '',
                material_color: material.color || '',
                material_gsm: material.gsm || '',
                consumption: consumption,
                available_quantity: material.quantity || 0,
                unit: material.unit || ''
              };
            } else {
              materialUsage[material.id].consumption += consumption;
            }
          }
        }
      });
      
      // Process custom components
      customComponents.forEach(component => {
        if (component.material_id && component.consumption) {
          const material = inventoryItems.find(item => item.id === component.material_id);
          if (material) {
            const consumption = parseFloat(String(component.consumption)) || 0;
            if (!materialUsage[material.id]) {
              materialUsage[material.id] = {
                material_id: material.id,
                material_name: material.material_type || '',
                material_color: material.color || '',
                material_gsm: material.gsm || '',
                consumption: consumption,
                available_quantity: material.quantity || 0,
                unit: material.unit || ''
              };
            } else {
              materialUsage[material.id].consumption += consumption;
            }
          }
        }
      });
      
      return Object.values(materialUsage);
    }
  };
}
