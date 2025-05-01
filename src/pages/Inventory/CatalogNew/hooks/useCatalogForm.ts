
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { ProductDetails, CustomComponent, Material, MaterialUsage, Component } from "../types";

export function useCatalogForm(inventoryMaterials: Material[]) {
  // Initialize product details with default values
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
    total_cost: 0
  });
  
  // Standard components (part, border, etc.)
  const [components, setComponents] = useState<Record<string, any>>({});
  
  // Custom components
  const [customComponents, setCustomComponents] = useState<CustomComponent[]>([]);
  
  // Cost calculations
  const [materialCost, setMaterialCost] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);
  
  // Handle changes to the product details form
  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // For number inputs, convert to proper number types
    if (["bag_length", "bag_width", "height", "default_quantity", "default_rate", 
         "cutting_charge", "printing_charge", "stitching_charge", "transport_charge"].includes(name)) {
      setProductDetails(prev => ({
        ...prev,
        [name]: value === "" ? 0 : Number(value)
      }));
    } else {
      setProductDetails(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Update consumption calculations when default quantity changes
    if (name === "default_quantity" && value !== "") {
      updateConsumptionBasedOnQuantity(Number(value));
    }
  };
  
  // Update consumption for all components based on quantity
  const updateConsumptionBasedOnQuantity = (quantity: number) => {
    // Update standard components
    setComponents(prev => {
      const updated = { ...prev };
      
      Object.keys(updated).forEach(type => {
        const comp = updated[type];
        if (comp && comp.material_id && comp.roll_width && comp.length && comp.width) {
          const length = parseFloat(String(comp.length));
          const width = parseFloat(String(comp.width));
          const rollWidth = parseFloat(String(comp.roll_width));
          
          if (!isNaN(length) && !isNaN(width) && !isNaN(rollWidth) && rollWidth > 0) {
            // Formula: (length * width) / (roll_width * 39.39) * quantity
            updated[type] = {
              ...comp,
              consumption: ((length * width) / (rollWidth * 39.39) * quantity).toFixed(4)
            };
          }
        }
      });
      
      return updated;
    });
    
    // Update custom components
    setCustomComponents(prev => 
      prev.map(comp => {
        if (comp && comp.material_id && comp.roll_width && comp.length && comp.width) {
          const length = parseFloat(String(comp.length));
          const width = parseFloat(String(comp.width));
          const rollWidth = parseFloat(String(comp.roll_width));
          
          if (!isNaN(length) && !isNaN(width) && !isNaN(rollWidth) && rollWidth > 0) {
            // Formula: (length * width) / (roll_width * 39.39) * quantity
            return {
              ...comp,
              consumption: ((length * width) / (rollWidth * 39.39) * quantity).toFixed(4)
            };
          }
        }
        return comp;
      })
    );
  };
  
  // Handle changes to standard components
  const handleComponentChange = (type: string, field: string, value: string) => {
    setComponents(prev => {
      const component = prev[type] || { 
        id: uuidv4(),
        type,
        component_type: type
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
        const quantity = productDetails.default_quantity || 1;
        
        if (!isNaN(length) && !isNaN(width) && !isNaN(rollWidth) && rollWidth > 0) {
          // Formula: (length * width) / (roll_width * 39.39) * quantity
          updatedComponent.consumption = ((length * width) / (rollWidth * 39.39) * quantity).toFixed(4);
        }
      }
      
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
      
      // Recalculate consumption if material_id, roll_width, length or width changes
      if (['material_id', 'roll_width', 'length', 'width'].includes(field) && 
          component.roll_width && component.length && component.width) {
        const length = parseFloat(String(component.length));
        const width = parseFloat(String(component.width));
        const rollWidth = parseFloat(String(component.roll_width));
        const quantity = productDetails.default_quantity || 1;
        
        if (!isNaN(length) && !isNaN(width) && !isNaN(rollWidth) && rollWidth > 0) {
          // Formula: (length * width) / (roll_width * 39.39) * quantity
          component.consumption = ((length * width) / (rollWidth * 39.39) * quantity).toFixed(4);
        }
      }
      
      updated[index] = component;
      return updated;
    });
  };
  
  // Add a new custom component
  const addCustomComponent = () => {
    const newComponent: CustomComponent = {
      id: uuidv4(),
      type: "custom",
      component_type: "custom",
      custom_name: "",
      color: "",
      gsm: "",
      size: ""
    };
    
    setCustomComponents(prev => [...prev, newComponent]);
  };
  
  // Remove a custom component by index
  const removeCustomComponent = (index: number) => {
    setCustomComponents(prev => prev.filter((_, i) => i !== index));
  };
  
  // Calculate material costs whenever components or inventory materials change
  useEffect(() => {
    calculateMaterialCost();
  }, [components, customComponents, inventoryMaterials]);
  
  // Calculate total cost whenever material cost or any charge changes
  useEffect(() => {
    const cutting = productDetails.cutting_charge || 0;
    const printing = productDetails.printing_charge || 0;
    const stitching = productDetails.stitching_charge || 0;
    const transport = productDetails.transport_charge || 0;
    
    setTotalCost(materialCost + cutting + printing + stitching + transport);
  }, [materialCost, productDetails.cutting_charge, productDetails.printing_charge, 
      productDetails.stitching_charge, productDetails.transport_charge]);
  
  // Calculate the total material cost
  const calculateMaterialCost = () => {
    if (!inventoryMaterials || inventoryMaterials.length === 0) return;
    
    let cost = 0;
    
    // Calculate cost for standard components
    Object.values(components).forEach(comp => {
      if (comp.material_id && comp.material_id !== 'not_applicable' && comp.consumption) {
        const material = inventoryMaterials.find(m => m.id === comp.material_id);
        if (material && material.purchase_price) {
          cost += parseFloat(String(comp.consumption)) * parseFloat(String(material.purchase_price));
        }
      }
    });
    
    // Calculate cost for custom components
    customComponents.forEach(comp => {
      if (comp.material_id && comp.material_id !== 'not_applicable' && comp.consumption) {
        const material = inventoryMaterials.find(m => m.id === comp.material_id);
        if (material && material.purchase_price) {
          cost += parseFloat(String(comp.consumption)) * parseFloat(String(material.purchase_price));
        }
      }
    });
    
    setMaterialCost(cost);
  };
  
  // Get a list of all used materials for display in the UI
  const usedMaterials = () => {
    if (!inventoryMaterials || inventoryMaterials.length === 0) return [];
    
    const materialUsage: Record<string, {
      material_id: string;
      material_name: string;
      component_type: string;
      consumption: number;
      unit_cost: number;
      total_cost: number;
      quantity: number;
      unit: string;
      cost: number;
      name: string;
    }> = {};
    
    // Process standard components
    Object.values(components).forEach(comp => {
      if (comp.material_id && comp.material_id !== 'not_applicable' && comp.consumption) {
        const material = inventoryMaterials.find(m => m.id === comp.material_id);
        if (material) {
          if (!materialUsage[comp.material_id]) {
            materialUsage[comp.material_id] = {
              material_id: comp.material_id,
              material_name: material.material_type,
              component_type: comp.component_type,
              consumption: parseFloat(String(comp.consumption)),
              unit_cost: material.purchase_price ? parseFloat(String(material.purchase_price)) : 0,
              total_cost: material.purchase_price ? parseFloat(String(comp.consumption)) * parseFloat(String(material.purchase_price)) : 0,
              id: comp.material_id,
              name: material.material_type + (material.color ? ` (${material.color})` : '') + (material.gsm ? ` ${material.gsm} GSM` : ''),
              quantity: parseFloat(String(comp.consumption)),
              unit: material.unit,
              cost: material.purchase_price ? parseFloat(String(comp.consumption)) * parseFloat(String(material.purchase_price)) : 0
            };
          } else {
            materialUsage[comp.material_id].quantity += parseFloat(String(comp.consumption));
            materialUsage[comp.material_id].cost += material.purchase_price ? parseFloat(String(comp.consumption)) * parseFloat(String(material.purchase_price)) : 0;
          }
        }
      }
    });
    
    // Process custom components
    customComponents.forEach(comp => {
      if (comp.material_id && comp.material_id !== 'not_applicable' && comp.consumption) {
        const material = inventoryMaterials.find(m => m.id === comp.material_id);
        if (material) {
          if (!materialUsage[comp.material_id]) {
            materialUsage[comp.material_id] = {
              material_id: comp.material_id,
              material_name: material.material_type,
              component_type: comp.component_type,
              consumption: parseFloat(String(comp.consumption)),
              unit_cost: material.purchase_price ? parseFloat(String(material.purchase_price)) : 0,
              total_cost: material.purchase_price ? parseFloat(String(comp.consumption)) * parseFloat(String(material.purchase_price)) : 0,
              id: comp.material_id,
              name: material.material_type + (material.color ? ` (${material.color})` : '') + (material.gsm ? ` ${material.gsm} GSM` : ''),
              quantity: parseFloat(String(comp.consumption)),
              unit: material.unit,
              cost: material.purchase_price ? parseFloat(String(comp.consumption)) * parseFloat(String(material.purchase_price)) : 0
            };
          } else {
            materialUsage[comp.material_id].quantity += parseFloat(String(comp.consumption));
            materialUsage[comp.material_id].cost += material.purchase_price ? parseFloat(String(comp.consumption)) * parseFloat(String(material.purchase_price)) : 0;
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
