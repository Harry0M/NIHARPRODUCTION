
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { OrderDetailsForm } from "@/components/orders/OrderDetailsForm";
import { ComponentForm } from "@/components/orders/ComponentForm";
import { CustomComponentSection } from "@/components/orders/CustomComponentSection";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Define component types for our order form
export type ComponentType = "part" | "border" | "handle" | "chain" | "runner" | "custom";
export type CustomComponent = {
  id: string;
  type: ComponentType;
  customName?: string;
  size?: string;
  color?: string;
  gsm?: string;
};

const OrderNew = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  
  // Order details state
  const [orderDetails, setOrderDetails] = useState({
    company_name: "",
    quantity: "",
    bag_length: "",
    bag_width: "",
    rate: "",
    special_instructions: "",
    order_date: new Date().toISOString().split('T')[0],
  });

  // Standard components state
  const [components, setComponents] = useState<{
    part?: CustomComponent;
    border?: CustomComponent;
    handle?: CustomComponent;
    chain?: CustomComponent;
    runner?: CustomComponent;
  }>({});

  // Custom added components state
  const [customComponents, setCustomComponents] = useState<CustomComponent[]>([]);

  const handleOrderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setOrderDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleComponentChange = (type: ComponentType, field: string, value: string) => {
    setComponents((prev) => {
      const component = prev[type] || { id: uuidv4(), type };
      return {
        ...prev,
        [type]: {
          ...component,
          [field]: value,
        },
      };
    });
  };

  const handleCustomComponentChange = (index: number, field: string, value: string) => {
    setCustomComponents((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addCustomComponent = () => {
    setCustomComponents([
      ...customComponents,
      { id: uuidv4(), type: "custom", customName: "" },
    ]);
  };

  const removeCustomComponent = (index: number) => {
    setCustomComponents((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const { company_name, quantity, bag_length, bag_width } = orderDetails;
    if (!company_name || !quantity || !bag_length || !bag_width) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required order details",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Insert order into orders table
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          company_name,
          quantity: parseInt(quantity),
          bag_length: parseFloat(bag_length),
          bag_width: parseFloat(bag_width),
          rate: orderDetails.rate ? parseFloat(orderDetails.rate) : null,
          order_date: orderDetails.order_date,
          special_instructions: orderDetails.special_instructions,
        })
        .select('id, order_number')
        .single();

      if (orderError) throw orderError;

      // Prepare component data for insertion
      const allComponents = [
        ...Object.values(components).filter(Boolean),
        ...customComponents,
      ].filter(Boolean);
      
      if (allComponents.length > 0) {
        const componentsToInsert = allComponents.map(comp => ({
          order_id: orderData.id,
          type: comp.type === 'custom' ? (comp.customName || 'custom') : comp.type,
          size: comp.size || null,
          color: comp.color || null,
          gsm: comp.gsm || null,
          custom_name: comp.type === 'custom' ? comp.customName : null
        }));

        const { error: componentsError } = await supabase
          .from("components")
          .insert(componentsToInsert);

        if (componentsError) {
          console.error("Error saving components:", componentsError);
          toast({
            title: "Error saving components",
            description: componentsError.message,
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Order created successfully",
        description: `Order number: ${orderData.order_number}`,
      });

      // Navigate to the order detail page
      navigate(`/orders/${orderData.id}`);
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast({
        title: "Error creating order",
        description: error.message,
        variant: "destructive",
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
        />

        <div className="grid grid-cols-1 gap-6">
          <h2 className="text-lg font-medium">Standard Components</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ComponentForm
              title="Part"
              component={components.part || { id: uuidv4(), type: "part" }}
              onChange={(field, value) => handleComponentChange("part", field, value)}
            />
            <ComponentForm
              title="Border"
              component={components.border || { id: uuidv4(), type: "border" }}
              onChange={(field, value) => handleComponentChange("border", field, value)}
            />
            <ComponentForm
              title="Handle"
              component={components.handle || { id: uuidv4(), type: "handle" }}
              onChange={(field, value) => handleComponentChange("handle", field, value)}
            />
            <ComponentForm
              title="Chain"
              component={components.chain || { id: uuidv4(), type: "chain" }}
              onChange={(field, value) => handleComponentChange("chain", field, value)}
            />
            <ComponentForm
              title="Runner"
              component={components.runner || { id: uuidv4(), type: "runner" }}
              onChange={(field, value) => handleComponentChange("runner", field, value)}
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
            components={customComponents}
            onChange={handleCustomComponentChange}
            onRemove={removeCustomComponent}
          />
        </div>

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
      </form>
    </div>
  );
};

export default OrderNew;
