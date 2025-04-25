
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { JobSelection } from "@/components/production/stitching/JobSelection";
import { JobCardInfo } from "@/components/production/stitching/JobCardInfo";
import { StitchingForm } from "@/components/production/stitching/StitchingForm";

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
  status: "pending" | "in_progress" | "completed";
  rate: number | null;
  created_at?: string;
}

const StitchingJob = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [jobCard, setJobCard] = useState<JobCard | null>(null);
  const [existingJobs, setExistingJobs] = useState<StitchingJobData[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchJobCard(id);
  }, [id]);

  const fetchJobCard = async (jobCardId: string) => {
    setFetching(true);
    try {
      // Fetch job card details
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
        .eq('id', jobCardId)
        .single();
      
      if (jobCardError) throw jobCardError;
      if (!jobCardData) throw new Error("Job card not found");
      
      setJobCard(jobCardData as JobCard);
      
      // Fetch existing stitching jobs
      const { data: stitchingJobs, error: stitchingJobsError } = await supabase
        .from('stitching_jobs')
        .select('*')
        .eq('job_card_id', jobCardId)
        .order('created_at', { ascending: false });
      
      if (stitchingJobsError) throw stitchingJobsError;
      
      if (stitchingJobs && stitchingJobs.length > 0) {
        setExistingJobs(stitchingJobs);
        setSelectedJobId(stitchingJobs[0].id);
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

  const getInitialFormValues = () => {
    if (selectedJobId) {
      const selectedJob = existingJobs.find(job => job.id === selectedJobId);
      if (selectedJob) {
        return {
          ...selectedJob,
          start_date: selectedJob.start_date ? new Date(selectedJob.start_date) : null,
          expected_completion_date: selectedJob.expected_completion_date ? new Date(selectedJob.expected_completion_date) : null,
        };
      }
    }
    
    return {
      total_quantity: jobCard?.order.quantity || null,
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
      status: "pending" as const,
      rate: null,
    };
  };

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
      const stitchingJobData = {
        job_card_id: id,
        ...values,
        start_date: values.start_date ? format(values.start_date, 'yyyy-MM-dd') : null,
        expected_completion_date: values.expected_completion_date ? format(values.expected_completion_date, 'yyyy-MM-dd') : null,
      };

      if (selectedJobId) {
        await supabase
          .from('stitching_jobs')
          .update(stitchingJobData)
          .eq('id', selectedJobId);
          
        toast({
          title: "Job Updated",
          description: "The stitching job has been updated successfully",
        });
      } else {
        await supabase
          .from('stitching_jobs')
          .insert(stitchingJobData);
          
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
          
        await supabase
          .from('orders')
          .update({ status: "stitching" as any })
          .eq('id', jobCard.order.order_number);
      }
        
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

  const handleSelectJob = (jobId: string) => {
    setSelectedJobId(jobId);
  };

  const createNewJob = () => {
    setSelectedJobId(null);
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
          <h1 className="text-3xl font-bold tracking-tight">Stitching Job</h1>
          <p className="text-muted-foreground">Manage stitching job details</p>
        </div>
      </div>

      {jobCard && (
        <>
          <JobSelection
            existingJobs={existingJobs}
            selectedJobId={selectedJobId}
            onSelectJob={handleSelectJob}
            onCreateNewJob={createNewJob}
          />

          <JobCardInfo
            jobName={jobCard.job_name}
            orderNumber={jobCard.order.order_number}
            companyName={jobCard.order.company_name}
            quantity={jobCard.order.quantity}
          />

          <StitchingForm
            defaultValues={getInitialFormValues()}
            onSubmit={handleSubmit}
            onCancel={() => navigate(`/production/job-cards/${id}`)}
            loading={loading}
            selectedJobId={selectedJobId}
          />
        </>
      )}
    </div>
  );
};

export default StitchingJob;
