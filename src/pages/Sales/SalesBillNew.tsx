
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, FileText } from 'lucide-react';
import { useDispatchedOrders, useSalesBills } from '@/hooks/use-sales-bills';
import { LoadingSpinner } from '@/components/production/LoadingSpinner';
import type { SalesBillFormData, DispatchedOrder } from '@/types/sales-bill';

const SalesBillNew = () => {
  const navigate = useNavigate();
  const { dispatchedOrders, loading: ordersLoading } = useDispatchedOrders();
  const { createSalesBill, loading: saving } = useSalesBills();
  
  const [selectedOrder, setSelectedOrder] = useState<DispatchedOrder | null>(null);
  const [formData, setFormData] = useState<SalesBillFormData>({
    company_name: '',
    company_address: '',
    catalog_name: '',
    quantity: 0,
    rate: 0,
    gst_percentage: 18,
    transport_charge: 0,
    bill_number: `SB-${Date.now()}`, // Generate a default bill number
    bill_date: new Date().toISOString().split('T')[0],
    status: 'draft',
    payment_status: 'pending',
    notes: '',
    terms_and_conditions: ''
  });

  const handleOrderSelect = (orderId: string) => {
    const order = dispatchedOrders.find(o => o.id === orderId);
    if (order) {
      setSelectedOrder(order);
      setFormData(prev => ({
        ...prev,
        dispatch_id: order.dispatch_id,
        order_id: order.order_id,
        company_name: order.company_name,
        company_address: order.company_address || '',
        catalog_name: order.catalog_name || '',
        catalog_id: order.catalog_id,
        quantity: order.quantity,
        rate: order.catalog_selling_rate || 0
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOrder) {
      alert('Please select an order first');
      return;
    }

    const success = await createSalesBill(formData);
    if (success) {
      navigate('/sales/bills');
    }
  };

  const calculateSubtotal = () => formData.quantity * formData.rate;
  const calculateGstAmount = () => (calculateSubtotal() * formData.gst_percentage) / 100;
  const calculateTotal = () => calculateSubtotal() + calculateGstAmount() + formData.transport_charge;

  if (ordersLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/sales/bills')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Sales Bill</h1>
          <p className="text-muted-foreground">Generate a new sales bill from dispatched orders</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Select Dispatched Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="order">Dispatched Order</Label>
                <Select onValueChange={handleOrderSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a dispatched order" />
                  </SelectTrigger>
                  <SelectContent>
                    {dispatchedOrders.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.order_number} - {order.company_name} ({order.quantity} units)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedOrder && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Order Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Order Number:</span> {selectedOrder.order_number}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Company:</span> {selectedOrder.company_name}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Product:</span> {selectedOrder.catalog_name}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Quantity:</span> {selectedOrder.quantity}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedOrder && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Bill Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bill_number">Bill Number</Label>
                    <Input
                      id="bill_number"
                      value={formData.bill_number}
                      onChange={(e) => setFormData(prev => ({...prev, bill_number: e.target.value}))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="bill_date">Bill Date</Label>
                    <Input
                      id="bill_date"
                      type="date"
                      value={formData.bill_date}
                      onChange={(e) => setFormData(prev => ({...prev, bill_date: e.target.value}))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => setFormData(prev => ({...prev, company_name: e.target.value}))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="catalog_name">Product Name</Label>
                    <Input
                      id="catalog_name"
                      value={formData.catalog_name}
                      onChange={(e) => setFormData(prev => ({...prev, catalog_name: e.target.value}))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="company_address">Company Address</Label>
                  <Textarea
                    id="company_address"
                    value={formData.company_address}
                    onChange={(e) => setFormData(prev => ({...prev, company_address: e.target.value}))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({...prev, quantity: parseInt(e.target.value) || 0}))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="rate">Rate per Unit (₹)</Label>
                    <Input
                      id="rate"
                      type="number"
                      step="0.01"
                      value={formData.rate}
                      onChange={(e) => setFormData(prev => ({...prev, rate: parseFloat(e.target.value) || 0}))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gst_percentage">GST Percentage (%)</Label>
                    <Input
                      id="gst_percentage"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.gst_percentage}
                      onChange={(e) => setFormData(prev => ({...prev, gst_percentage: parseFloat(e.target.value) || 0}))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="transport_charge">Transport Charge (₹)</Label>
                    <Input
                      id="transport_charge"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.transport_charge}
                      onChange={(e) => setFormData(prev => ({...prev, transport_charge: parseFloat(e.target.value) || 0}))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date || ''}
                    onChange={(e) => setFormData(prev => ({...prev, due_date: e.target.value}))}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                    placeholder="Additional notes..."
                  />
                </div>

                <div>
                  <Label htmlFor="terms_and_conditions">Terms and Conditions</Label>
                  <Textarea
                    id="terms_and_conditions"
                    value={formData.terms_and_conditions}
                    onChange={(e) => setFormData(prev => ({...prev, terms_and_conditions: e.target.value}))}
                    placeholder="Terms and conditions..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bill Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST ({formData.gst_percentage}%):</span>
                    <span>₹{calculateGstAmount().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transport Charge:</span>
                    <span>₹{formData.transport_charge.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total Amount:</span>
                    <span>₹{calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/sales/bills')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Creating...' : 'Create Sales Bill'}
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  );
};

export default SalesBillNew;
