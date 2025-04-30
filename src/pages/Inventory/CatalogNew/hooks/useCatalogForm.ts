
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Component, CustomComponent, MaterialUsage, ProductDetails, Material } from "../types";

export function useCatalogForm(materials: Material[]) {
  // Product details state
  const [productDetails, setProductDetails] = useState<ProductDetails>({
    name: "",
    description: "",
    bag_length: "",
    bag_width: "",
    default_quantity: "1", // Default to 1
    default_rate: "",
    cutting_charge: "0",
    printing_charge: "0",
    stitching_charge: "0",
    transport_charge: "0"
  });
  
  // Standard components state
  const [components, setComponents] = useState<Record<string, Component>>({});
  
  // Custom components state
  const [customComponents, setCustomComponents] = useState<CustomComponent[]>([]);
  
  // Cost calculation state
  const [materialCost, setMaterialCost] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  
  // Calculate total cost whenever any cost component changes
  useEffect(() => {
    if (materials) {
      calculateMaterialCost();
    }
  }, [components, customComponents, materials]);
  
  useEffect(() => {
    const cutting = parseFloat(productDetails.cutting_charge) || 0;
    const printing = parseFloat(productDetails.printing_charge) || 0;
    const stitching = parseFloat(productDetails.stitching_charge) || 0;
    const transport = parseFloat(productDetails.transport_charge) || 0;
    
    setTotalCost(materialCost + cutting + printing + stitching + transport);
  }, [materialCost, productDetails.cutting_charge, productDetails.printing_charge, 
      productDetails.stitching_charge, productDetails.transport_charge]);
  
  const calculateMaterialCost = () => {
    if (!materials || materials.length === 0) return;
    
    let cost = 0;
    
    // Calculate cost for standard components
    Object.values(components).forEach(comp => {
      if (comp.material_id && comp.material_id !== 'not_applicable' && comp.consumption) {
        const material = materials.find(m => m.id === comp.material_id);
        if (material && material.purchase_price) {
          cost += parseFloat(String(comp.consumption)) * parseFloat(material.purchase_price);
        }
      }
    });
    
    // Calculate cost for custom components
    customComponents.forEach(comp => {
      if (comp.material_id && comp.material_id !== 'not_applicable' && comp.consumption) {
        const material = materials.find(m => m.id === comp.material_id);
        if (material && material.purchase_price) {
          cost += parseFloat(String(comp.consumption)) * parseFloat(material.purchase_price);
        }
      }
    });
    
    setMaterialCost(cost);
  };
  
  // Handle changes to product details
  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProductDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle changes to standard components
  const handleComponentChange = (type: string, field: string, value: string) => {
    setComponents(prev => {
      // Get existing component or create new one with default type
      const component = prev[type] || { 
        id: uuidv4(),
        component_type: type,
        type: type // Added for compatibility with both interfaces
      };
      
      // Create updated component with new field value
      const updatedComponent = {
        ...component,
        [field]: value
      };
      
      // Recalculate consumption if relevant fields change
      if (['material_id', 'roll_width', 'length', 'width'].includes(field) && 
          updatedComponent.roll_width && updatedComponent.length && updatedComponent.width) {
        const length = parseFloat(updatedComponent.length);
        const width = parseFloat(updatedComponent.width);
        const rollWidth = parseFloat(String(updatedComponent.roll_width));
        
        if (!isNaN(length) && !isNaN(width) && !isNaN(rollWidth) && rollWidth > 0) {
          // Formula: (length * width) / (roll_width * 39.39)
          const calculatedConsumption = ((length * width) / (rollWidth * 39.39)).toFixed(4);
          updatedComponent.consumption = calculatedConsumption;
        }
      }
      
      // Return updated components
      return {
        ...prev,
        [type]: updatedComponent
      };
    });
  };
  
  // Handle changes to custom components
  const handleCustomComponentChange = (index: number, field: string, value: string) => {
    setCustomComponents(prev => {
      const updated = [...prev];
      const component = { ...updated[index], [field]: value };
      
      // Recalculate consumption if relevant fields change
      if (['material_id', 'roll_width', 'length', 'width'].includes(field) && 
          component.roll_width && component.length && component.width) {
        const length = parseFloat(String(component.length));
        const width = parseFloat(String(component.width));
        const rollWidth = parseFloat(String(component.roll_width));
        
        if (!isNaN(length) && !isNaN(width) && !isNaN(rollWidth) && rollWidth > 0) {
          // Formula: (length * width) / (roll_width * 39.39)
          const calculatedConsumption = ((length * width) / (rollWidth * 39.39)).toFixed(4);
          component.consumption = calculatedConsumption;
        }
      }
      
      updated[index] = component as CustomComponent;
      return updated;
    });
  };
  
  // Add a new custom component
  const addCustomComponent = () => {
    setCustomComponents([
      ...customComponents, 
      { 
        id: uuidv4(),
        type: "custom",
        component_type: "custom", // Added for compatibility
        customName: "",
        color: "",
        gsm: "",
        size: ""
      }
    ]);
  };
  
  // Remove a custom component
  const removeCustomComponent = (index: number) => {
    setCustomComponents(prev => prev.filter((_, i) => i !== index));
  };
  
  // Calculate and return material usage information
  const usedMaterials = (): MaterialUsage[] => {
    if (!materials) return [];
    
    const materialUsage: Record<string, MaterialUsage> = {};
    
    // Process standard components
    Object.values(components).forEach(comp => {
      if (comp.material_id && comp.material_id !== 'not_applicable' && comp.consumption) {
        const material = materials.find(m => m.id === comp.material_id);
        if (material) {
          if (!materialUsage[comp.material_id]) {
            materialUsage[comp.material_id] = {
              id: comp.material_id,
              name: material.material_type + (material.color ? ` (${material.color})` : '') + (material.gsm ? ` ${material.gsm} GSM` : ''),
              quantity: parseFloat(String(comp.consumption)),
              unit: material.unit,
              cost: material.purchase_price ? parseFloat(String(comp.consumption)) * parseFloat(material.purchase_price) : 0
            };
          } else {
            materialUsage[comp.material_id].quantity += parseFloat(String(comp.consumption));
            materialUsage[comp.material_id].cost += material.purchase_price ? parseFloat(String(comp.consumption)) * parseFloat(material.purchase_price) : 0;
          }
        }
      }
    });
    
    // Process custom components
    customComponents.forEach(comp => {
      if (comp.material_id && comp.material_id !== 'not_applicable' && comp.consumption) {
        const material = materials.find(m => m.id === comp.material_id);
        if (material) {
          if (!materialUsage[comp.material_id]) {
            materialUsage[comp.material_id] = {
              id: comp.material_id,
              name: material.material_type + (material.color ? ` (${material.color})` : '') + (material.gsm ? ` ${material.gsm} GSM` : ''),
              quantity: parseFloat(String(comp.consumption)),
              unit: material.unit,
              cost: material.purchase_price ? parseFloat(String(comp.consumption)) * parseFloat(material.purchase_price) : 0
            };
          } else {
            materialUsage[comp.material_id].quantity += parseFloat(String(comp.consumption));
            materialUsage[comp.material_id].cost += material.purchase_price ? parseFloat(String(comp.consumption)) * parseFloat(material.purchase_price) : 0;
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
