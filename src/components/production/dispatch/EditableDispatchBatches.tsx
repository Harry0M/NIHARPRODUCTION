import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, Save, X, Plus } from 'lucide-react';
import { useDispatchBatchActions } from '@/hooks/dispatch/useDispatchBatchActions';
import type { DispatchBatch } from '@/types/dispatch';

interface EditableDispatchBatchesProps {
  dispatchId: string;
  batches: DispatchBatch[];
  onBatchesUpdated: () => void;
  readonly?: boolean;
}

interface EditingBatch {
  id: string;
  quantity: number;
  delivery_date: string;
  notes: string;
  status: string;
}

export const EditableDispatchBatches = ({ 
  dispatchId, 
  batches, 
  onBatchesUpdated, 
  readonly = false 
}: EditableDispatchBatchesProps) => {
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<EditingBatch | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBatchData, setNewBatchData] = useState({
    quantity: 0,
    delivery_date: '',
    notes: '',
    status: 'pending'
  });

  const { 
    loading, 
    updateDispatchBatch, 
    deleteDispatchBatch, 
    createDispatchBatch 
  } = useDispatchBatchActions();

  const startEditing = (batch: DispatchBatch) => {
    if (readonly) return;
    
    setEditingBatchId(batch.id || '');
    setEditingData({
      id: batch.id || '',
      quantity: batch.quantity,
      delivery_date: batch.delivery_date,
      notes: batch.notes || '',
      status: batch.status || 'pending'
    });
  };

  const cancelEditing = () => {
    setEditingBatchId(null);
    setEditingData(null);
  };

  const saveChanges = async () => {
    if (!editingData) return;

    const result = await updateDispatchBatch(editingData.id, {
      quantity: editingData.quantity,
      delivery_date: editingData.delivery_date,
      notes: editingData.notes,
      status: editingData.status
    });

    if (result.success) {
      setEditingBatchId(null);
      setEditingData(null);
      onBatchesUpdated();
    }
  };

  const handleDelete = async (batchId: string, batchNumber: number) => {
    if (readonly) return;
    
    if (!confirm(`Are you sure you want to delete Batch ${batchNumber}? This action cannot be undone.`)) {
      return;
    }

    const result = await deleteDispatchBatch(batchId, batchNumber);
    if (result.success) {
      onBatchesUpdated();
    }
  };

  const handleAddBatch = async () => {
    if (newBatchData.quantity <= 0 || !newBatchData.delivery_date) {
      alert('Please fill in all required fields');
      return;
    }

    // Calculate the next batch number
    const nextBatchNumber = Math.max(...batches.map(b => b.batch_number), 0) + 1;

    const result = await createDispatchBatch({
      order_dispatch_id: dispatchId,
      batch_number: nextBatchNumber,
      quantity: newBatchData.quantity,
      delivery_date: newBatchData.delivery_date,
      notes: newBatchData.notes,
      status: newBatchData.status
    });

    if (result.success) {
      setShowAddForm(false);
      setNewBatchData({
        quantity: 0,
        delivery_date: '',
        notes: '',
        status: 'pending'
      });
      onBatchesUpdated();
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Dispatch Batches</h3>
          <p className="text-sm text-muted-foreground">
            Total Batches: {batches.length} | Total Quantity: {totalQuantity}
          </p>
        </div>
        {!readonly && (
          <Button
            onClick={() => setShowAddForm(true)}
            size="sm"
            variant="outline"
            disabled={loading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Batch
          </Button>
        )}
      </div>

      {/* Add New Batch Form */}
      {showAddForm && !readonly && (
        <Card className="border-dashed">
          <CardHeader className="py-4">
            <CardTitle className="text-base">Add New Batch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={newBatchData.quantity || ''}
                  onChange={(e) => setNewBatchData(prev => ({ 
                    ...prev, 
                    quantity: Number(e.target.value) 
                  }))}
                  min="1"
                  placeholder="Enter quantity"
                />
              </div>
              <div className="space-y-2">
                <Label>Delivery Date</Label>
                <Input
                  type="date"
                  value={newBatchData.delivery_date}
                  onChange={(e) => setNewBatchData(prev => ({ 
                    ...prev, 
                    delivery_date: e.target.value 
                  }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  value={newBatchData.status}
                  onChange={(e) => setNewBatchData(prev => ({ 
                    ...prev, 
                    status: e.target.value 
                  }))}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="pending">Pending</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input
                  value={newBatchData.notes}
                  onChange={(e) => setNewBatchData(prev => ({ 
                    ...prev, 
                    notes: e.target.value 
                  }))}
                  placeholder="Optional notes"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAddForm(false)}
                disabled={loading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleAddBatch}
                disabled={loading}
              >
                <Save className="h-4 w-4 mr-2" />
                Add Batch
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Batches */}
      <div className="grid gap-4">
        {batches.map((batch) => {
          const isEditing = editingBatchId === batch.id;
          
          return (
            <Card key={batch.id} className={isEditing ? 'border-primary' : ''}>
              <CardHeader className="py-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Batch {batch.batch_number}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(batch.status || 'pending')}>
                      {(batch.status || 'pending').charAt(0).toUpperCase() + (batch.status || 'pending').slice(1)}
                    </Badge>
                    {!readonly && !isEditing && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(batch)}
                          disabled={loading}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(batch.id || '', batch.batch_number)}
                          disabled={loading || batches.length === 1}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing && editingData ? (
                  // Edit mode
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          value={editingData.quantity}
                          onChange={(e) => setEditingData(prev => prev ? { 
                            ...prev, 
                            quantity: Number(e.target.value) 
                          } : null)}
                          min="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Delivery Date</Label>
                        <Input
                          type="date"
                          value={editingData.delivery_date}
                          onChange={(e) => setEditingData(prev => prev ? { 
                            ...prev, 
                            delivery_date: e.target.value 
                          } : null)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <select
                          value={editingData.status}
                          onChange={(e) => setEditingData(prev => prev ? { 
                            ...prev, 
                            status: e.target.value 
                          } : null)}
                          className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        >
                          <option value="pending">Pending</option>
                          <option value="dispatched">Dispatched</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Input
                          value={editingData.notes}
                          onChange={(e) => setEditingData(prev => prev ? { 
                            ...prev, 
                            notes: e.target.value 
                          } : null)}
                          placeholder="Optional notes"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={cancelEditing}
                        disabled={loading}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        onClick={saveChanges}
                        disabled={loading}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  </>
                ) : (
                  // View mode
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Quantity</Label>
                      <p className="text-sm">{batch.quantity}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Delivery Date</Label>
                      <p className="text-sm">{new Date(batch.delivery_date).toLocaleDateString()}</p>
                    </div>
                    {batch.notes && (
                      <div className="col-span-2">
                        <Label className="text-sm font-medium">Notes</Label>
                        <p className="text-sm text-muted-foreground">{batch.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {batches.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No batches found. Click "Add Batch" to create the first batch.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
