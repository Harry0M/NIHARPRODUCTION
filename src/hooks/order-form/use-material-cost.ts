
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useMaterialCost(
  components: Record<string, any>,
  customComponents: any[],
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

  // Calculate total material cost whenever components or quantity changes
  useEffect(() => {
    calculateTotalMaterialCost();
  }, [components, customComponents, quantity, inventoryItems]);

  const calculateTotalMaterialCost = () => {
    if (!inventoryItems) return;
    
    let totalCost = 0;
    const orderQuantity = parseInt(quantity) || 0;
    
    // Calculate cost from standard components
    Object.values(components).forEach(component => {
      if (component.material_id && component.consumption) {
        const material = inventoryItems.find(item => item.id === component.material_id);
        if (material && material.purchase_price) {
          const consumption = parseFloat(component.consumption) || 0;
          totalCost += consumption * parseFloat(material.purchase_price);
        }
      }
    });
    
    // Calculate cost from custom components
    customComponents.forEach(component => {
      if (component.material_id && component.consumption) {
        const material = inventoryItems.find(item => item.id === component.material_id);
        if (material && material.purchase_price) {
          const consumption = parseFloat(component.consumption) || 0;
          totalCost += consumption * parseFloat(material.purchase_price);
        }
      }
    });
    
    setTotalMaterialCost(totalCost);
  };

  return { inventoryItems };
}
