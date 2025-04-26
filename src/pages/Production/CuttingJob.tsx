import { useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { VendorSelection } from "@/components/production/VendorSelection";
import { ConsumptionCalculator } from "@/components/production/ConsumptionCalculator";
import { JobStatus } from "@/types/production";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function CuttingJob() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [cuttingData, setCuttingData] = useState({
    roll_width: "",
    consumption_meters: "",
    worker_name: "",
    is_internal: true,
    status: "pending" as JobStatus,
    received_quantity: ""
  });

  const [componentData, setComponentData] = useState<any[]>([]);

  const { data: jobCard, isLoading: jobCardLoading } = useQuery({
    queryKey: ['job-card', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_cards')
        .select(`
          id,
          job_name,
          orders (
            id,
            company_name,
            order_number,
            quantity,
            bag_length,
            bag_width
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    }
  });

  const { data: components, isLoading: componentsLoading } = useQuery({
    queryKey: ['order-components', jobCard?.orders?.id],
    queryFn: async () => {
      if (!jobCard?.orders?.id) return [];
      
      const { data, error } = await supabase
        .from('order_components')
        .select('*')
        .eq('order_id', jobCard.orders.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!jobCard?.orders?.id
  });

  const { data: existingJobs, isLoading: existingJobsLoading } = useQuery({
    queryKey: ['cutting-jobs', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cutting_jobs')
        .select('*')
        .eq('job_card_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  // Initialize component data when components are loaded
  useState(() => {
    if (components && components.length > 0 && componentData.length === 0) {
      const initialComponentData = components.map(comp => ({
        component_id: comp.id,
        component_type: comp.component_type,
        width: "",
        height: "",
        counter: "",
        rewinding: "",
        rate: "",
        status: "pending" as JobStatus,
        material_type: "",
        material_color: "",
        material_gsm: "",
        notes: ""
      }));
      
      setComponentData(initialComponentData);
    }
  });

  const handleSelectJob = async (jobId: string) => {
    setSelectedJobId(jobId);
    const selectedJob = existingJobs?.find(job => job.id === jobId);
    
    if (selectedJob) {
      setCuttingData({
        roll_width: selectedJob.roll_width?.toString() || "",
        consumption_meters: selectedJob.consumption_meters?.toString() || "",
        worker_name: selectedJob.worker_name || "",
        is_internal: selectedJob.is_internal,
        status: selectedJob.status,
        received_quantity: selectedJob.received_quantity?.toString() || ""
      });

      try {
        const { data, error } = await supabase
          .from('cutting_components')
          .select('*')
          .eq('cutting_job_id', jobId);

        if (error) throw error;

        if (data && data.length > 0) {
          // Map the component data - need to get the component_type from the original components
          const mappedComponents = data.map(comp => {
            const originalComponent = components?.find(c => c.id === comp.component_id);
            return {
              component_id: comp.component_id,
              component_type: originalComponent?.component_type || "",
              width: comp.width?.toString() || "",
              height: comp.height?.toString() || "",
              counter: comp.counter?.toString() || "",
              rewinding: comp.rewinding?.toString() || "",
              rate: comp.rate?.toString() || "",
              status: comp.status || "pending",
              material_type: comp.material_type || "",
              material_color: comp.material_color || "",
              material_gsm: comp.material_gsm?.toString() || "",
              notes: comp.notes || ""
            };
          });
          setComponentData(mappedComponents);
        }
      } catch (error) {
        console.error("Error fetching cutting components:", error);
      }
    }
  };

  const handleNewJob = () => {
    setSelectedJobId(null);
    setCuttingData({
      roll_width: "",
      consumption_meters: "",
      worker_name: "",
      is_internal: true,
      status: "pending",
      received_quantity: ""
    });

    // Reset component data
    if (components) {
      const initialComponentData = components.map(comp => ({
        component_id: comp.id,
        component_type: comp.component_type,
        width: "",
        height: "",
        counter: "",
        rewinding: "",
        rate: "",
        status: "pending" as JobStatus,
        material_type: "",
        material_color: "",
        material_gsm: "",
        notes: ""
      }));
      
      setComponentData(initialComponentData);
    }
  };

  const handleComponentChange = (index: number, field: string, value: string | JobStatus) => {
    const updatedComponents = [...componentData];
    if (updatedComponents[index]) {
      updatedComponents[index] = { ...updatedComponents[index], [field]: value };
      setComponentData(updatedComponents);
    }
  };

  const handleConsumptionCalculated = (meters: number) => {
    setCuttingData(prev => ({
      ...prev,
      consumption_meters: meters.toString()
    }));
  };

  const createCuttingJob = useMutation({
    mutationFn: async () => {
      // Validate roll width
      if (!cuttingData.roll_width.trim()) {
        setValidationError("Roll width is required");
        throw new Error("Roll width is required");
      }

      // Create cutting job
      const { data: cuttingJobData, error: cuttingJobError } = await supabase
        .from('cutting_jobs')
        .insert({
          job_card_id: id,
          roll_width: parseFloat(cuttingData.roll_width),
          consumption_meters: cuttingData.consumption_meters ? parseFloat(cuttingData.consumption_meters) : null,
          worker_name: cuttingData.worker_name || null,
          is_internal: cuttingData.is_internal,
          status: cuttingData.status,
          received_quantity: cuttingData.received_quantity ? parseInt(cuttingData.received_quantity) : null
        })
        .select()
        .single();

      if (cuttingJobError) throw cuttingJobError;

      // Save components
      const componentsToInsert = componentData
        .filter(comp => comp.width || comp.height || comp.counter || comp.rewinding)
        .map(comp => ({
          cutting_job_id: cuttingJobData.id,
          component_id: comp.component_id,
          component_type: comp.component_type, // Make sure this is stored
          width: comp.width ? parseFloat(comp.width) : null,
          height: comp.height ? parseFloat(comp.height) : null,
          counter: comp.counter ? parseFloat(comp.counter) : null,
          rewinding: comp.rewinding ? parseFloat(comp.rewinding) : null,
          rate: comp.rate ? parseFloat(comp.rate) : null,
          status: comp.status,
          material_type: comp.material_type || null,
          material_color: comp.material_color || null,
          material_gsm: comp.material_gsm ? parseFloat(comp.material_gsm) : null,
          notes: comp.notes || null
        }));

      if (componentsToInsert.length > 0) {
        const { error: componentsError } = await supabase
          .from('cutting_components')
          .insert(componentsToInsert);

        if (componentsError) throw componentsError;
      }

      return cuttingJobData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cutting-jobs', id] });
      toast({
        title: "Cutting Job Created",
        description: "The cutting job has been created successfully"
      });
      window.location.href = `/production/job-cards/${id}`;
    },
    onError: (error: any) => {
      toast({
        title: "Error creating cutting job",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateCuttingJob = useMutation({
    mutationFn: async () => {
      if (!selectedJobId) throw new Error("No job selected for update");

      // Validate roll width
      if (!cuttingData.roll_width.trim()) {
        setValidationError("Roll width is required");
        throw new Error("Roll width is required");
      }

      // Update cutting job
      const { error: cuttingJobError } = await supabase
        .from('cutting_jobs')
        .update({
          roll_width: parseFloat(cuttingData.roll_width),
          consumption_meters: cuttingData.consumption_meters ? parseFloat(cuttingData.consumption_meters) : null,
          worker_name: cuttingData.worker_name || null,
          is_internal: cuttingData.is_internal,
          status: cuttingData.status,
          received_quantity: cuttingData.received_quantity ? parseInt(cuttingData.received_quantity) : null
        })
        .eq('id', selectedJobId);

      if (cuttingJobError) throw cuttingJobError;

      // Delete existing components
      await supabase
        .from('cutting_components')
        .delete()
        .eq('cutting_job_id', selectedJobId);

      // Insert updated components
      const componentsToInsert = componentData
        .filter(comp => comp.width || comp.height || comp.counter || comp.rewinding)
        .map(comp => ({
          cutting_job_id: selectedJobId,
          component_id: comp.component_id,
          component_type: comp.component_type, // Make sure this is stored
          width: comp.width ? parseFloat(comp.width) : null,
          height: comp.height ? parseFloat(comp.height) : null,
          counter: comp.counter ? parseFloat(comp.counter) : null,
          rewinding: comp.rewinding ? parseFloat(comp.rewinding) : null,
          rate: comp.rate ? parseFloat(comp.rate) : null,
          status: comp.status,
          material_type: comp.material_type || null,
          material_color: comp.material_color || null,
          material_gsm: comp.material_gsm ? parseFloat(comp.material_gsm) : null,
          notes: comp.notes || null
        }));

      if (componentsToInsert.length > 0) {
        const { error: componentsError } = await supabase
          .from('cutting_components')
          .insert(componentsToInsert);

        if (componentsError) throw componentsError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cutting-jobs', id] });
      toast({
        title: "Cutting Job Updated",
        description: "The cutting job has been updated successfully"
      });
      window.location.href = `/production/job-cards/${id}`;
    },
    onError: (error: any) => {
      toast({
        title: "Error updating cutting job",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (selectedJobId) {
        await updateCuttingJob.mutateAsync();
      } else {
        await createCuttingJob.mutateAsync();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (jobCardLoading || componentsLoading || existingJobsLoading) {
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
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.location.href = `/production/job-cards/${id}`}
          className="gap-1"
        >
          <ArrowLeft size={16} />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Scissors className="h-6 w-6" />
            Cutting Job
          </h1>
          <p className="text-muted-foreground">
            {selectedJobId ? "Update" : "Create"} cutting job for {jobCard.job_name}
          </p>
        </div>
      </div>

      {existingJobs && existingJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Job Selection</CardTitle>
            <CardDescription>Select an existing job to edit or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {existingJobs.map((job, index) => (
                  <Button
                    key={job.id}
                    variant={selectedJobId === job.id ? "default" : "outline"}
                    onClick={() => handleSelectJob(job.id)}
                    className="flex items-center"
                  >
                    Job {index + 1} ({job.status})
                  </Button>
                ))}
                <Button
                  variant={selectedJobId === null ? "default" : "outline"}
                  onClick={handleNewJob}
                  className="flex items-center"
                >
                  Create New Job
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
              <CardDescription>Details from the original order</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Order Number</h3>
                  <p className="text-lg">{jobCard.orders?.order_number}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Company</h3>
                  <p className="text-lg">{jobCard.orders?.company_name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Quantity</h3>
                  <p className="text-lg">{jobCard.orders?.quantity.toLocaleString()} bags</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Bag Size</h3>
                  <p className="text-lg">{jobCard.orders?.bag_length} × {jobCard.orders?.bag_width} inches</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cutting Details</CardTitle>
              <CardDescription>Enter details for the cutting process</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="roll_width" className={`text-primary font-medium ${validationError ? 'text-destructive' : ''}`}>
                    Roll Width (Required) *
                  </Label>
                  <Input 
                    id="roll_width" 
                    type="text"
                    placeholder="Roll width in inches"
                    value={cuttingData.roll_width}
                    onChange={(e) => {
                      setCuttingData(prev => ({ ...prev, roll_width: e.target.value }));
                      if (validationError) setValidationError(null);
                    }}
                    required
                    className={`border-2 ${validationError ? 'border-destructive' : 'border-primary'} focus:ring-2 focus:ring-primary`}
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
                    type="text"
                    value={cuttingData.consumption_meters}
                    onChange={(e) => setCuttingData(prev => ({ ...prev, consumption_meters: e.target.value }))}
                    placeholder="Material consumption"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="received_quantity">Received Quantity</Label>
                  <Input 
                    id="received_quantity" 
                    type="text"
                    placeholder="Final quantity after cutting"
                    value={cuttingData.received_quantity}
                    onChange={(e) => setCuttingData(prev => ({ ...prev, received_quantity: e.target.value }))}
                  />
                </div>

                <div className="flex items-center space-x-2 pt-8">
                  <Checkbox 
                    id="is_internal"
                    checked={cuttingData.is_internal}
                    onCheckedChange={(checked) => {
                      setCuttingData(prev => ({ ...prev, is_internal: checked as boolean }));
                    }}
                  />
                  <Label htmlFor="is_internal">Internal Cutting (In-house)</Label>
                </div>

                <div className="space-y-2">
                  <Label>Worker Name</Label>
                  <VendorSelection
                    serviceType="cutting"
                    value={cuttingData.worker_name}
                    onChange={(value) => {
                      setCuttingData(prev => ({ ...prev, worker_name: value }));
                    }}
                    placeholder="Select cutter or enter manually"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={cuttingData.status}
                    onValueChange={(value: JobStatus) => {
                      setCuttingData(prev => ({ ...prev, status: value }));
                    }}
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

                <div className="md:col-span-3">
                  <ConsumptionCalculator
                    length={jobCard.orders?.bag_length}
                    width={jobCard.orders?.bag_width}
                    quantity={jobCard.orders?.quantity}
                    onConsumptionCalculated={handleConsumptionCalculated}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

      <Card>
        <CardHeader>
          <CardTitle>Component Cutting Details</CardTitle>
          <CardDescription>Enter cutting details for each component</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {components && components.map((component, index) => (
              <div key={component.id} className="p-4 border rounded-md space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium capitalize">{component.component_type}</h3>
                  <div className="flex items-center gap-2 text-sm">
                    {component.size && <span className="bg-slate-100 px-2 py-1 rounded">Size: {component.size}</span>}
                    {component.color && <span className="bg-slate-100 px-2 py-1 rounded">Color: {component.color}</span>}
                    {component.gsm && <span className="bg-slate-100 px-2 py-1 rounded">GSM: {component.gsm}</span>}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Material Type</Label>
                    <Input
                      type="text"
                      placeholder="Material type"
                      value={componentData[index]?.material_type || ""}
                      onChange={(e) => handleComponentChange(index, "material_type", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Material Color</Label>
                    <Input
                      type="text"
                      placeholder="Material color"
                      value={componentData[index]?.material_color || ""}
                      onChange={(e) => handleComponentChange(index, "material_color", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Material GSM</Label>
                    <Input
                      type="number"
                      placeholder="Material GSM"
                      value={componentData[index]?.material_gsm || ""}
                      onChange={(e) => handleComponentChange(index, "material_gsm", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Label>Width</Label>
                    <Input
                      type="text"
                      placeholder="Width"
                      value={componentData[index]?.width || ""}
                      onChange={(e) => handleComponentChange(index, "width", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Height</Label>
                    <Input
                      type="text"
                      placeholder="Height"
                      value={componentData[index]?.height || ""}
                      onChange={(e) => handleComponentChange(index, "height", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Counter</Label>
                    <Input
                      type="text"
                      placeholder="Counter"
                      value={componentData[index]?.counter || ""}
                      onChange={(e) => handleComponentChange(index, "counter", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rewinding</Label>
                    <Input
                      type="text"
                      placeholder="Rewinding"
                      value={componentData[index]?.rewinding || ""}
                      onChange={(e) => handleComponentChange(index, "rewinding", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={componentData[index]?.status || "pending"}
                      onValueChange={(value: JobStatus) => handleComponentChange(index, "status", value)}
                    >
                      <SelectTrigger>
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

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Add any notes about the cutting process"
                    value={componentData[index]?.notes || ""}
                    onChange={(e) => handleComponentChange(index, "notes", e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.location.href = `/production/job-cards/${id}`}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : (selectedJobId ? "Update" : "Create")} Cutting Job
          </Button>
        </CardFooter>
      </Card>
        </div>
      </form>
    </div>
  );
}
