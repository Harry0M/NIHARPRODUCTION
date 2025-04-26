
import { useParams } from "react-router-dom";
import { CuttingJobHeader } from "@/components/production/cutting/CuttingJobHeader";
import { CuttingJobOrderInfo } from "./CuttingJobOrderInfo";
import { CuttingJobSelection } from "./CuttingJobSelection";
import { CuttingJobComponentForm } from "./CuttingJobComponentForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { VendorSelection } from "@/components/production/VendorSelection";
import { useCuttingJob } from "@/hooks/use-cutting-job";

export default function CuttingJobForm() {
  const { id } = useParams();
  const {
    loading,
    submitting,
    jobCard,
    components,
    existingJobs,
    selectedJobId,
    cuttingData,
    componentData,
    validationError,
    handleInputChange,
    handleSelectChange,
    handleCheckboxChange,
    handleComponentChange,
    handleSelectJob,
    handleNewJob,
    handleSubmit
  } = useCuttingJob(id);

  const handleGoBack = () => {
    window.location.href = `/production/job-cards/${id}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!jobCard) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-2">Job Card Not Found</h2>
        <p className="mb-4">The job card you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={() => window.location.href = "/production/job-cards"}>
          Return to Job Cards
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CuttingJobHeader
        jobName={jobCard?.job_name}
        selectedJobId={selectedJobId}
        onBack={handleGoBack}
      />

      {existingJobs.length > 0 && (
        <CuttingJobSelection
          existingJobs={existingJobs.map(({ id, status }) => ({ id, status }))}
          selectedJobId={selectedJobId}
          handleSelectJob={handleSelectJob}
          handleNewJob={handleNewJob}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CuttingJobOrderInfo order={jobCard.order} />
        
        {/* Cutting details form */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Cutting Details</CardTitle>
            <CardDescription>Enter details for the cutting process</CardDescription>
          </CardHeader>
          <CardContent>
            <form id="cutting-form" onSubmit={handleSubmit} className="space-y-6">
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
                  <Label>Worker Name</Label>
                  <VendorSelection
                    serviceType="cutting"
                    value={cuttingData.worker_name}
                    onChange={(value) => handleInputChange({
                      target: { name: 'worker_name', value }
                    } as any)}
                    placeholder="Select cutter or enter manually"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={cuttingData.status}
                    onValueChange={(value) => handleSelectChange("status", value as any)}
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
            </form>
          </CardContent>
        </Card>

        <CuttingJobComponentForm
          components={components}
          componentData={componentData}
          handleComponentChange={handleComponentChange}
          handleGoBack={handleGoBack}
          submitting={submitting}
          selectedJobId={selectedJobId}
        />
      </div>
    </div>
  );
}
