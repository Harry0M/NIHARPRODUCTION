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

  const handleSubmit = async (formData: PrintingJobData) => {
    try {
      const printingJobData: PrintingJobData = {
        ...formData,
        job_card_id: id!,
        sheet_length: String(formData.sheet_length),
        sheet_width: String(formData.sheet_width),
        rate: String(formData.rate || '0'),
        received_quantity: formData.received_quantity || "0", // Ensure received_quantity is always a string value
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
      
      {showNewJobForm && (
        <PrintingJobForm
          bagDimensions={{
            length: jobCard.orders.bag_length,
            width: jobCard.orders.bag_width
          }}
          onSubmit={handleSubmit}
          onCancel={() => setShowNewJobForm(false)}
          isSubmitting={submitting}
          totalCuttingQuantity={cuttingJobs?.reduce((total, job) => 
            total + (job.received_quantity || 0), 0) || 0}
        />
      )}

      {!showNewJobForm && !selectedJobId && !printingJobsLoading && printingJobs && printingJobs.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {printingJobs.map((job) => (
            <Card key={job.id} className="hover:border-primary transition-colors">
              <CardContent className="pt-6">
                <div className="mb-4">
                  <p className="font-medium">Job Details</p>
                  <p className="text-sm text-muted-foreground">Created: {new Date(job.created_at).toLocaleDateString()}</p>
                  <p className="text-sm text-muted-foreground">Status: {job.status}</p>
                  
                  {/* Display received quantity */}
                  {job.received_quantity && (
                    <div className="mt-2 border-t pt-2">
                      <p className="font-medium text-primary">Received Quantity: {job.received_quantity}</p>
                    </div>
                  )}
                </div>
                <Button 
                  onClick={() => setSelectedJobId(job.id)}
                  className="w-full"
                >
                  Edit Printing Job
                </Button>
              </CardContent>
            </Card>
          ))}
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
          totalCuttingQuantity={cuttingJobs?.reduce((total, job) => 
            total + (job.received_quantity || 0), 0) || 0}
        />
      )}
    </div>
  );
}
