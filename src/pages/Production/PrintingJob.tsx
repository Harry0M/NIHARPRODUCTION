
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
import { ArrowLeft, Calendar, Printer, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

type JobStatus = "pending" | "in_progress" | "completed";

interface JobCard {
  id: string;
  job_name: string;
  order: {
    order_number: string;
    company_name: string;
    bag_length: number;
    bag_width: number;
    quantity: number;
  };
}

interface PrintingJobData {
  id?: string;
  job_card_id: string;
  pulling: string;
  gsm: string;
  sheet_length: number;
  sheet_width: number;
  print_image: string | null;
  worker_name: string | null;
  is_internal: boolean;
  status: JobStatus;
  rate: number | null;
  expected_completion_date: string | null;
}

const formSchema = z.object({
  pulling: z.string().optional(),
  gsm: z.string().optional(),
  sheet_length: z.coerce.number().min(0, "Length must be a positive number"),
  sheet_width: z.coerce.number().min(0, "Width must be a positive number"),
  worker_name: z.string().optional(),
  is_internal: z.boolean().default(true),
  status: z.enum(["pending", "in_progress", "completed"]).default("pending"),
  rate: z.coerce.number().min(0, "Rate must be a positive number").optional().nullable(),
  expected_completion_date: z.date().optional().nullable()
});

const PrintingJob = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [jobCard, setJobCard] = useState<JobCard | null>(null);
  const [existingJob, setExistingJob] = useState<PrintingJobData | null>(null);
  const [printImage, setPrintImage] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pulling: "",
      gsm: "",
      sheet_length: 0,
      sheet_width: 0,
      worker_name: "",
      is_internal: true,
      status: "pending" as JobStatus,
      rate: null,
      expected_completion_date: null
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
              bag_length,
              bag_width,
              quantity
            )
          `)
          .eq('id', id)
          .single();
        
        if (jobCardError) throw jobCardError;
        if (!jobCardData) throw new Error("Job card not found");
        
        setJobCard(jobCardData);
        
        // Then check if there's an existing printing job for this job card
        const { data: printingJob, error: printingJobError } = await supabase
          .from('printing_jobs')
          .select('*')
          .eq('job_card_id', id)
          .maybeSingle();
        
        if (printingJobError) throw printingJobError;
        
        if (printingJob) {
          setExistingJob(printingJob);
          form.reset({
            pulling: printingJob.pulling || "",
            gsm: printingJob.gsm || "",
            sheet_length: printingJob.sheet_length || jobCardData.orders.bag_length,
            sheet_width: printingJob.sheet_width || jobCardData.orders.bag_width,
            worker_name: printingJob.worker_name || "",
            is_internal: printingJob.is_internal !== false, // default to true if null
            status: printingJob.status as JobStatus || "pending",
            rate: printingJob.rate || null,
            expected_completion_date: printingJob.expected_completion_date ? new Date(printingJob.expected_completion_date) : null
          });
          setPrintImage(printingJob.print_image);
        } else {
          // Set defaults from job card
          form.reset({
            pulling: "",
            gsm: "",
            sheet_length: jobCardData.orders.bag_length,
            sheet_width: jobCardData.orders.bag_width,
            worker_name: "",
            is_internal: true,
            status: "pending",
            rate: null,
            expected_completion_date: null
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

  const handlePrintImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Create a URL for preview
      const imageUrl = URL.createObjectURL(file);
      setPrintImage(imageUrl);
      
      // TODO: In a real application, you would upload this to storage
      // For now, we're just storing the URL for demonstration purposes
      toast({
        title: "Image selected",
        description: "The print image has been selected",
      });
    } catch (error: any) {
      toast({
        title: "Error uploading image",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
      const printingJobData: Partial<PrintingJobData> = {
        job_card_id: id,
        pulling: values.pulling || null,
        gsm: values.gsm || null,
        sheet_length: values.sheet_length,
        sheet_width: values.sheet_width,
        print_image: printImage,
        worker_name: values.worker_name || null,
        is_internal: values.is_internal,
        status: values.status,
        rate: values.rate,
        expected_completion_date: values.expected_completion_date ? format(values.expected_completion_date, 'yyyy-MM-dd') : null
      };

      let result;
      
      if (existingJob) {
        // Update existing job
        const { data, error } = await supabase
          .from('printing_jobs')
          .update(printingJobData)
          .eq('id', existingJob.id)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
        
        toast({
          title: "Job Updated",
          description: "The printing job has been updated successfully",
        });
      } else {
        // Create new job
        const { data, error } = await supabase
          .from('printing_jobs')
          .insert(printingJobData)
          .select()
          .single();
          
        if (error) throw error;
        result = data;
        
        toast({
          title: "Job Created",
          description: "The printing job has been created successfully",
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
          <h1 className="text-3xl font-bold tracking-tight">Printing Job</h1>
          <p className="text-muted-foreground">Manage printing job details</p>
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
                    <Printer size={18} />
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
                      <Label>Quantity</Label>
                      <div className="font-medium mt-1">{jobCard.order.quantity.toLocaleString()} bags</div>
                    </div>
                    <div>
                      <Label>Bag Size</Label>
                      <div className="font-medium mt-1">{jobCard.order.bag_length} × {jobCard.order.bag_width} inches</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Printing Details</CardTitle>
                <CardDescription>Enter the printing job specifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="pulling"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pulling</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter pulling details" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="gsm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GSM</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter GSM" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sheet_length"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sheet Length (inches)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="Enter sheet length" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="sheet_width"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sheet Width (inches)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="Enter sheet width" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <Label>Print Image</Label>
                  <div className="mt-2">
                    <div className="flex items-center gap-4">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => document.getElementById('print-image-upload')?.click()}
                        disabled={loading}
                        className="flex gap-2 items-center"
                      >
                        <Upload size={16} />
                        {printImage ? "Change Image" : "Upload Image"}
                      </Button>
                      <input 
                        type="file"
                        id="print-image-upload"
                        onChange={handlePrintImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      {printImage && <span className="text-green-600 text-sm">Image selected</span>}
                    </div>
                    
                    {printImage && (
                      <div className="mt-4 border rounded p-2 max-w-md">
                        <img 
                          src={printImage} 
                          alt="Print design" 
                          className="max-h-40 object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="worker_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Printer Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter printer name or company" {...field} />
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
                        <FormLabel>Printing Type</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) => field.onChange(value === "true")}
                            defaultValue={field.value ? "true" : "false"}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select printing type" />
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

export default PrintingJob;
