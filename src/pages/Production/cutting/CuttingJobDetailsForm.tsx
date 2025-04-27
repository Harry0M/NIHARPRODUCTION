
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { VendorSelection } from "@/components/production/VendorSelection";
import { ConsumptionCalculator } from "@/components/production/ConsumptionCalculator";
import { JobStatus } from "@/types/production";

interface CuttingJobDetailsFormProps {
  cuttingData: {
    roll_width: string;
    consumption_meters: string;
    worker_name: string;
    is_internal: boolean;
    status: JobStatus;
    received_quantity: string;
  };
  validationError: string | null;
  orderInfo: {
    bag_length: number;
    bag_width: number;
    quantity: number;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCheckboxChange: (checked: boolean) => void;
  onSelectChange: (name: string, value: JobStatus) => void;
  onWorkerSelect: (workerId: string) => void;
  onConsumptionCalculated: (meters: number) => void;
}

export function CuttingJobDetailsForm({
  cuttingData,
  validationError,
  orderInfo,
  onInputChange,
  onCheckboxChange,
  onSelectChange,
  onWorkerSelect,
  onConsumptionCalculated
}: CuttingJobDetailsFormProps) {
  return (
    <Card className="w-full h-fit">
      <CardHeader className="space-y-1">
        <CardTitle>Cutting Details</CardTitle>
        <CardDescription>Enter details for the cutting process</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          <div className="space-y-2">
            <Label htmlFor="roll_width" className={`text-primary font-medium ${validationError ? 'text-destructive' : ''}`}>
              Roll Width (Required) *
            </Label>
            <Input 
              id="roll_width"
              name="roll_width"
              type="text"
              placeholder="Roll width in inches"
              value={cuttingData.roll_width}
              onChange={onInputChange}
              required
              className={`border-2 ${validationError ? 'border-destructive' : 'border-input'} focus:ring-2 focus:ring-primary`}
            />
            {validationError && (
              <p className="text-sm font-medium text-destructive mt-1">
                {validationError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="consumption_meters">Consumption (meters)</Label>
            <Input 
              id="consumption_meters"
              name="consumption_meters"
              type="text"
              value={cuttingData.consumption_meters}
              onChange={onInputChange}
              placeholder="Material consumption"
              className="border-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="received_quantity">Received Quantity</Label>
            <Input 
              id="received_quantity"
              name="received_quantity"
              type="text"
              placeholder="Final quantity after cutting"
              value={cuttingData.received_quantity}
              onChange={onInputChange}
              className="border-input"
            />
          </div>

          <div className="space-y-2">
            <Label>Worker Name</Label>
            <VendorSelection
              serviceType="cutting"
              value={cuttingData.worker_name}
              onChange={onWorkerSelect}
              placeholder="Select cutter or enter manually"
              className="w-full"
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox 
              id="is_internal"
              checked={cuttingData.is_internal}
              onCheckedChange={onCheckboxChange}
            />
            <Label htmlFor="is_internal">Internal Cutting (In-house)</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={cuttingData.status}
              onValueChange={(value) => onSelectChange("status", value as JobStatus)}
            >
              <SelectTrigger id="status" className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2 mt-4 bg-muted/30 p-4 rounded-lg">
            <ConsumptionCalculator
              length={orderInfo.bag_length}
              width={orderInfo.bag_width}
              quantity={orderInfo.quantity}
              onConsumptionCalculated={onConsumptionCalculated}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
