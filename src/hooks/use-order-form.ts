
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

    // Update consumption for standard components
    const updatedComponents = { ...components };
    Object.keys(updatedComponents).forEach(type => {
      const baseConsumption = baseConsumptions[type];
      if (baseConsumption && !isNaN(baseConsumption)) {
        const newConsumption = baseConsumption * quantity;
        updatedComponents[type] = {
          ...updatedComponents[type],
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
    const standardTypes = ['part', 'border', 'handle', 'chain', 'runner'];
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
      
      // Extract length and width from size format "length x width"
      let length = '', width = '';
      if (component.size) {
        const sizeValues = component.size.split('x').map((s: string) => s.trim());
        length = sizeValues[0] || '';
        width = sizeValues[1] || '';
      } else {
        // If no size but separate length/width provided
        length = component.length?.toString() || '';
        width = component.width?.toString() || '';
      }
      
      // Store consumption value directly from component
      const consumption = component.consumption?.toString() || '';
      const rollWidth = component.roll_width?.toString() || '';
      
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
      
      if (component.component_type === 'custom') {
        const customIndex = newCustomComponents.length;
        newCustomComponents.push({
          id: uuidv4(),
          type: 'custom',
          customName: component.custom_name || '',
          color: materialColor,
          gsm: materialGsm,
          length,
          width,
          consumption,
          roll_width: materialRollWidth || rollWidth,
          material_id: materialId
        });
        
        // Store base consumption for this custom component
        if (component.consumption) {
          newBaseConsumptions[`custom_${customIndex}`] = parseFloat(component.consumption);
        }
      } else if (standardTypes.includes(component.component_type)) {
        newOrderComponents[component.component_type] = {
          id: uuidv4(),
          type: component.component_type,
          color: materialColor,
          gsm: materialGsm,
          length,
          width,
          consumption,
          roll_width: materialRollWidth || rollWidth,
          material_id: materialId
        };
        
        // Store base consumption for standard component
        if (component.consumption) {
          newBaseConsumptions[component.component_type] = parseFloat(component.consumption);
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
        setTimeout(() => updateConsumptionBasedOnQuantity(quantity), 0);
      }
    }
  };

  const validateForm = (): boolean => {
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
      
      // Insert the order - using type assertion to bypass the order_number requirement
      // since this is auto-generated by the database trigger
      const { data: orderResult, error: orderError } = await supabase
        .from("orders")
        .insert(orderData as any)
        .select('id, order_number')
        .single();
      
      if (orderError) {
        console.error("Order insertion error:", orderError);
        throw orderError;
      }
      
      console.log("Order created successfully:", orderResult);
      
      // Process components if any exist
      const allComponents = [
        ...Object.values(components).filter(Boolean),
        ...customComponents
      ].filter(Boolean);
      
      console.log("Components to be saved:", allComponents);
      
      if (allComponents.length > 0) {
        const componentsToInsert = allComponents.map(comp => ({
          order_id: orderResult.id,
          component_type: comp.type === 'custom' ? 'custom' : comp.type,
          size: comp.length && comp.width ? `${comp.length}x${comp.width}` : null,
          color: comp.color || null,
          gsm: comp.gsm || null,
          custom_name: comp.type === 'custom' ? comp.customName : null
        }));

        console.log("Inserting components:", componentsToInsert);

        // Fixed: Using the correct table name "order_components" instead of "components"
        const { error: componentsError } = await supabase
          .from("order_components")
          .insert(componentsToInsert);
        
        if (componentsError) {
          console.error("Error saving components:", componentsError);
          toast({
            title: "Error saving components",
            description: componentsError.message,
            variant: "destructive"
          });
        } else {
          console.log("Components saved successfully");
        }
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
