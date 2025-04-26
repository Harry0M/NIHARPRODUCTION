
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
}

export function useOrderForm(): UseOrderFormReturn {
  const [submitting, setSubmitting] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderFormData>({
    company_name: "",
    company_id: null,
    quantity: "",
    bag_length: "",
    bag_width: "",
    rate: "",
    special_instructions: "",
    order_date: new Date().toISOString().split('T')[0]
  });
  
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [components, setComponents] = useState<Record<string, any>>({});
  const [customComponents, setCustomComponents] = useState<Component[]>([]);

  const handleOrderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { 
    target: { name: string; value: string | null } 
  }) => {
    const { name, value } = e.target;
    setOrderDetails(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when field is changed
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
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
  };

  const handleProductSelect = (components: any[]) => {
    // Convert catalog components to order components format
    const orderComponents = components.reduce((acc, component) => {
      if (component.component_type === 'custom') {
        setCustomComponents(prev => [...prev, {
          id: uuidv4(),
          type: 'custom',
          customName: component.custom_name,
          color: component.color,
          gsm: component.gsm,
          length: component.size?.split('x')[0] || '',
          width: component.size?.split('x')[1] || ''
        }]);
      } else {
        acc[component.component_type] = {
          id: uuidv4(),
          type: component.component_type,
          color: component.color,
          gsm: component.gsm,
          length: component.size?.split('x')[0] || '',
          width: component.size?.split('x')[1] || ''
        };
      }
      return acc;
    }, {});

    setComponents(orderComponents);
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
        rate: orderDetails.rate ? parseFloat(orderDetails.rate) : null,
        order_date: orderDetails.order_date,
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
      
      if (allComponents.length > 0) {
        const componentsToInsert = allComponents.map(comp => ({
          order_id: orderResult.id,
          component_type: comp.type === 'custom' ? 'custom' : comp.type,
          size: comp.length && comp.width ? `${comp.length}x${comp.width}` : null,
          color: comp.color || null,
          gsm: comp.gsm || null,
          custom_name: comp.type === 'custom' ? comp.customName : null
        }));

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
    validateForm
  };
}
