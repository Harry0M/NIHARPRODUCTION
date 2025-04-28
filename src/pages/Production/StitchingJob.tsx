
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, PackageCheck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStitchingJob } from "@/hooks/use-stitching-job";
import { StitchingForm } from "@/components/production/stitching/StitchingForm";
import { Card, CardContent } from "@/components/ui/card";

export default function StitchingJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    loading,
    fetching,
    jobCard,
    existingJobs,
    selectedJobId,
    setSelectedJobId,
    handleSubmit
  } = useStitchingJob(id);
  const [showNewJobForm, setShowNewJobForm] = useState(false);

  if (fetching) {
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
              <PackageCheck className="h-8 w-8" />
              Stitching Jobs
            </h1>
            <p className="text-muted-foreground">
              Manage stitching jobs for {jobCard.job_name}
            </p>
          </div>
        </div>
        {!showNewJobForm && !selectedJobId && (
          <Button onClick={() => setShowNewJobForm(true)} className="gap-2">
            <Plus size={16} />
            New Stitching Job
          </Button>
        )}
      </div>

      {showNewJobForm && (
        <StitchingForm
          defaultValues={{
            total_quantity: jobCard.order && jobCard.order.quantity ? jobCard.order.quantity : null,
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
            rate: null
          }}
          onSubmit={async (values) => {
            const success = await handleSubmit(values);
            if (success) {
              setShowNewJobForm(false);
            }
          }}
          onCancel={() => setShowNewJobForm(false)}
          loading={loading}
          selectedJobId={null}
        />
      )}

      {!showNewJobForm && !selectedJobId && !fetching && existingJobs && existingJobs.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {existingJobs.map((job) => (
            <Card key={job.id} className="hover:border-primary transition-colors">
              <CardContent className="pt-6">
                <div className="mb-4">
                  <p className="font-medium">Job Details</p>
                  <p className="text-sm text-muted-foreground">Created: {new Date(job.created_at).toLocaleDateString()}</p>
                  <p className="text-sm text-muted-foreground">Status: {job.status}</p>
                  {job.worker_name && (
                    <p className="text-sm text-muted-foreground">Worker: {job.worker_name}</p>
                  )}
                </div>
                <Button 
                  onClick={() => setSelectedJobId(job.id)}
                  className="w-full"
                >
                  Edit Stitching Job
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedJobId && existingJobs && (
        <StitchingForm
          defaultValues={{
            ...existingJobs.find(job => job.id === selectedJobId)!,
            start_date: existingJobs.find(job => job.id === selectedJobId)!.start_date ? 
              new Date(existingJobs.find(job => job.id === selectedJobId)!.start_date!) : null,
            expected_completion_date: existingJobs.find(job => job.id === selectedJobId)!.expected_completion_date ?
              new Date(existingJobs.find(job => job.id === selectedJobId)!.expected_completion_date!) : null
          }}
          onSubmit={async (values) => {
            const success = await handleSubmit(values);
            if (success) {
              setSelectedJobId(null);
            }
          }}
          onCancel={() => setSelectedJobId(null)}
          loading={loading}
          selectedJobId={selectedJobId}
        />
      )}
    </div>
  );
}
