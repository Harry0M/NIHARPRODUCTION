import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Component, CostCalculation } from "@/types/order-form";
import { isManualFormula, ProcessedComponent } from "@/utils/manualFormulaProcessor";

// Extended component interface to track manual consumption
interface ExtendedComponent extends Component {
  is_manual_consumption?: boolean;
  fetchedConsumption?: string; // Store the original fetched consumption value
  baseConsumption?: string; // Store the base consumption for manual components
  [key: string]: unknown;
}

export function useOrderComponents() {
  const [components, setComponents] = useState<Record<string, ExtendedComponent>>({});
  const [customComponents, setCustomComponents] = useState<Component[]>([]);  const [costCalculation, setCostCalculation] = useState<CostCalculation>({
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
  };  const updateConsumptionBasedOnQuantity = (quantity: number) => {
    if (isNaN(quantity) || quantity <= 0) return;

    console.log(`%c SIMPLE APPROACH: Multiplying manual components by quantity: ${quantity}`, 'background: #4CAF50; color: white; padding: 2px 5px; font-weight: bold;');
    
    // Skip if loading from database
    if (isLoadingFromDatabase) {
      console.log('%c Skipping - loading from database', 'background: #FF9800; color: white; padding: 2px 5px;');
      return;
    }

    // SIMPLE APPROACH: Process each standard component
    const updatedComponents = { ...components };
    
    Object.keys(updatedComponents).forEach(type => {
      const component = updatedComponents[type];
      
      if (!component.consumption) {
        console.log(`❌ ${type}: No consumption value`);
        return;
      }
      
      const currentConsumption = parseFloat(component.consumption);
      if (isNaN(currentConsumption)) {
        console.log(`❌ ${type}: Invalid consumption value: ${component.consumption}`);
        return;
      }
      
      const isManual = isManualFormula(component);
      
      if (isManual) {
        // FOR MANUAL: Use base consumption if available, otherwise use current consumption divided by previous quantity
        let baseConsumption = currentConsumption;
        
        // If we have stored base consumption, use it
        if (component.fetchedConsumption) {
          baseConsumption = parseFloat(component.fetchedConsumption);
        } else if (component.baseConsumption) {
          baseConsumption = parseFloat(String(component.baseConsumption));
        }
        
        const newConsumption = baseConsumption * quantity;
        
        console.log(`🔶 MANUAL ${type}: Base=${baseConsumption} × Qty=${quantity} = ${newConsumption}`);
        
        updatedComponents[type] = {
          ...component,
          consumption: newConsumption.toFixed(4),
          materialCost: newConsumption * (component.materialRate || 0)
        };
      } else {
        // FOR CALCULATED: Keep consumption as-is
        console.log(`🔵 CALCULATED ${type}: Keeping consumption = ${currentConsumption}`);
        
        updatedComponents[type] = {
          ...component,
          materialCost: currentConsumption * (component.materialRate || 0)
        };
      }
    });
    
    setComponents(updatedComponents);

    // SIMPLE APPROACH: Process each custom component
    const updatedCustomComponents = customComponents.map((component, idx) => {
      if (!component.consumption) {
        console.log(`❌ Custom ${idx}: No consumption value`);
        return component;
      }
      
      const currentConsumption = parseFloat(component.consumption);
      if (isNaN(currentConsumption)) {
        console.log(`❌ Custom ${idx}: Invalid consumption value: ${component.consumption}`);
        return component;
      }
      
      const isManual = isManualFormula(component as ProcessedComponent);
      
      if (isManual) {
        // FOR MANUAL: Use base consumption if available, otherwise use current consumption
        let baseConsumption = currentConsumption;
        
        // If we have stored base consumption, use it
        const extendedComponent = component as ExtendedComponent;
        if (extendedComponent.fetchedConsumption) {
          baseConsumption = parseFloat(extendedComponent.fetchedConsumption);
        } else if (extendedComponent.baseConsumption) {
          baseConsumption = parseFloat(String(extendedComponent.baseConsumption));
        }
        
        const newConsumption = baseConsumption * quantity;
        
        console.log(`🔶 MANUAL Custom ${idx}: Base=${baseConsumption} × Qty=${quantity} = ${newConsumption}`);
        
        return {
          ...component,
          consumption: newConsumption.toFixed(4),
          materialCost: newConsumption * (component.materialRate || 0)
        };
      } else {
        // FOR CALCULATED: Keep consumption as-is
        console.log(`🔵 CALCULATED Custom ${idx}: Keeping consumption = ${currentConsumption}`);
        
        return {
          ...component,
          materialCost: currentConsumption * (component.materialRate || 0)
        };
      }
    });
    
    setCustomComponents(updatedCustomComponents);
    
    // Update total cost
    const materialCost = [...Object.values(updatedComponents), ...updatedCustomComponents].reduce(
      (total, comp) => total + (comp.materialCost || 0), 0
    );
    
    setCostCalculation(prev => ({
      ...prev,
      materialCost
    }));
    
    console.log(`✅ SIMPLE UPDATE COMPLETE: Material cost = ${materialCost}`);
  };

  return {
    components,
    setComponents,
    customComponents,
    setCustomComponents,
    costCalculation,
    setCostCalculation,
    handleComponentChange,
    handleCustomComponentChange,
    addCustomComponent,
    removeCustomComponent,
    updateConsumptionBasedOnQuantity,
    setDatabaseLoadingState
  };
}
