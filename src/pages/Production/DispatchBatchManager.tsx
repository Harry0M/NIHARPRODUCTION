import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, Calendar, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { EditableDispatchBatches } from '@/components/production/dispatch/EditableDispatchBatches';
import type { DispatchData, DispatchBatch } from '@/types/dispatch';

const DispatchBatchManager = () => {
  const { dispatchId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dispatch, setDispatch] = useState<DispatchData | null>(null);
  const [batches, setBatches] = useState<DispatchBatch[]>([]);
  const [orderData, setOrderData] = useState<any>(null);

  useEffect(() => {
    if (dispatchId) {
      fetchDispatchData();
    }
  }, [dispatchId]);

  const fetchDispatchData = async () => {
    if (!dispatchId) return;

    setLoading(true);
    try {
      // Fetch dispatch data
      const { data: dispatchData, error: dispatchError } = await supabase
        .from('order_dispatches')
        .select('*')
        .eq('id', dispatchId)
        .single();

      if (dispatchError) throw dispatchError;

      // Fetch batches
      const { data: batchesData, error: batchesError } = await supabase
        .from('dispatch_batches')
        .select('*')
        .eq('order_dispatch_id', dispatchId)
        .order('batch_number', { ascending: true });

      if (batchesError) throw batchesError;

      // Fetch order data
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          company_name,
          quantity,
          status,
          created_at
        `)
        .eq('id', dispatchData.order_id)
        .single();

      if (orderError) throw orderError;

      setDispatch(dispatchData);
      setBatches(batchesData || []);
      setOrderData(orderData);
    } catch (error: any) {
      console.error('Error fetching dispatch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'dispatched':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalQuantity = batches.reduce((sum, batch) => sum + batch.quantity, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!dispatch) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-semibold">Dispatch not found</h2>
        <p className="text-muted-foreground mt-2">The requested dispatch could not be found.</p>
        <Button 
          onClick={() => navigate('/dispatch')} 
          className="mt-4"
        >
          Back to Dispatch List
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dispatch')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dispatch
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dispatch Batch Manager</h1>
          <p className="text-muted-foreground">
            Manage batches for dispatch #{dispatchId?.slice(-8)}
          </p>
        </div>
      </div>

      {/* Order & Dispatch Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Order Number:</span>
              <span className="text-sm">{orderData?.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Company:</span>
              <span className="text-sm">{orderData?.company_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Order Quantity:</span>
              <span className="text-sm">{orderData?.quantity?.toLocaleString()} units</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Order Status:</span>
              <Badge className={getStatusColor(orderData?.status || 'pending')}>
                {(orderData?.status || 'pending').charAt(0).toUpperCase() + (orderData?.status || 'pending').slice(1)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Dispatch Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Dispatch Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Recipient:</span>
              <span className="text-sm">{dispatch.recipient_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Delivery Date:</span>
              <span className="text-sm">{new Date(dispatch.delivery_date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Total Batches:</span>
              <span className="text-sm">{batches.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Total Dispatch Quantity:</span>
              <span className="text-sm font-semibold">{totalQuantity.toLocaleString()} units</span>
            </div>
            {dispatch.tracking_number && (
              <div className="flex justify-between">
                <span className="text-sm font-medium">Tracking Number:</span>
                <span className="text-sm font-mono">{dispatch.tracking_number}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delivery Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Delivery Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium">Delivery Address:</span>
              <p className="text-sm text-muted-foreground mt-1">{dispatch.delivery_address}</p>
            </div>
            {dispatch.notes && (
              <div>
                <span className="text-sm font-medium">Notes:</span>
                <p className="text-sm text-muted-foreground mt-1">{dispatch.notes}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Quality Checked:</span>
                <Badge variant={dispatch.quality_checked ? "default" : "outline"}>
                  {dispatch.quality_checked ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Quantity Checked:</span>
                <Badge variant={dispatch.quantity_checked ? "default" : "outline"}>
                  {dispatch.quantity_checked ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Batch Management */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Management</CardTitle>
          <CardDescription>
            Add, edit, or delete dispatch batches. Changes are saved automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditableDispatchBatches
            dispatchId={dispatch.id}
            batches={batches}
            onBatchesUpdated={fetchDispatchData}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default DispatchBatchManager;
