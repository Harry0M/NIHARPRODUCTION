
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { ArrowLeft, Calendar, PackageCheck, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { VendorSelection } from "@/components/production/VendorSelection";

type JobStatus = "pending" | "in_progress" | "completed";

interface JobCard {
  id: string;
  job_name: string;
  order: {
    order_number: string;
    company_name: string;
    quantity: number;
  };
}

interface StitchingJobData {
  id?: string;
  job_card_id: string;
  total_quantity: number | null;
  part_quantity: number | null;
  border_quantity: number | null;
  handle_quantity: number | null;
  chain_quantity: number | null;
  runner_quantity: number | null;
  piping_quantity: number | null;
  start_date: string | null;
  expected_completion_date: string | null;
  notes: string | null;
  worker_name: string | null;
  is_internal: boolean;
  status: JobStatus;
  rate: number | null;
  created_at?: string;
}

const formSchema = z.object({
  total_quantity: z.coerce.number().min(0, "Quantity must be a positive number").nullable(),
  part_quantity: z.coerce.number().min(0, "Part quantity must be a positive number").nullable(),
  border_quantity: z.coerce.number().min(0, "Border quantity must be a positive number").nullable(),
  handle_quantity: z.coerce.number().min(0, "Handle quantity must be a positive number").nullable(),
  chain_quantity: z.coerce.number().min(0, "Chain quantity must be a positive number").nullable(),
  runner_quantity: z.coerce.number().min(0, "Runner quantity must be a positive number").nullable(),
  piping_quantity: z.coerce.number().min(0, "Piping quantity must be a positive number").nullable(),
  start_date: z.date().nullable(),
  expected_completion_date: z.date().nullable(),
  notes: z.string().optional(),
  worker_name: z.string().optional(),
  is_internal: z.boolean().default(true),
  status: z.enum(["pending", "in_progress", "completed"]).default("pending"),
  rate: z.coerce.number().min(0, "Rate must be a positive number").optional().nullable(),
});

const StitchingJob = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [jobCard, setJobCard] = useState<JobCard | null>(null);
  const [existingJobs, setExistingJobs] = useState<StitchingJobData[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      total_quantity: null,
      part_quantity: null,
      border_quantity: null,
      handle_quantity: null,
      chain_quantity: null,
      runner_quantity: null,
      piping_quantity: null,
      start_date: null,
      expected_completion_date: null,
      notes: "",
      worker_name: "",
      is_internal: true,
      status: "pending" as JobStatus,
      rate: null,
    }
  });

  useEffect(() => {
    const fetchJobCard = async () => {
      if (!id) return;
      
      setFetching(true);
      try {
        // First fetch the job card details
        const { data: jobCardData, error: jobCardError } = await supabase
          .from('job_cards')
          .select(`
            id, 
            job_name,
            orders (
              order_number,
              company_name,
              quantity
            )
          `)
          .eq('id', id)
          .single();
        
        if (jobCardError) throw jobCardError;
        if (!jobCardData) throw new Error("Job card not found");
        
        // Transform the data to match the JobCard interface
        const transformedJobCard: JobCard = {
          id: jobCardData.id,
          job_name: jobCardData.job_name,
          order: {
            order_number: jobCardData.orders.order_number,
            company_name: jobCardData.orders.company_name,
            quantity: jobCardData.orders.quantity
          }
        };
        
        setJobCard(transformedJobCard);
        
        // Then fetch all existing stitching jobs for this job card
        const { data: stitchingJobs, error: stitchingJobsError } = await supabase
          .from('stitching_jobs')
          .select('*')
          .eq('job_card_id', id)
          .order('created_at', { ascending: false });
        
        if (stitchingJobsError) throw stitchingJobsError;
        
        if (stitchingJobs && stitchingJobs.length > 0) {
          setExistingJobs(stitchingJobs);
          
          // Select the most recent job by default
          setSelectedJobId(stitchingJobs[0].id);
          
          // Populate the form with the selected job's data
          const selectedJob = stitchingJobs[0];
          form.reset({
            total_quantity: selectedJob.total_quantity !== null ? Number(selectedJob.total_quantity) : null,
            part_quantity: selectedJob.part_quantity !== null ? Number(selectedJob.part_quantity) : null,
            border_quantity: selectedJob.border_quantity !== null ? Number(selectedJob.border_quantity) : null,
            handle_quantity: selectedJob.handle_quantity !== null ? Number(selectedJob.handle_quantity) : null,
            chain_quantity: selectedJob.chain_quantity !== null ? Number(selectedJob.chain_quantity) : null,
            runner_quantity: selectedJob.runner_quantity !== null ? Number(selectedJob.runner_quantity) : null,
            piping_quantity: selectedJob.piping_quantity !== null ? Number(selectedJob.piping_quantity) : null,
            start_date: selectedJob.start_date ? new Date(selectedJob.start_date) : null,
            expected_completion_date: selectedJob.expected_completion_date ? new Date(selectedJob.expected_completion_date) : null,
            notes: selectedJob.notes || "",
            worker_name: selectedJob.worker_name || "",
            is_internal: selectedJob.is_internal !== false, // default to true if null
            status: selectedJob.status as JobStatus || "pending",
            rate: selectedJob.rate !== null ? Number(selectedJob.rate) : null,
          });
        } else {
          // Set defaults for a new job
          form.reset({
            total_quantity: transformedJobCard.order.quantity,
            part_quantity: null,
            border_quantity: null,
            handle_quantity: null,
            chain_quantity: null,
            runner_quantity: null,
            piping_quantity: null,
            start_date: new Date(),
            expected_completion_date: null,
            notes: "",
            worker_name: "",
            is_internal: true,
            status: "pending",
            rate: null,
          });
        }
      } catch (error: any) {
        toast({
          title: "Error fetching job details",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setFetching(false);
      }
    };

    fetchJobCard();
  }, [id, form]);

  const selectJob = (jobId: string) => {
    setSelectedJobId(jobId);
    const selectedJob = existingJobs.find(job => job.id === jobId);
    
    if (selectedJob) {
      // Reset form with the selected job's data
      form.reset({
        total_quantity: selectedJob.total_quantity !== null ? Number(selectedJob.total_quantity) : null,
        part_quantity: selectedJob.part_quantity !== null ? Number(selectedJob.part_quantity) : null,
        border_quantity: selectedJob.border_quantity !== null ? Number(selectedJob.border_quantity) : null,
        handle_quantity: selectedJob.handle_quantity !== null ? Number(selectedJob.handle_quantity) : null,
        chain_quantity: selectedJob.chain_quantity !== null ? Number(selectedJob.chain_quantity) : null,
        runner_quantity: selectedJob.runner_quantity !== null ? Number(selectedJob.runner_quantity) : null,
        piping_quantity: selectedJob.piping_quantity !== null ? Number(selectedJob.piping_quantity) : null,
        start_date: selectedJob.start_date ? new Date(selectedJob.start_date) : null,
        expected_completion_date: selectedJob.expected_completion_date ? new Date(selectedJob.expected_completion_date) : null,
        notes: selectedJob.notes || "",
        worker_name: selectedJob.worker_name || "",
        is_internal: selectedJob.is_internal !== false, // default to true if null
        status: selectedJob.status as JobStatus || "pending",
        rate: selectedJob.rate !== null ? Number(selectedJob.rate) : null,
      });
    }
  };

  const createNewJob = () => {
    // Reset the form with default values
    if (jobCard) {
      form.reset({
        total_quantity: jobCard.order.quantity,
        part_quantity: null,
        border_quantity: null,
        handle_quantity: null,
        chain_quantity: null,
        runner_quantity: null,
        piping_quantity: null,
        start_date: new Date(),
        expected_completion_date: null,
        notes: "",
        worker_name: "",
        is_internal: true,
        status: "pending",
        rate: null,
      });
    }
    setSelectedJobId(null);
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!id || !jobCard) {
      toast({
        title: "Error",
        description: "Job card information is missing",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare data for submission
      const stitchingJobData = {
        job_card_id: id,
        total_quantity: values.total_quantity,
        part_quantity: values.part_quantity,
        border_quantity: values.border_quantity,
        handle_quantity: values.handle_quantity,
        chain_quantity: values.chain_quantity,
        runner_quantity: values.runner_quantity,
        piping_quantity: values.piping_quantity,
        start_date: values.start_date ? format(values.start_date, 'yyyy-MM-dd') : null,
        expected_completion_date: values.expected_completion_date ? format(values.expected_completion_date, 'yyyy-MM-dd') : null,
        notes: values.notes || null,
        worker_name: values.worker_name || null,
        is_internal: values.is_internal,
        status: values.status,
        rate: values.rate,
      };

      let result;
      
      if (selectedJobId) {
        // Update existing job
        const { data, error } = await supabase
          .from('stitching_jobs')
          .update(stitchingJobData)
          .eq('id', selectedJobId)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
        
        toast({
          title: "Job Updated",
          description: "The stitching job has been updated successfully",
        });
      } else {
        // Create new job
        const { data, error } = await supabase
          .from('stitching_jobs')
          .insert(stitchingJobData)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
        
        toast({
          title: "Job Created",
          description: "The stitching job has been created successfully",
        });
      }
      
      // Update job card status if needed
      if (values.status === "completed") {
        await supabase
          .from('job_cards')
          .update({ status: "in_progress" })
          .eq('id', id);
          
        // Also update order status if required
        await supabase
          .from('orders')
          .update({ status: "stitching" as any })
          .eq('id', jobCard.order.order_number);
      }
        
      // Redirect to the job card details
      navigate(`/production/job-cards/${id}`);
      
    } catch (error: any) {
      toast({
        title: "Error saving job",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold tracking-tight">Stitching Job</h1>
          <p className="text-muted-foreground">Manage stitching job details</p>
        </div>
      </div>

      {fetching ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {existingJobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Job Selection</CardTitle>
                <CardDescription>Select an existing job or create a new one</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {existingJobs.map((job) => (
                    <Button
                      key={job.id}
                      variant={selectedJobId === job.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => selectJob(job.id!)}
                      className="flex items-center gap-1"
                    >
                      Job {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'N/A'}
                      <span className={`ml-1 w-2 h-2 rounded-full ${
                        job.status === 'completed' ? 'bg-green-500' :
                        job.status === 'in_progress' ? 'bg-amber-500' : 'bg-gray-500'
                      }`}></span>
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={createNewJob}
                    className="flex items-center gap-1"
                  >
                    <Plus size={14} /> New Job
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {jobCard && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PackageCheck size={18} />
                      Job Card Information
                    </CardTitle>
                    <CardDescription>Details from the original job card and order</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Job Name</Label>
                        <div className="font-medium mt-1">{jobCard.job_name}</div>
                      </div>
                      <div>
                        <Label>Order Number</Label>
                        <div className="font-medium mt-1">{jobCard.order.order_number}</div>
                      </div>
                      <div>
                        <Label>Company</Label>
                        <div className="font-medium mt-1">{jobCard.order.company_name}</div>
                      </div>
                      <div>
                        <Label>Order Quantity</Label>
                        <div className="font-medium mt-1">{jobCard.order.quantity.toLocaleString()} bags</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Stitching Details</CardTitle>
                  <CardDescription>Enter the stitching job specifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="total_quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Quantity</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Total quantity" 
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="part_quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Part Quantity</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Part quantity" 
                              {...field}
                              value={field.value === null ? '' : field.value}
                              onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="border_quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Border Quantity</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Border quantity" 
                              {...field}
                              value={field.value === null ? '' : field.value}
                              onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="handle_quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Handle Quantity</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Handle quantity" 
                              {...field}
                              value={field.value === null ? '' : field.value}
                              onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="chain_quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chain Quantity</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Chain quantity" 
                              {...field}
                              value={field.value === null ? '' : field.value}
                              onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="runner_quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Runner Quantity</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Runner quantity" 
                              {...field}
                              value={field.value === null ? '' : field.value}
                              onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="piping_quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Piping Quantity</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="Piping quantity" 
                              {...field}
                              value={field.value === null ? '' : field.value}
                              onChange={e => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="start_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Start Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Select start date</span>
                                  )}
                                  <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="expected_completion_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Expected Completion Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Select completion date</span>
                                  )}
                                  <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes / Remarks</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter any notes or remarks about this job"
                            className="min-h-[100px]" 
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="worker_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stitcher Name</FormLabel>
                        <FormControl>
                          <VendorSelection
                            serviceType="stitching"
                            value={field.value || ""}
                            onChange={field.onChange}
                            placeholder="Select stitcher or enter manually"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="is_internal"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Stitching Type</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={(value) => field.onChange(value === "true")}
                              defaultValue={field.value ? "true" : "false"}
                              value={field.value ? "true" : "false"}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select stitching type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">Internal</SelectItem>
                                <SelectItem value="false">External</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rate</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="Enter rate" 
                              {...field}
                              value={field.value === null ? '' : field.value}
                              onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-end gap-3 pt-6">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => navigate(`/production/job-cards/${id}`)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : selectedJobId ? "Update Job" : "Create Job"}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </>
      )}
    </div>
  );
};

export default StitchingJob;
