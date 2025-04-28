
import React from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, Scissors, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CuttingJobOrderInfo } from "./cutting/CuttingJobOrderInfo";
import { CuttingJobComponentForm } from "./cutting/CuttingJobComponentForm";
import { CuttingJobDetailsForm } from "./cutting/CuttingJobDetailsForm";
import { useCuttingJob } from "@/hooks/use-cutting-job";
import { Card, CardContent } from "@/components/ui/card";
import { JobStatus } from "@/types/production";

export default function CuttingJob() {
  const { id } = useParams<{ id: string }>();
  
  const {
    jobCard,
    loading,
    components,
    existingJobs,
    selectedJobId,
    cuttingData,
    componentData,
    submitting,
    validationError,
    setCuttingData,
    setComponentData,
    handleNewJob,
    handleSelectJob,
    handleSubmit,
    handleGoBack
  } = useCuttingJob(id || "");

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

  const handleWorkerSelect = (workerId: string) => {
    setCuttingData(prev => ({ ...prev, worker_name: workerId }));
  };

  const handleComponentChange = (index: number, field: string, value: string | JobStatus) => {
    setComponentData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleConsumptionCalculated = (meters: number) => {
    setCuttingData(prev => ({
      ...prev,
      consumption_meters: meters.toString()
    }));
  };

  const handleCreateNewJob = () => {
    handleNewJob();
    // Update URL to indicate we're creating a new job
    window.history.replaceState(
      null, 
      '', 
      `/production/cutting/${id}?new=true`
    );
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
        <Button onClick={() => window.location.href = "/production/job-cards"}>
          Return to Job Cards
        </Button>
      </div>
    );
  }

  // Show form if either:
  // 1. User is editing an existing job (selectedJobId is set)
  // 2. User is creating a new job (URL has ?new=true)
  // 3. There are no existing jobs yet
  const showForm = selectedJobId !== null || 
                  window.location.search.includes('new=true') || 
                  existingJobs.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="gap-1"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Scissors className="h-8 w-8" />
              Cutting Jobs
            </h1>
            <p className="text-muted-foreground">
              Manage cutting jobs for {jobCard.job_name}
            </p>
          </div>
        </div>
        <Button 
          onClick={handleCreateNewJob} 
          className="gap-2"
          type="button"
        >
          <Plus size={16} />
          New Cutting Job
        </Button>
      </div>

      {!showForm && existingJobs.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {existingJobs.map((job, index) => (
            <Card key={job.id} className="hover:border-primary transition-colors">
              <CardContent className="pt-6">
                <div className="mb-4">
                  <p className="font-medium">
                    Job {index + 1}{job.worker_name ? ` - ${job.worker_name}` : ''}
                  </p>
                  <p className="text-sm text-muted-foreground">Created: {new Date(job.created_at).toLocaleDateString()}</p>
                  <p className="text-sm text-muted-foreground">Status: {job.status}</p>
                </div>
                <Button 
                  onClick={() => handleSelectJob(job.id)}
                  className="w-full"
                >
                  Edit Cutting Job
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <form id="cutting-form" onSubmit={handleSubmit} className="space-y-6 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <CuttingJobOrderInfo order={jobCard.orders} />
            <div className="lg:col-span-2">
              <CuttingJobDetailsForm
                cuttingData={cuttingData}
                validationError={validationError}
                orderInfo={{
                  bag_length: jobCard.orders.bag_length,
                  bag_width: jobCard.orders.bag_width,
                  quantity: jobCard.orders.quantity
                }}
                onInputChange={handleInputChange}
                onCheckboxChange={handleCheckboxChange}
                onSelectChange={handleSelectChange}
                onWorkerSelect={handleWorkerSelect}
                onConsumptionCalculated={handleConsumptionCalculated}
              />
            </div>
          </div>
          
          <CuttingJobComponentForm
            components={components}
            componentData={componentData}
            handleComponentChange={handleComponentChange}
            handleGoBack={handleGoBack}
            submitting={submitting}
            selectedJobId={selectedJobId}
          />
        </form>
      )}
    </div>
  );
}
