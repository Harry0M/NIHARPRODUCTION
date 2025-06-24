
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VendorSelection } from "@/components/production/VendorSelection";
import { JobStatus } from "@/types/production";

interface CuttingDetailsFormProps {
  cuttingData: {
    worker_name: string;
    is_internal: boolean;
    status: JobStatus;
    received_quantity: string;
    vendor_id?: string | null;
  };
  validationError?: string | null;
  orderInfo: {
    bag_length: number;
    bag_width: number;
    quantity: number;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCheckboxChange: (checked: boolean) => void;
  onSelectChange: (name: string, value: JobStatus) => void;
  onWorkerSelect: (value: string) => void;
  onVendorIdChange?: (vendorId: string | null) => void;
}

export function CuttingDetailsForm({
  cuttingData,
  validationError,
  orderInfo,
  onInputChange,
  onCheckboxChange,
  onSelectChange,
  onWorkerSelect,
  onVendorIdChange
}: CuttingDetailsFormProps) {
  return (
    <Card className="md:col-span-3">
      <CardHeader>
        <CardTitle>Cutting Details</CardTitle>
        <CardDescription>Enter details for the cutting process</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="received_quantity">Received Quantity</Label>
            <Input 
              id="received_quantity" 
              name="received_quantity"
              type="text"
              placeholder="Final quantity after cutting"
              value={cuttingData.received_quantity}
              onChange={onInputChange}
            />
          </div>

          <div className="flex items-center space-x-2 pt-8">
            <Checkbox 
              id="is_internal" 
              checked={cuttingData.is_internal}
              onCheckedChange={onCheckboxChange}
            />
            <Label htmlFor="is_internal">Internal Cutting (In-house)</Label>
          </div>

          <div className="space-y-2">
            <Label>Worker Name</Label>            <VendorSelection
              serviceType="cutting"
              value={cuttingData.worker_name}
              onChange={onWorkerSelect}
              onVendorIdChange={onVendorIdChange}
              placeholder="Select cutter or enter manually"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={cuttingData.status}
              onValueChange={(value: JobStatus) => onSelectChange("status", value)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
