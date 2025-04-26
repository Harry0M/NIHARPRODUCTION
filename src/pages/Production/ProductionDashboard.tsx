
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/production/LoadingSpinner";
import { StageCard } from "@/components/production/StageCard";
import { CuttingStageList } from "@/components/production/stages/CuttingStageList";
import { PrintingStageList } from "@/components/production/stages/PrintingStageList";
import { StitchingStageList } from "@/components/production/stages/StitchingStageList";
import { DispatchStageList } from "@/components/production/stages/DispatchStageList";
import { JobsData, JobStatus } from "@/types/production";

const ProductionDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "cutting";
  const [jobs, setJobs] = useState<JobsData>({
    cutting: [],
    printing: [],
    stitching: [],
    dispatch: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductionData = async () => {
      try {
        setLoading(true);
        
        // Fetch cutting jobs
        const { data: cuttingData, error: cuttingError } = await supabase
          .from('cutting_jobs')
          .select(`
            id,
            job_card_id,
            is_internal,
            worker_name,
            status,
            roll_width,
            consumption_meters,
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
        
        if (cuttingError) throw cuttingError;
        
        // Fetch printing jobs
        const { data: printingData, error: printingError } = await supabase
          .from('printing_jobs')
          .select(`
            id,
            job_card_id,
            is_internal,
            worker_name,
            status,
            gsm,
            pulling,
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
        
        if (printingError) throw printingError;
        
        // Fetch stitching jobs
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
        
        // For dispatch, fetch orders ready for dispatch
        const { data: dispatchOrders, error: dispatchError } = await supabase
          .from('orders')
          .select('*')
          .eq('status', 'ready_for_dispatch');
        
        if (dispatchError) throw dispatchError;

        // Format cutting jobs
        const formattedCuttingJobs = cuttingData.map(job => {
          const orderData = job.job_cards?.orders;
          const progress = job.status === 'completed' ? 100 : 
                          job.status === 'in_progress' ? 50 : 20;
          
          return {
            id: job.id,
            jobCardId: job.job_card_id,
            order: orderData?.order_number || 'Unknown',
            product: orderData ? `Bag ${orderData.bag_length}×${orderData.bag_width}` : 'Unknown',
            quantity: orderData?.quantity || 0,
            progress,
            worker: job.is_internal ? 'Internal Team' : job.worker_name || 'External',
            material: 'Canvas - 150 GSM',
            consumption: job.consumption_meters || 0,
            status: job.status as JobStatus,
            daysLeft: Math.floor(Math.random() * 5) + 1, // Placeholder for urgency
            created_at: job.created_at
          };
        });

        // Format printing jobs
        const formattedPrintingJobs = printingData.map(job => {
          const orderData = job.job_cards?.orders;
          const progress = job.status === 'completed' ? 100 : 
                          job.status === 'in_progress' ? 50 : 20;
          
          return {
            id: job.id,
            jobCardId: job.job_card_id,
            order: orderData?.order_number || 'Unknown',
            product: orderData ? `Bag ${orderData.bag_length}×${orderData.bag_width}` : 'Unknown',
            quantity: orderData?.quantity || 0,
            progress,
            worker: job.is_internal ? 'Internal Team' : job.worker_name || 'External',
            design: '2 Color Print - Logo Front',
            screenStatus: 'Ready',
            status: job.status as JobStatus,
            daysLeft: Math.floor(Math.random() * 5) + 1,
            created_at: job.created_at
          };
        });

        // Format stitching jobs
        const formattedStitchingJobs = stitchingData.map(job => {
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
            status: job.status as JobStatus,
            daysLeft: Math.floor(Math.random() * 3) + 1,
            created_at: job.created_at
          };
        });

        // Format dispatch jobs - treat orders ready_for_dispatch as dispatch jobs
        const formattedDispatchJobs = (dispatchOrders || []).map(order => ({
          id: order.id,
          jobCardId: order.id, // For UI consistency using order id
          order: order.order_number,
          product: `Bag ${order.bag_length}×${order.bag_width}`,
          quantity: order.quantity,
          progress: 100,
          worker: 'Internal Team',
          status: 'pending' as JobStatus, // Convert string to JobStatus type
          created_at: order.created_at
        }));

        setJobs({
          cutting: formattedCuttingJobs,
          printing: formattedPrintingJobs,
          stitching: formattedStitchingJobs,
          dispatch: formattedDispatchJobs
        });
      } catch (error: any) {
        console.error('Error fetching production data:', error);
        toast({
          title: "Failed to load production data",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProductionData();
  }, []);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Production</h1>
        <p className="text-muted-foreground">Monitor and manage production stages</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StageCard
          title="Cutting"
          count={jobs.cutting.length}
          path="/production?tab=cutting"
          isActive={initialTab === 'cutting'}
          description="Active jobs in cutting stage"
        />
        <StageCard
          title="Printing"
          count={jobs.printing.length}
          path="/production?tab=printing"
          isActive={initialTab === 'printing'}
          description="Active jobs in printing stage"
        />
        <StageCard
          title="Stitching"
          count={jobs.stitching.length}
          path="/production?tab=stitching"
          isActive={initialTab === 'stitching'}
          description="Active jobs in stitching stage"
        />
        <StageCard
          title="Dispatch"
          count={jobs.dispatch.length}
          path="/production?tab=dispatch"
          isActive={initialTab === 'dispatch'}
          description="Orders ready for dispatch"
        />
      </div>

      <Tabs defaultValue={initialTab} className="space-y-4" onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="cutting">Cutting</TabsTrigger>
          <TabsTrigger value="printing">Printing</TabsTrigger>
          <TabsTrigger value="stitching">Stitching</TabsTrigger>
          <TabsTrigger value="dispatch">Dispatch</TabsTrigger>
        </TabsList>
        
        <TabsContent value="cutting">
          <CuttingStageList jobs={jobs.cutting} />
        </TabsContent>
        
        <TabsContent value="printing">
          <PrintingStageList jobs={jobs.printing} />
        </TabsContent>
        
        <TabsContent value="stitching">
          <StitchingStageList jobs={jobs.stitching} />
        </TabsContent>
        
        <TabsContent value="dispatch">
          <DispatchStageList jobs={jobs.dispatch} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductionDashboard;
