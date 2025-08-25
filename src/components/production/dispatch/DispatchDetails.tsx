import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Truck, Edit2, Package, Save, X, Activity, CheckCircle } from "lucide-react";
import type { DispatchData } from "@/types/dispatch";
import type { DispatchBatch } from "@/types/dispatch";
import { downloadAsCSV } from "@/utils/downloadUtils";
import { generateDispatchReceiptPDF } from "@/utils/professionalPdfUtils";
import { DownloadButton } from "@/components/DownloadButton";
import { EditableDispatchBatches } from "./EditableDispatchBatches";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Order } from "@/hooks/use-dispatch-data";

interface DispatchDetailsProps {
  dispatch: DispatchData;
  batches: DispatchBatch[];
  orderNumber?: string;
  companyName?: string;
  order?: Order;
  onBatchesUpdated?: () => void;
}

export const DispatchDetails = ({ dispatch, batches, orderNumber, companyName, order, onBatchesUpdated }: DispatchDetailsProps) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({
    recipient_name: dispatch.recipient_name,
    delivery_address: dispatch.delivery_address,
    tracking_number: dispatch.tracking_number || '',
    notes: dispatch.notes || '',
    quality_checked: dispatch.quality_checked,
    quantity_checked: dispatch.quantity_checked
  });
  const navigate = useNavigate();

  // Calculate quantity summaries
  const totalStitchingReceived = order?.job_cards?.[0]?.stitching_jobs?.reduce((total, job) => 
    total + (job.received_quantity || 0), 0
  ) || 0;
  
  const totalDispatched = batches.reduce((sum, batch) => sum + batch.quantity, 0);

  // Handle saving dispatch details
  const handleSaveDetails = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("order_dispatches")
        .update({
          recipient_name: editFormData.recipient_name,
          delivery_address: editFormData.delivery_address,
          tracking_number: editFormData.tracking_number || null,
          notes: editFormData.notes || null,
          quality_checked: editFormData.quality_checked,
          quantity_checked: editFormData.quantity_checked
        })
        .eq("id", dispatch.id);

      if (error) throw error;

      toast({
        title: "Dispatch details updated",
        description: "The dispatch details have been saved successfully.",
      });

      setIsEditingDetails(false);
      
      // Refresh the data
      if (onBatchesUpdated) {
        onBatchesUpdated();
      }
    } catch (error: unknown) {
      toast({
        title: "Error updating dispatch details",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setEditFormData({
      recipient_name: dispatch.recipient_name,
      delivery_address: dispatch.delivery_address,
      tracking_number: dispatch.tracking_number || '',
      notes: dispatch.notes || '',
      quality_checked: dispatch.quality_checked,
      quantity_checked: dispatch.quantity_checked
    });
    setIsEditingDetails(false);
  };
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
          <div className="flex items-center gap-2">
            <DownloadButton 
              onCsvClick={handleDownloadCSV}
              onPdfClick={handleDownloadPDF}
              label="Download Complete Details"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingDetails(!isEditingDetails)}
              disabled={isSaving}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              {isEditingDetails ? 'Cancel Edit' : 'Edit Details'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quantity Summary Section */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-muted-foreground">Stitching Received</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{totalStitchingReceived}</div>
            <div className="text-xs text-muted-foreground">Total from stitching jobs</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Truck className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-muted-foreground">Total Dispatched</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{totalDispatched}</div>
            <div className="text-xs text-muted-foreground">Across all batches</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-muted-foreground">Remaining</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">{totalStitchingReceived - totalDispatched}</div>
            <div className="text-xs text-muted-foreground">Yet to dispatch</div>
          </div>
        </div>

        {isEditingDetails ? (
          // Edit form for dispatch details
          <div className="space-y-4 p-4 border rounded-md bg-muted/20">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipient_name">Recipient Name</Label>
                <Input
                  id="recipient_name"
                  value={editFormData.recipient_name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, recipient_name: e.target.value }))}
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tracking_number">Tracking Number</Label>
                <Input
                  id="tracking_number"
                  value={editFormData.tracking_number}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, tracking_number: e.target.value }))}
                  placeholder="Enter tracking number"
                  disabled={isSaving}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="delivery_address">Delivery Address</Label>
              <Textarea
                id="delivery_address"
                value={editFormData.delivery_address}
                onChange={(e) => setEditFormData(prev => ({ ...prev, delivery_address: e.target.value }))}
                rows={3}
                disabled={isSaving}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={editFormData.notes}
                onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes"
                rows={2}
                disabled={isSaving}
              />
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="quality_checked"
                  checked={editFormData.quality_checked}
                  onCheckedChange={(checked) => setEditFormData(prev => ({ ...prev, quality_checked: !!checked }))}
                  disabled={isSaving}
                />
                <Label htmlFor="quality_checked">Quality Check Completed</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="quantity_checked"
                  checked={editFormData.quantity_checked}
                  onCheckedChange={(checked) => setEditFormData(prev => ({ ...prev, quantity_checked: !!checked }))}
                  disabled={isSaving}
                />
                <Label htmlFor="quantity_checked">Quantity Check Completed</Label>
              </div>
            </div>
            
            <div className="flex items-center gap-2 pt-4 border-t">
              <Button
                onClick={handleSaveDetails}
                disabled={isSaving}
                size="sm"
              >
                {isSaving ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancelEdit}
                disabled={isSaving}
                size="sm"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          // Display mode for dispatch details
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
          </div>
        )}        <div className="space-y-4">          <div className="flex items-center justify-between">
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
