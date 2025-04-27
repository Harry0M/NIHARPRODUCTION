
import { useNavigate, useParams } from "react-router-dom";
import { JobCardInfo } from "@/components/production/stitching/JobCardInfo";
import { StitchingForm } from "@/components/production/stitching/StitchingForm";
import { useStitchingJob } from "@/hooks/use-stitching-job";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Scissors, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const StitchingJob = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const {
    loading: fetching,
    jobCard,
    existingJobs,
    selectedJobId,
    setSelectedJobId,
    handleSubmit
  } = useStitchingJob(id);

  const handleSelectJob = (jobId: string) => {
    setSelectedJobId(jobId);
  };

  const createNewJob = () => {
    setSelectedJobId(null);
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

  if (fetching) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/production/job-cards/${id}`)}
            className="gap-1"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Scissors className="h-8 w-8" /> {/* Replaced Stitch with Scissors */}
              Stitching Jobs
            </h1>
            <p className="text-muted-foreground">
              {jobCard ? `Manage stitching jobs for ${jobCard.job_name}` : 'Loading...'}
            </p>
          </div>
        </div>
        {!selectedJobId && (
          <Button onClick={createNewJob} className="gap-2">
            <Plus size={16} />
            New Stitching Job
          </Button>
        )}
      </div>

      {jobCard && (
        <>
          {!selectedJobId && existingJobs.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {existingJobs.map((job) => (
                <Card key={job.id} className="hover:border-primary transition-colors">
                  <CardContent className="pt-6">
                    <div className="mb-4">
                      <p className="font-medium">Job Details</p>
                      <p className="text-sm text-muted-foreground">Created: {new Date(job.created_at!).toLocaleDateString()}</p>
                      <p className="text-sm text-muted-foreground">Status: {job.status}</p>
                    </div>
                    <Button 
                      onClick={() => handleSelectJob(job.id)}
                      className="w-full"
                    >
                      Edit Stitching Job
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {(selectedJobId || (!existingJobs || existingJobs.length === 0)) && (
            <>
              <JobCardInfo
                jobName={jobCard.job_name}
                orderNumber={jobCard.order.order_number}
                companyName={jobCard.order.company_name}
                quantity={jobCard.order.quantity}
              />

              <StitchingForm
                defaultValues={getInitialFormValues()}
                onSubmit={async (values) => {
                  const success = await handleSubmit(values);
                  if (success) {
                    navigate(`/production/job-cards/${id}`);
                  }
                }}
                onCancel={() => navigate(`/production/job-cards/${id}`)}
                loading={fetching}
                selectedJobId={selectedJobId}
              />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default StitchingJob;
