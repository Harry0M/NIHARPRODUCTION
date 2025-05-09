
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { OrderFormData } from "@/types/order";

interface UseProductSelectionProps {
  orderDetails: OrderFormData;
  setOrderDetails: React.Dispatch<React.SetStateAction<OrderFormData>>;
  setComponents: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  setCustomComponents: React.Dispatch<React.SetStateAction<any[]>>;
  setBaseConsumptions: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  updateConsumptionBasedOnQuantity: (quantity: number) => void;
  setCostCalculation?: React.Dispatch<React.SetStateAction<any>>;
}

export function useProductSelection({
  orderDetails,
  setOrderDetails,
  setComponents,
  setCustomComponents,
  setBaseConsumptions,
  updateConsumptionBasedOnQuantity,
  setCostCalculation
}: UseProductSelectionProps) {
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>();
  
  const handleProductSelect = async (components: any[]) => {
    console.log("Selected product components:", components);
    
    if (!components || components.length === 0) {
      console.log("No components to process");
      return;
    }
    
    // Get product default quantity if available from first component
    // This assumes all components from the same product have the same default_quantity
    const productQuantity = components[0]?.default_quantity || 1;
    console.log(`Product default quantity: ${productQuantity}`);
    
    // Update product_quantity in orderDetails
    setOrderDetails(prev => {
      const newDetails = {
        ...prev,
        product_quantity: productQuantity.toString()
      };
      
      // Calculate total quantity if order quantity is already set
      if (prev.quantity) {
        const orderQty = parseFloat(prev.quantity);
        if (!isNaN(orderQty)) {
          newDetails.total_quantity = (orderQty * productQuantity).toString();
        }
      }
      
      return newDetails;
    });
    
    // Clear existing components first
    // Define standard types in lowercase for case-insensitive comparison
    const standardTypesLower = ['part', 'border', 'handle', 'chain', 'runner', 'piping'];
    const newOrderComponents: Record<string, any> = {};
    const newCustomComponents: any[] = [];
    const newBaseConsumptions: Record<string, number> = {};

    // Extract all material_ids that need to be fetched
    const materialIds = components
      .filter(comp => comp.material_id)
      .map(comp => comp.material_id);

    let materialsData: Record<string, any> = {};
    
    // Fetch complete material data for all components with material_id
    if (materialIds.length > 0) {
      try {
        const { data: materials, error } = await supabase
          .from('inventory')
          .select('id, material_name, color, gsm, unit, roll_width, purchase_rate')
          .in('id', materialIds);
          
        if (error) {
          console.error('Error fetching materials:', error);
          toast({
            title: "Error fetching materials",
            description: error.message,
            variant: "destructive"
          });
        } else if (materials) {
          materialsData = materials.reduce((acc, material) => {
            acc[material.id] = material;
            return acc;
          }, {} as Record<string, any>);
          
          console.log("Fetched materials data:", materialsData);
        }
      } catch (err) {
        console.error('Error in material fetch:', err);
      }
    }

    // Collect cost data from product if available
    let productCosts = {
      cutting_charge: 0,
      printing_charge: 0,
      stitching_charge: 0,
      transport_charge: 0,
      margin: 15
    };

    // Try to fetch cost data from the catalog product
    if (components[0]?.catalog_id) {
      try {
        const { data: costData, error } = await supabase
          .from('catalog')
          .select('cutting_charge, printing_charge, stitching_charge, transport_charge, margin')
          .eq('id', components[0].catalog_id)
          .single();
          
        if (!error && costData) {
          productCosts = {
            cutting_charge: costData.cutting_charge || 0,
            printing_charge: costData.printing_charge || 0,
            stitching_charge: costData.stitching_charge || 0,
            transport_charge: costData.transport_charge || 0,
            margin: costData.margin || 15
          };
          console.log("Fetched product cost data:", productCosts);
        }
      } catch (err) {
        console.error('Error fetching product cost data:', err);
      }
    }

    // Update the order details with cost data
    setOrderDetails(prev => ({
      ...prev,
      cutting_charge: productCosts.cutting_charge?.toString() || '0',
      printing_charge: productCosts.printing_charge?.toString() || '0',
      stitching_charge: productCosts.stitching_charge?.toString() || '0',
      transport_charge: productCosts.transport_charge?.toString() || '0',
      margin: productCosts.margin?.toString() || '15'
    }));

    // Create a function to process each component
    const processComponent = (component: any) => {
      if (!component) return null;
      
      console.log("Processing component:", component);
      
      // Extract length and width from size format "length x width"
      let length = '', width = '';
      if (component.size) {
        const sizeValues = component.size.split('x').map((s: string) => s.trim());
        if (sizeValues.length >= 2) {
          length = sizeValues[0] || '';
          width = sizeValues[1] || '';
        }
      } else {
        // If no size but separate length/width provided
        length = component.length?.toString() || '';
        width = component.width?.toString() || '';
      }
      
      // Get consumption value directly from component - THIS IS THE TOTAL SAVED CONSUMPTION
      // This value already includes the default quantity factor from when it was created
      let totalConsumption = component.consumption?.toString() || '';
      const rollWidth = component.roll_width?.toString() || '';
      
      // If consumption isn't available, calculate it
      if (!totalConsumption && length && width && rollWidth) {
        const lengthVal = parseFloat(length);
        const widthVal = parseFloat(width);
        const rollWidthVal = parseFloat(rollWidth);
        
        if (!isNaN(lengthVal) && !isNaN(widthVal) && !isNaN(rollWidthVal) && rollWidthVal > 0) {
          // Formula: (length * width) / (roll_width * 39.39)
          const calculatedConsumption = (lengthVal * widthVal) / (rollWidthVal * 39.39);
          totalConsumption = calculatedConsumption.toFixed(2);
        }
      }
      
      // Include material_id if available
      const materialId = component.material_id || null;
      
      // Get material details either from fetched data or component
      let materialColor = '';
      let materialGsm = '';
      let materialRollWidth = '';
      let materialRate = 0;
      
      if (materialId && materialsData[materialId]) {
        // If we have fetched material data, use it
        materialColor = materialsData[materialId].color || '';
        materialGsm = materialsData[materialId].gsm?.toString() || '';
        materialRollWidth = materialsData[materialId].roll_width?.toString() || rollWidth;
        materialRate = materialsData[materialId].purchase_rate || 0;
      } else {
        // Fallback to component data
        materialColor = component.material?.color || component.color || '';
        materialGsm = component.material?.gsm?.toString() || component.gsm?.toString() || '';
      }

      // Calculate material cost based on consumption and rate
      let materialCost = 0;
      if (totalConsumption && materialRate) {
        const consumptionVal = parseFloat(totalConsumption);
        if (!isNaN(consumptionVal)) {
          materialCost = consumptionVal * materialRate;
        }
      }

      // Make sure component_type exists and is a string before converting to lower case
      if (!component.component_type || typeof component.component_type !== 'string') {
        console.warn('Component has no valid component_type:', component);
        return null;
      }
      
      const componentTypeLower = component.component_type.toLowerCase();
      
      // Calculate the base consumption (per unit) from the total consumption
      // Divide by product default quantity to get the base consumption per unit
      let baseConsumption: number | undefined;
      
      if (totalConsumption) {
        const totalConsumptionVal = parseFloat(totalConsumption);
        if (!isNaN(totalConsumptionVal)) {
          // Calculate base consumption per unit from total consumption
          baseConsumption = totalConsumptionVal / productQuantity;
          console.log(`Calculated base consumption: ${baseConsumption} (total: ${totalConsumptionVal} / product qty: ${productQuantity})`);
        }
      }

      // Prepare the common component object with all necessary fields
      const commonFields = {
        color: materialColor,
        gsm: materialGsm,
        length,
        width,
        consumption: totalConsumption,
        baseConsumption: baseConsumption?.toString(),
        roll_width: materialRollWidth || rollWidth,
        material_id: materialId,
        materialRate,
        materialCost
      };

      return {
        ...component,
        ...commonFields,
        componentTypeLower,
        baseConsumption
      };
    };

    // Process all components
    const processedComponents = components.map(processComponent).filter(Boolean);

    // Separate standard and custom components
    processedComponents.forEach(comp => {
      if (!comp) return;

      const { componentTypeLower, baseConsumption } = comp;
      
      if (componentTypeLower === 'custom') {
        const customIndex = newCustomComponents.length;
        newCustomComponents.push({
          id: uuidv4(),
          type: 'custom',
          customName: comp.custom_name || '',
          ...comp
        });
        
        // Store base consumption for this custom component
        if (baseConsumption) {
          newBaseConsumptions[`custom_${customIndex}`] = baseConsumption;
        }
      } else if (standardTypesLower.includes(componentTypeLower)) {
        // Map the component type to the capitalized version used in the UI
        const componentTypeKey = comp.component_type;
        
        console.log(`Found standard component ${componentTypeLower} -> mapping to key ${componentTypeKey}`);
        
        newOrderComponents[componentTypeKey] = {
          id: uuidv4(),
          type: componentTypeKey, // Preserve original capitalization
          ...comp
        };
        
        // Store base consumption for standard component
        if (baseConsumption) {
          newBaseConsumptions[componentTypeKey] = baseConsumption;
        }
      }
    });

    console.log("Setting standard components:", newOrderComponents);
    console.log("Setting custom components:", newCustomComponents);
    console.log("Setting base consumptions:", newBaseConsumptions);

    // Replace all components with the new ones
    setComponents(newOrderComponents);
    setCustomComponents(newCustomComponents);
    setBaseConsumptions(newBaseConsumptions);

    // Update cost calculation state if callback provided
    if (setCostCalculation) {
      // Sum up material costs from all components
      const materialCost = [...Object.values(newOrderComponents), ...newCustomComponents].reduce(
        (total, comp) => total + (comp.materialCost || 0), 0
      );

      setCostCalculation(prev => ({
        ...prev,
        materialCost,
        cuttingCharge: productCosts.cutting_charge || 0,
        printingCharge: productCosts.printing_charge || 0,
        stitchingCharge: productCosts.stitching_charge || 0,
        transportCharge: productCosts.transport_charge || 0,
        margin: productCosts.margin || 15
      }));
    }

    // If quantity already entered, recalculate total quantity and update consumption
    if (orderDetails.quantity) {
      const orderQty = parseFloat(orderDetails.quantity);
      if (!isNaN(orderQty) && orderQty > 0) {
        const totalQty = orderQty * productQuantity;
        
        // Update total quantity
        setOrderDetails(prev => ({
          ...prev,
          total_quantity: totalQty.toString()
        }));
        
        // Update consumptions with total quantity
        setTimeout(() => updateConsumptionBasedOnQuantity(totalQty), 100);
      }
    }
  };

  return {
    selectedProductId,
    setSelectedProductId,
    handleProductSelect
  };
}
