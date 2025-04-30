
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { ProductDetails, Component, CustomComponent, MaterialUsage } from "../types";

export function useCatalogForm(materials: any[] = []) {
  const [productDetails, setProductDetails] = useState<ProductDetails>({
    name: "",
    description: "",
    bag_length: "",
    bag_width: "",
    default_quantity: "1",
    default_rate: "",
    cutting_charge: "0",
    printing_charge: "0",
    stitching_charge: "0",
    transport_charge: "0"
  });

  const [components, setComponents] = useState<Record<string, Component>>({});
  const [customComponents, setCustomComponents] = useState<CustomComponent[]>([]);
  const [materialCost, setMaterialCost] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);

  // Calculate total cost whenever any cost component changes
  useEffect(() => {
    const cutting = parseFloat(productDetails.cutting_charge) || 0;
    const printing = parseFloat(productDetails.printing_charge) || 0;
    const stitching = parseFloat(productDetails.stitching_charge) || 0;
    const transport = parseFloat(productDetails.transport_charge) || 0;
    
    setTotalCost(materialCost + cutting + printing + stitching + transport);
  }, [materialCost, productDetails.cutting_charge, productDetails.printing_charge, 
      productDetails.stitching_charge, productDetails.transport_charge]);

  // Calculate material cost whenever components change
  useEffect(() => {
    if (!materials || materials.length === 0) return;
    calculateMaterialCost();
  }, [components, customComponents, materials]);

  // Handler for product details changes
  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProductDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handler for component changes
  const handleComponentChange = (type: string, field: string, value: string) => {
    setComponents(prev => {
      // Create the base component if it doesn't exist
      const component = prev[type] || { 
        id: uuidv4(),
        component_type: type,
        type,
        color: "",
        gsm: "",
        size: ""
      };

      // Create a new component object with the updated field
      const updatedComponent = {
        ...component,
        [field]: value
      };

      // Recalculate consumption if relevant fields change
      if (['material_id', 'roll_width', 'length', 'width'].includes(field) && 
          updatedComponent.roll_width && updatedComponent.length && updatedComponent.width) {
        // Make sure we're working with string values and then parse them
        const length = parseFloat(String(updatedComponent.length));
        const width = parseFloat(String(updatedComponent.width));
        const rollWidth = parseFloat(String(updatedComponent.roll_width));
        
        if (!isNaN(length) && !isNaN(width) && !isNaN(rollWidth) && rollWidth > 0) {
          const consumption = ((length * width) / (rollWidth * 39.39)).toFixed(4);
          updatedComponent.consumption = consumption;
        }
      }

      return {
        ...prev,
        [type]: updatedComponent
      };
    });
  };

  // Handler for custom component changes
  const handleCustomComponentChange = (index: number, field: string, value: string) => {
    setCustomComponents(prev => {
      const updated = [...prev];
      // Make a copy of the component to update
      const component = { ...updated[index] };
      
      // Update the field
      // Handle both custom_name and customName fields for compatibility
      if (field === 'customName') {
        component.custom_name = value;
        component.customName = value;
      } else {
        component[field as keyof CustomComponent] = value as any;
      }
      
      // Recalculate consumption if relevant fields change
      if (['material_id', 'roll_width', 'length', 'width'].includes(field) && 
          component.roll_width && component.length && component.width) {
        const length = parseFloat(String(component.length));
        const width = parseFloat(String(component.width));
        const rollWidth = parseFloat(String(component.roll_width));
        
        if (!isNaN(length) && !isNaN(width) && !isNaN(rollWidth) && rollWidth > 0) {
          component.consumption = ((length * width) / (rollWidth * 39.39)).toFixed(4);
        }
      }
      
      updated[index] = component;
      return updated;
    });
  };

  // Add custom component
  const addCustomComponent = () => {
    setCustomComponents([
      ...customComponents,
      {
        id: uuidv4(),
        type: "custom",
        component_type: "custom",
        custom_name: "",
        customName: "",
        color: "",
        gsm: "",
        size: ""
      }
    ]);
  };

  // Remove custom component
  const removeCustomComponent = (index: number) => {
    setCustomComponents(prev => prev.filter((_, i) => i !== index));
  };

  // Calculate material cost
  const calculateMaterialCost = () => {
    if (!materials || materials.length === 0) return;
    
    let cost = 0;
    
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

  // Generate a list of used materials
  const usedMaterials = () => {
    if (!materials) return [];
    
    const materialUsage: Record<string, MaterialUsage> = {};
    
    // Process standard components
    Object.values(components).forEach(comp => {
      if (comp.material_id && comp.material_id !== 'not_applicable' && comp.consumption) {
        const material = materials.find(m => m.id === comp.material_id);
        if (material) {
          const consumption = parseFloat(String(comp.consumption)) || 0;
          if (!materialUsage[comp.material_id]) {
            materialUsage[comp.material_id] = {
              id: comp.material_id,
              name: material.material_type + (material.color ? ` (${material.color})` : '') + (material.gsm ? ` ${material.gsm} GSM` : ''),
              quantity: consumption,
              unit: material.unit,
              cost: material.purchase_price ? consumption * parseFloat(String(material.purchase_price)) : 0
            };
          } else {
            materialUsage[comp.material_id].quantity += consumption;
            materialUsage[comp.material_id].cost += material.purchase_price ? consumption * parseFloat(String(material.purchase_price)) : 0;
          }
        }
      }
    });
    
    // Process custom components
    customComponents.forEach(comp => {
      if (comp.material_id && comp.material_id !== 'not_applicable' && comp.consumption) {
        const material = materials.find(m => m.id === comp.material_id);
        if (material) {
          const consumption = parseFloat(String(comp.consumption)) || 0;
          if (!materialUsage[comp.material_id]) {
            materialUsage[comp.material_id] = {
              id: comp.material_id,
              name: material.material_type + (material.color ? ` (${material.color})` : '') + (material.gsm ? ` ${material.gsm} GSM` : ''),
              quantity: consumption,
              unit: material.unit,
              cost: material.purchase_price ? consumption * parseFloat(String(material.purchase_price)) : 0
            };
          } else {
            materialUsage[comp.material_id].quantity += consumption;
            materialUsage[comp.material_id].cost += material.purchase_price ? consumption * parseFloat(String(material.purchase_price)) : 0;
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
