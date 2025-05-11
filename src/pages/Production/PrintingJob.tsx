
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, Printer, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { usePrintingJob } from "@/hooks/use-printing-job";
import { JobStatus, PrintingJobData } from "@/types/production";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PrintingJobForm } from "@/components/production/printing/PrintingJobForm";
import { Card, CardContent } from "@/components/ui/card";

export default function PrintingJob() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { submitting, createPrintingJob, updatePrintingJob } = usePrintingJob();
  const [showNewJobForm, setShowNewJobForm] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const { data: jobCard, isLoading: jobCardLoading } = useQuery({
    queryKey: ['job-card', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_cards')
        .select(`
          id,
          job_name,
          orders (
            id,
            company_name,
            order_number,
            quantity,
            bag_length,
            bag_width
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    }
  });

  const { data: printingJobs, isLoading: printingJobsLoading } = useQuery({
    queryKey: ['printing-jobs', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('printing_jobs')
        .select('*')
        .eq('job_card_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });
  
  // Query to get cutting jobs for this job card
  const { data: cuttingJobs, isLoading: cuttingJobsLoading } = useQuery({
    queryKey: ['cutting-jobs', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cutting_jobs')
        .select('*')
        .eq('job_card_id', id);

      if (error) throw error;
      return data;
    }
  });

  // Calculate the total cutting quantity and allocated quantity
  const totalCuttingQuantity = cuttingJobs?.reduce((total, job) => 
    total + (job.received_quantity || 0), 0) || 0;
  
  // Calculate the total allocated to printing jobs so far
  const totalAllocatedQuantity = printingJobs?.reduce((total, job) => 
    total + (Number(job.pulling) || 0), 0) || 0;
  
  // Calculate remaining unallocated quantity from cutting jobs
  const remainingQuantity = totalCuttingQuantity - totalAllocatedQuantity;

  const handleSubmit = async (formData: PrintingJobData) => {
    try {
      // Before saving, validate the quantity allocation if this is a new pulling
      const pullingQty = Number(formData.pulling) || 0;
      const currentJobPulling = formData.id 
        ? (printingJobs?.find(job => job.id === formData.id)?.pulling || "0") 
        : "0";
      const currentPullingQty = Number(currentJobPulling) || 0;
      
      // Calculate the net change in allocation
      const netAllocationChange = pullingQty - currentPullingQty;
      
      // Check if we have enough quantity left to allocate
      if (netAllocationChange > remainingQuantity) {
        toast({
          title: "Quantity Allocation Error",
          description: `You're trying to allocate ${netAllocationChange} units, but only ${remainingQuantity} are available.`,
          variant: "destructive"
        });
        return;
      }

      const printingJobData: PrintingJobData = {
        ...formData,
        job_card_id: id!,
        sheet_length: String(formData.sheet_length),
        sheet_width: String(formData.sheet_width),
        rate: String(formData.rate || '0'),
        pulling: String(formData.pulling || '0'),
        received_quantity: formData.received_quantity || "0", 
      };

      if (formData.id) {
        await updatePrintingJob(formData.id, printingJobData);
        toast({
          title: "Success",
          description: "Printing job updated successfully",
        });
      } else {
        await createPrintingJob(id!, printingJobData);
        toast({
          title: "Success",
          description: "Printing job created successfully",
        });
        setShowNewJobForm(false);
      }
      
      setSelectedJobId(null);
      queryClient.invalidateQueries({ queryKey: ['printing-jobs', id] });
    } catch (error: any) {
      toast({
        title: "Error saving printing job",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (jobCardLoading) {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = `/production/job-cards/${id}`}
            className="gap-1"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Printer className="h-8 w-8" />
              Printing Jobs
            </h1>
            <p className="text-muted-foreground">
              Manage printing jobs for {jobCard.job_name}
            </p>
          </div>
        </div>
        {!showNewJobForm && !selectedJobId && (
          <Button onClick={() => setShowNewJobForm(true)} className="gap-2">
            <Plus size={16} />
            New Printing Job
          </Button>
        )}
      </div>
      
      {/* Summary Card for Quantities */}
      {!showNewJobForm && !selectedJobId && (
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-background p-4 rounded-lg border shadow-sm">
                <h3 className="font-semibold text-lg mb-1">Total Cutting Quantity</h3>
                <p className="text-2xl font-bold">{totalCuttingQuantity}</p>
              </div>
              
              <div className="bg-background p-4 rounded-lg border shadow-sm">
                <h3 className="font-semibold text-lg mb-1">Allocated to Printing</h3>
                <p className="text-2xl font-bold">{totalAllocatedQuantity}</p>
              </div>
              
              <div className={`bg-background p-4 rounded-lg border shadow-sm ${remainingQuantity < 0 ? 'border-red-500' : ''}`}>
                <h3 className="font-semibold text-lg mb-1">Remaining Available</h3>
                <p className={`text-2xl font-bold ${remainingQuantity < 0 ? 'text-red-500' : ''}`}>
                  {remainingQuantity}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {showNewJobForm && (
        <PrintingJobForm
          bagDimensions={{
            length: jobCard.orders.bag_length,
            width: jobCard.orders.bag_width
          }}
          onSubmit={handleSubmit}
          onCancel={() => setShowNewJobForm(false)}
          isSubmitting={submitting}
          totalCuttingQuantity={totalCuttingQuantity}
          remainingQuantity={remainingQuantity}
        />
      )}

      {!showNewJobForm && !selectedJobId && !printingJobsLoading && printingJobs && printingJobs.length > 0 && (
        <div className="space-y-4">
          <div className="rounded-md border">
            <div className="bg-muted/50 p-4 grid grid-cols-12 font-medium">
              <div className="col-span-2">Job ID</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-3">Quantities</div>
              <div className="col-span-3">Actions</div>
            </div>
            {printingJobs.map((job, index) => {
              // Format job title with worker name and quantity like stitching jobs
              const jobTitle = job.worker_name ? 
                `${job.worker_name} - ${job.received_quantity || 0} pcs` : 
                `Job ${index + 1} - ${job.received_quantity || 0} pcs`;
              const sheetSize = job.sheet_length && job.sheet_width ? 
                `${job.sheet_length}×${job.sheet_width}` : 'N/A';
              
              return (
                <div key={job.id} className="p-4 border-t grid grid-cols-12 items-center hover:bg-muted/20 transition-colors">
                  <div className="col-span-2">
                    <p className="font-medium">{jobTitle}</p>
                    {job.worker_name && <p className="text-xs text-muted-foreground">Worker: {job.worker_name}</p>}
                  </div>
                  <div className="col-span-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${job.status === 'completed' ? 'bg-green-100 text-green-700' : job.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {job.status === 'in_progress' ? 'In Progress' : job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground">
                    {new Date(job.created_at).toLocaleDateString()}
                  </div>
                  <div className="col-span-3 space-y-1">
                    {job.pulling && (
                      <p className="text-sm"><span className="font-medium">Pulling:</span> {job.pulling}</p>
                    )}
                    {job.received_quantity && (
                      <p className="text-sm"><span className="font-medium">Received:</span> {job.received_quantity}</p>
                    )}
                    <p className="text-sm"><span className="font-medium">Sheet:</span> {sheetSize}</p>
                    {job.rate && (
                      <p className="text-sm"><span className="font-medium">Rate:</span> {job.rate}</p>
                    )}
                  </div>
                  <div className="col-span-3 flex justify-end">
                    <Button
                      onClick={() => setSelectedJobId(job.id)}
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

      {selectedJobId && printingJobs && (
        <PrintingJobForm
          initialData={{
            ...printingJobs.find(job => job.id === selectedJobId)!,
            // Convert numeric database values to strings for the form
            sheet_length: String(printingJobs.find(job => job.id === selectedJobId)!.sheet_length || ''),
            sheet_width: String(printingJobs.find(job => job.id === selectedJobId)!.sheet_width || ''),
            rate: String(printingJobs.find(job => job.id === selectedJobId)!.rate || ''),
            pulling: String(printingJobs.find(job => job.id === selectedJobId)!.pulling || ''),
            received_quantity: printingJobs.find(job => job.id === selectedJobId)!.received_quantity !== null ? 
              String(printingJobs.find(job => job.id === selectedJobId)!.received_quantity) : ''
          }}
          bagDimensions={{
            length: jobCard.orders.bag_length,
            width: jobCard.orders.bag_width
          }}
          onSubmit={handleSubmit}
          onCancel={() => setSelectedJobId(null)}
          isSubmitting={submitting}
          totalCuttingQuantity={totalCuttingQuantity}
          remainingQuantity={remainingQuantity + (Number(printingJobs.find(job => job.id === selectedJobId)!.pulling) || 0)}
        />
      )}
    </div>
  );
}
