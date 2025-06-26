import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Truck, Edit2, Package } from "lucide-react";
import type { DispatchData } from "@/types/dispatch";
import type { DispatchBatch } from "@/types/dispatch";
import { downloadAsCSV } from "@/utils/downloadUtils";
import { generateDispatchReceiptPDF } from "@/utils/professionalPdfUtils";
import { DownloadButton } from "@/components/DownloadButton";
import { EditableDispatchBatches } from "./EditableDispatchBatches";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface DispatchDetailsProps {
  dispatch: DispatchData;
  batches: DispatchBatch[];
  orderNumber?: string;
  companyName?: string;
  onBatchesUpdated?: () => void;
}

export const DispatchDetails = ({ dispatch, batches, orderNumber, companyName, onBatchesUpdated }: DispatchDetailsProps) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const navigate = useNavigate();
  // Handler for CSV download - Enhanced with comprehensive data
  const handleDownloadCSV = () => {
    const totalQuantity = batches.reduce((sum, batch) => sum + batch.quantity, 0);
    
    const downloadData = [{
      // Basic dispatch information
      order_number: orderNumber || 'N/A',
      company_name: companyName || 'N/A',
      delivery_date: new Date(dispatch.delivery_date).toLocaleDateString(),
      recipient_name: dispatch.recipient_name,
      delivery_address: dispatch.delivery_address,
      tracking_number: dispatch.tracking_number || 'N/A',
      quality_checked: dispatch.quality_checked ? 'Yes' : 'No',
      quantity_checked: dispatch.quantity_checked ? 'Yes' : 'No',
      notes: dispatch.notes || 'N/A',
      dispatched_on: new Date(dispatch.created_at || '').toLocaleDateString(),
      
      // Comprehensive batch information
      total_batches: batches.length,
      total_quantity: totalQuantity,
      batch_details: batches.map(batch => 
        `Batch ${batch.batch_number}: ${batch.quantity} units (${new Date(batch.delivery_date).toLocaleDateString()}) - ${batch.notes || 'No notes'}`
      ).join(' | '),
      
      // Status information
      dispatch_status: 'Dispatched',
      all_batches_status: batches.map(batch => 
        `Batch ${batch.batch_number}: ${(batch.status || 'pending').toUpperCase()}`
      ).join(' | ')
    }];
    
    downloadAsCSV(downloadData, `dispatch-comprehensive-${orderNumber}`);
  };
  
  // Handler for PDF download - Enhanced with comprehensive data
  const handleDownloadPDF = () => {
    const totalQuantity = batches.reduce((sum, batch) => sum + batch.quantity, 0);
    
    generateDispatchReceiptPDF({
      // Order and company information
      orderNumber: orderNumber || 'N/A',
      companyName: companyName || 'N/A',
      order_number: orderNumber || 'N/A',
      company_name: companyName || 'N/A',
      
      // Dispatch details
      deliveryDate: dispatch.delivery_date,
      delivery_date: dispatch.delivery_date,
      recipientName: dispatch.recipient_name,
      recipient_name: dispatch.recipient_name,
      deliveryAddress: dispatch.delivery_address,
      delivery_address: dispatch.delivery_address,
      trackingNumber: dispatch.tracking_number || '',
      tracking_number: dispatch.tracking_number || '',
      qualityChecked: dispatch.quality_checked,
      quality_checked: dispatch.quality_checked,
      quantityChecked: dispatch.quantity_checked,
      quantity_checked: dispatch.quantity_checked,
      notes: dispatch.notes || '',
      dispatchedOn: dispatch.created_at || '',
      dispatched_on: dispatch.created_at || '',
      
      // Comprehensive batch information
      batches: batches.map(batch => ({
        id: batch.id,
        batch_number: batch.batch_number,
        quantity: batch.quantity,
        delivery_date: batch.delivery_date,
        quality_status: batch.quality_status || 'approved',
        status: batch.status || 'pending',
        notes: batch.notes || ''
      })),
      totalQuantity: totalQuantity,
      total_quantity: totalQuantity
    }, `dispatch-comprehensive-${orderNumber}`);
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" /> Dispatch Details
            </CardTitle>
            <CardDescription>
              This order was dispatched on {new Date(dispatch.created_at || '').toLocaleDateString()} to {dispatch.recipient_name}
            </CardDescription>
          </div>
          <DownloadButton 
            onCsvClick={handleDownloadCSV}
            onPdfClick={handleDownloadPDF}
            label="Download Complete Details"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-md">
          <div className="space-y-2">
            <div><strong>Recipient Name:</strong> {dispatch.recipient_name}</div>
            <div><strong>Delivery Address:</strong> {dispatch.delivery_address}</div>
            <div><strong>Tracking Number:</strong> {dispatch.tracking_number || "—"}</div>
          </div>
          <div className="space-y-2">
            <div><strong>Quality Check:</strong> {dispatch.quality_checked ? "Yes" : "No"}</div>
            <div><strong>Quantity Check:</strong> {dispatch.quantity_checked ? "Yes" : "No"}</div>
            <div><strong>Notes:</strong> {dispatch.notes || "—"}</div>
          </div>
        </div>        <div className="space-y-4">          <div className="flex items-center justify-between">
            <h3 className="font-medium">Dispatch Batches</h3>
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                Total Batches: {batches.length} | Total Quantity: {batches.reduce((sum, batch) => sum + batch.quantity, 0)}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/dispatch/${dispatch.id}/batches`)}
              >
                <Package className="h-4 w-4 mr-2" />
                Batch Manager
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditMode(!isEditMode)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                {isEditMode ? 'View Only' : 'Edit Batches'}
              </Button>
            </div>
          </div>

          {isEditMode ? (
            <EditableDispatchBatches
              dispatchId={dispatch.id}
              batches={batches}
              onBatchesUpdated={() => {
                if (onBatchesUpdated) {
                  onBatchesUpdated();
                }
              }}
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="max-h-[400px] overflow-y-auto relative">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-muted/50 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium border-b">Batch No.</th>
                        <th className="px-4 py-3 text-left text-sm font-medium border-b">Quantity</th>
                        <th className="px-4 py-3 text-left text-sm font-medium border-b">Delivery Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium border-b">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium border-b">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {batches.map((batch) => (
                        <tr key={batch.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 text-sm whitespace-nowrap">Batch {batch.batch_number}</td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">{batch.quantity}</td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            {new Date(batch.delivery_date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              batch.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              batch.status === 'dispatched' ? 'bg-blue-100 text-blue-800' :
                              batch.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {(batch.status || 'pending').charAt(0).toUpperCase() + (batch.status || 'pending').slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">{batch.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
