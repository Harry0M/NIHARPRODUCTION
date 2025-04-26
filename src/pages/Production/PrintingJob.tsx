import { useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { usePrintImage } from "@/hooks/use-print-image";
import { JobStatus } from "@/types/production";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function PrintingJob() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { uploading, uploadImage } = usePrintImage();
  const [submitting, setSubmitting] = useState(false);

  const [printingData, setPrintingData] = useState({
    pulling: "",
    gsm: "",
    sheet_length: "",
    sheet_width: "",
    worker_name: "",
    is_internal: true,
    rate: "",
    status: "pending" as JobStatus,
    expected_completion_date: "",
    print_image: ""
  });

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

  const { data: existingJob, isLoading: existingJobLoading } = useQuery({
    queryKey: ['printing-job', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('printing_jobs')
        .select('*')
        .eq('job_card_id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  const createPrintingJob = useMutation({
    mutationFn: async (data: typeof printingData) => {
      const { error } = await supabase
        .from('printing_jobs')
        .insert({
          job_card_id: id,
          ...data,
          sheet_length: data.sheet_length ? parseFloat(data.sheet_length) : null,
          sheet_width: data.sheet_width ? parseFloat(data.sheet_width) : null,
          rate: data.rate ? parseFloat(data.rate) : null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['printing-job', id] });
      toast({
        title: "Success",
        description: "Printing job created successfully",
      });
      window.location.href = `/production/job-cards/${id}`;
    },
    onError: (error: any) => {
      toast({
        title: "Error creating printing job",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updatePrintingJob = useMutation({
    mutationFn: async (data: typeof printingData) => {
      const { error } = await supabase
        .from('printing_jobs')
        .update({
          ...data,
          sheet_length: data.sheet_length ? parseFloat(data.sheet_length) : null,
          sheet_width: data.sheet_width ? parseFloat(data.sheet_width) : null,
          rate: data.rate ? parseFloat(data.rate) : null,
        })
        .eq('job_card_id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['printing-job', id] });
      toast({
        title: "Success",
        description: "Printing job updated successfully",
      });
      window.location.href = `/production/job-cards/${id}`;
    },
    onError: (error: any) => {
      toast({
        title: "Error updating printing job",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (existingJob) {
        await updatePrintingJob.mutateAsync(printingData);
      } else {
        await createPrintingJob.mutateAsync(printingData);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      setPrintingData(prev => ({
        ...prev,
        print_image: imageUrl
      }));
    }
  };

  if (jobCardLoading || existingJobLoading) {
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
            Printing Job
          </h1>
          <p className="text-muted-foreground">
            Create printing job for {jobCard?.job_name}
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
            <CardDescription>Details from the original order</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Order Number</Label>
                <p className="text-lg">{jobCard?.orders?.order_number}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Company</Label>
                <p className="text-lg">{jobCard?.orders?.company_name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Quantity</Label>
                <p className="text-lg">{jobCard?.orders?.quantity.toLocaleString()} bags</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Bag Size</Label>
                <p className="text-lg">{jobCard?.orders?.bag_length} × {jobCard?.orders?.bag_width} inches</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Printing Details</CardTitle>
              <CardDescription>Enter the printing job specifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="pulling">Pulling</Label>
                  <Input
                    id="pulling"
                    value={printingData.pulling}
                    onChange={(e) => setPrintingData(prev => ({ ...prev, pulling: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gsm">GSM</Label>
                  <Input
                    id="gsm"
                    value={printingData.gsm}
                    onChange={(e) => setPrintingData(prev => ({ ...prev, gsm: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rate">Rate</Label>
                  <Input
                    id="rate"
                    type="number"
                    value={printingData.rate}
                    onChange={(e) => setPrintingData(prev => ({ ...prev, rate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="sheet_length">Sheet Length</Label>
                  <Input
                    id="sheet_length"
                    type="number"
                    value={printingData.sheet_length}
                    onChange={(e) => setPrintingData(prev => ({ ...prev, sheet_length: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sheet_width">Sheet Width</Label>
                  <Input
                    id="sheet_width"
                    type="number"
                    value={printingData.sheet_width}
                    onChange={(e) => setPrintingData(prev => ({ ...prev, sheet_width: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="print_image">Print Design Image</Label>
                <div className="grid gap-4">
                  <Input
                    id="print_image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={uploading}
                  />
                  {printingData.print_image && (
                    <img 
                      src={printingData.print_image} 
                      alt="Print design preview" 
                      className="max-w-sm rounded-lg border"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Worker Name</Label>
                  <Input
                    value={printingData.worker_name}
                    onChange={(e) => setPrintingData(prev => ({ ...prev, worker_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={printingData.status}
                    onValueChange={(value: JobStatus) => 
                      setPrintingData(prev => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Expected Completion Date</Label>
                  <Input
                    type="date"
                    value={printingData.expected_completion_date}
                    onChange={(e) => setPrintingData(prev => ({ 
                      ...prev, 
                      expected_completion_date: e.target.value 
                    }))}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.location.href = `/production/job-cards/${id}`}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : (existingJob ? "Update" : "Create")} Printing Job
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
