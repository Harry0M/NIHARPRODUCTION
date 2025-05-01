
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ComponentForm } from "@/components/orders/ComponentForm";
import { CustomComponent } from "./types";

interface ComponentsSectionProps {
  components: Record<string, any>;
  customComponents: CustomComponent[];
  handleComponentChange: (type: string, field: string, value: string) => void;
  handleCustomComponentChange: (index: number, field: string, value: string) => void;
  addCustomComponent: () => void;
  removeCustomComponent: (index: number) => void;
}

export function ComponentsSection({
  components,
  customComponents,
  handleComponentChange,
  handleCustomComponentChange,
  addCustomComponent,
  removeCustomComponent
}: ComponentsSectionProps) {
  // Default component options
  const componentOptions = {
    color: ["Red", "Blue", "Green", "Black", "White", "Yellow", "Brown", "Orange", "Purple", "Gray", "Custom"],
    gsm: ["70", "80", "90", "100", "120", "140", "160", "180", "200", "250", "300", "Custom"]
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
                component={components.part || { type: "part", width: "", length: "", color: "", material_id: "", roll_width: "", consumption: "" }}
                index={0}
                componentOptions={componentOptions}
                onChange={(field, value) => handleComponentChange("part", field, value)}
                handleChange={() => {}}
              />
              
              <ComponentForm
                title="Border"
                component={components.border || { type: "border", width: "", length: "", color: "", material_id: "", roll_width: "", consumption: "" }}
                index={1}
                componentOptions={componentOptions}
                onChange={(field, value) => handleComponentChange("border", field, value)}
                handleChange={() => {}}
              />
              
              <ComponentForm
                title="Handle"
                component={components.handle || { type: "handle", width: "", length: "", color: "", material_id: "", roll_width: "", consumption: "" }}
                index={2}
                componentOptions={componentOptions}
                onChange={(field, value) => handleComponentChange("handle", field, value)}
                handleChange={() => {}}
              />
              
              <ComponentForm
                title="Chain"
                component={components.chain || { type: "chain", width: "", length: "", color: "", material_id: "" }}
                index={3}
                componentOptions={componentOptions}
                onChange={(field, value) => handleComponentChange("chain", field, value)}
                handleChange={() => {}}
              />
              
              <ComponentForm
                title="Runner"
                component={components.runner || { type: "runner", width: "", length: "", color: "", material_id: "" }}
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
            
            {customComponents.length > 0 ? (
              <div className="space-y-4">
                {customComponents.map((component, index) => (
                  <div key={component.id} className="p-4 border rounded-md bg-muted/10">
                    <ComponentForm
                      title={`Custom Component: ${component.custom_name || "(unnamed)"}`}
                      component={{
                        ...component,
                        name: component.custom_name
                      }}
                      index={index}
                      isCustom={true}
                      componentOptions={componentOptions}
                      onChange={(field, value) => handleCustomComponentChange(index, field, value)}
                      onRemove={() => removeCustomComponent(index)}
                      handleChange={() => {}}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 border border-dashed rounded-md text-center text-muted-foreground">
                No custom components added yet
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
