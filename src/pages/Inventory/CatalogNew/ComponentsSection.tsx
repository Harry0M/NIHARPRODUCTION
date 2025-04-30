
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ComponentForm } from "@/components/orders/ComponentForm";
import { CustomComponentSection } from "@/components/orders/CustomComponentSection";
import { Component, CustomComponent, ComponentOptions } from "./types";

const componentOptions: ComponentOptions = {
  color: ["Red", "Blue", "Green", "Black", "White", "Yellow", "Brown", "Orange", "Purple", "Gray", "Custom"],
  gsm: ["70", "80", "90", "100", "120", "140", "160", "180", "200", "250", "300", "Custom"]
};

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
  // Helper function to convert component types for compatibility
  const convertToComponentProps = (component: any) => {
    return {
      id: component.id || "",
      type: component.type || component.component_type || "",
      width: component.width || "",
      length: component.length || "",
      color: component.color || "",
      material_id: component.material_id || "",
      roll_width: String(component.roll_width || ""),
      consumption: String(component.consumption || "")
    };
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
              <ComponentForm
                title="Part"
                component={convertToComponentProps(components.part || { type: "part", width: "", length: "", color: "", material_id: "", roll_width: "", consumption: "" })}
                index={0}
                componentOptions={componentOptions}
                onChange={(field, value) => handleComponentChange("part", field, value)}
                handleChange={() => {}}
              />
              
              <ComponentForm
                title="Border"
                component={convertToComponentProps(components.border || { type: "border", width: "", length: "", color: "", material_id: "", roll_width: "", consumption: "" })}
                index={1}
                componentOptions={componentOptions}
                onChange={(field, value) => handleComponentChange("border", field, value)}
                handleChange={() => {}}
              />
              
              <ComponentForm
                title="Handle"
                component={convertToComponentProps(components.handle || { type: "handle", width: "", length: "", color: "", material_id: "", roll_width: "", consumption: "" })}
                index={2}
                componentOptions={componentOptions}
                onChange={(field, value) => handleComponentChange("handle", field, value)}
                handleChange={() => {}}
              />
              
              <ComponentForm
                title="Chain"
                component={convertToComponentProps(components.chain || { type: "chain", width: "", length: "", color: "", material_id: "" })}
                index={3}
                componentOptions={componentOptions}
                onChange={(field, value) => handleComponentChange("chain", field, value)}
                handleChange={() => {}}
              />
              
              <ComponentForm
                title="Runner"
                component={convertToComponentProps(components.runner || { type: "runner", width: "", length: "", color: "", material_id: "" })}
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
              components={customComponents.map(c => ({
                ...c,
                customName: c.custom_name || c.customName || "",
                roll_width: String(c.roll_width || ""),
                consumption: String(c.consumption || "")
              }))}
              onChange={handleCustomComponentChange}
              onRemove={removeCustomComponent}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
