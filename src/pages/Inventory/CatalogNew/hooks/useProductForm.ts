import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

export const useProductForm = () => {
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
    // Cost fields
    cutting_charge: "0",
    printing_charge: "0",
    stitching_charge: "0",
    transport_charge: "0",
    material_cost: "0", // This will be calculated based on components
    total_cost: "0"     // This will be the sum of all costs
  });
  
  const [components, setComponents] = useState<Record<string, any>>({});
  const [customComponents, setCustomComponents] = useState<any[]>([]);
  const [materialPrices, setMaterialPrices] = useState<Record<string, number>>({});

  // Function to fetch material price by ID
  const fetchMaterialPrice = async (materialId: string) => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('purchase_rate, rate')
        .eq('id', materialId)
        .single();
      
      if (error) {
        console.error("Error fetching material price:", error);
        return null;
      }
      
      // Use purchase_rate if available, otherwise fall back to rate
      const materialRate = data.purchase_rate || data.rate || 0;
      console.log(`Material ${materialId} price:`, materialRate);
      
      // Add to materialPrices state
      setMaterialPrices(prev => ({
        ...prev,
        [materialId]: materialRate
      }));
      
      return materialRate;
    } catch (error) {
      console.error("Error in fetchMaterialPrice:", error);
      return null;
    }
  };
  
  // Function to calculate consumption based on dimensions
  const calculateConsumption = (length?: string, width?: string, rollWidth?: string): string | undefined => {
    if (!length || !width || !rollWidth) return undefined;
    
    const lengthVal = parseFloat(length);
    const widthVal = parseFloat(width);
    const rollWidthVal = parseFloat(rollWidth);
    
    if (isNaN(lengthVal) || isNaN(widthVal) || isNaN(rollWidthVal) || rollWidthVal <= 0) {
      return undefined;
    }
    
    // Formula: (length * width) / (roll_width * 39.39)
    const consumption = (lengthVal * widthVal) / (rollWidthVal * 39.39);
    return consumption.toFixed(4);
  };
  
  // Calculate material cost for a component
  const calculateComponentMaterialCost = (component: any): number => {
    if (!component.material_id || !component.consumption) return 0;
    
    const materialId = component.material_id;
    const consumption = parseFloat(component.consumption);
    const rate = materialPrices[materialId] || 0;
    
    if (isNaN(consumption) || isNaN(rate)) return 0;
    
    const cost = consumption * rate;
    return cost;
  };
  
  // Calculate total material cost from all components
  const calculateTotalMaterialCost = (): number => {
    let totalCost = 0;
    
    // Add costs from standard components
    Object.values(components).forEach((component: any) => {
      if (component.materialCost) {
        const componentCost = parseFloat(String(component.materialCost));
        if (!isNaN(componentCost)) {
          totalCost += componentCost;
        }
      } else if (component.material_id && component.consumption) {
        const componentCost = calculateComponentMaterialCost(component);
        totalCost += componentCost;
      }
    });
    
    // Add costs from custom components
    customComponents.forEach((component) => {
      if (component.materialCost) {
        const componentCost = parseFloat(String(component.materialCost));
        if (!isNaN(componentCost)) {
          totalCost += componentCost;
        }
      } else if (component.material_id && component.consumption) {
        const componentCost = calculateComponentMaterialCost(component);
        totalCost += componentCost;
      }
    });
    
    return totalCost;
  };
  
  // Update material costs whenever components or material prices change
  useEffect(() => {
    const totalMaterialCost = calculateTotalMaterialCost();
    
    setProductData(prev => {
      const updatedData = {
        ...prev,
        material_cost: totalMaterialCost.toFixed(2)
      };
      
      // Also update total cost
      const totalCost = calculateTotalCost({
        ...updatedData
      });
      
      updatedData.total_cost = totalCost.toString();
      
      // If selling_rate exists, update margin
      if (updatedData.selling_rate && parseFloat(updatedData.selling_rate) > 0 && totalCost > 0) {
        const calculatedMargin = ((parseFloat(updatedData.selling_rate) - totalCost) / totalCost) * 100;
        updatedData.margin = calculatedMargin.toFixed(2);
      }
      
      return updatedData;
    });
  }, [components, customComponents, materialPrices]);
  
  // Function to update consumption values based on dimensions and default quantity
  const updateConsumptionValues = () => {
    // Update standard components
    const updatedComponents = { ...components };
    let hasUpdates = false;
    
    Object.keys(updatedComponents).forEach(type => {
      const component = updatedComponents[type];
      if (component.length && component.width && component.roll_width) {
        const baseConsumption = calculateConsumption(
          component.length,
          component.width,
          component.roll_width
        );
        
        if (baseConsumption) {
          const consumption = productData.default_quantity 
            ? (parseFloat(baseConsumption) * parseFloat(productData.default_quantity)).toFixed(4)
            : baseConsumption;
            
          updatedComponents[type] = {
            ...component,
            baseConsumption,
            consumption
          };
          
          // Also calculate material cost if material_id is present
          if (component.material_id && materialPrices[component.material_id]) {
            const materialRate = materialPrices[component.material_id];
            const materialCost = parseFloat(consumption) * materialRate;
            updatedComponents[type].materialCost = materialCost;
          }
          
          hasUpdates = true;
        }
      }
    });
    
    if (hasUpdates) {
      setComponents(updatedComponents);
    }
    
    // Update custom components
    const updatedCustomComponents = customComponents.map(component => {
      if (component.length && component.width && component.roll_width) {
        const baseConsumption = calculateConsumption(
          component.length,
          component.width,
          component.roll_width
        );
        
        if (baseConsumption) {
          const consumption = productData.default_quantity 
            ? (parseFloat(baseConsumption) * parseFloat(productData.default_quantity)).toFixed(4)
            : baseConsumption;
            
          const updatedComponent = {
            ...component,
            baseConsumption,
            consumption
          };
          
          // Also calculate material cost if material_id is present
          if (component.material_id && materialPrices[component.material_id]) {
            const materialRate = materialPrices[component.material_id];
            const materialCost = parseFloat(consumption) * materialRate;
            updatedComponent.materialCost = materialCost;
          }
          
          return updatedComponent;
        }
      }
      return component;
    });
    
    setCustomComponents(updatedCustomComponents);
  };
  
  // Effect to recalculate consumption when default quantity changes
  useEffect(() => {
    updateConsumptionValues();
  }, [productData.default_quantity, materialPrices]);

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Unlinked handling for all fields - no automatic calculations between selling_rate and margin
    setProductData(prev => {
      const updatedData = {
        ...prev,
        [name]: value
      };
      
      // Calculate total cost whenever cost-related fields change
      if (['cutting_charge', 'printing_charge', 'stitching_charge', 'transport_charge', 'material_cost'].includes(name)) {
        const totalCost = calculateTotalCost(updatedData);
        updatedData.total_cost = totalCost.toString();
        
        // No longer automatically updating margin or selling_rate when costs change
        // This allows the user to set them independently
      }
      
      // No automatic recalculation between margin and selling_rate
      // They will be calculated only on form submission
      
      return updatedData;
    });
  };
  
  // Function to calculate total cost
  const calculateTotalCost = (data: typeof productData) => {
    const cuttingCharge = parseFloat(data.cutting_charge) || 0;
    const printingCharge = parseFloat(data.printing_charge) || 0;
    const stitchingCharge = parseFloat(data.stitching_charge) || 0;
    const transportCharge = parseFloat(data.transport_charge) || 0;
    const materialCost = parseFloat(data.material_cost) || 0;
    
    return cuttingCharge + printingCharge + stitchingCharge + transportCharge + materialCost;
  };

  const handleComponentChange = async (type: string, field: string, value: string) => {
    setComponents(prev => {
      const component = prev[type] || { 
        id: uuidv4(),
        type 
      };
      
      const updatedComponent = {
        ...component,
        [field]: value
      };
      
      // If material_id changed, fetch the material price
      if (field === 'material_id' && value) {
        fetchMaterialPrice(value).then(rate => {
          if (rate !== null) {
            setComponents(current => {
              const componentToUpdate = current[type] || {};
              return {
                ...current,
                [type]: {
                  ...componentToUpdate,
                  materialRate: rate
                }
              };
            });
          }
        });
      }
      
      // If materialCost is directly set, keep it as number
      if (field === 'materialCost') {
        console.log(`Setting material cost for ${type} to ${value}`);
        updatedComponent.materialCost = parseFloat(value);
      }
      
      // If dimensions or roll width changed, recalculate consumption
      if (['length', 'width', 'roll_width'].includes(field) && 
          updatedComponent.length && 
          updatedComponent.width && 
          updatedComponent.roll_width) {
        
        const baseConsumption = calculateConsumption(
          updatedComponent.length,
          updatedComponent.width,
          updatedComponent.roll_width
        );
        
        if (baseConsumption) {
          updatedComponent.baseConsumption = baseConsumption;
          updatedComponent.consumption = productData.default_quantity 
            ? (parseFloat(baseConsumption) * parseFloat(productData.default_quantity)).toFixed(4)
            : baseConsumption;
            
          // Also calculate material cost if material_id and rate are present
          if (updatedComponent.material_id && materialPrices[updatedComponent.material_id]) {
            const materialRate = materialPrices[updatedComponent.material_id];
            const consumptionValue = parseFloat(updatedComponent.consumption);
            const materialCost = consumptionValue * materialRate;
            updatedComponent.materialCost = materialCost;
            updatedComponent.materialRate = materialRate;
          }
        }
      }
      
      return {
        ...prev,
        [type]: updatedComponent
      };
    });
  };

  const handleCustomComponentChange = async (index: number, field: string, value: string) => {
    setCustomComponents(prev => {
      const updated = [...prev];
      const updatedComponent = { ...updated[index], [field]: value };
      
      // If material_id changed, fetch the material price
      if (field === 'material_id' && value) {
        fetchMaterialPrice(value).then(rate => {
          if (rate !== null) {
            setCustomComponents(current => {
              const newComponents = [...current];
              newComponents[index] = {
                ...newComponents[index],
                materialRate: rate
              };
              
              // Recalculate material cost if consumption is available
              if (newComponents[index].consumption) {
                const consumption = parseFloat(newComponents[index].consumption);
                if (!isNaN(consumption)) {
                  const materialCost = consumption * rate;
                  newComponents[index].materialCost = materialCost;
                }
              }
              
              return newComponents;
            });
          }
        });
      }
      
      // If materialCost is directly set, keep it as number
      if (field === 'materialCost') {
        console.log(`Setting material cost for custom component ${index} to ${value}`);
        updatedComponent.materialCost = parseFloat(value);
      }
      
      // If dimensions or roll width changed, recalculate consumption
      if (['length', 'width', 'roll_width'].includes(field) && 
          updatedComponent.length && 
          updatedComponent.width && 
          updatedComponent.roll_width) {
        
        const baseConsumption = calculateConsumption(
          updatedComponent.length,
          updatedComponent.width,
          updatedComponent.roll_width
        );
        
        if (baseConsumption) {
          updatedComponent.baseConsumption = baseConsumption;
          updatedComponent.consumption = productData.default_quantity 
            ? (parseFloat(baseConsumption) * parseFloat(productData.default_quantity)).toFixed(4)
            : baseConsumption;
            
          // Also calculate material cost if material_id and rate are present
          if (updatedComponent.material_id && materialPrices[updatedComponent.material_id]) {
            const materialRate = materialPrices[updatedComponent.material_id];
            const consumptionValue = parseFloat(updatedComponent.consumption);
            const materialCost = consumptionValue * materialRate;
            updatedComponent.materialCost = materialCost;
            updatedComponent.materialRate = materialRate;
          }
        }
      }
      
      updated[index] = updatedComponent;
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

  // Calculate total consumption for all components
  const totalConsumption = [...Object.values(components), ...customComponents]
    .reduce((total, comp) => {
      const consumption = comp.consumption ? parseFloat(comp.consumption) : 0;
      return isNaN(consumption) ? total : total + consumption;
    }, 0);

  // Calculate total component costs for display
  const componentCosts = [...Object.values(components), ...customComponents]
    .filter(comp => comp.materialCost || (comp.material_id && comp.consumption))
    .map(comp => {
      const consumption = parseFloat(comp.consumption || '0');
      const rate = comp.materialRate || materialPrices[comp.material_id || ''] || 0;
      const cost = comp.materialCost ? parseFloat(String(comp.materialCost)) : (consumption * rate);
      
      return {
        name: comp.type === 'custom' ? comp.customName || 'Custom component' : comp.type,
        consumption,
        rate,
        cost: !isNaN(cost) ? cost : 0,
        materialId: comp.material_id
      };
    });

  return {
    productData,
    setProductData,
    components,
    customComponents,
    materialPrices,
    componentCosts,
    totalConsumption,
    handleProductChange,
    calculateTotalCost,
    fetchMaterialPrice,
    handleComponentChange,
    handleCustomComponentChange,
    addCustomComponent,
    removeCustomComponent
  };
};
