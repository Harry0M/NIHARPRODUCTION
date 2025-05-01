
import { Card, CardContent } from "@/components/ui/card";
import { ComponentForm } from "@/components/orders/ComponentForm";

interface StandardComponentsProps {
  components: Record<string, any>;
  componentOptions?: {
    color: string[];
    gsm: string[];
  };
  onChange?: (type: string, field: string, value: string) => void;
  handleComponentChange?: (type: string, field: string, value: string) => void;
}

export function StandardComponents({ 
  components, 
  componentOptions = { 
    color: ["White", "Black", "Red", "Blue", "Green", "Yellow"],
    gsm: ["80", "100", "120", "150", "180", "200", "250"]
  }, 
  onChange,
  handleComponentChange
}: StandardComponentsProps) {
  const componentTypes = ["part", "border", "handle", "chain", "runner"];
  
  // Use either onChange or handleComponentChange (for backward compatibility)
  const handleChange = onChange || handleComponentChange;
  
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
              onChange={(field, value) => handleChange && handleChange(type, field, value)}
              handleChange={() => {}}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
