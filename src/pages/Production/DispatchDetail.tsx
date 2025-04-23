
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

const DispatchDetail = () => {
  const { id: orderId } = useParams();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [dispatchData, setDispatchData] = useState<DispatchData | null>(null);
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
      setDispatchData(dispatch);

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
      if (!dispatchData) {
        const { error: insertError } = await supabase.from("order_dispatches").insert([
          {
            order_id: orderId,
            delivery_date: formData.delivery_date,
            tracking_number: formData.tracking_number || null,
            recipient_name: formData.recipient_name,
            delivery_address: formData.delivery_address,
            notes: formData.notes || null,
            quality_checked: formData.confirm_quality_check,
            quantity_checked: formData.confirm_quantity_check,
          }
        ]);
        if (insertError) throw insertError;
      }

      // Update order status to 'ready_for_dispatch' instead of 'dispatched'
      const { error: statusError } = await supabase
        .from("orders")
        .update({ status: "ready_for_dispatch" as Database['public']['Enums']['order_status'] })
        .eq("id", orderId);
      if (statusError) throw statusError;

      toast({ title: "Dispatch Complete", description: "Order has been marked as ready for dispatch!" });
      fetchOrderData(orderId); // Refresh data
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

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
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
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" /> Dispatch Details
                </CardTitle>
                <CardDescription>
                  This order was dispatched on {formatDate(dispatchData.delivery_date)} to {dispatchData.recipient_name}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div><strong>Delivery Date:</strong> {formatDate(dispatchData.delivery_date)}</div>
                <div><strong>Tracking Number:</strong> {dispatchData.tracking_number || "—"}</div>
                <div><strong>Recipient Name:</strong> {dispatchData.recipient_name}</div>
                <div><strong>Delivery Address:</strong> {dispatchData.delivery_address}</div>
                <div><strong>Notes:</strong> {dispatchData.notes || "—"}</div>
                <div><strong>Quality Check:</strong> {dispatchData.quality_checked ? "Yes" : "No"}</div>
                <div><strong>Quantity Check:</strong> {dispatchData.quantity_checked ? "Yes" : "No"}</div>
                <div><strong>Dispatched At:</strong> {formatDate(dispatchData.created_at)}</div>
              </CardContent>
            </Card>
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
