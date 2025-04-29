
import { Card, CardContent } from "@/components/ui/card";
import { ComponentForm } from "@/components/orders/ComponentForm";

interface StandardComponentsProps {
  components: Record<string, any>;
  componentOptions: {
    color: string[];
    gsm: string[];
  };
  onChange: (type: string, field: string, value: string) => void;
}

export function StandardComponents({ components, componentOptions, onChange }: StandardComponentsProps) {
  const componentTypes = ["part", "border", "handle", "chain", "runner"];
  
  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <h2 className="text-lg font-medium">Standard Components</h2>
        <div className="divide-y divide-border">
          {componentTypes.map((type, index) => (
            <ComponentForm
              key={type}
              title={type.charAt(0).toUpperCase() + type.slice(1)}
              component={components[type] || { 
                type, 
                width: "", 
                length: "", 
                color: "", 
                gsm: "",
                material_id: "",
                roll_width: "",
                consumption: "" 
              }}
              index={index}
              componentOptions={componentOptions}
              onChange={(field, value) => onChange(type, field, value)}
              handleChange={() => {}}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
