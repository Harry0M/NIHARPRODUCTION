
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DispatchForm } from "@/components/production/DispatchForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface ProductionStage {
  name: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  completedDate?: string;
}

const DispatchDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<{
    id: string;
    orderNumber: string;
    companyName: string;
    quantity: number;
    stages: ProductionStage[];
  } | null>(null);

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch the order and job card details
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          id, 
          order_number,
          company_name,
          quantity,
          job_cards (
            id,
            status,
            cutting_jobs (status, updated_at),
            printing_jobs (status, updated_at),
            stitching_jobs (status, updated_at)
          )
        `)
        .eq('id', id)
        .single();

      if (orderError) throw orderError;
      
      // Transform the data to the format expected by the DispatchForm
      const stages: ProductionStage[] = [];
      
      if (orderData?.job_cards && orderData.job_cards.length > 0) {
        // Add an overall job card stage
        stages.push({
          name: "Job Card Created",
          status: "completed",
          completedDate: orderData.job_cards[0].updated_at
        });
        
        // Process cutting jobs
        const cuttingJobs = orderData.job_cards.flatMap(card => card.cutting_jobs || []);
        if (cuttingJobs.length > 0) {
          const allCompleted = cuttingJobs.every(job => job.status === "completed");
          stages.push({
            name: "Cutting",
            status: allCompleted ? "completed" : 
                   cuttingJobs.some(job => job.status === "in_progress") ? "in_progress" : "pending",
            completedDate: allCompleted ? cuttingJobs[cuttingJobs.length - 1].updated_at : undefined
          });
        }
        
        // Process printing jobs
        const printingJobs = orderData.job_cards.flatMap(card => card.printing_jobs || []);
        if (printingJobs.length > 0) {
          const allCompleted = printingJobs.every(job => job.status === "completed");
          stages.push({
            name: "Printing",
            status: allCompleted ? "completed" : 
                   printingJobs.some(job => job.status === "in_progress") ? "in_progress" : "pending",
            completedDate: allCompleted ? printingJobs[printingJobs.length - 1].updated_at : undefined
          });
        }
        
        // Process stitching jobs
        const stitchingJobs = orderData.job_cards.flatMap(card => card.stitching_jobs || []);
        if (stitchingJobs.length > 0) {
          const allCompleted = stitchingJobs.every(job => job.status === "completed");
          stages.push({
            name: "Stitching",
            status: allCompleted ? "completed" : 
                   stitchingJobs.some(job => job.status === "in_progress") ? "in_progress" : "pending",
            completedDate: allCompleted ? stitchingJobs[stitchingJobs.length - 1].updated_at : undefined
          });
        }
      }
      
      setOrderData({
        id: orderData.id,
        orderNumber: orderData.order_number,
        companyName: orderData.company_name,
        quantity: orderData.quantity,
        stages
      });
    } catch (error: any) {
      toast({
        title: "Error fetching order details",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDispatchSubmit = async (dispatchData: {
    delivery_date: string;
    tracking_number: string;
    recipient_name: string;
    delivery_address: string;
    notes: string;
    confirm_quality_check: boolean;
    confirm_quantity_check: boolean;
  }) => {
    try {
      if (!orderData?.id) throw new Error("Order data is missing");
      
      // First, create the dispatch record
      const { data: dispatchData, error: dispatchError } = await supabase
        .from('order_dispatches')
        .insert({
          order_id: orderData.id,
          delivery_date: dispatchData.delivery_date,
          tracking_number: dispatchData.tracking_number || null,
          recipient_name: dispatchData.recipient_name,
          delivery_address: dispatchData.delivery_address,
          notes: dispatchData.notes || null,
          quality_checked: dispatchData.confirm_quality_check,
          quantity_checked: dispatchData.confirm_quantity_check
        })
        .select()
        .single();
      
      if (dispatchError) throw dispatchError;
      
      // Update the order status to completed
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('id', orderData.id);
      
      if (updateError) throw updateError;
      
      toast({
        title: "Order dispatched successfully",
        description: `Order ${orderData.orderNumber} has been marked as dispatched.`
      });
      
      // Navigate back to the dispatch list
      navigate('/dispatch');
      
    } catch (error: any) {
      toast({
        title: "Failed to dispatch order",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading dispatch details...</p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Order not found</h1>
        <p className="text-muted-foreground">The requested order could not be found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dispatch Order</h1>
        <p className="text-muted-foreground">
          Complete dispatch information for order #{orderData.orderNumber}
        </p>
      </div>

      <DispatchForm 
        jobCardId="0" // Not required for this implementation
        orderNumber={orderData.orderNumber}
        companyName={orderData.companyName}
        quantity={orderData.quantity}
        stages={orderData.stages}
        onDispatchSubmit={handleDispatchSubmit}
      />
    </div>
  );
};

export default DispatchDetail;
