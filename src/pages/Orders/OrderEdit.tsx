
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { OrderDetailsForm } from "@/components/orders/OrderDetailsForm";
import { ComponentForm } from "@/components/orders/ComponentForm";
import { CustomComponentSection } from "@/components/orders/CustomComponentSection";

const componentOptions = {
  color: ["Red", "Blue", "Green", "Black", "White", "Yellow", "Brown", "Orange", "Purple", "Gray", "Custom"],
  gsm: ["70", "80", "90", "100", "120", "140", "160", "180", "200", "250", "300", "Custom"]
};

interface ComponentData {
  id?: string;
  type: string;
  name?: string;
  width: string;
  length: string;
  color: string;
  gsm: string;
  details?: string;
}

type ComponentType = Database["public"]["Enums"]["component_type"];

const OrderEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    company_name: "",
    quantity: "",
    bag_length: "",
    bag_width: "",
    rate: "",
    special_instructions: "",
    order_date: ""
  });
  
  const [components, setComponents] = useState<ComponentData[]>([
    { type: "part", width: "", length: "", color: "", gsm: "" },
    { type: "border", width: "", length: "", color: "", gsm: "" },
    { type: "handle", width: "", length: "", color: "", gsm: "" },
    { type: "chain", width: "", length: "", color: "", gsm: "" },
    { type: "runner", width: "", length: "", color: "", gsm: "" }
  ]);
  
  const [customComponents, setCustomComponents] = useState<ComponentData[]>([]);
  
  useEffect(() => {
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
        const fetchedCustomComponents: ComponentData[] = [];
        
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
            fetchedCustomComponents.push({
              ...componentData,
              name: comp.type !== "custom" ? comp.type : "",
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
    
    fetchOrderData();
  }, [id, navigate]);

  const handleOrderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      type: "custom",
      name: "",
      width: "",
      length: "",
      color: "",
      gsm: "",
      details: ""
    }]);
  };

  const removeCustomComponent = (index: number) => {
    setCustomComponents(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!formData.company_name) return "Company name is required";
    if (!formData.quantity || parseInt(formData.quantity) <= 0) return "Valid quantity is required";
    if (!formData.bag_length || parseFloat(formData.bag_length) <= 0) return "Valid bag length is required";
    if (!formData.bag_width || parseFloat(formData.bag_width) <= 0) return "Valid bag width is required";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
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
        const componentsToInsert = allComponents.map(comp => {
          // For custom components, use the name as type if provided
          const componentType = comp.type === "custom" && comp.name 
            ? comp.name as ComponentType 
            : comp.type as ComponentType;
            
          return {
            order_id: id,
            type: componentType,
            size: comp.length && comp.width ? `${comp.length}x${comp.width}` : null,
            color: comp.color || null,
            gsm: comp.gsm || null,
            details: comp.details || null
          };
        });

        const { error: componentsError } = await supabase
          .from("components")
          .insert(componentsToInsert);
        
        if (componentsError) throw componentsError;
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-1"
          onClick={() => navigate(`/orders/${id}`)}
        >
          <ArrowLeft size={16} />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Order</h1>
          <p className="text-muted-foreground">Update order details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <OrderDetailsForm 
          formData={formData}
          handleOrderChange={handleOrderChange}
        />

        <Card>
          <CardHeader>
            <CardTitle>Bag Components</CardTitle>
            <CardDescription>Specify the details for each bag component</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {components.map((component, index) => (
                <div key={index} className="p-4 border rounded-md space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium capitalize">{component.type}</h3>
                  </div>
                  <ComponentForm
                    component={component}
                    index={index}
                    componentOptions={componentOptions}
                    handleChange={handleComponentChange}
                  />
                </div>
              ))}
              
              <CustomComponentSection
                customComponents={customComponents}
                componentOptions={componentOptions}
                handleCustomComponentChange={handleCustomComponentChange}
                addCustomComponent={addCustomComponent}
                removeCustomComponent={removeCustomComponent}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 pt-6">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate(`/orders/${id}`)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Updating..." : "Update Order"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default OrderEdit;
