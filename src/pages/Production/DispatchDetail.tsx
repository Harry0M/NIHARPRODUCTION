
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { StageStatus } from "@/components/production/StageStatus";
import { DispatchForm } from "@/components/production/DispatchForm";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ClipboardList, Truck } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { DownloadButton } from "@/components/DownloadButton";
import { downloadAsCSV, downloadAsPDF } from "@/utils/downloadUtils";

export interface StageSummary {
  name: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  completedDate?: string;
}

interface DispatchData {
  id: string;
  order_id: string;
  delivery_date: string;
  tracking_number?: string | null;
  recipient_name: string;
  delivery_address: string;
  notes?: string | null;
  quality_checked: boolean;
  quantity_checked: boolean;
  created_at?: string;
  updated_at?: string;
}

interface DispatchBatch {
  id?: string;
  batch_number: number;
  quantity: number;
  delivery_date: string;
  notes?: string;
  status?: string;
}

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
        
        // Fetch batches for this dispatch
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

  // Handler for submitting the dispatch information
  const handleDispatch = async (formData: any) => {
    if (!orderId) return;
    setLoading(true);

    try {
      // Insert dispatch data if not already exists
      const { data: dispatchData, error: dispatchError } = await supabase
        .from("order_dispatches")
        .insert([{
          order_id: orderId,
          recipient_name: formData.recipient_name,
          delivery_address: formData.delivery_address,
          delivery_date: formData.batches[0].delivery_date, // Using the first batch's delivery date as main date
          tracking_number: formData.tracking_number || null,
          notes: formData.notes || null,
          quality_checked: formData.confirm_quality_check,
          quantity_checked: formData.confirm_quantity_check,
        }])
        .select()
        .single();

      if (dispatchError) throw dispatchError;

      // Insert batch data
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

      // Update order status
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

  // Formatting helper
  const formatDate = (date: string | undefined) =>
    date ? new Date(date).toLocaleDateString() : "";

  const handleDownloadCSV = () => {
    if (!dispatchData) return;
    
    const downloadData = [{
      order_number: order?.order_number || 'N/A',
      company_name: order?.company_name || 'N/A',
      delivery_date: formatDate(dispatchData.delivery_date),
      recipient_name: dispatchData.recipient_name,
      delivery_address: dispatchData.delivery_address,
      tracking_number: dispatchData.tracking_number || 'N/A',
      quality_checked: dispatchData.quality_checked ? 'Yes' : 'No',
      quantity_checked: dispatchData.quantity_checked ? 'Yes' : 'No',
      notes: dispatchData.notes || 'N/A',
      dispatched_on: formatDate(dispatchData.created_at)
    }];
    
    downloadAsCSV(downloadData, `dispatch-${order?.order_number}`);
  };
  
  const handleDownloadPDF = () => {
    if (!dispatchData) return;
    
    const downloadData = [{
      order_number: order?.order_number || 'N/A',
      company_name: order?.company_name || 'N/A',
      delivery_date: formatDate(dispatchData.delivery_date),
      recipient_name: dispatchData.recipient_name,
      delivery_address: dispatchData.delivery_address,
      tracking_number: dispatchData.tracking_number || 'N/A',
      quality_checked: dispatchData.quality_checked ? 'Yes' : 'No',
      quantity_checked: dispatchData.quantity_checked ? 'Yes' : 'No',
      notes: dispatchData.notes || 'N/A',
      dispatched_on: formatDate(dispatchData.created_at)
    }];
    
    downloadAsPDF(
      downloadData, 
      `dispatch-${order?.order_number}`,
      `Dispatch Details: ${order?.order_number}`
    );
  };

  const renderDispatchDetails = (dispatch: any) => {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" /> Dispatch Details
          </CardTitle>
          <CardDescription>
            This order was dispatched on {formatDate(dispatch.created_at)} to {dispatch.recipient_name}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div><strong>Recipient Name:</strong> {dispatch.recipient_name}</div>
            <div><strong>Delivery Address:</strong> {dispatch.delivery_address}</div>
            <div><strong>Tracking Number:</strong> {dispatch.tracking_number || "—"}</div>
            <div><strong>Notes:</strong> {dispatch.notes || "—"}</div>
            <div><strong>Quality Check:</strong> {dispatch.quality_checked ? "Yes" : "No"}</div>
            <div><strong>Quantity Check:</strong> {dispatch.quantity_checked ? "Yes" : "No"}</div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Dispatch Batches</h3>
            <div className="grid gap-4">
              {dispatchBatches.map((batch: any) => (
                <Card key={batch.id}>
                  <CardHeader className="py-4">
                    <CardTitle className="text-base">Batch {batch.batch_number}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div><strong>Quantity:</strong> {batch.quantity}</div>
                    <div><strong>Delivery Date:</strong> {formatDate(batch.delivery_date)}</div>
                    <div><strong>Status:</strong> {batch.status}</div>
                    {batch.notes && <div><strong>Notes:</strong> {batch.notes}</div>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
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
          {/* Order details card */}
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
              <CardDescription>
                <span>Order #{order.order_number}&nbsp;•&nbsp;</span>
                <span>{order.company_name}&nbsp;•&nbsp;</span>
                <span>Quantity:&nbsp;{order.quantity}&nbsp;bags</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div><strong>Bag Size:</strong> {order.bag_length} x {order.bag_width} in</div>
                <div><strong>Status:</strong> {order.status?.replace(/_/g, " ")}</div>
                <div><strong>Created:</strong> {formatDate(order.created_at)}</div>
              </div>
            </CardContent>
          </Card>

          {/* Show existing dispatch if available, else show dispatch form */}
          {dispatchData ? (
            renderDispatchDetails(dispatchData)
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
