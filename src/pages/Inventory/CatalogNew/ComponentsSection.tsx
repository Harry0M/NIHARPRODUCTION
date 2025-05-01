import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ComponentForm } from "@/components/orders/ComponentForm";
import { Component } from "./types";

interface ComponentsSectionProps {
  components: Record<string, any>;
  customComponents: Component[];
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
        <CardTitle>Components</CardTitle>
        <CardDescription>
          Define the bag components (part, border, handle, etc.)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible defaultValue="part" className="space-y-4">
          {Object.keys(components).map((type) => (
            <ComponentForm
              key={type}
              component={components[type]}
              index={0}
              componentOptions={componentOptions}
              title={type.charAt(0).toUpperCase() + type.slice(1)}
              onChange={(field, value) => handleComponentChange(type, field, value)}
            />
          ))}
        </Accordion>

        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Custom Components</h3>
            <Button type="button" variant="outline" size="sm" onClick={addCustomComponent}>
              <Plus size={16} className="mr-2" />
              Add Component
            </Button>
          </div>

          {customComponents.length > 0 ? (
            <div className="space-y-6">
              {customComponents.map((comp, index) => (
                <ComponentForm
                  key={comp.id}
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
            <div className="text-center p-8 border border-dashed rounded-lg">
              <p className="text-muted-foreground">No custom components added yet.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
