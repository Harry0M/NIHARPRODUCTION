import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Calculator, Package, Building } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type SalesInvoiceInsert = Database["public"]["Tables"]["sales_invoices"]["Insert"];

interface SellsFormData {
  invoiceNumber: string;
  companyName: string;
  productName: string;
  quantity: number;
  rate: number;
  transportIncluded: boolean;
  transportCharge: number;
  gstPercentage: number;
  otherExpenses: number;
  createdDate: string; // Added creation date field
}

const SellsCreateForm = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState<SellsFormData>({
    invoiceNumber: "",
    companyName: "",
    productName: "",
    quantity: 0,
    rate: 0,
    transportIncluded: false,
    transportCharge: 0,
    gstPercentage: 18, // Default GST
    otherExpenses: 0,
    createdDate: new Date().toISOString().split('T')[0], // Default to today's date
  });

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;

      setOrder(data);
      
      // Auto-populate form with order data
      // Calculate rate per unit from total selling price divided by order quantity
      const calculatedRate = data.calculated_selling_price && data.order_quantity 
        ? data.calculated_selling_price / data.order_quantity 
        : (data.rate || 0);
      
      setFormData(prev => ({
        ...prev,
        companyName: data.company_name,
        productName: data.description || `Order ${data.order_number}`,
        quantity: data.order_quantity || 1, // Show order quantity, not total quantity
        rate: calculatedRate, // Show calculated rate per unit
        transportCharge: data.transport_charge || 0,
        transportIncluded: Boolean(data.transport_charge),
      }));
    } catch (error) {
      toast({
        title: "Error fetching order",
        description: error instanceof Error ? error.message : "Failed to load order details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId, fetchOrder]);

  const calculateSubtotal = () => {
    return formData.quantity * formData.rate;
  };

  const calculateGSTAmount = () => {
    const subtotal = calculateSubtotal();
    return (subtotal * formData.gstPercentage) / 100;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const gstAmount = calculateGSTAmount();
    const transport = formData.transportIncluded ? 0 : formData.transportCharge;
    return subtotal + gstAmount + transport + formData.otherExpenses;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setSaving(true);
    try {      // Create sales invoice record
      const salesInvoiceData: SalesInvoiceInsert = {
        order_id: order.id,
        invoice_number: formData.invoiceNumber,
        company_name: formData.companyName,
        product_name: formData.productName,
        quantity: formData.quantity,
        rate: formData.rate,
        transport_included: formData.transportIncluded,
        transport_charge: formData.transportIncluded ? 0 : formData.transportCharge,
        gst_percentage: formData.gstPercentage,
        gst_amount: calculateGSTAmount(),
        other_expenses: formData.otherExpenses,
        subtotal: calculateSubtotal(),
        total_amount: calculateTotal(),
        created_at: new Date(formData.createdDate).toISOString(), // Use selected date
      };

      // Insert into sales_invoices table
      const { data: salesInvoice, error: salesError } = await supabase
        .from('sales_invoices')
        .insert(salesInvoiceData)
        .select()
        .single();

      if (salesError) throw salesError;

      // Also create a transaction record for tracking
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          type: 'sales_invoice',
          amount: calculateTotal(),
          order_id: order.id,
          notes: `Invoice: ${formData.invoiceNumber} - ${formData.productName}`,
          date: formData.createdDate, // Use selected date for transaction
        });

      if (transactionError) throw transactionError;      toast({
        title: "Sales invoice created successfully",
        description: `Invoice ${formData.invoiceNumber} has been created and recorded`,
      });

      // Navigate to the invoice detail page
      navigate(`/sells/invoice/${salesInvoice.id}`);
    } catch (error) {
      toast({
        title: "Error creating sales invoice",
        description: error instanceof Error ? error.message : "Failed to save sales invoice",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof SellsFormData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Order not found</h3>
        <p className="text-muted-foreground mb-4">
          The requested order could not be found.
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
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/sells')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sells
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Sales Record</h1>
          <p className="text-muted-foreground">
            Create invoice and sales record for order {order.order_number}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Sales Information
              </CardTitle>
              <CardDescription>
                Enter the invoice details and adjust pricing if needed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoiceNumber">Invoice Number *</Label>
                    <Input
                      id="invoiceNumber"
                      placeholder="Enter invoice number"
                      value={formData.invoiceNumber}
                      onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="createdDate">Creation Date *</Label>
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
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      readOnly
                      className="bg-muted"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productName">Product</Label>
                    <Input
                      id="productName"
                      value={formData.productName}
                      onChange={(e) => handleInputChange('productName', e.target.value)}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Order Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange('quantity', Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rate">Rate per Unit</Label>
                    <Input
                      id="rate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.rate}
                      onChange={(e) => handleInputChange('rate', Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Transport Included in Rate</Label>
                      <p className="text-sm text-muted-foreground">
                        Toggle if transport cost is already included in the rate
                      </p>
                    </div>
                    <Switch
                      checked={formData.transportIncluded}
                      onCheckedChange={(checked) => handleInputChange('transportIncluded', checked)}
                    />
                  </div>

                  {!formData.transportIncluded && (
                    <div className="space-y-2">
                      <Label htmlFor="transportCharge">Transport Charge</Label>
                      <Input
                        id="transportCharge"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.transportCharge}
                        onChange={(e) => handleInputChange('transportCharge', Number(e.target.value))}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gstPercentage">GST Percentage</Label>
                    <Input
                      id="gstPercentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.gstPercentage}
                      onChange={(e) => handleInputChange('gstPercentage', Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="otherExpenses">Other Expenses</Label>
                    <Input
                      id="otherExpenses"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.otherExpenses}
                      onChange={(e) => handleInputChange('otherExpenses', Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/sells')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving || !formData.invoiceNumber}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Create Sales Record'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Summary Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Order Number:</span>
                  <Badge variant="outline">{order.order_number}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Status:</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Completed
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Order Date:</span>
                  <span>{new Date(order.order_date).toLocaleDateString()}</span>
                </div>
                {order.delivery_date && (
                  <div className="flex justify-between text-sm">
                    <span>Delivery Date:</span>
                    <span>{new Date(order.delivery_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Price Calculation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>GST ({formData.gstPercentage}%):</span>
                  <span>{formatCurrency(calculateGSTAmount())}</span>
                </div>
                {!formData.transportIncluded && formData.transportCharge > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Transport:</span>
                    <span>{formatCurrency(formData.transportCharge)}</span>
                  </div>
                )}
                {formData.otherExpenses > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Other Expenses:</span>
                    <span>{formatCurrency(formData.otherExpenses)}</span>
                  </div>
                )}
                <hr />
                <div className="flex justify-between font-semibold">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SellsCreateForm;
