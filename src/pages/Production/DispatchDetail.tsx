
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { downloadAsCSV, downloadAsPDF } from "@/utils/downloadUtils";
import { DispatchForm } from "@/components/production/DispatchForm";
import { OrderInfoCard } from "@/components/production/dispatch/OrderInfoCard";
import { DispatchDetails } from "@/components/production/dispatch/DispatchDetails";
import { PageHeader } from "@/components/production/dispatch/PageHeader";
import { useDispatchData } from "@/hooks/use-dispatch-data";
import { useDispatchActions } from "@/hooks/use-dispatch-actions";

const DispatchDetail = () => {
  const { id: orderId } = useParams();
  const { loading, order, dispatchData, dispatchBatches, productionStages } = useDispatchData(orderId || '');
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

  const handleDispatchSubmit = async (formData: any) => {
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
              jobCardId={order.job_cards?.[0]?.id || ""}
              orderNumber={order.order_number}
              companyName={order.company_name}
              quantity={order.quantity}
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
