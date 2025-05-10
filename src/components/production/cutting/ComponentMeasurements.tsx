
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ComponentMeasurementsProps {
  width: string;
  height: string;
  counter: string;
  rewinding: string;
  materialName?: string;
  rollWidth?: string;
  consumption?: string;
  onMeasurementChange: (field: string, value: string) => void;
}

export function ComponentMeasurements({
  width,
  height,
  counter,
  rewinding,
  materialName,
  rollWidth,
  consumption,
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
      
      {(rollWidth || consumption) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 p-2 bg-slate-50 rounded-md">
          {rollWidth && (
            <div>
              <Label className="text-sm text-muted-foreground">Roll Width</Label>
              <p className="font-medium">{rollWidth}</p>
            </div>
          )}
          {consumption && (
            <div>
              <Label className="text-sm text-muted-foreground">Consumption</Label>
              <p className="font-medium">{consumption}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
