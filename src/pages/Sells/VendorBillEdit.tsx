import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Calculator, Package, FileText, User } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { Database } from "@/integrations/supabase/types";

type VendorBill = Database["public"]["Tables"]["vendor_bills"]["Row"];
type Vendor = Database["public"]["Tables"]["vendors"]["Row"];

interface VendorBillWithVendor extends VendorBill {
  vendors?: Vendor;
}

interface FormData {
  rate: number;
  gst_percentage: number;
  other_expenses: number;
  status: string;
  notes: string;
}

const VendorBillEdit = () => {
  const { billId } = useParams<{ billId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bill, setBill] = useState<VendorBillWithVendor | null>(null);  const [formData, setFormData] = useState<FormData>({
    rate: 0,
    gst_percentage: 0,
    other_expenses: 0,
    status: 'pending',
    notes: '',
  });

  const fetchBill = useCallback(async () => {
    if (!billId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vendor_bills')
        .select(`
          *,
          vendors (*)
        `)
        .eq('id', billId)
        .single();

      if (error) throw error;
      
      setBill(data as VendorBillWithVendor);
        // Populate form with existing data
      setFormData({
        rate: data.rate,
        gst_percentage: data.gst_percentage,
        other_expenses: data.other_expenses,
        status: data.status || 'pending',
        notes: data.notes || '',
      });
    } catch (error) {
      toast({
        title: "Error fetching vendor bill",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [billId]);

  useEffect(() => {
    fetchBill();
  }, [fetchBill]);

  // Calculate financial values
  const calculateFinancials = useCallback(() => {
    if (!bill) return { subtotal: 0, gstAmount: 0, totalAmount: 0 };
      const subtotal = bill.quantity * formData.rate;
    const gstAmount = subtotal * (formData.gst_percentage / 100);
    const totalAmount = subtotal + gstAmount + formData.other_expenses;
    
    return {
      subtotal,
      gstAmount,
      totalAmount,
    };
  }, [bill, formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bill) return;

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to edit vendor bills",
        variant: "destructive",
      });
      return;
    }

    // Validation
    if (formData.rate <= 0) {
      toast({
        title: "Validation Error",
        description: "Rate must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const financials = calculateFinancials();
        const updateData = {
        rate: formData.rate,
        gst_percentage: formData.gst_percentage,
        subtotal: financials.subtotal,
        gst_amount: financials.gstAmount,
        other_expenses: formData.other_expenses,
        total_amount: financials.totalAmount,
        status: formData.status,
        notes: formData.notes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('vendor_bills')
        .update(updateData)
        .eq('id', bill.id);

      if (error) throw error;

      toast({
        title: "Vendor bill updated",
        description: "Vendor bill has been updated successfully",
      });

      // Navigate back to detail view
      navigate(`/sells/vendor-bills/${bill.id}`);
    } catch (error) {
      toast({
        title: "Error updating vendor bill",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Vendor bill not found</h3>
        <p className="text-muted-foreground mb-4">
          The requested vendor bill could not be found.
        </p>
        <Button onClick={() => navigate('/sells/vendor-bills')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Vendor Bills
        </Button>
      </div>
    );
  }

  const financials = calculateFinancials();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(`/sells/vendor-bills/${bill.id}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Details
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Vendor Bill</h1>
            <p className="text-muted-foreground">Modify vendor bill information and recalculate totals</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Fields */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Bill Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bill_number">Bill Number</Label>
                  <Input
                    id="bill_number"
                    value={bill.bill_number}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label htmlFor="vendor_name">Vendor Name</Label>
                  <Input
                    id="vendor_name"
                    value={bill.vendor_name}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label htmlFor="job_type">Job Type</Label>
                  <Input
                    id="job_type"
                    value={bill.job_type}
                    disabled
                    className="bg-muted capitalize"
                  />
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    value={bill.quantity.toLocaleString()}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Financial Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rate">Rate per Unit</Label>
                  <Input
                    id="rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                </div>                <div>
                  <Label htmlFor="gst_percentage">GST Rate (%)</Label>
                  <Input
                    id="gst_percentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.gst_percentage}
                    onChange={(e) => setFormData(prev => ({ ...prev, gst_percentage: parseFloat(e.target.value) || 0 }))}
                  />
                </div>                <div>
                  <Label htmlFor="other_expenses">Other Expenses</Label>
                  <Input
                    id="other_expenses"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.other_expenses}
                    onChange={(e) => setFormData(prev => ({ ...prev, other_expenses: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Bill Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">{formatCurrency(financials.subtotal)}</span>
              </div>
                <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">GST ({formData.gst_percentage}%):</span>
                <span className="font-medium">{formatCurrency(financials.gstAmount)}</span>
              </div>
              
              {formData.other_expenses > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Other Expenses:</span>
                  <span className="font-medium">{formatCurrency(formData.other_expenses)}</span>
                </div>
              )}
              
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-primary">{formatCurrency(financials.totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vendor Info */}
          {bill.vendors && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Vendor Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Vendor Name</h3>
                  <p className="font-medium">{bill.vendors.name}</p>
                </div>
                {bill.vendors.contact_person && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Contact Person</h3>
                    <p className="text-sm">{bill.vendors.contact_person}</p>
                  </div>
                )}
                {bill.vendors.service_type && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Service Type</h3>
                    <Badge variant="outline" className="mt-1 capitalize">
                      {bill.vendors.service_type}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Job Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Job Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Order Number</h3>
                <p className="text-sm">{bill.order_number}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Job Number</h3>
                <p className="text-sm">{bill.job_number}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Company</h3>
                <p className="text-sm">{bill.company_name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                <p className="text-sm">{formatDate(bill.created_at)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              type="submit"
              className="w-full"
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => navigate(`/sells/vendor-bills/${bill.id}`)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default VendorBillEdit;
