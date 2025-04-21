import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  type: string;
  name?: string;
  width: string;
  length: string;
  color: string;
  gsm: string;
  details?: string;
}

type ComponentType = Database["public"]["Enums"]["component_type"];

const OrderNew = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    company_name: "",
    quantity: "",
    bag_length: "",
    bag_width: "",
    rate: "",
    special_instructions: ""
  });
  
  const [components, setComponents] = useState<ComponentData[]>([
    { type: "part", width: "", length: "", color: "", gsm: "" },
    { type: "border", width: "", length: "", color: "", gsm: "" },
    { type: "handle", width: "", length: "", color: "", gsm: "" },
    { type: "chain", width: "", length: "", color: "", gsm: "" },
    { type: "runner", width: "", length: "", color: "", gsm: "" }
  ]);
  
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

  const [customComponents, setCustomComponents] = useState<ComponentData[]>([]);

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
    
    const hasAnyComponentData = components.some(comp => comp.length || comp.width || comp.color || comp.gsm);
    if (!hasAnyComponentData && customComponents.length === 0) {
      return "At least one component detail is required";
    }
    
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
      const tempOrderNumber = `TEMP-${Date.now()}`;
      
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          company_name: formData.company_name,
          quantity: parseInt(formData.quantity),
          bag_length: parseFloat(formData.bag_length),
          bag_width: parseFloat(formData.bag_width),
          rate: formData.rate ? parseFloat(formData.rate) : null,
          special_instructions: formData.special_instructions || null,
          order_number: tempOrderNumber
        })
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      const allComponents = [
        ...components.filter(comp => comp.length || comp.width || comp.color || comp.gsm),
        ...customComponents.filter(comp => comp.length || comp.width || comp.color || comp.gsm)
      ].map(comp => ({
        order_id: orderData.id,
        type: comp.type === 'custom' ? (comp.name || 'Custom Component') : comp.type,
        size: comp.length && comp.width ? `${comp.length}x${comp.width}` : null,
        color: comp.color || null,
        gsm: comp.gsm || null,
        details: comp.details || null
      }));

      if (allComponents.length > 0) {
        const componentsToInsert = allComponents.map(comp => ({
          order_id: orderData.id,
          type: comp.type as ComponentType,
          size: comp.size || null,
          color: comp.color || null,
          gsm: comp.gsm || null,
          details: comp.details || null
        }));

        const { error: componentsError } = await supabase
          .from("components")
          .insert(componentsToInsert);
        
        if (componentsError) throw componentsError;
      }

      toast({
        title: "Order Created",
        description: `Order number ${orderData.order_number} has been created successfully`,
      });
      
      navigate(`/orders/${orderData.id}`);
      
    } catch (error: any) {
      toast({
        title: "Error creating order",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-1"
          onClick={() => navigate("/orders")}
        >
          <ArrowLeft size={16} />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Order</h1>
          <p className="text-muted-foreground">Create a new bag manufacturing order</p>
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
              onClick={() => navigate("/orders")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Order"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default OrderNew;
