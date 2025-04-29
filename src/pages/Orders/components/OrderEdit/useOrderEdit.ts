
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ComponentData, CustomComponent } from "@/types/order";
import { v4 as uuidv4 } from "uuid";

export const useOrderEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    company_name: "",
    company_id: null as string | null,
    quantity: "",
    bag_length: "",
    bag_width: "",
    rate: "",
    special_instructions: "",
    order_date: ""
  });
  
  const [formErrors, setFormErrors] = useState({
    company: undefined as string | undefined,
    quantity: undefined as string | undefined,
    bag_length: undefined as string | undefined,
    bag_width: undefined as string | undefined,
    order_date: undefined as string | undefined
  });
  
  const [components, setComponents] = useState<ComponentData[]>([
    { type: "part", width: "", length: "", color: "", gsm: "" },
    { type: "border", width: "", length: "", color: "", gsm: "" },
    { type: "handle", width: "", length: "", color: "", gsm: "" },
    { type: "chain", width: "", length: "", color: "", gsm: "" },
    { type: "runner", width: "", length: "", color: "", gsm: "" }
  ]);
  
  const [customComponents, setCustomComponents] = useState<CustomComponent[]>([]);

  useEffect(() => {
    fetchOrderData();
  }, [id]);

  const fetchOrderData = async () => {
    setLoading(true);
    try {
      // Fetch order details
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();
        
      if (orderError) throw orderError;
      
      // Format order data for the form
      setFormData({
        company_name: orderData.company_name,
        company_id: orderData.company_id,
        quantity: orderData.quantity.toString(),
        bag_length: orderData.bag_length.toString(),
        bag_width: orderData.bag_width.toString(),
        rate: orderData.rate ? orderData.rate.toString() : "",
        special_instructions: orderData.special_instructions || "",
        order_date: new Date(orderData.order_date).toISOString().split('T')[0]
      });
      
      // Fetch order components
      const { data: componentsData, error: componentsError } = await supabase
        .from("components")
        .select("*")
        .eq("order_id", id);
        
      if (componentsError) throw componentsError;
      
      // Process components
      const standardComponents = ["part", "border", "handle", "chain", "runner"];
      const fetchedCustomComponents: CustomComponent[] = [];
      
      // Initialize components with fetched data
      const updatedComponents = [...components];
      
      componentsData?.forEach(comp => {
        // Extract size information
        let width = "", length = "";
        if (comp.size) {
          const [l, w] = comp.size.split('x');
          length = l || "";
          width = w || "";
        }
        
        const componentData: ComponentData = {
          id: comp.id,
          type: comp.type,
          color: comp.color || "",
          gsm: comp.gsm || "",
          length,
          width,
          details: comp.details || ""
        };
        
        // Check if it's a standard component or custom
        if (standardComponents.includes(comp.type)) {
          const index = standardComponents.indexOf(comp.type);
          updatedComponents[index] = componentData;
        } else {
          // Make sure id field is not optional for CustomComponent
          fetchedCustomComponents.push({
            id: comp.id || uuidv4(),
            ...componentData,
            customName: comp.type !== "custom" ? comp.type : comp.details || "",
          });
        }
      });
      
      setComponents(updatedComponents);
      setCustomComponents(fetchedCustomComponents);
      
    } catch (error: any) {
      toast({
        title: "Error fetching order details",
        description: error.message,
        variant: "destructive"
      });
      navigate("/orders");
    } finally {
      setLoading(false);
    }
  };

  const handleOrderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error when field is changed
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleComponentChange = (index: number, field: string, value: string) => {
    setComponents(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
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
    setCustomComponents(prev => [...prev, { 
      id: uuidv4(),
      type: "custom",
      customName: "",
      width: "",
      length: "",
      color: "",
      gsm: "",
    }]);
  };

  const removeCustomComponent = (index: number) => {
    setCustomComponents(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const errors = {
      company: undefined as string | undefined,
      quantity: undefined as string | undefined,
      bag_length: undefined as string | undefined,
      bag_width: undefined as string | undefined,
      order_date: undefined as string | undefined
    };
    
    let isValid = true;
    
    if (!formData.company_name) {
      errors.company = "Company name is required";
      isValid = false;
    }
    
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      errors.quantity = "Valid quantity is required";
      isValid = false;
    }
    
    if (!formData.bag_length || parseFloat(formData.bag_length) <= 0) {
      errors.bag_length = "Valid bag length is required";
      isValid = false;
    }
    
    if (!formData.bag_width || parseFloat(formData.bag_width) <= 0) {
      errors.bag_width = "Valid bag width is required";
      isValid = false;
    }
    
    if (!formData.order_date) {
      errors.order_date = "Order date is required";
      isValid = false;
    }
    
    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please correct the highlighted fields",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Update order
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          company_name: formData.company_name,
          company_id: formData.company_id,
          quantity: parseInt(formData.quantity),
          bag_length: parseFloat(formData.bag_length),
          bag_width: parseFloat(formData.bag_width),
          rate: formData.rate ? parseFloat(formData.rate) : null,
          special_instructions: formData.special_instructions || null,
          order_date: formData.order_date
        })
        .eq("id", id);
      
      if (orderError) throw orderError;
      
      // Delete existing components and recreate them
      const { error: deleteError } = await supabase
        .from("components")
        .delete()
        .eq("order_id", id);
      
      if (deleteError) throw deleteError;
      
      // Process and insert updated components
      const allComponents = [
        ...components.filter(comp => comp.length || comp.width || comp.color || comp.gsm),
        ...customComponents.filter(comp => comp.length || comp.width || comp.color || comp.gsm)
      ];

      if (allComponents.length > 0) {
        for (const comp of allComponents) {
          // Define allowable component type values that match the database enum
          const componentType = comp.type === 'custom' ? 'custom' : 
            (['part', 'border', 'handle', 'chain', 'runner'].includes(comp.type) ? 
              comp.type as any : 'custom');

          const { error: componentError } = await supabase
            .from("components")
            .insert({
              order_id: id,
              type: componentType,
              size: comp.length && comp.width ? `${comp.length}x${comp.width}` : null,
              color: comp.color || null,
              gsm: comp.gsm || null,
              details: comp.customName || comp.details || null
            } as any); // Type assertion to bypass TypeScript strict checking
            
          if (componentError) throw componentError;
        }
      }

      toast({
        title: "Order Updated",
        description: "The order has been updated successfully",
      });
      
      navigate(`/orders/${id}`);
      
    } catch (error: any) {
      toast({
        title: "Error updating order",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    id,
    navigate,
    formData,
    formErrors,
    components,
    customComponents,
    loading,
    submitting,
    handleOrderChange,
    handleComponentChange,
    handleCustomComponentChange,
    addCustomComponent,
    removeCustomComponent,
    handleSubmit
  };
};
