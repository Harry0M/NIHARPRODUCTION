
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import type { CatalogProduct } from "@/hooks/use-catalog-products";

interface ComponentType {
  id: string;
  type: string;
  customName?: string;
  color?: string;
  gsm?: string;
  length?: string;
  width?: string;
  roll_width?: string;
  material_id?: string;
  material_linked?: boolean;
  consumption?: string;
  baseConsumption?: string;
  materialRate?: number;
  materialCost?: number;
  formula?: 'standard' | 'linear';
}

export const useProductEditForm = () => {
  const [productData, setProductData] = useState({
    name: "",
    description: "",
    bag_length: "",
    bag_width: "",
    border_dimension: "",
    default_quantity: "",
    default_rate: "",
    selling_rate: "",
    margin: "",
    cutting_charge: "0",
    printing_charge: "0",
    stitching_charge: "0",
    transport_charge: "0",
    material_cost: "0",
    total_cost: "0"
  });
  
  const [components, setComponents] = useState<Record<string, any>>({});
  const [customComponents, setCustomComponents] = useState<ComponentType[]>([]);
  const [existingComponents, setExistingComponents] = useState<any[]>([]);
  const [deletedComponentIds, setDeletedComponentIds] = useState<string[]>([]);
  const [materialPrices, setMaterialPrices] = useState<Record<string, number>>({});

  const fetchMaterialPrice = useCallback(async (materialId: string): Promise<number | null> => {
    if (materialPrices[materialId] !== undefined) {
      return materialPrices[materialId];
    }
    
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('purchase_rate, purchase_price')
        .eq('id', materialId)
        .single();
      
      if (error) {
        console.error('Error fetching material price:', error);
        return null;
      }
      
      const price = data.purchase_rate || data.purchase_price || 0;
      setMaterialPrices(prev => ({ ...prev, [materialId]: price }));
      return price;
    } catch (error) {
      console.error('Error fetching material price:', error);
      return null;
    }
  }, [materialPrices]);

  const calculateTotalCost = useCallback((data: typeof productData) => {
    const materialCost = parseFloat(data.material_cost) || 0;
    const cuttingCharge = parseFloat(data.cutting_charge) || 0;
    const printingCharge = parseFloat(data.printing_charge) || 0;
    const stitchingCharge = parseFloat(data.stitching_charge) || 0;
    const transportCharge = parseFloat(data.transport_charge) || 0;
    
    return materialCost + cuttingCharge + printingCharge + stitchingCharge + transportCharge;
  }, []);

  const calculateTotalMaterialCost = useCallback(() => {
    let totalCost = 0;
    
    Object.values(components).forEach((component: any) => {
      if (component && component.material_id && materialPrices[component.material_id]) {
        const consumption = parseFloat(component.consumption || '0');
        const rate = materialPrices[component.material_id];
        if (!isNaN(consumption) && !isNaN(rate)) {
          totalCost += consumption * rate;
        }
      }
    });
    
    customComponents.forEach((component) => {
      if (component.material_id && materialPrices[component.material_id]) {
        const consumption = parseFloat(component.consumption || '0');
        const rate = materialPrices[component.material_id];
        if (!isNaN(consumption) && !isNaN(rate)) {
          totalCost += consumption * rate;
        }
      }
    });
    
    return totalCost;
  }, [components, customComponents, materialPrices]);

  const componentCosts = calculateTotalMaterialCost();
  const totalConsumption = Object.values(components).reduce((total, comp: any) => {
    return total + (parseFloat(comp?.consumption || '0'));
  }, 0) + customComponents.reduce((total, comp) => {
    return total + (parseFloat(comp.consumption || '0'));
  }, 0);

  const handleProductChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProductData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Calculate margin when selling_rate or default_rate changes
      if (name === "selling_rate" || name === "default_rate") {
        const costRate = parseFloat(name === "default_rate" ? value : updated.default_rate);
        const sellingRate = parseFloat(name === "selling_rate" ? value : updated.selling_rate);
        
        if (!isNaN(costRate) && !isNaN(sellingRate) && costRate > 0) {
          const calculatedMargin = ((sellingRate - costRate) / costRate) * 100;
          updated.margin = calculatedMargin.toFixed(2);
        }
      }
      
      // Update selling_rate when margin changes
      if (name === "margin") {
        const costRate = parseFloat(updated.default_rate);
        const marginValue = parseFloat(value);
        
        if (!isNaN(costRate) && !isNaN(marginValue) && costRate > 0) {
          const calculatedSellingRate = costRate * (1 + (marginValue / 100));
          updated.selling_rate = calculatedSellingRate.toFixed(2);
        }
      }
      
      // Recalculate total cost when cost components change
      if (["cutting_charge", "printing_charge", "stitching_charge", "transport_charge", "material_cost"].includes(name)) {
        const totalCost = calculateTotalCost(updated);
        updated.total_cost = totalCost.toFixed(2);
      }
      
      return updated;
    });
  }, [calculateTotalCost]);

  const handleComponentChange = useCallback((type: string, field: string, value: string) => {
    setComponents(prev => {
      const component = prev[type] || { 
        id: existingComponents.find(c => c.component_type === type)?.id || uuidv4(),
        type 
      };
      return {
        ...prev,
        [type]: {
          ...component,
          [field]: value
        }
      };
    });
  }, [existingComponents]);

  const handleCustomComponentChange = useCallback((index: number, field: string, value: string) => {
    setCustomComponents(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const addCustomComponent = useCallback(() => {
    setCustomComponents(prev => [
      ...prev, 
      { 
        id: uuidv4(),
        type: "custom",
        customName: "" 
      }
    ]);
  }, []);

  const removeCustomComponent = useCallback((index: number) => {
    const componentToRemove = customComponents[index];
    
    if (componentToRemove.id && existingComponents.some(c => c.id === componentToRemove.id)) {
      setDeletedComponentIds(prev => [...prev, componentToRemove.id]);
    }
    
    setCustomComponents(prev => prev.filter((_, i) => i !== index));
  }, [customComponents, existingComponents]);

  const initializeFromProduct = useCallback((product: CatalogProduct) => {
    console.log("Initializing form from product:", product);
    
    setProductData({
      name: product.name,
      description: product.description || "",
      bag_length: product.bag_length.toString(),
      bag_width: product.bag_width.toString(),
      border_dimension: product.border_dimension ? product.border_dimension.toString() : "",
      default_quantity: product.default_quantity ? product.default_quantity.toString() : "",
      default_rate: product.default_rate ? product.default_rate.toString() : "",
      selling_rate: product.selling_rate ? product.selling_rate.toString() : "",
      margin: product.margin ? product.margin.toString() : "",
      cutting_charge: product.cutting_charge ? product.cutting_charge.toString() : "0",
      printing_charge: product.printing_charge ? product.printing_charge.toString() : "0",
      stitching_charge: product.stitching_charge ? product.stitching_charge.toString() : "0",
      transport_charge: product.transport_charge ? product.transport_charge.toString() : "0",
      material_cost: product.total_cost ? (product.total_cost - (product.cutting_charge || 0) - (product.printing_charge || 0) - (product.stitching_charge || 0) - (product.transport_charge || 0)).toString() : "0",
      total_cost: product.total_cost ? product.total_cost.toString() : "0"
    });

    const standardComponentTypes = ['part', 'border', 'handle', 'chain', 'runner'];
    const productComponents = product.catalog_components || [];
    
    const standardComps: Record<string, any> = {};
    const customComps: ComponentType[] = [];
    
    productComponents.forEach(comp => {
      if (standardComponentTypes.includes(comp.component_type)) {
        standardComps[comp.component_type] = {
          id: comp.id,
          type: comp.component_type,
          color: comp.color || undefined,
          gsm: comp.gsm?.toString() || undefined,
          length: comp.length?.toString() || undefined,
          width: comp.width?.toString() || undefined,
          roll_width: comp.roll_width?.toString() || undefined,
          formula: comp.formula || 'standard',
          consumption: comp.consumption?.toString() || undefined,
          material_id: comp.material_id || undefined,
        };
      } else {
        customComps.push({
          id: comp.id,
          type: 'custom',
          customName: comp.custom_name || comp.component_type,
          color: comp.color || undefined,
          gsm: comp.gsm?.toString() || undefined,
          length: comp.length?.toString() || undefined,
          width: comp.width?.toString() || undefined,
          roll_width: comp.roll_width?.toString() || undefined,
          formula: comp.formula || 'standard',
          consumption: comp.consumption?.toString() || undefined,
          material_id: comp.material_id || undefined,
        });
      }
    });
    
    setComponents(standardComps);
    setCustomComponents(customComps);
    setExistingComponents(productComponents);
  }, []);

  return {
    productData,
    components,
    customComponents,
    materialPrices,
    componentCosts,
    totalConsumption,
    existingComponents,
    deletedComponentIds,
    handleProductChange,
    calculateTotalCost,
    fetchMaterialPrice,
    handleComponentChange,
    handleCustomComponentChange,
    addCustomComponent,
    removeCustomComponent,
    initializeFromProduct
  };
};
