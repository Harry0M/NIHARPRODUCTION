
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { PrintingJobProvider } from "./providers/PrintingJobProvider";
import { PrintingJobInfo } from "./components/PrintingJobInfo";
import { PrintingDetailsForm } from "./components/PrintingDetailsForm";
import { format } from "date-fns";

interface Component {
  id: string;
  type: string;
  size: string | null;
  color: string | null;
  gsm: string | null;
}

interface JobCard {
  id: string;
  job_name: string;
  order: {
    id: string;
    order_number: string;
    company_name: string;
    bag_length: number;
    bag_width: number;
    quantity: number;
  };
  components?: Component[];
}

const PrintingJob = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [jobCard, setJobCard] = useState<JobCard | null>(null);
  const [existingJob, setExistingJob] = useState<any | null>(null);

  useEffect(() => {
    const fetchJobCard = async () => {
      if (!id) return;
      
      setFetching(true);
      try {
        // Fetch job card with order details
        const { data: jobCardData, error: jobCardError } = await supabase
          .from('job_cards')
          .select(`
            id, 
            job_name,
            orders (
              id, 
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
        
        // Fetch components for the order
        const { data: componentsData, error: componentsError } = await supabase
          .from('components')
          .select('*')
          .eq('order_id', jobCardData.orders.id);
        
        if (componentsError) throw componentsError;
        
        // Transform the data to match our JobCard interface
        const transformedJobCard: JobCard = {
          id: jobCardData.id,
          job_name: jobCardData.job_name,
          order: jobCardData.orders,
          components: componentsData || []
        };
        
        setJobCard(transformedJobCard);
        
        // Fetch existing printing job if any
        const { data: printingJob, error: printingJobError } = await supabase
          .from('printing_jobs')
          .select('*')
          .eq('job_card_id', id)
          .maybeSingle();
        
        if (printingJobError) throw printingJobError;
        
        if (printingJob) {
          setExistingJob(printingJob);
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
  }, [id]);

  const handleSubmit = async (values: any) => {
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
      const printingJobData = {
        job_card_id: id,
        ...values,
        expected_completion_date: values.expected_completion_date ? format(values.expected_completion_date, 'yyyy-MM-dd') : null
      };

      let result;
      
      if (existingJob) {
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
      
      await supabase
        .from('job_cards')
        .update({ status: values.status })
        .eq('id', id);
        
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
        jobCard && (
          <div className="space-y-6">
            <PrintingJobInfo jobCard={jobCard} />
            
            <Card>
              <CardHeader>
                <CardTitle>Printing Details</CardTitle>
              </CardHeader>
              <CardContent>
                <PrintingJobProvider 
                  initialData={existingJob}
                >
                  <PrintingDetailsForm
                    onSubmit={handleSubmit}
                    defaultValues={{
                      pulling: existingJob?.pulling || "",
                      gsm: existingJob?.gsm || "",
                      sheet_length: existingJob?.sheet_length || jobCard.order.bag_length,
                      sheet_width: existingJob?.sheet_width || jobCard.order.bag_width,
                      worker_name: existingJob?.worker_name || "",
                      is_internal: existingJob?.is_internal ?? true,
                      status: existingJob?.status || "pending",
                      rate: existingJob?.rate || null,
                      expected_completion_date: existingJob?.expected_completion_date ? new Date(existingJob.expected_completion_date) : null
                    }}
                    components={jobCard.components || []}
                  />
                </PrintingJobProvider>
              </CardContent>
            </Card>
          </div>
        )
      )}
    </div>
  );
};

export default PrintingJob;
