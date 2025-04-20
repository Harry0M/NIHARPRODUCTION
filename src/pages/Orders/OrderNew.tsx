
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ArrowLeft, Plus, Trash } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

// Define the component options for dropdowns
const componentOptions = {
  size: ["S", "M", "L", "XL", "XXL", "Custom"],
  color: ["Red", "Blue", "Green", "Black", "White", "Yellow", "Brown", "Orange", "Purple", "Gray", "Custom"],
  gsm: ["70", "80", "90", "100", "120", "140", "160", "180", "200", "250", "300", "Custom"]
};

interface ComponentData {
  type: string;
  size: string;
  color: string;
  gsm: string;
  details?: string;
}

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
    { type: "part", size: "", color: "", gsm: "" },
    { type: "border", size: "", color: "", gsm: "" },
    { type: "handle", size: "", color: "", gsm: "" },
    { type: "chain", size: "", color: "", gsm: "" },
    { type: "runner", size: "", color: "", gsm: "" }
  ]);
  
  const [customComponents, setCustomComponents] = useState<ComponentData[]>([]);

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
    setCustomComponents(prev => [...prev, { type: "custom", size: "", color: "", gsm: "", details: "" }]);
  };

  const removeCustomComponent = (index: number) => {
    setCustomComponents(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!formData.company_name) return "Company name is required";
    if (!formData.quantity || parseInt(formData.quantity) <= 0) return "Valid quantity is required";
    if (!formData.bag_length || parseFloat(formData.bag_length) <= 0) return "Valid bag length is required";
    if (!formData.bag_width || parseFloat(formData.bag_width) <= 0) return "Valid bag width is required";
    
    // Check if at least one component has values
    const hasAnyComponentData = components.some(comp => comp.size || comp.color || comp.gsm);
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
      // Insert the order first - note we removed order_number since it's auto-generated
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          company_name: formData.company_name,
          quantity: parseInt(formData.quantity),
          bag_length: parseFloat(formData.bag_length),
          bag_width: parseFloat(formData.bag_width),
          rate: formData.rate ? parseFloat(formData.rate) : null,
          special_instructions: formData.special_instructions || null,
        })
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      // Then insert all components
      const allComponents = [
        ...components.filter(comp => comp.size || comp.color || comp.gsm),
        ...customComponents.filter(comp => comp.size || comp.color || comp.gsm)
      ];

      if (allComponents.length > 0) {
        const componentsToInsert = allComponents.map(comp => ({
          order_id: orderData.id,
          type: comp.type as Database["public"]["Enums"]["component_type"],
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
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
            <CardDescription>Enter the basic information for this order</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input 
                  id="company_name" 
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleOrderChange}
                  placeholder="Client company name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Order Quantity</Label>
                <Input 
                  id="quantity" 
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleOrderChange}
                  placeholder="Number of bags"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bag_length">Bag Length (inches)</Label>
                <Input 
                  id="bag_length" 
                  name="bag_length"
                  type="number"
                  step="0.01"
                  value={formData.bag_length}
                  onChange={handleOrderChange}
                  placeholder="Length in inches"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bag_width">Bag Width (inches)</Label>
                <Input 
                  id="bag_width" 
                  name="bag_width"
                  type="number"
                  step="0.01"
                  value={formData.bag_width}
                  onChange={handleOrderChange}
                  placeholder="Width in inches"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rate">Rate per Bag (optional)</Label>
                <Input 
                  id="rate" 
                  name="rate"
                  type="number"
                  step="0.01"
                  value={formData.rate}
                  onChange={handleOrderChange}
                  placeholder="Price per bag"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="special_instructions">Special Instructions (optional)</Label>
              <Textarea 
                id="special_instructions" 
                name="special_instructions"
                value={formData.special_instructions}
                onChange={handleOrderChange}
                placeholder="Any additional notes or requirements"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

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
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Size</Label>
                      <Select 
                        value={component.size} 
                        onValueChange={(value) => handleComponentChange(index, 'size', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Not Applicable</SelectItem>
                          {componentOptions.size.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <Select 
                        value={component.color} 
                        onValueChange={(value) => handleComponentChange(index, 'color', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select color" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Not Applicable</SelectItem>
                          {componentOptions.color.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>GSM</Label>
                      <Select 
                        value={component.gsm} 
                        onValueChange={(value) => handleComponentChange(index, 'gsm', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select GSM" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Not Applicable</SelectItem>
                          {componentOptions.gsm.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
              
              {customComponents.map((component, index) => (
                <div key={`custom-${index}`} className="p-4 border rounded-md space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Custom Component</h3>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeCustomComponent(index)}
                    >
                      <Trash size={16} className="text-destructive" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label>Details</Label>
                    <Input 
                      placeholder="Component description" 
                      value={component.details || ''}
                      onChange={(e) => handleCustomComponentChange(index, 'details', e.target.value)}
                    />
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Size</Label>
                      <Select 
                        value={component.size} 
                        onValueChange={(value) => handleCustomComponentChange(index, 'size', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Not Applicable</SelectItem>
                          {componentOptions.size.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <Select 
                        value={component.color} 
                        onValueChange={(value) => handleCustomComponentChange(index, 'color', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select color" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Not Applicable</SelectItem>
                          {componentOptions.color.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>GSM</Label>
                      <Select 
                        value={component.gsm} 
                        onValueChange={(value) => handleCustomComponentChange(index, 'gsm', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select GSM" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Not Applicable</SelectItem>
                          {componentOptions.gsm.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                className="w-full flex items-center justify-center gap-1"
                onClick={addCustomComponent}
              >
                <Plus size={16} />
                Add Custom Component
              </Button>
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
