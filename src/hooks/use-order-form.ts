import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { OrderFormData } from "@/types/order";

interface Component {
  id: string;
  type: string;
  customName?: string;
  color?: string;
  gsm?: string;
  length?: string;
  width?: string;
  consumption?: string;
  baseConsumption?: string;
  roll_width?: string;
  material_id?: string; // Added material_id to match what's being used in the code
}

interface FormErrors {
  company?: string;
  quantity?: string;
  bag_length?: string;
  bag_width?: string;
  order_date?: string;
}

interface UseOrderFormReturn {
  orderDetails: OrderFormData;
  components: Record<string, any>;
  customComponents: Component[];
  submitting: boolean;
  formErrors: FormErrors;
  handleOrderChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { 
    target: { name: string; value: string | null } 
  }) => void;
  handleComponentChange: (type: string, field: string, value: string) => void;
  handleCustomComponentChange: (index: number, field: string, value: string) => void;
  addCustomComponent: () => void;
  removeCustomComponent: (index: number) => void;
  handleProductSelect: (components: any[]) => void;
  handleSubmit: (e: React.FormEvent) => Promise<string | undefined>;
  validateForm: () => boolean;
  updateConsumptionBasedOnQuantity: (quantity: number) => void;
}

export function useOrderForm(): UseOrderFormReturn {
  const [submitting, setSubmitting] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderFormData>({
    company_name: "",
    company_id: null,
    quantity: "",
    bag_length: "",
    bag_width: "",
    border_dimension: "",
    rate: "",
    special_instructions: "",
    sales_account_id: null,
    order_date: new Date().toISOString().split('T')[0]
  });
  
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [components, setComponents] = useState<Record<string, any>>({});
  const [customComponents, setCustomComponents] = useState<Component[]>([]);
  const [baseConsumptions, setBaseConsumptions] = useState<Record<string, number>>({});

  const handleOrderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { 
    target: { name: string; value: string | null } 
  }) => {
    const { name, value } = e.target;
    
    // Handle special case for sales_account_id
    if (name === 'sales_account_id') {
      setOrderDetails(prev => ({
        ...prev,
        [name]: value === 'none' ? null : value
      }));
    } else {
      setOrderDetails(prev => ({
        ...prev,
        [name]: value
      }));

      // If quantity changed, update consumption values
      if (name === 'quantity' && value) {
        const quantity = parseFloat(value as string);
        if (!isNaN(quantity)) {
          updateConsumptionBasedOnQuantity(quantity);
        }
      }
    }
    
    // Clear validation error when field is changed
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
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

  const handleProductSelect = async (components: any[]) => {
    console.log("Selected product components:", components);
    
    if (!components || components.length === 0) {
      console.log("No components to process");
      return;
    }
    
    // Clear existing components first
    // Define standard types in lowercase for case-insensitive comparison
    const standardTypesLower = ['part', 'border', 'handle', 'chain', 'runner', 'piping'];
    const newOrderComponents: Record<string, any> = {};
    const newCustomComponents: Component[] = [];
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
          .select('id, material_name, color, gsm, unit, roll_width')
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

    components.forEach(component => {
      if (!component) return;
      
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
      
      // Get consumption value directly from component - THIS IS THE STORED VALUE
      let consumption = component.consumption?.toString() || '';
      const rollWidth = component.roll_width?.toString() || '';
      
      // If consumption isn't available, calculate it
      if (!consumption && length && width && rollWidth) {
        const lengthVal = parseFloat(length);
        const widthVal = parseFloat(width);
        const rollWidthVal = parseFloat(rollWidth);
        
        if (!isNaN(lengthVal) && !isNaN(widthVal) && !isNaN(rollWidthVal) && rollWidthVal > 0) {
          // Formula: (length * width) / (roll_width * 39.39)
          const calculatedConsumption = (lengthVal * widthVal) / (rollWidthVal * 39.39);
          consumption = calculatedConsumption.toFixed(2);
        }
      }
      
      // Include material_id if available
      const materialId = component.material_id || null;
      
      // Get material details either from fetched data or component
      let materialColor = '';
      let materialGsm = '';
      let materialRollWidth = '';
      
      if (materialId && materialsData[materialId]) {
        // If we have fetched material data, use it
        materialColor = materialsData[materialId].color || '';
        materialGsm = materialsData[materialId].gsm?.toString() || '';
        materialRollWidth = materialsData[materialId].roll_width?.toString() || rollWidth;
      } else {
        // Fallback to component data
        materialColor = component.material?.color || component.color || '';
        materialGsm = component.material?.gsm?.toString() || component.gsm?.toString() || '';
      }

      console.log(`Component ${component.component_type} has material:`, {
        materialId,
        materialColor,
        materialGsm,
        materialRollWidth
      });
      
      // Make sure component_type exists and is a string before converting to lower case
      if (!component.component_type || typeof component.component_type !== 'string') {
        console.warn('Component has no valid component_type:', component);
        return;
      }
      
      const componentTypeLower = component.component_type.toLowerCase();
      
      // Extract the base consumption value - THIS IS THE KEY FIX
      // We need to store the original consumption as baseConsumption
      // This will be the per-unit value (without default quantity factored in)
      const baseConsumption = consumption ? parseFloat(consumption) : undefined;
      
      // Handle the case where product has a default quantity > 1
      // The consumption stored in the database is the base consumption per unit
      // So we need to preserve this information
      
      if (componentTypeLower === 'custom') {
        const customIndex = newCustomComponents.length;
        newCustomComponents.push({
          id: uuidv4(),
          type: 'custom',
          customName: component.custom_name || '',
          color: materialColor,
          gsm: materialGsm,
          length,
          width,
          consumption, // This is the total consumption with default_quantity
          baseConsumption: baseConsumption?.toString(), // Store the base consumption per unit
          roll_width: materialRollWidth || rollWidth,
          material_id: materialId
        });
        
        // Store base consumption for this custom component
        if (baseConsumption) {
          newBaseConsumptions[`custom_${customIndex}`] = baseConsumption;
        }
      } else if (standardTypesLower.includes(componentTypeLower)) {
        // Map the component type to the capitalized version used in the UI
        const componentTypeKey = component.component_type;
        
        console.log(`Found standard component ${componentTypeLower} -> mapping to key ${componentTypeKey}`);
        
        newOrderComponents[componentTypeKey] = {
          id: uuidv4(),
          type: componentTypeKey, // Preserve original capitalization
          color: materialColor,
          gsm: materialGsm,
          length,
          width,
          consumption, // This is the total consumption with default_quantity
          baseConsumption: baseConsumption?.toString(), // Store the base consumption per unit
          roll_width: materialRollWidth || rollWidth,
          material_id: materialId
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

    // If quantity already entered, update consumption values
    if (orderDetails.quantity) {
      const quantity = parseFloat(orderDetails.quantity);
      if (!isNaN(quantity) && quantity > 0) {
        setTimeout(() => updateConsumptionBasedOnQuantity(quantity), 100);
      }
    }
  };

  const validateForm = () => {
    const errors: FormErrors = {};
    let isValid = true;

    // Validate company information
    if (!orderDetails.company_name) {
      errors.company = "Company name is required";
      isValid = false;
    }

    // Validate quantity
    if (!orderDetails.quantity || parseFloat(orderDetails.quantity) <= 0) {
      errors.quantity = "Valid quantity is required";
      isValid = false;
    }

    // Validate bag length
    if (!orderDetails.bag_length || parseFloat(orderDetails.bag_length) <= 0) {
      errors.bag_length = "Valid bag length is required";
      isValid = false;
    }

    // Validate bag width
    if (!orderDetails.bag_width || parseFloat(orderDetails.bag_width) <= 0) {
      errors.bag_width = "Valid bag width is required";
      isValid = false;
    }

    // Validate order date
    if (!orderDetails.order_date) {
      errors.order_date = "Order date is required";
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // Helper function to convert string values to appropriate types
  const convertStringToNumeric = (value: string | undefined | null): number | null => {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    const numValue = parseFloat(value);
    return isNaN(numValue) ? null : numValue;
  };

  // Helper function to validate component data
  const validateComponentData = (component: any): boolean => {
    if (!component) {
      console.warn("Invalid component data: component is null or undefined");
      return false;
    }
    
    // Check for required type field (using either type or component_type)
    if (!component.type && !component.component_type) {
      console.warn("Invalid component data: missing type/component_type", component);
      return false;
    }
    
    // Validate numeric fields to ensure they're not NaN when parsed
    if (component.length && isNaN(parseFloat(component.length))) {
      console.warn("Invalid component data: length is not a valid number", component);
      return false;
    }
    
    if (component.width && isNaN(parseFloat(component.width))) {
      console.warn("Invalid component data: width is not a valid number", component);
      return false;
    }
    
    if (component.roll_width && isNaN(parseFloat(component.roll_width))) {
      console.warn("Invalid component data: roll_width is not a valid number", component);
      return false;
    }
    
    if (component.consumption && isNaN(parseFloat(component.consumption))) {
      console.warn("Invalid component data: consumption is not a valid number", component);
      return false;
    }
    
    if (component.gsm && isNaN(parseFloat(component.gsm))) {
      console.warn("Invalid component data: gsm is not a valid number", component);
      return false;
    }
    
    return true;
  }

  const handleSubmit = async (e: React.FormEvent): Promise<string | undefined> => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      toast({
        title: "Form validation failed",
        description: "Please correct the highlighted fields",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Prepare data for database insert
      const orderData = {
        company_name: orderDetails.company_id ? null : orderDetails.company_name,
        company_id: orderDetails.company_id,
        quantity: parseInt(orderDetails.quantity),
        bag_length: parseFloat(orderDetails.bag_length),
        bag_width: parseFloat(orderDetails.bag_width),
        border_dimension: orderDetails.border_dimension ? parseFloat(orderDetails.border_dimension) : null,
        rate: orderDetails.rate ? parseFloat(orderDetails.rate) : null,
        order_date: orderDetails.order_date,
        sales_account_id: orderDetails.sales_account_id || null,
        special_instructions: orderDetails.special_instructions || null
      };

      console.log("Submitting order data:", orderData);
      
      // Implement retry logic for order insertion
      let orderResult = null;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts && !orderResult) {
        attempts++;
        
        try {
          // Insert the order - using type assertion to bypass the order_number requirement
          // since this is auto-generated by the database trigger
          const { data, error } = await supabase
            .from("orders")
            .insert(orderData as any)
            .select('id, order_number')
            .single();
          
          if (error) {
            console.error(`Order insertion attempt ${attempts} error:`, error);
            
            // If it's not a duplicate key error or we've reached max attempts, throw the error
            if (error.code !== '23505' || attempts >= maxAttempts) {
              throw error;
            }
            
            // For duplicate key errors, wait briefly and retry
            await new Promise(resolve => setTimeout(resolve, 100 * attempts));
          } else {
            // Success! Store the result and exit the retry loop
            orderResult = data;
            break;
          }
        } catch (insertError) {
          if (attempts >= maxAttempts) {
            throw insertError;
          }
        }
      }
      
      if (!orderResult) {
        throw new Error("Failed to create order after multiple attempts");
      }
      
      console.log("Order created successfully:", orderResult);
      
      // Process components if any exist
      const allComponents = [
        ...Object.values(components).filter(Boolean),
        ...customComponents
      ].filter(Boolean);
      
      console.log("Raw components to be saved:", allComponents);
      
      if (allComponents.length > 0) {
        // Create a properly formatted array of components with correct data types
        const componentsToInsert = allComponents
          .filter(comp => validateComponentData(comp))
          .map(comp => {
            // Determine correct component type - IMPORTANT: convert to lowercase to match database enum
            // The database expects component_type in lowercase, but UI might display it with capitalization
            const componentTypeRaw = comp.type === 'custom' ? 'custom' : comp.type;
            const componentType = componentTypeRaw.toLowerCase();
            
            console.log(`Converting component type from '${componentTypeRaw}' to '${componentType}'`);
            
            // Use proper size formatting or null
            const size = comp.length && comp.width 
              ? `${comp.length}x${comp.width}` 
              : null;
            
            // Get the appropriate custom name based on component type
            const customName = comp.type === 'custom' ? comp.customName : null;
            
            // Convert string values to appropriate types for numeric fields
            const gsmValue = convertStringToNumeric(comp.gsm);
            const rollWidthValue = convertStringToNumeric(comp.roll_width);
            const consumptionValue = convertStringToNumeric(comp.consumption);
            
            // Debug log for individual component
            console.log(`Preparing component ${componentType}:`, {
              originalType: comp.type,
              normalizedType: componentType,
              originalGsm: comp.gsm,
              originalRollWidth: comp.roll_width,
              originalConsumption: comp.consumption,
              convertedGsm: gsmValue,
              convertedRollWidth: rollWidthValue,
              convertedConsumption: consumptionValue,
              size,
              materialId: comp.material_id || null
            });
            
            return {
              order_id: orderResult.id,
              component_type: componentType,
              size,
              color: comp.color || null,
              gsm: gsmValue,
              custom_name: customName,
              material_id: comp.material_id || null,
              roll_width: rollWidthValue,
              consumption: consumptionValue
            };
        });

        // Additional debug log for final components array
        console.log("Formatted components to insert:", componentsToInsert);

        if (componentsToInsert.length > 0) {
          const { data: insertedComponents, error: componentsError } = await supabase
            .from("order_components")
            .insert(componentsToInsert)
            .select();
          
          if (componentsError) {
            console.error("Error saving components:", componentsError);
            console.error("Components that failed to save:", componentsToInsert);
            
            toast({
              title: "Error saving components",
              description: componentsError.message,
              variant: "destructive"
            });
          } else {
            console.log("Components saved successfully:", insertedComponents);
            
            // Success toast for components
            toast({
              title: "Components saved successfully",
              description: `${insertedComponents?.length || 0} components saved`
            });
          }
        } else {
          console.warn("No valid components to insert after validation");
        }
      } else {
        console.log("No components to save");
      }
      
      toast({
        title: "Order created successfully",
        description: `Order number: ${orderResult.order_number}`
      });

      return orderResult.id;
      
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast({
        title: "Error creating order",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    orderDetails,
    components,
    customComponents,
    submitting,
    formErrors,
    handleOrderChange,
    handleComponentChange,
    handleCustomComponentChange,
    addCustomComponent,
    removeCustomComponent,
    handleProductSelect,
    handleSubmit,
    validateForm,
    updateConsumptionBasedOnQuantity
  };
}
