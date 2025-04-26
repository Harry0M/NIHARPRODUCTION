
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { OrderDetailsForm } from "@/components/orders/OrderDetailsForm";
import { ComponentForm } from "@/components/orders/ComponentForm";
import { CustomComponent, CustomComponentSection } from "@/components/orders/CustomComponentSection";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const componentOptions = {
  color: ["Red", "Blue", "Green", "Black", "White", "Yellow", "Brown", "Orange", "Purple", "Gray", "Custom"],
  gsm: ["70", "80", "90", "100", "120", "140", "160", "180", "200", "250", "300", "Custom"]
};

const OrderNew = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  
  // Order details state
  const [orderDetails, setOrderDetails] = useState({
    company_name: "",
    company_id: "", // Add company_id to track selected company
    quantity: "",
    bag_length: "",
    bag_width: "",
    rate: "",
    special_instructions: "",
    order_date: new Date().toISOString().split('T')[0]
  });
  
  // Standard components state
  const [components, setComponents] = useState<Record<string, any>>({});
  
  // Custom added components state
  const [customComponents, setCustomComponents] = useState<CustomComponent[]>([]);
  
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const { company_name, company_id, quantity, bag_length, bag_width } = orderDetails;
    
    // Check if either company_name or company_id is provided
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
      // Prepare order data ensuring we have either company_name or company_id
      const orderData = {
        company_name: company_name || null, // Set to null if empty
        company_id: company_id || null,     // Set to null if empty
        quantity: parseInt(quantity),
        bag_length: parseFloat(bag_length),
        bag_width: parseFloat(bag_width),
        rate: orderDetails.rate ? parseFloat(orderDetails.rate) : null,
        order_date: orderDetails.order_date,
        special_instructions: orderDetails.special_instructions
      };

      console.log("Submitting order data:", orderData);
      
      // Insert order into orders table
      const { data: orderData2, error: orderError } = await supabase
        .from("orders")
        .insert(orderData)
        .select('id, order_number')
        .single();
      
      if (orderError) throw orderError;
      
      // Prepare component data for insertion
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

        // Fixed: Changed table name from "components" to "order_components" and adjusted field names
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
      
      // Navigate to the order detail page
      navigate(`/orders/${orderData2.id}`);
      
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
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => navigate("/orders")}
            className="gap-1"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">New Order</h1>
            <p className="text-muted-foreground">Create a new order for production</p>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <OrderDetailsForm 
          formData={orderDetails}
          handleOrderChange={handleOrderChange}
          onProductSelect={handleProductSelect}
        />
        
        <Card>
          <CardHeader>
            <CardTitle>Bag Components</CardTitle>
            <CardDescription>Specify the details for each component of the bag</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="space-y-6">
                <h2 className="text-lg font-medium">Standard Components</h2>
                <div className="divide-y divide-border">
                  <ComponentForm
                    title="Part"
                    component={components.part || { type: "part", width: "", length: "", color: "", gsm: "" }}
                    index={0}
                    componentOptions={componentOptions}
                    onChange={(field, value) => handleComponentChange("part", field, value)}
                    handleChange={() => {}}
                  />
                  
                  <ComponentForm
                    title="Border"
                    component={components.border || { type: "border", width: "", length: "", color: "", gsm: "" }}
                    index={1}
                    componentOptions={componentOptions}
                    onChange={(field, value) => handleComponentChange("border", field, value)}
                    handleChange={() => {}}
                  />
                  
                  <ComponentForm
                    title="Handle"
                    component={components.handle || { type: "handle", width: "", length: "", color: "", gsm: "" }}
                    index={2}
                    componentOptions={componentOptions}
                    onChange={(field, value) => handleComponentChange("handle", field, value)}
                    handleChange={() => {}}
                  />
                  
                  <ComponentForm
                    title="Chain"
                    component={components.chain || { type: "chain", width: "", length: "", color: "", gsm: "" }}
                    index={3}
                    componentOptions={componentOptions}
                    onChange={(field, value) => handleComponentChange("chain", field, value)}
                    handleChange={() => {}}
                  />
                  
                  <ComponentForm
                    title="Runner"
                    component={components.runner || { type: "runner", width: "", length: "", color: "", gsm: "" }}
                    index={4}
                    componentOptions={componentOptions}
                    onChange={(field, value) => handleComponentChange("runner", field, value)}
                    handleChange={() => {}}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium">Custom Components</h2>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={addCustomComponent}
                  >
                    <Plus size={16} />
                    Add Custom Component
                  </Button>
                </div>
                
                <CustomComponentSection
                  customComponents={customComponents}
                  componentOptions={componentOptions}
                  handleCustomComponentChange={handleCustomComponentChange}
                  removeCustomComponent={removeCustomComponent}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex justify-end gap-2">
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
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default OrderNew;
