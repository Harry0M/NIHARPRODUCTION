
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Component, CostCalculation } from "@/types/order-form";
import { isManualFormula, ProcessedComponent } from "@/utils/manualFormulaProcessor";

// Extended component interface to track original consumption for manual formulas
interface ExtendedComponent extends Component {
  originalConsumption?: number;
  is_manual_consumption?: boolean;
  [key: string]: unknown;
}

// Extended custom component interface
interface ExtendedCustomComponent extends Component {
  originalConsumption?: number;
}

export function useOrderComponents() {
  const [components, setComponents] = useState<Record<string, ExtendedComponent>>({});
  const [customComponents, setCustomComponents] = useState<Component[]>([]);
  const [baseConsumptions, setBaseConsumptions] = useState<Record<string, number>>({});  const [costCalculation, setCostCalculation] = useState<CostCalculation>({
    materialCost: 0,
    cuttingCharge: 0,
    printingCharge: 0,
    stitchingCharge: 0,
    transportCharge: 0,
    baseCost: 0,
    gstAmount: 0,
    totalCost: 0,
    margin: 15, // Default margin
    sellingPrice: 0,
    perUnitBaseCost: 0,
    perUnitTransportCost: 0,
    perUnitGstCost: 0,
    perUnitCost: 0
  });
  
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
      updated[index] = { ...updated[index], [field]: value };
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
    
    // Also remove from base consumptions
    const updatedBaseConsumptions = { ...baseConsumptions };
    delete updatedBaseConsumptions[`custom_${index}`];
    setBaseConsumptions(updatedBaseConsumptions);
  };
    // Track first-time quantity update to handle special case of quantity=1
  const [initialUpdateDone, setInitialUpdateDone] = useState(false);
  const [isLoadingFromDatabase, setIsLoadingFromDatabase] = useState(false);
  
  // Add an effect to ensure base consumptions are properly set for initial calculation
  useEffect(() => {
    // If we have components but initialUpdateDone is false, we need to ensure correct initialization
    if (!initialUpdateDone && Object.keys(components).length > 0) {
      console.log("Initial component update detected, ensuring base consumptions");
      setInitialUpdateDone(true);
    }
  }, [components, initialUpdateDone]);

  // Add method to set loading state when components are being loaded from database
  const setDatabaseLoadingState = (loading: boolean) => {
    setIsLoadingFromDatabase(loading);
    console.log(`%c Database loading state: ${loading}`, 'background: #FF9800; color: white; padding: 2px 5px;');
  };    const updateConsumptionBasedOnQuantity = (quantity: number) => {
    if (isNaN(quantity) || quantity <= 0) return;

    console.log(`%c Updating consumption based on quantity: ${quantity}`, 'background: #4CAF50; color: white; padding: 2px 5px;');
    console.log("Current components state:", components);
    
    // CRITICAL: Skip if we're in the middle of loading components from database
    if (isLoadingFromDatabase) {
      console.log('%c Skipping consumption update - components being loaded from database', 'background: #FF9800; color: white; padding: 2px 5px;');
      return;
    }
    
    // Skip the update if we already have final consumption values
    // This prevents recalculating and overriding the values we want to keep
    const hasFinalValues = Object.values(components).some(comp => 
      comp.finalConsumptionValue || comp.exactConsumption
    );
    
    if (hasFinalValues) {
      console.log('%c Skipping consumption update - using final consumption values', 'background: #FFC107; color: black; padding: 2px 5px;');
      return;
    }
    
    // Check if we're in order edit mode by looking for existing component IDs
    // In edit mode, components already have their final consumption values from database
    const isInEditMode = Object.values(components).some(comp => comp.id && typeof comp.id === 'string' && comp.id.length > 10) || 
                         customComponents.some(comp => comp.id && typeof comp.id === 'string' && comp.id.length > 10);
    
    // Additional check: if components have consumption values already set, we're likely in edit mode
    const hasExistingConsumption = Object.values(components).some(comp => comp.consumption && parseFloat(comp.consumption) > 0) ||
                                  customComponents.some(comp => comp.consumption && parseFloat(comp.consumption) > 0);
    
    if (isInEditMode || hasExistingConsumption) {
      console.log('%c Order Edit Mode Detected: Skipping consumption recalculation to prevent double multiplication', 'background: #9C27B0; color: white; padding: 2px 5px;');
      console.log('Edit mode detection details:', {
        isInEditMode,
        hasExistingConsumption,
        componentIds: Object.values(components).map(c => c.id),
        customComponentIds: customComponents.map(c => c.id)
      });
      
      // In edit mode, only update material costs without changing consumption
      const updatedComponents = { ...components };
      let anyUpdated = false;
      
      Object.keys(updatedComponents).forEach(type => {
        const component = updatedComponents[type];
        if (component.consumption && component.materialRate) {
          const consumption = parseFloat(component.consumption);
          const newMaterialCost = consumption * component.materialRate;
          if (Math.abs((component.materialCost || 0) - newMaterialCost) > 0.01) {
            updatedComponents[type] = {
              ...component,
              materialCost: newMaterialCost
            };
            anyUpdated = true;
          }
        }
      });
      
      if (anyUpdated) {
        setComponents(updatedComponents);
      }
      
      // Update custom components material costs only
      const updatedCustomComponents = customComponents.map((component) => {
        if (component.consumption && component.materialRate) {
          const consumption = parseFloat(component.consumption);
          const newMaterialCost = consumption * component.materialRate;
          if (Math.abs((component.materialCost || 0) - newMaterialCost) > 0.01) {
            return {
              ...component,
              materialCost: newMaterialCost
            };
          }
        }
        return component;
      });
      
      if (JSON.stringify(updatedCustomComponents) !== JSON.stringify(customComponents)) {
        setCustomComponents(updatedCustomComponents);
      }
        return; // Exit early for edit mode
    }
    
    // Special handling for quantity=1 to ensure it's not just the initial setup
    const isQuantityOne = quantity === 1;
    
    // Make sure we have base consumptions - important when quantity is 1
    if (Object.keys(baseConsumptions).length === 0) {
      console.warn("No base consumptions found while updating with quantity", quantity);
      return; // Skip update if we don't have base consumptions yet
    }

    // Update consumption for standard components
    const updatedComponents = { ...components };
    let anyUpdated = false;
      Object.keys(updatedComponents).forEach(type => {
      const component = updatedComponents[type];
      const baseConsumption = baseConsumptions[type];
      
      // Skip if this component already has a final consumption value
      if (component.finalConsumptionValue || component.exactConsumption) {
        console.log(`Skipping ${type} - has final consumption value`);
        return;
      }
      
      if (baseConsumption && !isNaN(baseConsumption)) {
        // Ensure base consumption is positive
        const safeBaseConsumption = Math.max(baseConsumption, 0.001);
        
        // Calculate new consumption based on quantity
        let newConsumption = safeBaseConsumption * quantity;
        
        // Handle manual formulas - multiply consumption by quantity for real-time updates
        if (isManualFormula(component)) {
          // For manual formulas, store original consumption if not already stored
          if (!component.originalConsumption) {
            component.originalConsumption = safeBaseConsumption;
          }
          // For manual formulas, multiply the original consumption by quantity
          newConsumption = component.originalConsumption * quantity;
          console.log(`%c Manual Formula Component ${type}: Original = ${component.originalConsumption}, Qty = ${quantity}, New = ${newConsumption}`, 
            'background: #FF5722; color: white; padding: 2px 5px; font-weight: bold;');
        } else {
          console.log(`%c Component ${type}: Base = ${safeBaseConsumption}, Qty = ${quantity}, New = ${newConsumption}`, 
            'background: #2196F3; color: white; padding: 2px 5px;');
        }
        
        updatedComponents[type] = {
          ...component,
          baseConsumption: safeBaseConsumption.toFixed(6), // Increased precision
          consumption: newConsumption.toFixed(4),
          materialCost: newConsumption * (component.materialRate || 0),
          // Preserve originalConsumption for manual formulas
          ...(isManualFormula(component) && { originalConsumption: component.originalConsumption || safeBaseConsumption })
        };
        anyUpdated = true;
      }
    });
    
    // Only update components if changes were made
    if (anyUpdated) {
      setComponents(updatedComponents);
    }    // Update consumption for custom components
    const updatedCustomComponents = customComponents.map((component, idx) => {
      // Skip if this component already has a final consumption value
      if (component.finalConsumptionValue || component.exactConsumption) {
        console.log(`Skipping custom component ${idx} - has final consumption value`);
        return component;
      }
      
      const baseConsumption = baseConsumptions[`custom_${idx}`];
      if (baseConsumption && !isNaN(baseConsumption)) {
        // Ensure base consumption is positive
        const safeBaseConsumption = Math.max(baseConsumption, 0.001);
        
        // Calculate new consumption based on quantity
        let newConsumption = safeBaseConsumption * quantity;        // Handle manual formulas for custom components
        if (isManualFormula(component as ProcessedComponent)) {
          // For manual formulas, store original consumption if not already stored
          const extendedComponent = component as ExtendedCustomComponent;
          const originalConsumption = extendedComponent.originalConsumption || safeBaseConsumption;
          // For manual formulas, multiply the original consumption by quantity
          newConsumption = originalConsumption * quantity;
          console.log(`%c Manual Formula Custom Component ${idx}: Original = ${originalConsumption}, Qty = ${quantity}, New = ${newConsumption}`,
            'background: #FF5722; color: white; padding: 2px 5px; font-weight: bold;');
          
          return {
            ...component,
            baseConsumption: safeBaseConsumption.toFixed(6), // Increased precision
            consumption: newConsumption.toFixed(4),
            materialCost: newConsumption * (component.materialRate || 0),
            originalConsumption: originalConsumption
          };
        } else {
          console.log(`%c Custom component ${idx}: Base = ${safeBaseConsumption}, Qty = ${quantity}, New = ${newConsumption}`,
            'background: #9C27B0; color: white; padding: 2px 5px;');
          
          return {
            ...component,
            baseConsumption: safeBaseConsumption.toFixed(6), // Increased precision
            consumption: newConsumption.toFixed(4),
            materialCost: newConsumption * (component.materialRate || 0)
          };
        }
      }
      return component;
    });
    
    // Only update if there are actual changes
    if (JSON.stringify(updatedCustomComponents) !== JSON.stringify(customComponents)) {
      setCustomComponents(updatedCustomComponents);
    }
    
    // Trigger cost calculation update
    const materialCost = [...Object.values(updatedComponents), ...updatedCustomComponents].reduce(
      (total, comp) => total + (comp.materialCost || 0), 0
    );
    
    setCostCalculation(prev => ({
      ...prev,
      materialCost
    }));
    
    // If this was the first update with quantity=1, mark it as done
    if (isQuantityOne && !initialUpdateDone) {
      setInitialUpdateDone(true);
    }
  };
  
  return {
    components,
    setComponents,
    customComponents,
    setCustomComponents,
    baseConsumptions,
    setBaseConsumptions,
    costCalculation,
    setCostCalculation,
    handleComponentChange,
    handleCustomComponentChange,
    addCustomComponent,
    removeCustomComponent,
    updateConsumptionBasedOnQuantity
  };
}
