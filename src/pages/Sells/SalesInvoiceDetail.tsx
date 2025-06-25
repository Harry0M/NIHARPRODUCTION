import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Printer, FileText, Package, Building, Calculator } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { Database } from "@/integrations/supabase/types";
import { generateSalesInvoicePDF } from "@/utils/professionalPdfUtils";

type SalesInvoice = Database["public"]["Tables"]["sales_invoices"]["Row"];
type Order = Database["public"]["Tables"]["orders"]["Row"];

interface SalesInvoiceWithOrder extends SalesInvoice {
  orders?: Order;
}

const SalesInvoiceDetail = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<SalesInvoiceWithOrder | null>(null);
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
            onClick={() => navigate('/sells')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sells
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Sales Invoice #{invoice.invoice_number}</h1>
            <p className="text-muted-foreground">View invoice details and information</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/sells/invoice/${invoice.id}/edit`)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Invoice
          </Button>          <Button
            variant="outline"
            onClick={() => generateSalesInvoicePDF({
              invoiceNumber: invoice.invoice_number,
              companyName: invoice.company_name,
              productName: invoice.product_name,
              quantity: invoice.quantity,
              rate: invoice.rate,
              subtotal: invoice.subtotal,
              gstPercentage: invoice.gst_percentage,
              gstAmount: invoice.gst_amount,
              transportIncluded: invoice.transport_included,
              transportCharge: invoice.transport_charge,
              otherExpenses: invoice.other_expenses,
              totalAmount: invoice.total_amount,
              createdAt: invoice.created_at,
              notes: invoice.notes || '',
              order: invoice.orders ? {
                orderNumber: invoice.orders.order_number,
                orderDate: invoice.orders.order_date,
                deliveryDate: invoice.orders.delivery_date || '',
                status: invoice.orders.status || ''
              } : undefined
            }, `sales-invoice-${invoice.invoice_number}`)}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoice Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Invoice Number</h3>
                  <p className="font-medium">{invoice.invoice_number}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Company Name</h3>
                  <p className="font-medium">{invoice.company_name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Product Name</h3>
                  <p className="font-medium">{invoice.product_name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Quantity</h3>
                  <p className="font-medium">{invoice.quantity.toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Rate</h3>
                  <p className="font-medium">{formatCurrency(invoice.rate)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Created Date</h3>
                  <p className="font-medium">{formatDate(invoice.created_at)}</p>
                </div>
              </div>

              {invoice.notes && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                  <p className="text-sm bg-muted p-3 rounded-md">{invoice.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Financial Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                </div>
                
                {invoice.transport_included && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transport Charge:</span>
                    <span className="font-medium">{formatCurrency(invoice.transport_charge)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GST ({invoice.gst_percentage}%):</span>
                  <span className="font-medium">{formatCurrency(invoice.gst_amount)}</span>
                </div>
                
                {invoice.other_expenses > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Other Expenses:</span>
                    <span className="font-medium">{formatCurrency(invoice.other_expenses)}</span>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount:</span>
                <span className="text-primary">{formatCurrency(invoice.total_amount)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Information */}
        <div className="space-y-6">
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
                {invoice.orders.delivery_date && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Delivery Date</h3>
                    <p className="text-sm">{formatDate(invoice.orders.delivery_date)}</p>
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <Badge variant="outline" className="mt-1 bg-green-50 text-green-700 border-green-200">
                    {invoice.orders.status}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                  onClick={() => navigate(`/orders/${invoice.orders?.id}`)}
                >
                  View Order Details
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Transport Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Transport Included</h3>
                <Badge variant={invoice.transport_included ? "default" : "secondary"} className="mt-1">
                  {invoice.transport_included ? "Yes" : "No"}
                </Badge>
              </div>
              {invoice.transport_included && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Transport Charge</h3>
                  <p className="font-medium">{formatCurrency(invoice.transport_charge)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SalesInvoiceDetail;
