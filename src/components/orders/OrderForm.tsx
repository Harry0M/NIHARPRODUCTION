
import * as React from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { StandardComponents } from "./StandardComponents";
import { CustomComponentSection, type CustomComponent } from "./CustomComponentSection";

interface OrderFormProps {
  onSubmit: (data: any) => void;
}

export function OrderForm({ onSubmit }: OrderFormProps) {
  const [customComponents, setCustomComponents] = React.useState<CustomComponent[]>([]);

  // Sample component options (these would typically come from your backend)
  const componentOptions = {
    color: ["White", "Black", "Red", "Blue", "Green"],
    gsm: ["80", "100", "120", "150", "180", "200", "250"]
  };

  const handleAddCustomComponent = () => {
    setCustomComponents([
      ...customComponents,
      { 
        id: crypto.randomUUID(),
        type: "custom",
        customName: "",
        width: "",
        length: "",
        color: "",
        gsm: ""
      }
    ]);
  };

  const handleCustomComponentChange = (index: number, field: string, value: string) => {
    const updatedComponents = [...customComponents];
    updatedComponents[index] = {
      ...updatedComponents[index],
      [field]: value
    };
    setCustomComponents(updatedComponents);
  };

  const removeCustomComponent = (index: number) => {
    setCustomComponents(customComponents.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-6">
        <div className="space-y-4">
          <FormItem>
            <FormLabel>Company Name</FormLabel>
            <FormControl>
              <Input placeholder="Enter company name" />
            </FormControl>
          </FormItem>

          <FormItem>
            <FormLabel>Order Quantity</FormLabel>
            <FormControl>
              <Input type="number" placeholder="Enter quantity" min="1" />
            </FormControl>
          </FormItem>

          <div className="grid grid-cols-2 gap-4">
            <FormItem>
              <FormLabel>Bag Length (inches)</FormLabel>
              <FormControl>
                <Input type="number" step="0.1" placeholder="Enter length" />
              </FormControl>
            </FormItem>
            <FormItem>
              <FormLabel>Bag Width (inches)</FormLabel>
              <FormControl>
                <Input type="number" step="0.1" placeholder="Enter width" />
              </FormControl>
            </FormItem>
          </div>

          <FormItem>
            <FormLabel>Order Date</FormLabel>
            <FormControl>
              <Input type="date" />
            </FormControl>
          </FormItem>
        </div>

        <div className="space-y-6">
          <StandardComponents 
            components={{}}
            componentOptions={componentOptions}
            onChange={() => {}}
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Custom Components</h2>
              <Button type="button" variant="outline" onClick={handleAddCustomComponent}>
                <Plus className="h-4 w-4 mr-2" />
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

        <FormItem>
          <FormLabel>Rate (per bag)</FormLabel>
          <FormControl>
            <Input type="number" step="0.01" placeholder="Enter rate per bag" />
          </FormControl>
        </FormItem>
      </div>
    </div>
  );
}
