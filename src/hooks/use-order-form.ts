
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";

interface OrderFormData {
  company_name: string;
  company_id: string;
  quantity: string;
  bag_length: string;
  bag_width: string;
  rate: string;
  special_instructions: string;
  order_date: string;
}

interface Component {
  id: string;
  type: string;
  customName?: string;
  color?: string;
  gsm?: string;
  length?: string;
  width?: string;
}

interface UseOrderFormReturn {
  orderDetails: OrderFormData;
  components: Record<string, any>;
  customComponents: Component[];
  submitting: boolean;
  handleOrderChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { 
    target: { name: string; value: string } 
  }) => void;
  handleComponentChange: (type: string, field: string, value: string) => void;
  handleCustomComponentChange: (index: number, field: string, value: string) => void;
  addCustomComponent: () => void;
  removeCustomComponent: (index: number) => void;
  handleProductSelect: (components: any[]) => void;
  handleSubmit: (e: React.FormEvent) => Promise<string | undefined>;
}

// Define the database schema type to match what Supabase expects
interface OrderDatabaseSchema {
  company_name: string;
  company_id: string | null;
  quantity: number;
  bag_length: number;
  bag_width: number;
  rate: number | null;
  order_date: string;
  special_instructions: string | null;
}

export function useOrderForm(): UseOrderFormReturn {
  const [submitting, setSubmitting] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderFormData>({
    company_name: "",
    company_id: "",
    quantity: "",
    bag_length: "",
    bag_width: "",
    rate: "",
    special_instructions: "",
    order_date: new Date().toISOString().split('T')[0]
  });
  
  const [components, setComponents] = useState<Record<string, any>>({});
  const [customComponents, setCustomComponents] = useState<Component[]>([]);

  const handleOrderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { 
    target: { name: string; value: string } 
  }) => {
    const { name, value } = e.target;
    setOrderDetails(prev => ({
      ...prev,
      [name]: value
    }));
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

  const handleSubmit = async (e: React.FormEvent): Promise<string | undefined> => {
    e.preventDefault();
    
    const { company_name, company_id, quantity, bag_length, bag_width } = orderDetails;
    
    if ((!company_name && !company_id) || !quantity || !bag_length || !bag_width) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required order details including company information",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Fix: When company_id is provided, we need to get the company_name from the selected company
      // instead of setting it to null
      let orderCompanyName = company_name;
      
      // If we have a company_id but no company_name, fetch the company name
      if (company_id && !company_name) {
        const { data: companyData, error: companyError } = await supabase
          .from("companies")
          .select("name")
          .eq("id", company_id)
          .single();
          
        if (companyError) {
          throw new Error("Could not fetch company information");
        }
        
        if (companyData) {
          orderCompanyName = companyData.name;
        }
      }

      // Create an object that matches our database schema expectations
      const orderData: OrderDatabaseSchema = {
        company_name: orderCompanyName, // Use the fetched company name or provided name
        company_id: company_id || null,
        quantity: parseInt(quantity),
        bag_length: parseFloat(bag_length),
        bag_width: parseFloat(bag_width),
        rate: orderDetails.rate ? parseFloat(orderDetails.rate) : null,
        order_date: orderDetails.order_date,
        special_instructions: orderDetails.special_instructions || null
      };

      console.log("Submitting order data:", orderData);
      
      // Use type assertion to tell TypeScript that this is ok
      // The order_number will be generated by a database trigger
      const { data: orderData2, error: orderError } = await supabase
        .from("orders")
        .insert(orderData as any)
        .select('id, order_number')
        .single();
      
      if (orderError) throw orderError;
      
      const allComponents = [
        ...Object.values(components).filter(Boolean),
        ...customComponents
      ].filter(Boolean);
      
      if (allComponents.length > 0) {
        const componentsToInsert = allComponents.map(comp => ({
          order_id: orderData2.id,
          component_type: comp.type === 'custom' ? 'custom' : comp.type,
          size: comp.length && comp.width ? `${comp.length}x${comp.width}` : null,
          color: comp.color || null,
          gsm: comp.gsm || null,
          custom_name: comp.type === 'custom' ? comp.customName : null
        }));

        const { error: componentsError } = await supabase
          .from("order_components")
          .insert(componentsToInsert as any);
        
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
        description: `Order number: ${orderData2.order_number}`
      });

      return orderData2.id;
      
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast({
        title: "Error creating order",
        description: error.message,
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
    handleOrderChange,
    handleComponentChange,
    handleCustomComponentChange,
    addCustomComponent,
    removeCustomComponent,
    handleProductSelect,
    handleSubmit
  };
}
