
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { downloadAsCSV, downloadAsPDF } from "@/utils/downloadUtils";
import { DispatchForm } from "@/components/production/DispatchForm";
import { OrderInfoCard } from "@/components/production/dispatch/OrderInfoCard";
import { DispatchDetails } from "@/components/production/dispatch/DispatchDetails";
import { PageHeader } from "@/components/production/dispatch/PageHeader";
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
  const { order, dispatchData, dispatchBatches, productionStages, loading } = useOrderDispatchData(orderId || '');
  const { handleDispatch } = useDispatchActions();

  const handleDownloadCSV = () => {
    if (!dispatchData || !order) return;
    
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
    if (!dispatchData || !order) return;
    
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
      <PageHeader 
        dispatchData={dispatchData}
        onDownloadCSV={handleDownloadCSV}
        onDownloadPDF={handleDownloadPDF}
      />

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
