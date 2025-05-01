
import { useState, useEffect } from "react";
import { ProductDetails, Component, CustomComponent } from "../types";

export function useCatalogForm(materials: any[]) {
  const [productDetails, setProductDetails] = useState<ProductDetails>({
    name: "",
    description: "",
    bag_length: 0,
    bag_width: 0,
    height: 0,
    default_quantity: 1,
    default_rate: 0,
    cutting_charge: 0,
    printing_charge: 0,
    stitching_charge: 0,
    transport_charge: 0
  });
  
  const [components, setComponents] = useState<Record<string, Component>>({});
  const [customComponents, setCustomComponents] = useState<CustomComponent[]>([]);
  
  const [materialCost, setMaterialCost] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  
  // Calculate material cost whenever components, custom components, or default quantity changes
  useEffect(() => {
    calculateMaterialCost();
  }, [components, customComponents, materials, productDetails.default_quantity]);

  useEffect(() => {
    // Calculate total cost whenever any cost component changes
    const cutting = parseFloat(productDetails.cutting_charge.toString()) || 0;
    const printing = parseFloat(productDetails.printing_charge.toString()) || 0;
    const stitching = parseFloat(productDetails.stitching_charge.toString()) || 0;
    const transport = parseFloat(productDetails.transport_charge.toString()) || 0;
    
    setTotalCost(materialCost + cutting + printing + stitching + transport);
  }, [materialCost, productDetails.cutting_charge, productDetails.printing_charge, 
      productDetails.stitching_charge, productDetails.transport_charge]);
  
  // Update consumption values when default_quantity changes
  useEffect(() => {
    updateComponentConsumptions();
  }, [productDetails.default_quantity]);
  
  // Function to update consumption based on default quantity
  const updateComponentConsumptions = () => {
    const defaultQuantity = Number(productDetails.default_quantity) || 1;
    
    // Update standard components consumption
    setComponents(prevComponents => {
      const updatedComponents = { ...prevComponents };
      
      Object.keys(updatedComponents).forEach(type => {
        const component = updatedComponents[type];
        if (component && component.length && component.width && component.roll_width) {
          const length = parseFloat(String(component.length));
          const width = parseFloat(String(component.width));
          const rollWidth = parseFloat(String(component.roll_width));
          
          if (!isNaN(length) && !isNaN(width) && !isNaN(rollWidth) && rollWidth > 0) {
            // Base consumption for a single unit
            const baseConsumption = (length * width) / (rollWidth * 39.39);
            // Adjust for quantity
            updatedComponents[type] = {
              ...component,
              consumption: (baseConsumption * defaultQuantity).toFixed(4)
            };
          }
        }
      });
      
      return updatedComponents;
    });
    
    // Update custom components consumption
    setCustomComponents(prevCustomComponents => {
      return prevCustomComponents.map(component => {
        if (component.length && component.width && component.roll_width) {
          const length = parseFloat(String(component.length));
          const width = parseFloat(String(component.width));
          const rollWidth = parseFloat(String(component.roll_width));
          
          if (!isNaN(length) && !isNaN(width) && !isNaN(rollWidth) && rollWidth > 0) {
            // Base consumption for a single unit
            const baseConsumption = (length * width) / (rollWidth * 39.39);
            // Adjust for quantity
            return {
              ...component,
              consumption: (baseConsumption * defaultQuantity).toFixed(4)
            };
          }
        }
        return component;
      });
    });
  };
  
  const calculateMaterialCost = () => {
    if (!materials || materials.length === 0) return;
    
    let cost = 0;
    const defaultQuantity = Number(productDetails.default_quantity) || 1;
    
    // Calculate cost for standard components
    Object.values(components).forEach(comp => {
      if (comp.material_id && comp.material_id !== 'not_applicable' && comp.consumption) {
        const material = materials.find(m => m.id === comp.material_id);
        if (material && material.purchase_price) {
          cost += parseFloat(String(comp.consumption)) * parseFloat(String(material.purchase_price));
        }
      }
    });
    
    // Calculate cost for custom components
    customComponents.forEach(comp => {
      if (comp.material_id && comp.material_id !== 'not_applicable' && comp.consumption) {
        const material = materials.find(m => m.id === comp.material_id);
        if (material && material.purchase_price) {
          cost += parseFloat(String(comp.consumption)) * parseFloat(String(material.purchase_price));
        }
      }
    });
    
    setMaterialCost(cost);
  };
  
  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProductDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleComponentChange = (type: string, field: string, value: string) => {
    setComponents(prev => {
      const component = prev[type] || { 
        id: crypto.randomUUID(),
        type: type as "part" | "border" | "handle" | "chain" | "runner" | "custom"
      };
      
      const updatedComponent = {
        ...component,
        [field]: value
      };
      
      // Recalculate consumption if material_id, roll_width, length or width changes
      if (['material_id', 'roll_width', 'length', 'width'].includes(field) && 
          updatedComponent.roll_width && updatedComponent.length && updatedComponent.width) {
        const length = parseFloat(String(updatedComponent.length));
        const width = parseFloat(String(updatedComponent.width));
        const rollWidth = parseFloat(String(updatedComponent.roll_width));
        const defaultQuantity = Number(productDetails.default_quantity) || 1;
        
        if (!isNaN(length) && !isNaN(width) && !isNaN(rollWidth) && rollWidth > 0) {
          // Formula: (length * width) / (roll_width * 39.39) * quantity
          updatedComponent.consumption = ((length * width) / (rollWidth * 39.39) * defaultQuantity).toFixed(4);
        }
      }
      
      return {
        ...prev,
        [type]: updatedComponent
      };
    });
  };
  
  const handleCustomComponentChange = (index: number, field: string, value: string) => {
    setCustomComponents(prev => {
      const updated = [...prev];
      const component = { ...updated[index], [field]: value };
      
      // Recalculate consumption if material_id, roll_width, length or width changes
      if (['material_id', 'roll_width', 'length', 'width'].includes(field) && 
          component.roll_width && component.length && component.width) {
        const length = parseFloat(String(component.length));
        const width = parseFloat(String(component.width));
        const rollWidth = parseFloat(String(component.roll_width));
        const defaultQuantity = Number(productDetails.default_quantity) || 1;
        
        if (!isNaN(length) && !isNaN(width) && !isNaN(rollWidth) && rollWidth > 0) {
          // Formula: (length * width) / (roll_width * 39.39) * quantity
          component.consumption = ((length * width) / (rollWidth * 39.39) * defaultQuantity).toFixed(4);
        }
      }
      
      updated[index] = component;
      return updated;
    });
  };
  
  const addCustomComponent = () => {
    setCustomComponents(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "custom",
        component_type: "custom",
        custom_name: "",
        color: "",
        gsm: "",
        length: "",
        width: "",
        material_id: "",
        roll_width: "",
        consumption: ""
      }
    ]);
  };
  
  const removeCustomComponent = (index: number) => {
    setCustomComponents(prev => prev.filter((_, i) => i !== index));
  };
  
  const usedMaterials = () => {
    if (!materials) return [];
    
    const materialUsage: Record<string, {
      id: string,
      material_id: string,
      name: string,
      quantity: number,
      unit: string,
      cost: number,
      component_type: string,
      consumption: number,
      unit_cost: number,
      total_cost: number,
      material_name: string
    }> = {};
    
    // Process standard components
    Object.values(components).forEach(comp => {
      if (comp.material_id && comp.material_id !== 'not_applicable' && comp.consumption) {
        const material = materials.find(m => m.id === comp.material_id);
        if (material) {
          const consumptionValue = parseFloat(String(comp.consumption));
          const costValue = material.purchase_price ? consumptionValue * parseFloat(String(material.purchase_price)) : 0;
          
          if (!materialUsage[comp.material_id]) {
            materialUsage[comp.material_id] = {
              id: comp.material_id,
              material_id: comp.material_id,
              name: material.material_type + (material.color ? ` (${material.color})` : '') + (material.gsm ? ` ${material.gsm} GSM` : ''),
              quantity: consumptionValue,
              unit: material.unit,
              cost: costValue,
              component_type: comp.type,
              consumption: consumptionValue,
              unit_cost: parseFloat(String(material.purchase_price)) || 0,
              total_cost: costValue,
              material_name: material.material_type
            };
          } else {
            materialUsage[comp.material_id].quantity += consumptionValue;
            materialUsage[comp.material_id].cost += costValue;
            materialUsage[comp.material_id].total_cost += costValue;
          }
        }
      }
    });
    
    // Process custom components
    customComponents.forEach(comp => {
      if (comp.material_id && comp.material_id !== 'not_applicable' && comp.consumption) {
        const material = materials.find(m => m.id === comp.material_id);
        if (material) {
          const consumptionValue = parseFloat(String(comp.consumption));
          const costValue = material.purchase_price ? consumptionValue * parseFloat(String(material.purchase_price)) : 0;
          
          if (!materialUsage[comp.material_id]) {
            materialUsage[comp.material_id] = {
              id: comp.material_id,
              material_id: comp.material_id,
              name: material.material_type + (material.color ? ` (${material.color})` : '') + (material.gsm ? ` ${material.gsm} GSM` : ''),
              quantity: consumptionValue,
              unit: material.unit,
              cost: costValue,
              component_type: comp.component_type,
              consumption: consumptionValue,
              unit_cost: parseFloat(String(material.purchase_price)) || 0,
              total_cost: costValue,
              material_name: material.material_type
            };
          } else {
            materialUsage[comp.material_id].quantity += consumptionValue;
            materialUsage[comp.material_id].cost += costValue;
            materialUsage[comp.material_id].total_cost += costValue;
          }
        }
      }
    });
    
    return Object.values(materialUsage);
  };

  return {
    productDetails,
    setProductDetails,
    components,
    setComponents,
    customComponents,
    setCustomComponents,
    materialCost,
    totalCost,
    handleProductChange,
    handleComponentChange,
    handleCustomComponentChange,
    addCustomComponent,
    removeCustomComponent,
    usedMaterials
  };
}
