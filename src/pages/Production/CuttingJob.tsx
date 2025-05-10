
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, Scissors, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CuttingJobOrderInfo } from "./CuttingJobOrderInfo";
import { CuttingJobSelection } from "./CuttingJobSelection";
import { CuttingJobComponentForm } from "./CuttingJobComponentForm";
import { CuttingDetailsForm } from "@/components/production/cutting/CuttingDetailsForm";
import { useCuttingJob } from "@/hooks/use-cutting-job";

export default function CuttingJob() {
  const { id } = useParams();
  
  const {
    jobCard,
    loading,
    components,
    existingJobs,
    selectedJobId,
    cuttingData,
    componentData,
    validationError,
    submitting,
    setCuttingData,
    setComponentData,
    handleSelectJob,
    handleNewJob,
    handleSubmit
  } = useCuttingJob(id || "");
  
  // Add state to track if we're showing a new job form
  const [showNewJobForm, setShowNewJobForm] = useState(false);

  // Reset form visibility when selection changes
  useEffect(() => {
    if (selectedJobId) {
      setShowNewJobForm(false);
    }
  }, [selectedJobId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCuttingData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: any) => {
    setCuttingData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setCuttingData(prev => ({ ...prev, is_internal: checked }));
  };

  const handleWorkerSelect = (workerId: string) => {
    setCuttingData(prev => ({ ...prev, worker_name: workerId }));
  };

  const handleComponentChange = (index: number, field: string, value: string) => {
    setComponentData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleGoBack = () => {
    window.location.href = `/production/job-cards/${id}`;
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

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={handleGoBack}
            type="button"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Scissors className="h-6 w-6" />
              Cutting Jobs
            </h1>
            <p className="text-muted-foreground">
              Manage cutting jobs for {jobCard?.job_name}
            </p>
          </div>
        </div>
        {!showNewJobForm && !selectedJobId && (
          <Button 
            className="gap-2" 
            onClick={() => {
              setShowNewJobForm(true);
              handleNewJob();
            }}
          >
            <Plus size={16} />
            New Cutting Job
          </Button>
        )}
      </div>

      {!showNewJobForm && !selectedJobId && existingJobs.length > 0 && (
        <div className="space-y-4">
          <div className="rounded-md border">
            <div className="bg-muted/50 p-4 grid grid-cols-12 font-medium">
              <div className="col-span-3">Worker & Quantity</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Created</div>
              <div className="col-span-3">Details</div>
              <div className="col-span-2">Actions</div>
            </div>
            {existingJobs.map((job, index) => {
              // Format job title with worker name and quantity
              const jobTitle = job.worker_name ? 
                `${job.worker_name} - ${job.received_quantity || 0} pcs` : 
                `Cutting Job ${index + 1}`;
              
              return (
                <div key={job.id} className="p-4 border-t grid grid-cols-12 items-center hover:bg-muted/20 transition-colors">
                  <div className="col-span-3">
                    <p className="font-medium">{jobTitle}</p>
                  </div>
                  <div className="col-span-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${job.status === 'completed' ? 'bg-green-100 text-green-700' : job.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {job.status === 'in_progress' ? 'In Progress' : job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground">
                    {job.created_at && new Date(job.created_at).toLocaleDateString()}
                  </div>
                  <div className="col-span-3 space-y-1">
                    {job.received_quantity && (
                      <p className="text-sm"><span className="font-medium">Quantity:</span> {job.received_quantity}</p>
                    )}
                    {job.roll_width && (
                      <p className="text-sm"><span className="font-medium">Roll Width:</span> {job.roll_width}</p>
                    )}
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <Button
                      onClick={() => handleSelectJob(job.id)}
                      size="sm"
                      className="gap-1"
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(showNewJobForm || selectedJobId) && (
        <form id="cutting-form" onSubmit={handleSubmit} className="space-y-6 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <CuttingJobOrderInfo order={jobCard.order} />
            
            <div className="lg:col-span-2">
              <CuttingDetailsForm
                cuttingData={cuttingData}
                validationError={validationError}
                orderInfo={{
                  bag_length: jobCard.order.bag_length,
                  bag_width: jobCard.order.bag_width,
                  quantity: jobCard.order.quantity
                }}
                onInputChange={handleInputChange}
                onCheckboxChange={handleCheckboxChange}
                onSelectChange={handleSelectChange}
                onWorkerSelect={handleWorkerSelect}
              />
            </div>
          </div>
          
          <CuttingJobComponentForm
            components={components}
            componentData={componentData}
            handleComponentChange={handleComponentChange}
            handleGoBack={() => {
              if (selectedJobId) {
                // If editing, just clear selection
                handleSelectJob('');
              } else {
                // If creating new, hide form
                setShowNewJobForm(false);
              }
            }}
            submitting={submitting}
            selectedJobId={selectedJobId}
          />
        </form>
      )}
    </div>
  );
}
