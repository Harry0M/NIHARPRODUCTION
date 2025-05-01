
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { ComponentForm, ComponentProps } from "@/components/orders/ComponentForm";

export type CustomComponent = ComponentProps;

interface CustomComponentSectionProps {
  customComponents?: CustomComponent[];
  components?: CustomComponent[];
  componentOptions: {
    color: string[];
    gsm: string[];
  };
  handleCustomComponentChange?: (index: number, field: string, value: string) => void;
  removeCustomComponent?: (index: number) => void;
  onChange?: (index: number, field: string, value: string) => void;
  onRemove?: (index: number) => void;
  defaultQuantity?: string;
}

export function CustomComponentSection({
  customComponents,
  components,
  componentOptions,
  handleCustomComponentChange,
  removeCustomComponent,
  onChange,
  onRemove,
  defaultQuantity
}: CustomComponentSectionProps) {
  // Use either components or customComponents based on which is provided
  const componentsToRender = components || customComponents || [];
  
  if (!componentsToRender.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No custom components added yet.
      </div>
    );
  }

  // Use the appropriate change handlers based on which props were provided
  const handleChange = onChange || handleCustomComponentChange;
  const handleRemove = onRemove || removeCustomComponent;

  return (
    <div className="space-y-6">
      {componentsToRender.map((component, index) => (
        <div key={component.id} className="bg-muted/50 rounded-lg p-4 relative">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2 h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => handleRemove && handleRemove(index)}
          >
            <Trash2 size={18} />
            <span className="sr-only">Remove component</span>
          </Button>
          <ComponentForm
            component={component}
            index={index}
            isCustom
            componentOptions={componentOptions}
            handleChange={handleChange || (() => {})}
            defaultQuantity={defaultQuantity}
          />
        </div>
      ))}
    </div>
  );
}
