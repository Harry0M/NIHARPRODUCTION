import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Scissors } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type JobStatus = Database["public"]["Enums"]["job_status"];

interface JobCard {
  id: string;
  job_name: string;
  order: {
    id: string;
    company_name: string;
    order_number: string;
    quantity: number;
    bag_length: number;
    bag_width: number;
  };
}

interface Component {
  id: string;
  type: string;
  size: string | null;
  color: string | null;
  gsm: string | null;
}

interface CuttingComponent {
  component_id: string;
  type: string;
  width: string;
  height: string;
  counter: string;
  rewinding: string;
  rate: string;
  status: JobStatus;
}

interface CuttingJob {
  id: string;
  job_card_id: string;
  roll_width: string;
  consumption_meters: string;
  worker_name: string;
  is_internal: boolean;
  status: JobStatus;
  received_quantity: string;
}

const CuttingJob = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [jobCard, setJobCard] = useState<JobCard | null>(null);
  const [components, setComponents] = useState<Component[]>([]);
  const [existingJob, setExistingJob] = useState<CuttingJob | null>(null);
  const [existingComponents, setExistingComponents] = useState<CuttingComponent[]>([]);
  
  const [cuttingData, setCuttingData] = useState({
    roll_width: "",
    consumption_meters: "",
    worker_name: "",
    is_internal: true,
    status: "pending" as JobStatus,
    received_quantity: ""
  });
  
  const [componentData, setComponentData] = useState<CuttingComponent[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: jobCardData, error: jobCardError } = await supabase
          .from("job_cards")
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
          .eq("id", id)
          .single();
          
        if (jobCardError) throw jobCardError;
        
        const formattedJobCard: JobCard = {
          id: jobCardData.id,
          job_name: jobCardData.job_name,
          order: jobCardData.orders
        };
        
        setJobCard(formattedJobCard);
        
        const { data: componentsData, error: componentsError } = await supabase
          .from("components")
          .select("id, type, size, color, gsm")
          .eq("order_id", jobCardData.orders.id);
          
        if (componentsError) throw componentsError;
        setComponents(componentsData || []);
        
        const initialComponentData: CuttingComponent[] = componentsData.map(comp => ({
          component_id: comp.id,
          type: comp.type,
          width: "",
          height: "",
          counter: "",
          rewinding: "",
          rate: "",
          status: "pending"
        }));
        
        setComponentData(initialComponentData);
        
        const { data: existingJobData, error: existingJobError } = await supabase
          .from("cutting_jobs")
          .select("*")
          .eq("job_card_id", id)
          .maybeSingle();
          
        if (existingJobError) throw existingJobError;
        
        if (existingJobData) {
          setExistingJob({
            id: existingJobData.id,
            job_card_id: existingJobData.job_card_id,
            roll_width: existingJobData.roll_width?.toString() || "",
            consumption_meters: existingJobData.consumption_meters?.toString() || "",
            worker_name: existingJobData.worker_name || "",
            is_internal: existingJobData.is_internal ?? true,
            status: existingJobData.status || "pending",
            received_quantity: existingJobData.received_quantity?.toString() || ""
          });
          
          setCuttingData({
            roll_width: existingJobData.roll_width?.toString() || "",
            worker_name: existingJobData.worker_name || "",
            is_internal: existingJobData.is_internal ?? true,
            status: existingJobData.status || "pending",
            received_quantity: existingJobData.received_quantity?.toString() || ""
          });
          
          if (existingJobData.id) {
            const { data: componentsData, error: componentsError } = await supabase
              .from("cutting_components")
              .select("*")
              .eq("cutting_job_id", existingJobData.id);
              
            if (componentsError) throw componentsError;
            
            if (componentsData && componentsData.length > 0) {
              const formattedComponents = componentsData.map(comp => ({
                component_id: comp.component_id || "",
                type: components.find(c => c.id === comp.component_id)?.type || "",
                width: comp.width?.toString() || "",
                height: comp.height?.toString() || "",
                counter: comp.counter?.toString() || "",
                rewinding: comp.rewinding?.toString() || "",
                rate: comp.rate?.toString() || "",
                status: comp.status || "pending"
              }));
              
              setExistingComponents(formattedComponents);
              setComponentData(formattedComponents);
            }
          }
        }
        
        if (jobCardData.orders.bag_length && jobCardData.orders.bag_width && jobCardData.orders.quantity) {
          const bagArea = (jobCardData.orders.bag_length * jobCardData.orders.bag_width);
          const consumption = ((bagArea / 6339.39) * jobCardData.orders.quantity).toFixed(2);
          
          if (!existingJobData?.consumption_meters) {
            setCuttingData(prev => ({
              ...prev,
              consumption_meters: consumption
            }));
          } else {
            setCuttingData(prev => ({
              ...prev,
              consumption_meters: existingJobData.consumption_meters?.toString() || consumption
            }));
          }
        }
        
      } catch (error: any) {
        toast({
          title: "Error fetching data",
          description: error.message,
          variant: "destructive"
        });
        navigate("/production/job-cards");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCuttingData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: JobStatus) => {
    setCuttingData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setCuttingData(prev => ({ ...prev, is_internal: checked }));
  };

  const handleComponentChange = (index: number, field: string, value: string | JobStatus) => {
    setComponentData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const calculateConsumptionMeters = () => {
    if (jobCard?.order.bag_length && jobCard?.order.bag_width && jobCard?.order.quantity) {
      const bagArea = (jobCard.order.bag_length * jobCard.order.bag_width);
      return ((bagArea / 6339.39) * jobCard.order.quantity).toFixed(2);
    }
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jobCard || !id) return;
    
    if (!cuttingData.roll_width) {
      toast({
        title: "Validation Error",
        description: "Roll width is required",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      let cuttingJobId = existingJob?.id;
      
      if (!existingJob) {
        const { data, error } = await supabase
          .from("cutting_jobs")
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
          
        if (error) throw error;
        cuttingJobId = data.id;
        
        if (cuttingData.status !== "pending") {
          await supabase
            .from("job_cards")
            .update({ status: "in_progress" })
            .eq("id", id);
        }
      } else {
        const { error } = await supabase
          .from("cutting_jobs")
          .update({
            roll_width: parseFloat(cuttingData.roll_width),
            consumption_meters: cuttingData.consumption_meters ? parseFloat(cuttingData.consumption_meters) : null,
            worker_name: cuttingData.worker_name || null,
            is_internal: cuttingData.is_internal,
            status: cuttingData.status,
            received_quantity: cuttingData.received_quantity ? parseInt(cuttingData.received_quantity) : null
          })
          .eq("id", existingJob.id);
          
        if (error) throw error;
        
        if (cuttingData.status === "completed") {
          await supabase
            .from("job_cards")
            .update({ status: "in_progress" })
            .eq("id", id);
            
          await supabase
            .from("orders")
            .update({ status: "cutting" })
            .eq("id", jobCard.order.id);
        }
      }
      
      if (cuttingJobId) {
        if (existingJob && existingComponents.length > 0) {
          await supabase
            .from("cutting_components")
            .delete()
            .eq("cutting_job_id", existingJob.id);
        }
        
        const componentsToInsert = componentData
          .filter(comp => comp.width || comp.height || comp.counter || comp.rewinding)
          .map(comp => ({
            cutting_job_id: cuttingJobId,
            component_id: comp.component_id,
            width: comp.width ? parseFloat(comp.width) : null,
            height: comp.height ? parseFloat(comp.height) : null,
            counter: comp.counter ? parseFloat(comp.counter) : null,
            rewinding: comp.rewinding ? parseFloat(comp.rewinding) : null,
            rate: comp.rate ? parseFloat(comp.rate) : null,
            status: comp.status
          }));
        
        if (componentsToInsert.length > 0) {
          const { error } = await supabase
            .from("cutting_components")
            .insert(componentsToInsert);
            
          if (error) throw error;
        }
      }
      
      toast({
        title: existingJob ? "Cutting Job Updated" : "Cutting Job Created",
        description: `The cutting job for ${jobCard.job_name} has been ${existingJob ? "updated" : "created"} successfully`
      });
      
      navigate(`/production/job-cards/${id}`);
    } catch (error: any) {
      toast({
        title: "Error saving cutting job",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
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
        <Button asChild>
          <Link to="/production/job-cards">Return to Job Cards</Link>
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
          className="gap-1"
          onClick={() => navigate(`/production/job-cards/${id}`)}
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
            {existingJob ? "Update" : "Create"} cutting job for {jobCard.job_name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
            <CardDescription>Order details for this job</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Order Number</h3>
                <p className="text-lg">{jobCard.order.order_number}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Company</h3>
                <p className="text-lg">{jobCard.order.company_name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Quantity</h3>
                <p className="text-lg">{jobCard.order.quantity.toLocaleString()} bags</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Bag Size</h3>
                <p className="text-lg">{jobCard.order.bag_length} × {jobCard.order.bag_width} inches</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Cutting Details</CardTitle>
            <CardDescription>Enter details for the cutting process</CardDescription>
          </CardHeader>
          <CardContent>
            <form id="cutting-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="roll_width">Roll Width</Label>
                  <Input 
                    id="roll_width" 
                    name="roll_width"
                    type="number"
                    step="0.01"
                    placeholder="Enter roll width"
                    value={cuttingData.roll_width}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consumption_meters">Consumption (meters)</Label>
                  <Input 
                    id="consumption_meters" 
                    name="consumption_meters"
                    type="number"
                    step="0.01"
                    placeholder="Calculated consumption"
                    value={cuttingData.consumption_meters || calculateConsumptionMeters()}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="received_quantity">Received Quantity</Label>
                  <Input 
                    id="received_quantity" 
                    name="received_quantity"
                    type="number"
                    placeholder="Final quantity after cutting"
                    value={cuttingData.received_quantity}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="worker_name">Worker/Company Name</Label>
                  <Input 
                    id="worker_name" 
                    name="worker_name"
                    placeholder="Name of cutting worker or company"
                    value={cuttingData.worker_name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={cuttingData.status}
                    onValueChange={(value) => handleSelectChange("status", value)}
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
                <div className="flex items-center space-x-2 pt-8">
                  <Checkbox 
                    id="is_internal" 
                    checked={cuttingData.is_internal}
                    onCheckedChange={handleCheckboxChange}
                  />
                  <Label htmlFor="is_internal">Internal Cutting (In-house)</Label>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Component Cutting Details</CardTitle>
            <CardDescription>Enter cutting details for each component</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {components.map((component, index) => (
                <div key={component.id} className="p-4 border rounded-md space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium capitalize">{component.type}</h3>
                    <div className="flex items-center gap-2 text-sm">
                      {component.size && <span className="bg-slate-100 px-2 py-1 rounded">Size: {component.size}</span>}
                      {component.color && <span className="bg-slate-100 px-2 py-1 rounded">Color: {component.color}</span>}
                      {component.gsm && <span className="bg-slate-100 px-2 py-1 rounded">GSM: {component.gsm}</span>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="space-y-2">
                      <Label>Width</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="Width"
                        value={componentData[index]?.width || ""}
                        onChange={(e) => handleComponentChange(index, "width", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Height</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="Height"
                        value={componentData[index]?.height || ""}
                        onChange={(e) => handleComponentChange(index, "height", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Counter</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="Counter"
                        value={componentData[index]?.counter || ""}
                        onChange={(e) => handleComponentChange(index, "counter", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rewinding</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="Rewinding"
                        value={componentData[index]?.rewinding || ""}
                        onChange={(e) => handleComponentChange(index, "rewinding", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rate</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="Rate"
                        value={componentData[index]?.rate || ""}
                        onChange={(e) => handleComponentChange(index, "rate", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={componentData[index]?.status || "pending"}
                        onValueChange={(value) => handleComponentChange(index, "status", value)}
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
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => navigate(`/production/job-cards/${id}`)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              form="cutting-form"
              disabled={submitting}
            >
              {submitting ? "Saving..." : (existingJob ? "Update Cutting Job" : "Create Cutting Job")}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default CuttingJob;
