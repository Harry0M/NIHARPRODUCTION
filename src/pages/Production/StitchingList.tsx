
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, PackageCheck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StitchingStageList } from "@/components/production/stages/StitchingStageList";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/production/LoadingSpinner";

export default function StitchingList() {
  const navigate = useNavigate();
  
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['stitchingJobs'],
    queryFn: async () => {
      const { data: stitchingData, error: stitchingError } = await supabase
        .from('stitching_jobs')
        .select(`
          id,
          job_card_id,
          is_internal,
          worker_name,
          status,
          total_quantity,
          created_at,
          job_cards(
            id,
            job_name,
            job_number,
            orders(
              id,
              order_number,
              company_name,
              quantity,
              bag_length,
              bag_width
            )
          )
        `);
      
      if (stitchingError) throw stitchingError;
      
      // Format stitching jobs
      return stitchingData.map(job => {
        const orderData = job.job_cards?.orders;
        const progress = job.status === 'completed' ? 100 : 
                        job.status === 'in_progress' ? 50 : 20;
        
        return {
          id: job.id,
          jobCardId: job.job_card_id,
          order: orderData?.order_number || 'Unknown',
          product: orderData ? `Bag ${orderData.bag_length}×${orderData.bag_width}` : 'Unknown',
          quantity: job.total_quantity || (orderData?.quantity || 0),
          progress,
          worker: job.is_internal ? 'Internal Team' : job.worker_name || 'External',
          parts: progress > 50 ? 'Ready' : 'In Process',
          handles: progress > 70 ? 'Ready' : 'In Process',
          finishing: progress > 90 ? 'Ready' : 'Pending',
          status: job.status,
          daysLeft: Math.floor(Math.random() * 3) + 1,
          created_at: job.created_at
        };
      });
    }
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <PackageCheck className="h-8 w-8" />
            Stitching Jobs
          </h1>
          <p className="text-muted-foreground">
            Manage all stitching jobs across production
          </p>
        </div>
        <Button onClick={() => navigate("/production/job-cards/new")} className="gap-2">
          <Plus size={16} />
          New Job Card
        </Button>
      </div>

      {jobs && jobs.length > 0 ? (
        <StitchingStageList jobs={jobs} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No active stitching jobs found</p>
            <Link to="/production/job-cards/new">
              <Button>Create a new job card</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
