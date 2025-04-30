
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Component, CustomComponent, Material, MaterialUsage, ProductDetails } from "../types";

const initialProductDetails: ProductDetails = {
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
};

export const useCatalogForm = (materials: Material[] | undefined) => {
  // Product details state
  const [productDetails, setProductDetails] = useState<ProductDetails>(initialProductDetails);
  
  // Standard components state
  const [components, setComponents] = useState<Record<string, Component>>({});
  
  // Custom added components state
  const [customComponents, setCustomComponents] = useState<CustomComponent[]>([]);
  
  // Calculate total material cost
  const [materialCost, setMaterialCost] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  
  useEffect(() => {
    if (materials) {
      calculateMaterialCost();
    }
  }, [components, customComponents, materials]);

  useEffect(() => {
    // Calculate total cost whenever any cost component changes
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
          cost += parseFloat(comp.consumption) * parseFloat(material.purchase_price);
        }
      }
    });
    
    // Calculate cost for custom components
    customComponents.forEach(comp => {
      if (comp.material_id && comp.material_id !== 'not_applicable' && comp.consumption) {
        const material = materials.find(m => m.id === comp.material_id);
        if (material && material.purchase_price) {
          cost += parseFloat(comp.consumption) * parseFloat(material.purchase_price);
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
        id: uuidv4(),
        type 
      };
      
      const updatedComponent = {
        ...component,
        [field]: value
      };
      
      // Recalculate consumption if material_id, roll_width, length or width changes
      if (['material_id', 'roll_width', 'length', 'width'].includes(field) && 
          updatedComponent.roll_width && updatedComponent.length && updatedComponent.width) {
        const length = parseFloat(updatedComponent.length);
        const width = parseFloat(updatedComponent.width);
        const rollWidth = parseFloat(updatedComponent.roll_width);
        
        if (!isNaN(length) && !isNaN(width) && !isNaN(rollWidth) && rollWidth > 0) {
          // Formula: (length * width) / (roll_width * 39.39)
          // Convert result to string since the component expects a string value
          updatedComponent.consumption = ((length * width) / (rollWidth * 39.39)).toFixed(4).toString();
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
        const length = parseFloat(component.length);
        const width = parseFloat(component.width);
        const rollWidth = parseFloat(component.roll_width);
        
        if (!isNaN(length) && !isNaN(width) && !isNaN(rollWidth) && rollWidth > 0) {
          // Formula: (length * width) / (roll_width * 39.39)
          // Convert result to string since the component expects a string value
          component.consumption = ((length * width) / (rollWidth * 39.39)).toFixed(4).toString();
        }
      }
      
      updated[index] = component;
      return updated;
    });
  };
  
  const addCustomComponent = () => {
    setCustomComponents([
      ...customComponents, 
      { 
        id: uuidv4(),
        type: "custom",
        customName: "" 
      }
    ]);
  };
  
  const removeCustomComponent = (index: number) => {
    setCustomComponents(prev => prev.filter((_, i) => i !== index));
  };
  
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
              quantity: parseFloat(comp.consumption),
              unit: material.unit,
              cost: material.purchase_price ? parseFloat(comp.consumption) * parseFloat(material.purchase_price) : 0
            };
          } else {
            materialUsage[comp.material_id].quantity += parseFloat(comp.consumption);
            materialUsage[comp.material_id].cost += material.purchase_price ? parseFloat(comp.consumption) * parseFloat(material.purchase_price) : 0;
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
              quantity: parseFloat(comp.consumption),
              unit: material.unit,
              cost: material.purchase_price ? parseFloat(comp.consumption) * parseFloat(material.purchase_price) : 0
            };
          } else {
            materialUsage[comp.material_id].quantity += parseFloat(comp.consumption);
            materialUsage[comp.material_id].cost += material.purchase_price ? parseFloat(comp.consumption) * parseFloat(material.purchase_price) : 0;
          }
        }
      }
    });
    
    return Object.values(materialUsage);
  };
  
  return {
    productDetails,
    components,
    customComponents,
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
