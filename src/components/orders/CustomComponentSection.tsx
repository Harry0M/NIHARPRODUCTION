
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { ComponentForm, ComponentProps } from "@/components/orders/ComponentForm";

export type CustomComponent = ComponentProps;

interface CustomComponentSectionProps {
  customComponents: CustomComponent[];
  componentOptions: {
    color: string[];
    gsm: string[];
  };
  handleCustomComponentChange: (index: number, field: string, value: string) => void;
  removeCustomComponent: (index: number) => void;
  defaultQuantity?: string;
}

export function CustomComponentSection({
  customComponents,
  componentOptions,
  handleCustomComponentChange,
  removeCustomComponent,
  defaultQuantity
}: CustomComponentSectionProps) {
  if (!customComponents.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No custom components added yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {customComponents.map((component, index) => (
        <div key={component.id} className="bg-muted/50 rounded-lg p-4 relative">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2 h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => removeCustomComponent(index)}
          >
            <Trash2 size={18} />
            <span className="sr-only">Remove component</span>
          </Button>
          <ComponentForm
            component={component}
            index={index}
            isCustom
            componentOptions={componentOptions}
            handleChange={handleCustomComponentChange}
            defaultQuantity={defaultQuantity}
          />
        </div>
      ))}
    </div>
  );
}
