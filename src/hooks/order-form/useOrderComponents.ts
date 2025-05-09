
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Component } from "@/types/order-form";

export function useOrderComponents() {
  const [components, setComponents] = useState<Record<string, any>>({});
  const [customComponents, setCustomComponents] = useState<Component[]>([]);
  const [baseConsumptions, setBaseConsumptions] = useState<Record<string, number>>({});
  
  const handleComponentChange = (type: string, field: string, value: string) => {
    setComponents(prev => {
      const component = prev[type] || { 
        id: uuidv4(),
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
  };

  const handleCustomComponentChange = (index: number, field: string, value: string) => {
    setCustomComponents(prev => {
      const updated = [...prev];
      if (index >= 0 && index < updated.length) {
        updated[index] = { ...updated[index], [field]: value };
      }
      return updated;
    });
  };

  const addCustomComponent = () => {
    setCustomComponents([
      ...customComponents, 
      { 
        id: uuidv4(),
        type: "custom",
        customName: "",
        is_custom: true
      }
    ]);
  };

  const removeCustomComponent = (index: number) => {
    if (index < 0 || index >= customComponents.length) {
      console.warn(`Invalid index ${index} for removeCustomComponent`);
      return;
    }
    
    setCustomComponents(prev => prev.filter((_, i) => i !== index));
    
    // Also remove from base consumptions
    const updatedBaseConsumptions = { ...baseConsumptions };
    delete updatedBaseConsumptions[`custom_${index}`];
    setBaseConsumptions(updatedBaseConsumptions);
  };
  
  const updateConsumptionBasedOnQuantity = (quantity: number) => {
    if (isNaN(quantity) || quantity <= 0) return;

    console.log(`Updating consumption based on quantity: ${quantity}`);
    console.log("Base consumptions:", baseConsumptions);

    // Update consumption for standard components
    const updatedComponents = { ...components };
    Object.keys(updatedComponents).forEach(type => {
      const baseConsumption = baseConsumptions[type];
      if (baseConsumption && !isNaN(baseConsumption)) {
        const newConsumption = baseConsumption * quantity;
        updatedComponents[type] = {
          ...updatedComponents[type],
          baseConsumption: baseConsumption.toFixed(2),
          consumption: newConsumption.toFixed(2)
        };
      }
    });
    setComponents(updatedComponents);

    // Update consumption for custom components
    const updatedCustomComponents = customComponents.map((component, idx) => {
      const baseConsumption = baseConsumptions[`custom_${idx}`];
      if (baseConsumption && !isNaN(baseConsumption)) {
        const newConsumption = baseConsumption * quantity;
        return {
          ...component,
          baseConsumption: baseConsumption.toFixed(2),
          consumption: newConsumption.toFixed(2)
        };
      }
      return component;
    });
    setCustomComponents(updatedCustomComponents);
  };
  
  return {
    components,
    setComponents,
    customComponents,
    setCustomComponents,
    baseConsumptions,
    setBaseConsumptions,
    handleComponentChange,
    handleCustomComponentChange,
    addCustomComponent,
    removeCustomComponent,
    updateConsumptionBasedOnQuantity
  };
}
