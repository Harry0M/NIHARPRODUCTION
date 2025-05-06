
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MaterialLinkSelector } from "@/components/inventory/MaterialLinkSelector";

// Update the CustomComponent interface to use number for consumption
export interface CustomComponent {
  id: string;
  type: string;
  customName?: string;
  color?: string;
  length?: string;
  width?: string;
  roll_width?: string;
  material_id?: string;
  consumption?: number; // Changed to number type
}

interface CustomComponentSectionProps {
  customComponents: CustomComponent[];
  componentOptions: {
    color: string[];
  };
  handleCustomComponentChange: (index: number, field: string, value: string) => void;
  removeCustomComponent: (index: number) => void;
  defaultQuantity?: string;
  showConsumption?: boolean; // Added prop for showing consumption
  inventoryItems?: any[]; // Added prop for inventory items
}

export const CustomComponentSection = ({
  customComponents,
  componentOptions,
  handleCustomComponentChange,
  removeCustomComponent,
  defaultQuantity,
  showConsumption = false, // Default to false if not provided
  inventoryItems = [] // Default to empty array if not provided
}: CustomComponentSectionProps) => {
  return (
    <div className="space-y-4">
      {customComponents.map((component, index) => (
        <div key={component.id} className="border rounded-md p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`customName-${index}`}>Component Name</Label>
              <Input
                type="text"
                id={`customName-${index}`}
                value={component.customName || ""}
                onChange={(e) => handleCustomComponentChange(index, "customName", e.target.value)}
                placeholder="Enter component name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`color-${index}`}>Color</Label>
              <Select onValueChange={(value) => handleCustomComponentChange(index, "color", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a color" defaultValue={component.color || ""} />
                </SelectTrigger>
                <SelectContent>
                  {componentOptions.color.map((color) => (
                    <SelectItem key={color} value={color}>
                      {color}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`length-${index}`}>Length (inches)</Label>
              <Input
                type="number"
                id={`length-${index}`}
                value={component.length || ""}
                onChange={(e) => handleCustomComponentChange(index, "length", e.target.value)}
                placeholder="Enter length"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`width-${index}`}>Width (inches)</Label>
              <Input
                type="number"
                id={`width-${index}`}
                value={component.width || ""}
                onChange={(e) => handleCustomComponentChange(index, "width", e.target.value)}
                placeholder="Enter width"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`roll_width-${index}`}>Roll Width (inches)</Label>
              <Input
                type="number"
                id={`roll_width-${index}`}
                value={component.roll_width || ""}
                onChange={(e) => handleCustomComponentChange(index, "roll_width", e.target.value)}
                placeholder="Enter roll width"
                step="0.01"
              />
            </div>
          </div>
          
          {showConsumption && component.consumption !== undefined && (
            <div className="space-y-2">
              <Label htmlFor={`consumption-${index}`}>Consumption</Label>
              <Input
                type="number"
                id={`consumption-${index}`}
                value={component.consumption.toFixed(2) || ""}
                placeholder="Consumption"
                readOnly
                className="bg-muted"
              />
            </div>
          )}
          
          <MaterialLinkSelector
            inventoryItems={inventoryItems}
            selectedMaterialId={component.material_id}
            onMaterialSelect={(materialId) => handleCustomComponentChange(index, "material_id", materialId || "")}
          />

          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => removeCustomComponent(index)}
          >
            <Trash2 size={16} />
            Remove
          </Button>
        </div>
      ))}
    </div>
  );
};
