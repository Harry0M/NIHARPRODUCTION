
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PrintingJobForm } from "@/components/production/printing/PrintingJobForm";

export default function PrintingJob() {
  const { id } = useParams(); // This is the job card ID
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [jobCard, setJobCard] = useState<any>(null);
  const [existingJobs, setExistingJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cuttingJobReceivedQuantity, setCuttingJobReceivedQuantity] = useState<string>('');

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch job card details
      const { data: jobCardData, error: jobCardError } = await supabase
        .from("job_cards")
        .select(`
          *,
          orders (*)
        `)
        .eq("id", id)
        .single();

      if (jobCardError) throw jobCardError;
      setJobCard(jobCardData);

      // Fetch existing printing jobs for this job card
      const { data: printingJobsData, error: printingJobsError } = await supabase
        .from("printing_jobs")
        .select("*")
        .eq("job_card_id", id);

      if (printingJobsError) throw printingJobsError;
      setExistingJobs(printingJobsData || []);
      
      // Fetch cutting job details to get the received quantity
      const { data: cuttingJobData, error: cuttingJobError } = await supabase
        .from("cutting_jobs")
        .select("received_quantity")
        .eq("job_card_id", id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!cuttingJobError && cuttingJobData) {
        setCuttingJobReceivedQuantity(cuttingJobData.received_quantity?.toString() || '');
      }
    } catch (error) {
      console.error("Error fetching job data:", error);
      toast({
        title: "Failed to load job data",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectJob = (jobId: string) => {
    const job = existingJobs.find((job) => job.id === jobId);
    if (job) {
      setSelectedJobId(jobId);
    }
  };

  const handleNewJob = () => {
    setSelectedJobId(null);
  };

  const handleSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      if (selectedJobId) {
        // Update existing job
        const { error } = await supabase
          .from("printing_jobs")
          .update(data)
          .eq("id", selectedJobId);

        if (error) throw error;

        toast({
          title: "Printing job updated",
          description: "The printing job has been updated successfully.",
        });
      } else {
        // Create new job
        const { error } = await supabase
          .from("printing_jobs")
          .insert({
            ...data,
            job_card_id: id,
          });

        if (error) throw error;

        toast({
          title: "Printing job created",
          description: "A new printing job has been created successfully.",
        });
      }

      // Redirect back to job card detail page
      navigate(`/production/job-cards/${id}`);
    } catch (error: any) {
      console.error("Error saving printing job:", error);
      toast({
        title: "Error saving printing job",
        description: error.message || "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/production/job-cards/${id}`);
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
        <Button onClick={() => navigate("/production/job-cards")}>
          Return to Job Cards
        </Button>
      </div>
    );
  }

  const initialData = selectedJobId
    ? existingJobs.find((job) => job.id === selectedJobId)
    : undefined;

  const bagDimensions = {
    length: jobCard.orders.bag_length || 0,
    width: jobCard.orders.bag_width || 0,
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={handleCancel}
        >
          <ArrowLeft size={16} />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Printer className="h-6 w-6" />
            Printing Job
          </h1>
          <p className="text-muted-foreground">
            {selectedJobId ? "Update" : "Create"} printing job for {jobCard.job_name}
          </p>
        </div>
      </div>

      {existingJobs.length > 0 && (
        <div className="border rounded-lg p-4 bg-card">
          <h2 className="text-lg font-medium mb-2">Existing Printing Jobs</h2>
          <div className="flex flex-wrap gap-2">
            {existingJobs.map((job) => (
              <Button
                key={job.id}
                variant={selectedJobId === job.id ? "default" : "outline"}
                onClick={() => handleSelectJob(job.id)}
                size="sm"
              >
                {job.worker_name || "Untitled Job"} ({job.status})
              </Button>
            ))}
            <Button
              variant={!selectedJobId ? "default" : "outline"}
              onClick={handleNewJob}
              size="sm"
            >
              + New Job
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 border rounded-lg p-4 bg-card">
          <h2 className="text-lg font-medium mb-2">Order Information</h2>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">Order #:</span>
              <p className="font-medium">{jobCard.orders.order_number}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Company:</span>
              <p className="font-medium">{jobCard.orders.company_name}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Quantity:</span>
              <p className="font-medium">{jobCard.orders.quantity}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Dimensions:</span>
              <p className="font-medium">
                {jobCard.orders.bag_length}x{jobCard.orders.bag_width}
              </p>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <PrintingJobForm
            initialData={initialData}
            bagDimensions={bagDimensions}
            cuttingJobReceivedQuantity={cuttingJobReceivedQuantity}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={submitting}
          />
        </div>
      </div>
    </div>
  );
}
