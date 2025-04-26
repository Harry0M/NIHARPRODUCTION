
import { useNavigate, useParams } from "react-router-dom";
import { JobSelection } from "@/components/production/stitching/JobSelection";
import { JobCardInfo } from "@/components/production/stitching/JobCardInfo";
import { StitchingForm } from "@/components/production/stitching/StitchingForm";
import { JobHeader } from "@/components/production/stitching/JobHeader";
import { useStitchingJob } from "@/hooks/use-stitching-job";

const StitchingJob = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const {
    loading,
    fetching,
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
      <JobHeader onBack={() => navigate(`/production/job-cards/${id}`)} />

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
            onSubmit={async (values) => {
              const success = await handleSubmit(values);
              if (success) {
                navigate(`/production/job-cards/${id}`);
              }
            }}
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
