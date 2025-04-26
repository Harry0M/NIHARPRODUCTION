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

export default function PrintingJob() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { submitting, createPrintingJob, updatePrintingJob } = usePrintingJob();
  const [showNewJobForm, setShowNewJobForm] = useState(true);

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

  const handleSubmit = async (formData: PrintingJobData) => {
    try {
      // Ensure all numeric fields are converted to strings
      const printingJobData: PrintingJobData = {
        ...formData,
        job_card_id: id!, // Use the id from params as job_card_id
        sheet_length: String(formData.sheet_length),
        sheet_width: String(formData.sheet_width),
        rate: String(formData.rate || '0'),
      };

      if (formData.id) {
        // Update existing job
        await updatePrintingJob(formData.id, printingJobData);
        toast({
          title: "Success",
          description: "Printing job updated successfully",
        });
      } else {
        // Create new job
        await createPrintingJob(id!, printingJobData);
        toast({
          title: "Success",
          description: "Printing job created successfully",
        });
        setShowNewJobForm(false);
      }
      
      // Force refresh data
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
        {!showNewJobForm && (
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
        />
      )}

      {!printingJobsLoading && printingJobs && printingJobs.length > 0 && (
        <div className="grid gap-4">
          {printingJobs.map((job) => (
            <PrintingJobForm
              key={job.id}
              initialData={{
                id: job.id,
                job_card_id: job.job_card_id,
                pulling: job.pulling || "",
                gsm: job.gsm || "",
                sheet_length: String(job.sheet_length || ""),
                sheet_width: String(job.sheet_width || ""),
                worker_name: job.worker_name || "",
                is_internal: job.is_internal || false,
                rate: String(job.rate || '0'),
                status: job.status || "pending",
                expected_completion_date: job.expected_completion_date || "",
                print_image: job.print_image || ""
              }}
              bagDimensions={{
                length: jobCard.orders.bag_length,
                width: jobCard.orders.bag_width
              }}
              onSubmit={handleSubmit}
              onCancel={() => {}}
              isSubmitting={submitting}
            />
          ))}
        </div>
      )}
    </div>
  );
}
