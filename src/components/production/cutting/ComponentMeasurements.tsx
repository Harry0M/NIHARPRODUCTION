
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ComponentMeasurementsProps {
  width: string;
  height: string;
  counter: string;
  rewinding: string;
  onMeasurementChange: (field: string, value: string) => void;
}

export function ComponentMeasurements({
  width,
  height,
  counter,
  rewinding,
  onMeasurementChange
}: ComponentMeasurementsProps) {
  return (
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
          value={height}
          onChange={(e) => onMeasurementChange("height", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Counter</Label>
        <Input
          type="text"
          placeholder="Counter"
          value={counter}
          onChange={(e) => onMeasurementChange("counter", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Rewinding</Label>
        <Input
          type="text"
          placeholder="Rewinding"
          value={rewinding}
          onChange={(e) => onMeasurementChange("rewinding", e.target.value)}
        />
      </div>
    </div>
  );
}
