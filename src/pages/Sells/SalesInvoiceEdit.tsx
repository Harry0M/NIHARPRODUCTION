import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Calculator, Package, FileText } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { Database } from "@/integrations/supabase/types";

type SalesInvoice = Database["public"]["Tables"]["sales_invoices"]["Row"];
type Order = Database["public"]["Tables"]["orders"]["Row"];

interface SalesInvoiceWithOrder extends SalesInvoice {
  orders?: Order;
}

interface EditFormData {
  invoiceNumber: string;
  companyName: string;
  productName: string;
  quantity: number;
  rate: number;
  transportIncluded: boolean;
  transportCharge: number;
  gstPercentage: number;
  otherExpenses: number;
  notes: string;
  createdDate: string; // Added creation date field
}

const SalesInvoiceEdit = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [invoice, setInvoice] = useState<SalesInvoiceWithOrder | null>(null);
  const [formData, setFormData] = useState<EditFormData>({
    invoiceNumber: "",
    companyName: "",
    productName: "",
    quantity: 0,
    rate: 0,
    transportIncluded: false,
    transportCharge: 0,
    gstPercentage: 18,
    otherExpenses: 0,
    notes: "",
    createdDate: new Date().toISOString().split('T')[0], // Default to today's date
  });

  const fetchInvoice = useCallback(async () => {
    if (!invoiceId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales_invoices')
        .select(`
          *,
          orders (*)
        `)
        .eq('id', invoiceId)
        .single();

      if (error) throw error;
      
      setInvoice(data as SalesInvoiceWithOrder);
      
      // Populate form with existing data
      setFormData({
        invoiceNumber: data.invoice_number,
        companyName: data.company_name,
        productName: data.product_name,
        quantity: data.quantity,
        rate: data.rate,
        transportIncluded: data.transport_included,
        transportCharge: data.transport_charge,
        gstPercentage: data.gst_percentage,
        otherExpenses: data.other_expenses,
        notes: data.notes || "",
        createdDate: data.created_at ? new Date(data.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      toast({
        title: "Error fetching invoice",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  // Calculate financial values
  const calculateFinancials = useCallback(() => {
    const subtotal = formData.quantity * formData.rate;
    const transportCharge = formData.transportIncluded ? formData.transportCharge : 0;
    const gstAmount = (subtotal * formData.gstPercentage) / 100;
    const totalAmount = subtotal + transportCharge + gstAmount + formData.otherExpenses;

    return {
      subtotal,
      transportCharge,
      gstAmount,
      totalAmount,
    };
  }, [formData]);

  const financials = calculateFinancials();

  const handleInputChange = (field: keyof EditFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted');
    console.log('Invoice:', invoice);
    console.log('Form data:', formData);
    
    if (!invoice) return;

    // Check authentication status
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Current user:', user);
    console.log('Auth error:', authError);
    
    if (!user) {
      console.warn('⚠️ User not authenticated - this might cause RLS policy issues');
      toast({
        title: "Authentication Error",
        description: "You must be logged in to edit invoices",
        variant: "destructive",
      });
      return;
    }

    // Validation
    if (!formData.invoiceNumber.trim()) {
      toast({
        title: "Validation Error",
        description: "Invoice number is required",
        variant: "destructive",
      });
      return;
    }

    if (formData.quantity <= 0 || formData.rate <= 0) {
      toast({
        title: "Validation Error",
        description: "Quantity and rate must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);    try {
      const updateData = {
        invoice_number: formData.invoiceNumber,
        company_name: formData.companyName,
        product_name: formData.productName,
        quantity: formData.quantity,
        rate: formData.rate,
        transport_included: formData.transportIncluded,
        transport_charge: financials.transportCharge,
        gst_percentage: formData.gstPercentage,
        gst_amount: financials.gstAmount,
        other_expenses: formData.otherExpenses,
        subtotal: financials.subtotal,
        total_amount: financials.totalAmount,
        notes: formData.notes || null,
        created_at: new Date(formData.createdDate).toISOString(), // Update creation date
        updated_at: new Date().toISOString(),
      };      console.log('Updating invoice with data:', updateData);
      console.log('Invoice ID:', invoice.id);
      console.log('Invoice created_by:', invoice.created_by);
      console.log('Current user ID:', user?.id);

      const { data, error } = await supabase
        .from('sales_invoices')
        .update(updateData)
        .eq('id', invoice.id)
        .select();

      console.log('Update result:', { data, error });
      
      if (error) {
        console.error('❌ Database update error details:');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        
        // Check if it's an RLS policy error
        if (error.message.includes('row-level security') || error.message.includes('policy')) {
          console.error('🔒 This appears to be an RLS policy error');
          console.error('💡 Possible solutions:');
          console.error('   1. Check if user owns this invoice (created_by = user.id)');
          console.error('   2. Update RLS policies to be more permissive');
          console.error('   3. Ensure user is properly authenticated');
        }
      }

      if (error) throw error;      toast({
        title: "Invoice updated",
        description: "Sales invoice has been updated successfully",
      });

      // Navigate back to sells list with refresh parameter to trigger data refresh
      navigate('/sells?refresh=invoice-updated');
    } catch (error) {
      toast({
        title: "Error updating invoice",
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

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Invoice not found</h3>
        <p className="text-muted-foreground mb-4">
          The requested sales invoice could not be found.
        </p>
        <Button onClick={() => navigate('/sells')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Sells
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(`/sells/invoice/${invoice.id}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Details
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Sales Invoice</h1>
            <p className="text-muted-foreground">Modify invoice information and recalculate totals</p>
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
                Invoice Information
              </CardTitle>
              <CardDescription>Update the basic invoice details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoiceNumber">Invoice Number</Label>
                  <Input
                    id="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                    placeholder="Enter invoice number"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="createdDate">Creation Date</Label>
                  <Input
                    id="createdDate"
                    type="date"
                    value={formData.createdDate}
                    onChange={(e) => handleInputChange('createdDate', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder="Enter company name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="productName">Product Name</Label>
                  <Input
                    id="productName"
                    value={formData.productName}
                    onChange={(e) => handleInputChange('productName', e.target.value)}
                    placeholder="Enter product name"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                    placeholder="Enter quantity"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="rate">Rate per Unit</Label>
                  <Input
                    id="rate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.rate}
                    onChange={(e) => handleInputChange('rate', parseFloat(e.target.value) || 0)}
                    placeholder="Enter rate per unit"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="gstPercentage">GST Percentage</Label>
                  <Input
                    id="gstPercentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.gstPercentage}
                    onChange={(e) => handleInputChange('gstPercentage', parseFloat(e.target.value) || 0)}
                    placeholder="Enter GST percentage"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transport & Additional Charges</CardTitle>
              <CardDescription>Configure transport and other additional expenses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="transportIncluded"
                  checked={formData.transportIncluded}
                  onCheckedChange={(checked) => handleInputChange('transportIncluded', checked)}
                />
                <Label htmlFor="transportIncluded">Include Transport Charges</Label>
              </div>

              {formData.transportIncluded && (
                <div>
                  <Label htmlFor="transportCharge">Transport Charge</Label>
                  <Input
                    id="transportCharge"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.transportCharge}
                    onChange={(e) => handleInputChange('transportCharge', parseFloat(e.target.value) || 0)}
                    placeholder="Enter transport charge"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="otherExpenses">Other Expenses</Label>
                <Input
                  id="otherExpenses"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.otherExpenses}
                  onChange={(e) => handleInputChange('otherExpenses', parseFloat(e.target.value) || 0)}
                  placeholder="Enter other expenses"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Add any additional notes"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary and Order Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Invoice Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">{formatCurrency(financials.subtotal)}</span>
              </div>
              
              {formData.transportIncluded && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Transport:</span>
                  <span className="font-medium">{formatCurrency(financials.transportCharge)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">GST ({formData.gstPercentage}%):</span>
                <span className="font-medium">{formatCurrency(financials.gstAmount)}</span>
              </div>
              
              {formData.otherExpenses > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Other Expenses:</span>
                  <span className="font-medium">{formatCurrency(formData.otherExpenses)}</span>
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

          {/* Related Order Info */}
          {invoice.orders && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Related Order
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Order Number</h3>
                  <Badge variant="outline" className="mt-1">
                    {invoice.orders.order_number}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Order Date</h3>
                  <p className="text-sm">{formatDate(invoice.orders.order_date)}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate(`/orders/${invoice.orders?.id}`)}
                >
                  View Order Details
                </Button>
              </CardContent>
            </Card>
          )}

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
              onClick={() => navigate(`/sells/invoice/${invoice.id}`)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SalesInvoiceEdit;
