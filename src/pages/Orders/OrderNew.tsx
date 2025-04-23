import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ComponentForm, ComponentProps } from "@/components/orders/ComponentForm";
import { CustomComponentSection, CustomComponent } from "@/components/orders/CustomComponentSection";
import { orderSchema } from "@/lib/validations/order";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";
import { OrderDetailsForm } from "@/components/orders/OrderDetailsForm";
import { z } from "zod";

const OrderNew = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    company_name: "",
    quantity: "",
    bag_length: "",
    bag_width: "",
    rate: "",
    special_instructions: "",
  });

  const [part, setPart] = useState<ComponentProps>({
    type: "part",
    width: "",
    length: "",
    color: "",
    gsm: "",
  });

  const [border, setBorder] = useState<ComponentProps>({
    type: "border",
    width: "",
    length: "",
    color: "",
    gsm: "",
  });

  const [handle, setHandle] = useState<ComponentProps>({
    type: "handle",
    width: "",
    length: "",
    color: "",
    gsm: "",
  });

  const [chain, setChain] = useState<ComponentProps>({
    type: "chain",
    width: "",
    length: "",
    color: "",
    gsm: "",
  });

  const [runner, setRunner] = useState<ComponentProps>({
    type: "runner",
    width: "",
    length: "",
    color: "",
    gsm: "",
  });

  const [customComponents, setCustomComponents] = useState<CustomComponent[]>([]);

  const componentOptions = {
    color: ["White", "Black", "Red", "Blue", "Green", "Yellow"],
    gsm: ["80", "100", "120", "150", "180", "200", "250"]
  };

  const handleOrderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePartChange = (field: string, value: string) => {
    setPart(prev => ({ ...prev, [field]: value }));
  };

  const handleBorderChange = (field: string, value: string) => {
    setBorder(prev => ({ ...prev, [field]: value }));
  };

  const handleHandleChange = (field: string, value: string) => {
    setHandle(prev => ({ ...prev, [field]: value }));
  };

  const handleChainChange = (field: string, value: string) => {
    setChain(prev => ({ ...prev, [field]: value }));
  };

  const handleRunnerChange = (field: string, value: string) => {
    setRunner(prev => ({ ...prev, [field]: value }));
  };

  const handleCustomComponentChange = (index: number, field: string, value: string) => {
    const updatedComponents = [...customComponents];
    updatedComponents[index] = { ...updatedComponents[index], [field]: value };
    setCustomComponents(updatedComponents);
  };

  const removeCustomComponent = (index: number) => {
    const updatedComponents = [...customComponents];
    updatedComponents.splice(index, 1);
    setCustomComponents(updatedComponents);
  };

  const addCustomComponent = () => {
    setCustomComponents(prev => [...prev, { id: Date.now().toString(), type: "custom" }]);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const parsedQuantity = parseInt(formData.quantity);
      const parsedBagLength = parseFloat(formData.bag_length);
      const parsedBagWidth = parseFloat(formData.bag_width);
      const parsedRate = parseFloat(formData.rate);

      if (isNaN(parsedQuantity) || isNaN(parsedBagLength) || isNaN(parsedBagWidth)) {
        toast({
          title: "Error",
          description: "Quantity, Bag Length, and Bag Width must be valid numbers.",
          variant: "destructive",
        });
        return;
      }

      const newOrder = {
        ...formData,
        quantity: parsedQuantity,
        bag_length: parsedBagLength,
        bag_width: parsedBagWidth,
        rate: parsedRate || null,
        order_number: `ORD-${Date.now()}`,
        status: "pending",
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([newOrder])
        .select()

      if (error) {
        console.error("Error creating order:", error);
        toast({
          title: "Error",
          description: "Failed to create order. Please try again.",
          variant: "destructive",
        });
      } else {
        console.log("Order created successfully:", data);
        toast({
          title: "Success",
          description: "Order created successfully!",
        });
        navigate('/orders');
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">New Order</h1>
      </div>

      <div className="space-y-6">
        <OrderDetailsForm
          formData={formData}
          handleOrderChange={handleOrderChange}
        />

        <Card>
          <CardHeader>
            <CardTitle>Components</CardTitle>
            <CardDescription>Add the required components for this order</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ComponentForm
              component={part}
              index={0}
              title="Part"
              componentOptions={componentOptions}
              onChange={(field, value) => handlePartChange(field, value)}
            />

            <Separator />

            <ComponentForm
              component={border}
              index={0}
              title="Border"
              componentOptions={componentOptions}
              onChange={(field, value) => handleBorderChange(field, value)}
            />

            <Separator />

            <ComponentForm
              component={handle}
              index={0}
              title="Handle"
              componentOptions={componentOptions}
              onChange={(field, value) => handleHandleChange(field, value)}
            />

            <Separator />

            <ComponentForm
              component={chain}
              index={0}
              title="Chain"
              componentOptions={componentOptions}
              onChange={(field, value) => handleChainChange(field, value)}
            />

            <Separator />

            <ComponentForm
              component={runner}
              index={0}
              title="Runner"
              componentOptions={componentOptions}
              onChange={(field, value) => handleRunnerChange(field, value)}
            />

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Custom Components</h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={addCustomComponent}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Component
                </Button>
              </div>
              <CustomComponentSection
                components={customComponents}
                componentOptions={componentOptions}
                onChange={handleCustomComponentChange}
                onRemove={removeCustomComponent}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate('/orders')}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Order"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderNew;
