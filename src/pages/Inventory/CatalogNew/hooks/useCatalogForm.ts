
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Component, CustomComponent, MaterialUsage, ProductDetails } from "../types";

export const useCatalogForm = (materials: any[]) => {
  // Product details state
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
    transport_charge: 0,
  });
  
  // Standard components state
  const [components, setComponents] = useState<Record<string, Component>>({});
  
  // Custom added components state
  const [customComponents, setCustomComponents] = useState<CustomComponent[]>([]);
  
  // Cost calculations
  const [materialCost, setMaterialCost] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  // Calculate material cost whenever components, custom components, or default quantity changes
  useEffect(() => {
    calculateMaterialCost();
  }, [components, customComponents, materials, productDetails.default_quantity]);

  // Calculate total cost whenever any cost component changes
  useEffect(() => {
    const cutting = Number(productDetails.cutting_charge) || 0;
    const printing = Number(productDetails.printing_charge) || 0;
    const stitching = Number(productDetails.stitching_charge) || 0;
    const transport = Number(productDetails.transport_charge) || 0;
    
    setTotalCost(materialCost + cutting + printing + stitching + transport);
  }, [materialCost, productDetails.cutting_charge, productDetails.printing_charge, 
      productDetails.stitching_charge, productDetails.transport_charge]);

  // Update all component consumption values when default quantity changes
  useEffect(() => {
    if (productDetails.default_quantity !== 1) {
      recalculateAllConsumptions();
    }
  }, [productDetails.default_quantity]);
  
  const calculateMaterialCost = () => {
    if (!materials || materials.length === 0) return;
    
    let cost = 0;
    const defaultQuantity = Number(productDetails.default_quantity) || 1;
    
    // Calculate cost for standard components
    Object.values(components).forEach(comp => {
      if (comp.material_id && comp.material_id !== 'not_applicable' && comp.consumption) {
        const material = materials.find(m => m.id === comp.material_id);
        if (material && material.purchase_price) {
          cost += parseFloat(String(comp.consumption)) * parseFloat(String(material.purchase_price)) * defaultQuantity;
        }
      }
    });
    
    // Calculate cost for custom components
    customComponents.forEach(comp => {
      if (comp.material_id && comp.material_id !== 'not_applicable' && comp.consumption) {
        const material = materials.find(m => m.id === comp.material_id);
        if (material && material.purchase_price) {
          cost += parseFloat(String(comp.consumption)) * parseFloat(String(material.purchase_price)) * defaultQuantity;
        }
      }
    });
    
    setMaterialCost(cost);
  };
  
  const recalculateAllConsumptions = () => {
    // Recalculate for standard components
    const updatedComponents = { ...components };
    
    Object.keys(updatedComponents).forEach(type => {
      const comp = updatedComponents[type];
      if (comp.length && comp.width && comp.roll_width) {
        updatedComponents[type] = {
          ...comp,
          consumption: calculateConsumption(comp.length, comp.width, comp.roll_width)
        };
      }
    });
    
    setComponents(updatedComponents);
    
    // Recalculate for custom components
    const updatedCustomComponents = customComponents.map(comp => {
      if (comp.length && comp.width && comp.roll_width) {
        return {
          ...comp,
          consumption: calculateConsumption(comp.length, comp.width, comp.roll_width)
        };
      }
      return comp;
    });
    
    setCustomComponents(updatedCustomComponents);
  };
  
  const calculateConsumption = (length: string, width: string, rollWidth: string) => {
    const lengthVal = parseFloat(length);
    const widthVal = parseFloat(width);
    const rollWidthVal = parseFloat(rollWidth);
    
    if (!isNaN(lengthVal) && !isNaN(widthVal) && !isNaN(rollWidthVal) && rollWidthVal > 0) {
      return ((lengthVal * widthVal) / (rollWidthVal * 39.39)).toFixed(4);
    }
    
    return "0";
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
        id: uuidv4(),
        type: type as ComponentType
      };
      
      const updatedComponent = {
        ...component,
        [field]: value
      };
      
      // Recalculate consumption if material_id, roll_width, length or width changes
      if (['material_id', 'roll_width', 'length', 'width'].includes(field) && 
          updatedComponent.roll_width && updatedComponent.length && updatedComponent.width) {
        
        updatedComponent.consumption = calculateConsumption(
          updatedComponent.length as string, 
          updatedComponent.width as string, 
          updatedComponent.roll_width as string
        );
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
        
        component.consumption = calculateConsumption(
          component.length as string,
          component.width as string,
          component.roll_width as string
        );
      }
      
      updated[index] = component as CustomComponent;
      return updated;
    });
  };
  
  const addCustomComponent = () => {
    setCustomComponents([
      ...customComponents, 
      { 
        id: uuidv4(),
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
  
  const usedMaterials = (): MaterialUsage[] => {
    if (!materials) return [];
    
    const materialUsage: Record<string, MaterialUsage> = {};
    const defaultQuantity = Number(productDetails.default_quantity) || 1;
    
    // Process standard components
    Object.values(components).forEach(comp => {
      if (comp.material_id && comp.material_id !== 'not_applicable' && comp.consumption) {
        const material = materials.find(m => m.id === comp.material_id);
        if (material) {
          const consumptionValue = parseFloat(String(comp.consumption));
          const costValue = material.purchase_price ? consumptionValue * parseFloat(String(material.purchase_price)) * defaultQuantity : 0;
          
          if (!materialUsage[comp.material_id]) {
            materialUsage[comp.material_id] = {
              id: comp.material_id,
              material_id: comp.material_id,
              name: material.material_type + (material.color ? ` (${material.color})` : '') + (material.gsm ? ` ${material.gsm} GSM` : ''),
              quantity: consumptionValue * defaultQuantity,
              unit: material.unit,
              cost: costValue,
              component_type: comp.type,
              consumption: consumptionValue * defaultQuantity,
              unit_cost: parseFloat(String(material.purchase_price)) || 0,
              total_cost: costValue,
              material_name: material.material_type
            };
          } else {
            materialUsage[comp.material_id].quantity += consumptionValue * defaultQuantity;
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
          const costValue = material.purchase_price ? consumptionValue * parseFloat(String(material.purchase_price)) * defaultQuantity : 0;
          
          if (!materialUsage[comp.material_id]) {
            materialUsage[comp.material_id] = {
              id: comp.material_id,
              material_id: comp.material_id,
              name: material.material_type + (material.color ? ` (${material.color})` : '') + (material.gsm ? ` ${material.gsm} GSM` : ''),
              quantity: consumptionValue * defaultQuantity,
              unit: material.unit,
              cost: costValue,
              component_type: comp.component_type,
              consumption: consumptionValue * defaultQuantity,
              unit_cost: parseFloat(String(material.purchase_price)) || 0,
              total_cost: costValue,
              material_name: material.material_type
            };
          } else {
            materialUsage[comp.material_id].quantity += consumptionValue * defaultQuantity;
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
};

type ComponentType = "part" | "border" | "handle" | "chain" | "runner" | "custom";
