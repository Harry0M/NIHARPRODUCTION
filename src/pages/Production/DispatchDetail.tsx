import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { StageStatus } from "@/components/production/StageStatus";
import { DispatchForm } from "@/components/production/DispatchForm";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ClipboardList } from "lucide-react";
import { DownloadButton } from "@/components/DownloadButton";
import { downloadAsCSV, downloadAsPDF } from "@/utils/downloadUtils";
import { OrderInfoCard } from "@/components/production/dispatch/OrderInfoCard";
import { DispatchDetails } from "@/components/production/dispatch/DispatchDetails";
import type { DispatchData, DispatchBatch, StageSummary } from "@/types/dispatch";

const DispatchDetail = () => {
  const { id: orderId } = useParams();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [dispatchData, setDispatchData] = useState<DispatchData | null>(null);
  const [dispatchBatches, setDispatchBatches] = useState<DispatchBatch[]>([]);
  const [productionStages, setProductionStages] = useState<StageSummary[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (orderId) {
      fetchOrderData(orderId);
    }
  }, [orderId]);

  const fetchOrderData = async (orderId: string) => {
    setLoading(true);
    try {
      // Fetch order with production stages and job cards
      const { data: orderData, error } = await supabase
        .from("orders")
        .select(`
          id,
          order_number,
          company_name,
          quantity,
          rate,
          bag_length,
          bag_width,
          status,
          created_at,
          job_cards (
            id,
            job_name,
            status,
            cutting_jobs (id, status, updated_at),
            printing_jobs (id, status, updated_at),
            stitching_jobs (id, status, updated_at)
          )
        `)
        .eq("id", orderId)
        .maybeSingle();

      if (error) throw error;
      if (!orderData) {
        toast({
          title: "Order not found",
          description: "This order does not exist.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      setOrder(orderData);

      // Derive production stages status for summary (first job card only for now)
      const card = orderData.job_cards?.[0];
      const stages: StageSummary[] = [
        {
          name: "Cutting",
          status: card?.cutting_jobs?.[0]?.status || "pending",
          completedDate: card?.cutting_jobs?.[0]?.status === "completed" ? card?.cutting_jobs?.[0]?.updated_at : undefined,
        },
        {
          name: "Printing",
          status: card?.printing_jobs?.[0]?.status || "pending",
          completedDate: card?.printing_jobs?.[0]?.status === "completed" ? card?.printing_jobs?.[0]?.updated_at : undefined,
        },
        {
          name: "Stitching",
          status: card?.stitching_jobs?.[0]?.status || "pending",
          completedDate: card?.stitching_jobs?.[0]?.status === "completed" ? card?.stitching_jobs?.[0]?.updated_at : undefined,
        },
      ];
      setProductionStages(stages);

      // Fetch dispatch data for this order if present
      const { data: dispatch, error: dispatchError } = await supabase
        .from("order_dispatches")
        .select("*")
        .eq("order_id", orderId)
        .maybeSingle();

      if (dispatchError) throw dispatchError;
      
      if (dispatch) {
        setDispatchData(dispatch);
        
        const { data: batches, error: batchesError } = await supabase
          .from("dispatch_batches")
          .select("*")
          .eq("order_dispatch_id", dispatch.id)
          .order("batch_number", { ascending: true });
          
        if (batchesError) throw batchesError;
        if (batches) {
          setDispatchBatches(batches);
        }
      }

    } catch (err: any) {
      toast({
        title: "Error loading dispatch details",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDispatch = async (formData: any) => {
    if (!orderId) return;
    setLoading(true);

    try {
      const { data: dispatchData, error: dispatchError } = await supabase
        .from("order_dispatches")
        .insert([{
          order_id: orderId,
          recipient_name: formData.recipient_name,
          delivery_address: formData.delivery_address,
          delivery_date: formData.batches[0].delivery_date,
          tracking_number: formData.tracking_number || null,
          notes: formData.notes || null,
          quality_checked: formData.confirm_quality_check,
          quantity_checked: formData.confirm_quantity_check,
        }])
        .select()
        .single();

      if (dispatchError) throw dispatchError;

      const batchInserts = formData.batches.map((batch: any, index: number) => ({
        order_dispatch_id: dispatchData.id,
        batch_number: index + 1,
        quantity: batch.quantity,
        delivery_date: batch.delivery_date,
        notes: batch.notes || null,
      }));

      const { error: batchError } = await supabase
        .from("dispatch_batches")
        .insert(batchInserts);

      if (batchError) throw batchError;

      const { error: statusError } = await supabase
        .from("orders")
        .update({ status: "dispatched" as const })
        .eq("id", orderId);

      if (statusError) throw statusError;

      toast({ 
        title: "Dispatch Complete", 
        description: "Order has been marked as dispatched!" 
      });
      
      fetchOrderData(orderId);
    } catch (error: any) {
      toast({
        title: "Error dispatching order",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!dispatchData) return;
    
    const downloadData = [{
      order_number: order?.order_number || 'N/A',
      company_name: order?.company_name || 'N/A',
      delivery_date: new Date(dispatchData.delivery_date).toLocaleDateString(),
      recipient_name: dispatchData.recipient_name,
      delivery_address: dispatchData.delivery_address,
      tracking_number: dispatchData.tracking_number || 'N/A',
      quality_checked: dispatchData.quality_checked ? 'Yes' : 'No',
      quantity_checked: dispatchData.quantity_checked ? 'Yes' : 'No',
      notes: dispatchData.notes || 'N/A',
      dispatched_on: new Date(dispatchData.created_at || '').toLocaleDateString()
    }];
    
    downloadAsCSV(downloadData, `dispatch-${order?.order_number}`);
  };
  
  const handleDownloadPDF = () => {
    if (!dispatchData) return;
    
    const downloadData = [{
      order_number: order?.order_number || 'N/A',
      company_name: order?.company_name || 'N/A',
      delivery_date: new Date(dispatchData.delivery_date).toLocaleDateString(),
      recipient_name: dispatchData.recipient_name,
      delivery_address: dispatchData.delivery_address,
      tracking_number: dispatchData.tracking_number || 'N/A',
      quality_checked: dispatchData.quality_checked ? 'Yes' : 'No',
      quantity_checked: dispatchData.quantity_checked ? 'Yes' : 'No',
      notes: dispatchData.notes || 'N/A',
      dispatched_on: new Date(dispatchData.created_at || '').toLocaleDateString()
    }];
    
    downloadAsPDF(
      downloadData, 
      `dispatch-${order?.order_number}`,
      `Dispatch Details: ${order?.order_number}`
    );
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            Dispatch Order
          </h1>
          <p className="text-muted-foreground mb-5">
            Complete and track the dispatch for this order.
          </p>
          <Button onClick={() => navigate("/dispatch")} variant="outline" size="sm">Back to Dispatch List</Button>
        </div>
        
        {dispatchData && (
          <DownloadButton 
            label="Download Details"
            onCsvClick={handleDownloadCSV}
            onPdfClick={handleDownloadPDF}
          />
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary"/>
        </div>
      ) : !order ? null : (
        <>
          <OrderInfoCard
            orderNumber={order.order_number}
            companyName={order.company_name}
            quantity={order.quantity}
            bagLength={order.bag_length}
            bagWidth={order.bag_width}
            status={order.status}
            createdAt={order.created_at}
          />

          {dispatchData ? (
            <DispatchDetails 
              dispatch={dispatchData}
              batches={dispatchBatches}
            />
          ) : (
            <DispatchForm
              jobCardId={order.job_cards?.[0]?.id || ""}
              orderNumber={order.order_number}
              companyName={order.company_name}
              quantity={order.quantity}
              stages={productionStages}
              onDispatchSubmit={handleDispatch}
            />
          )}
        </>
      )}
    </div>
  );
};

export default DispatchDetail;
