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
    
    // Pre-initialize cost calculation with the production costs
    // This ensures costs appear immediately even before consumption is calculated
    if (setCostCalculation) {
      setCostCalculation(prev => ({
        ...prev,
        cuttingCharge: productCosts.cutting_charge || 0,
        printingCharge: productCosts.printing_charge || 0,
        stitchingCharge: productCosts.stitching_charge || 0,
        transportCharge: productCosts.transport_charge || 0,
        margin: productCosts.margin || 15
      }));
    }

    // Create a function to process each component
    const processComponent = (component: any) => {
      if (!component) return null;
      
      console.log("Processing component with types:", {
        originalType: component.component_type,
        type: component.type,
        lowerOriginal: component.component_type?.toLowerCase(),
        lowerType: component.type?.toLowerCase()
      });
      
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
      
      // If consumption isn't available, calculate it based on formula type
      if (!totalConsumption) {
        // Get formula type, defaulting to standard if not specified
        const formula = component.formula || 'standard';
        console.log(`Calculating consumption using formula type: ${formula}`, {
          length,
          width,
          rollWidth,
          componentType: component.component_type || component.type
        });
        
        if (formula === 'standard' && length && width && rollWidth) {
          // Standard formula: (length * width) / (roll_width * 39.39)
          const lengthVal = parseFloat(length);
          const widthVal = parseFloat(width);
          const rollWidthVal = parseFloat(rollWidth);
          
          if (!isNaN(lengthVal) && !isNaN(widthVal) && !isNaN(rollWidthVal) && rollWidthVal > 0) {
            const calculatedConsumption = (lengthVal * widthVal) / (rollWidthVal * 39.39);
            totalConsumption = calculatedConsumption.toFixed(2);
            console.log(`Standard formula calculation: (${lengthVal} * ${widthVal}) / (${rollWidthVal} * 39.39) = ${totalConsumption}`);
          }
        } else if (formula === 'linear' && length) {
          // Linear formula: (length) / 39.39
          const lengthVal = parseFloat(length);
          
          if (!isNaN(lengthVal)) {
            const calculatedConsumption = lengthVal / 39.39;
            totalConsumption = calculatedConsumption.toFixed(2);
            console.log(`Linear formula calculation: ${lengthVal} / 39.39 = ${totalConsumption}`);
          }
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

      // Ensure we have a valid componentType for the database - must be lowercase
      const componentType = component.component_type || component.type;
      let componentTypeLower = componentType?.toLowerCase() || '';

      // Validate against the list of valid component types
      const validComponentTypes = ['part', 'border', 'chain', 'piping', 'runner', 'handle', 'custom'];
      if (!validComponentTypes.includes(componentTypeLower)) {
        console.warn(`Invalid component type "${componentTypeLower}" - defaulting to "part"`);
        
        // Try to normalize component type to a valid value
        if (componentTypeLower.includes('part') || componentTypeLower.includes('body')) {
          componentTypeLower = 'part';
        } else if (componentTypeLower.includes('border')) {
          componentTypeLower = 'border';
        } else if (componentTypeLower.includes('chain')) {
          componentTypeLower = 'chain';
        } else if (componentTypeLower.includes('piping')) {
          componentTypeLower = 'piping';
        } else if (componentTypeLower.includes('runner')) {
          componentTypeLower = 'runner';
        } else if (componentTypeLower.includes('handle')) {
          componentTypeLower = 'handle';
        } else if (componentTypeLower.includes('custom')) {
          componentTypeLower = 'custom';
        } else {
          componentTypeLower = 'part';
        }
        
        console.log(`Normalized component type to: ${componentTypeLower}`);
      }
      
      // Calculate the base consumption (per unit) from the total consumption
      // Divide by product default quantity to get the base consumption per unit
      let baseConsumption: number | undefined;
      
      if (totalConsumption) {
        const totalConsumptionVal = parseFloat(totalConsumption);
        if (!isNaN(totalConsumptionVal)) {
          // Calculate base consumption per unit from total consumption
          baseConsumption = totalConsumptionVal / productQuantity;
          // Ensure it's at least a small positive number to avoid calculation issues
          if (baseConsumption <= 0) baseConsumption = 0.001;
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
      
      // IMPORTANT: Check for custom components
      // - If is_custom is true, it's a custom component
      // - If component_type is 'custom', it's a custom component
      // - If custom_name is provided, it's a custom component
      
      if (comp.is_custom === true || componentTypeLower === 'custom' || comp.custom_name) {
        const customIndex = newCustomComponents.length;
        newCustomComponents.push({
          id: uuidv4(),
          type: 'custom',
          customName: comp.custom_name || comp.componentTypeLower || '',
          ...comp
        });
        
        // Store base consumption for this custom component
        if (baseConsumption) {
          newBaseConsumptions[`custom_${customIndex}`] = baseConsumption;
        }
      } else if (standardTypesLower.includes(componentTypeLower)) {
        // Map the component type to the capitalized version used in the UI
        // Get the properly capitalized UI version from the lowercase database version
        const componentTypeCapitalized = {
          'part': 'Part',
          'border': 'Border',
          'chain': 'Chain',
          'piping': 'Piping',
          'runner': 'Runner',
          'handle': 'Handle'
        }[componentTypeLower] || 'Part';
        
        console.log(`Found standard component ${componentTypeLower} -> mapping to UI key ${componentTypeCapitalized}`);
        
        newOrderComponents[componentTypeCapitalized] = {
          id: uuidv4(),
          type: componentTypeCapitalized, // Use properly capitalized version for UI
          ...comp
        };
        
        // Store base consumption for standard component
        if (baseConsumption) {
          newBaseConsumptions[componentTypeCapitalized] = baseConsumption;
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
      
      // Get order quantity for production cost calculation
      const orderQty = parseFloat(orderDetails.quantity || '1');
      
      // Calculate production costs based on order quantity
      const totalCuttingCharge = orderQty * (productCosts.cutting_charge || 0);
      const totalPrintingCharge = orderQty * (productCosts.printing_charge || 0);
      const totalStitchingCharge = orderQty * (productCosts.stitching_charge || 0);
      const totalTransportCharge = productCosts.transport_charge || 0; // Transport is usually per order, not per unit
      
      // Sum up production costs
      const productionCost = totalCuttingCharge + totalPrintingCharge + totalStitchingCharge + totalTransportCharge;
      
      // Calculate total cost
      const totalCost = materialCost + productionCost;
      
      // Calculate selling price based on margin
      const margin = productCosts.margin || 15;
      const sellingPrice = totalCost * (1 + margin / 100);
      
      console.log('Setting initial cost calculation:', {
        materialCost,
        cuttingCharge: totalCuttingCharge,
        printingCharge: totalPrintingCharge,
        stitchingCharge: totalStitchingCharge,
        transportCharge: totalTransportCharge,
        productionCost,
        totalCost,
        margin,
        sellingPrice
      });
      
      setCostCalculation({
        materialCost,
        cuttingCharge: totalCuttingCharge,
        printingCharge: totalPrintingCharge,
        stitchingCharge: totalStitchingCharge,
        transportCharge: totalTransportCharge,
        productionCost,
        totalCost,
        margin,
        sellingPrice
      });
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
