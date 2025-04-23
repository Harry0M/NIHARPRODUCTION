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
import { ArrowLeft, Calendar, Scissors } from "lucide-react";
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
  worker_name: string | null;
  start_date: string | null;
  expected_completion_date: string | null;
  notes: string | null;
  is_internal: boolean;
  status: JobStatus;
  rate: number | null;
}

const formSchema = z.object({
  total_quantity: z.coerce.number().nullable(),
  part_quantity: z.coerce.number().nullable(),
  border_quantity: z.coerce.number().nullable(),
  handle_quantity: z.coerce.number().nullable(),
  chain_quantity: z.coerce.number().nullable(),
  runner_quantity: z.coerce.number().nullable(),
  piping_quantity: z.coerce.number().nullable(),
  worker_name: z.string().optional(),
  start_date: z.date().optional().nullable(),
  expected_completion_date: z.date().optional().nullable(),
  notes: z.string().optional(),
  is_internal: z.boolean().default(true),
  status: z.enum(["pending", "in_progress", "completed"]).default("pending"),
  rate: z.coerce.number().min(0, "Rate must be a positive number").optional().nullable()
});

const StitchingJob = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [jobCard, setJobCard] = useState<JobCard | null>(null);
  const [existingJob, setExistingJob] = useState<StitchingJobData | null>(null);

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
      worker_name: "",
      start_date: null,
      expected_completion_date: null,
      notes: "",
      is_internal: true,
      status: "pending" as JobStatus,
      rate: null
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
        
        // Then check if there's an existing stitching job for this job card
        const { data: stitchingJob, error: stitchingJobError } = await supabase
          .from('stitching_jobs')
          .select('*')
          .eq('job_card_id', id)
          .maybeSingle();
        
        if (stitchingJobError) throw stitchingJobError;
        
        if (stitchingJob) {
          setExistingJob(stitchingJob);
          form.reset({
            total_quantity: stitchingJob.total_quantity || transformedJobCard.order.quantity,
            part_quantity: stitchingJob.part_quantity || null,
            border_quantity: stitchingJob.border_quantity || null,
            handle_quantity: stitchingJob.handle_quantity || null,
            chain_quantity: stitchingJob.chain_quantity || null,
            runner_quantity: stitchingJob.runner_quantity || null,
            piping_quantity: stitchingJob.piping_quantity || null,
            worker_name: stitchingJob.worker_name || "",
            start_date: stitchingJob.start_date ? new Date(stitchingJob.start_date) : null,
            expected_completion_date: stitchingJob.expected_completion_date ? new Date(stitchingJob.expected_completion_date) : null,
            notes: stitchingJob.notes || "",
            is_internal: stitchingJob.is_internal !== false, // default to true if null
            status: stitchingJob.status as JobStatus || "pending",
            rate: stitchingJob.rate || null
          });
        } else {
          // Set defaults from job card
          form.reset({
            total_quantity: transformedJobCard.order.quantity,
            part_quantity: null,
            border_quantity: null,
            handle_quantity: null,
            chain_quantity: null,
            runner_quantity: null,
            piping_quantity: null,
            worker_name: "",
            start_date: null,
            expected_completion_date: null,
            notes: "",
            is_internal: true,
            status: "pending",
            rate: null
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
      // Ensure job_card_id is always set and not optional
      const stitchingJobData = {
        job_card_id: id,
        total_quantity: values.total_quantity,
        part_quantity: values.part_quantity,
        border_quantity: values.border_quantity,
        handle_quantity: values.handle_quantity,
        chain_quantity: values.chain_quantity,
        runner_quantity: values.runner_quantity,
        piping_quantity: values.piping_quantity,
        worker_name: values.worker_name || null,
        start_date: values.start_date ? format(values.start_date, 'yyyy-MM-dd') : null,
        expected_completion_date: values.expected_completion_date ? format(values.expected_completion_date, 'yyyy-MM-dd') : null,
        notes: values.notes || null,
        is_internal: values.is_internal,
        status: values.status,
        rate: values.rate
      };

      let result;
      
      if (existingJob) {
        // Update existing job
        const { data, error } = await supabase
          .from('stitching_jobs')
          .update(stitchingJobData)
          .eq('id', existingJob.id)
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
      await supabase
        .from('job_cards')
        .update({ status: values.status })
        .eq('id', id);
        
      // Redirect to the job cards list
      navigate('/production/job-cards');
      
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
          onClick={() => navigate("/production/job-cards")}
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {jobCard && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scissors size={18} />
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
                      <Label>Total Quantity</Label>
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
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="total_quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Quantity</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Enter total quantity" 
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="part_quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Part Quantity</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Enter part quantity" 
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="border_quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Border Quantity</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Enter border quantity" 
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))}
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
                            placeholder="Enter handle quantity" 
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))}
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
                            placeholder="Enter chain quantity" 
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="runner_quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Runner Quantity</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Enter runner quantity" 
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))}
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
                            placeholder="Enter piping quantity" 
                            {...field}
                            value={field.value === null ? '' : field.value}
                            onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))}
                          />
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

                <div className="grid md:grid-cols-2 gap-4">
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
                                  <span>Pick a date</span>
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
                              className="p-3 pointer-events-auto"
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
                                  <span>Pick a date</span>
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
                              className="p-3 pointer-events-auto"
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
                      <FormLabel>General Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter any additional notes or remarks" 
                          rows={3} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
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
                  onClick={() => navigate("/production/job-cards")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : existingJob ? "Update Job" : "Create Job"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      )}
    </div>
  );
};

export default StitchingJob;
