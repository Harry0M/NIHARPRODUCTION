
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { WorkerSelection } from "@/components/production/WorkerSelection";
import { useCuttingJob } from "../contexts/CuttingJobContext";

export function CuttingDetailsForm() {
  const {
    cuttingData,
    handleInputChange,
    handleSelectChange,
    handleCheckboxChange,
    handleWorkerSelect,
    validationError
  } = useCuttingJob();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          onChange={handleInputChange}
          required
          className={`border-2 ${validationError ? 'border-destructive' : 'border-primary'} focus:ring-2 focus:ring-primary`}
          aria-required="true"
          aria-invalid={validationError ? "true" : "false"}
          aria-describedby={validationError ? "roll-width-error" : undefined}
        />
        {validationError && (
          <p id="roll-width-error" className="text-sm font-medium text-destructive mt-1">
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
          onChange={handleInputChange}
          placeholder="Material consumption"
        />
        <p className="text-xs text-muted-foreground">
          Calculated using: [(length×width)÷6339.39]×quantity
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="received_quantity">Received Quantity</Label>
        <Input 
          id="received_quantity" 
          name="received_quantity"
          type="text"
          placeholder="Final quantity after cutting"
          value={cuttingData.received_quantity}
          onChange={handleInputChange}
        />
      </div>

      <div className="flex items-center space-x-2 pt-8">
        <Checkbox 
          id="is_internal" 
          checked={cuttingData.is_internal}
          onCheckedChange={handleCheckboxChange}
        />
        <Label htmlFor="is_internal">Internal Cutting (In-house)</Label>
      </div>

      <div className="space-y-2">
        <WorkerSelection
          workerType={cuttingData.is_internal ? 'internal' : 'external'}
          serviceType="cutting"
          onWorkerSelect={handleWorkerSelect}
          selectedWorkerId={cuttingData.worker_name}
          label="Cutter Name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={cuttingData.status}
          onValueChange={(value: any) => handleSelectChange("status", value)}
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
  );
}
