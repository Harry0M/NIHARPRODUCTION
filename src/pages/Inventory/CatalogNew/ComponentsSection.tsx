
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ComponentForm } from "@/components/orders/ComponentForm";
import { Component, CustomComponent } from "./types";

interface ComponentsSectionProps {
  components: Record<string, Component>;
  customComponents: CustomComponent[];
  handleComponentChange: (type: string, field: string, value: string) => void;
  handleCustomComponentChange: (index: number, field: string, value: string) => void;
  addCustomComponent: () => void;
  removeCustomComponent: (index: number) => void;
}

export const ComponentsSection = ({
  components,
  customComponents,
  handleComponentChange,
  handleCustomComponentChange,
  addCustomComponent,
  removeCustomComponent
}: ComponentsSectionProps) => {
  const componentOptions = {
    color: ["red", "green", "blue", "yellow", "black", "white"],
    gsm: ["80", "120", "150", "200", "250", "300"],
  };

  return (
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
              {["part", "border", "handle", "chain", "runner"].map((type) => (
                <ComponentForm
                  key={type}
                  title={type.charAt(0).toUpperCase() + type.slice(1)}
                  component={components[type] || { 
                    id: "", 
                    type: type as Component["type"],
                    width: "", 
                    length: "", 
                    color: "", 
                    gsm: "", 
                    material_id: "", 
                    roll_width: "", 
                    consumption: "" 
                  }}
                  index={0}
                  componentOptions={componentOptions}
                  onChange={(field, value) => handleComponentChange(type, field, value)}
                  handleChange={() => {}}
                />
              ))}
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
            
            {customComponents.length > 0 ? (
              <div className="space-y-6">
                {customComponents.map((comp, index) => (
                  <ComponentForm
                    key={comp.id}
                    title={comp.custom_name || `Custom ${index + 1}`}
                    component={comp}
                    index={index}
                    isCustom={true}
                    componentOptions={componentOptions}
                    onChange={(field, value) => handleCustomComponentChange(index, field, value)}
                    onRemove={() => removeCustomComponent(index)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center p-6 border border-dashed rounded-md">
                <p className="text-muted-foreground">No custom components added</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
