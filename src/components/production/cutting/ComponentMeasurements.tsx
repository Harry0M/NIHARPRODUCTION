
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ComponentMeasurementsProps {
  width: string;
  height: string;
  counter: string;
  rewinding: string;
  roll_width: string;  // Changed to component-specific roll_width
  consumption: string;  // Changed to component-specific consumption
  materialName?: string;
  onMeasurementChange: (field: string, value: string) => void;
}

export function ComponentMeasurements({
  width,
  height,
  counter,
  rewinding,
  roll_width,
  consumption,
  materialName,
  onMeasurementChange
}: ComponentMeasurementsProps) {
  return (
    <div className="space-y-4">
      {materialName && (
        <div className="p-2 bg-slate-50 rounded-md">
          <Label className="text-sm text-muted-foreground">Material</Label>
          <p className="font-medium">{materialName}</p>
        </div>
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Width</Label>
          <Input
            type="text"
            placeholder="Width"
            value={width}
            onChange={(e) => onMeasurementChange("width", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Height</Label>
          <Input
            type="text"
            placeholder="Height"
            onChange={(e) => onMeasurementChange("height", e.target.value)}
            value={height}
          />
        </div>
        <div className="space-y-2">
          <Label>Counter</Label>
          <Input
            type="text"
            placeholder="Counter (any value)"
            value={counter}
            onChange={(e) => onMeasurementChange("counter", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Rewinding</Label>
          <Input
            type="text"
            placeholder="Rewinding (any value)"
            value={rewinding}
            onChange={(e) => onMeasurementChange("rewinding", e.target.value)}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Roll Width</Label>
          <Input
            type="text"
            placeholder="Roll width"
            value={roll_width}
            onChange={(e) => onMeasurementChange("roll_width", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Consumption</Label>
          <Input
            type="text"
            placeholder="Material consumption"
            value={consumption}
            onChange={(e) => onMeasurementChange("consumption", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
