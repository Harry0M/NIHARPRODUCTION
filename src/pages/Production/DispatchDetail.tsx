
import { useParams } from "react-router-dom";
import { Loader2, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { DispatchForm } from "@/components/production/DispatchForm";
import { OrderInfoCard } from "@/components/production/dispatch/OrderInfoCard";
import { DispatchDetails } from "@/components/production/dispatch/DispatchDetails";
import { useOrderDispatchData } from "@/hooks/use-dispatch-data";
import { useDispatchActions } from "@/hooks/use-dispatch-actions";

// Interface for stitching job to fix TypeScript types
interface StitchingJob {
  received_quantity: number | null;
  provided_quantity?: number | null;
  status?: string;
  id?: string;
}

// Interface for dispatch form data
interface DispatchFormData {
  recipient_name: string;
  delivery_address: string;
  tracking_number?: string;
  notes?: string;
  batches: Array<{
    quantity: number;
    delivery_date: string;
    notes?: string;
  }>;
  confirm_quality_check: boolean;
  confirm_quantity_check: boolean;
}

const DispatchDetail = () => {
  const { id: orderId } = useParams();
  const navigate = useNavigate();
  const { order, dispatchData, dispatchBatches, productionStages, loading } = useOrderDispatchData(orderId || '');
  const { handleDispatch } = useDispatchActions();

  const handleDispatchSubmit = async (formData: DispatchFormData) => {
    if (!orderId) return;
    const success = await handleDispatch(orderId, formData);
    if (success) {
      // Refresh the data
      window.location.reload();
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Simple Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            Dispatch Order
          </h1>
          <p className="text-muted-foreground mb-5">
            Complete and track the dispatch for this order.
          </p>
          <Button 
            onClick={() => navigate("/dispatch")} 
            variant="outline" 
            size="sm"
          >
            Back to Dispatch List
          </Button>
        </div>
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
              orderNumber={order?.order_number}
              companyName={order?.company_name}
              onBatchesUpdated={() => {
                // Refresh the data when batches are updated
                window.location.reload();
              }}
            />
          ) : (
            <DispatchForm
              jobCardId={order?.job_cards?.[0]?.id || ""}
              orderNumber={order?.order_number || ""}
              companyName={order?.company_name || ""}
              companyAddress={
                order?.companies?.address || 
                (order?.sales_account?.companies?.address) || 
                ''
              }
              quantity={order?.quantity || 0}
              stitchingReceivedQuantity={
                order?.job_cards?.[0]?.stitching_jobs?.reduce((total: number, job: StitchingJob) => 
                  total + (job.received_quantity || 0), 0
                ) || 0
              }
              stages={productionStages}
              onDispatchSubmit={handleDispatchSubmit}
            />
          )}
        </>
      )}
    </div>
  );
};

export default DispatchDetail;
