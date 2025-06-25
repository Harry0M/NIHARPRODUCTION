import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit, Printer, FileText, Package, Building, Calculator, User } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { generateVendorBillPDF } from "@/utils/professionalPdfUtils";
import { Database } from "@/integrations/supabase/types";

type VendorBill = Database["public"]["Tables"]["vendor_bills"]["Row"];
type Vendor = Database["public"]["Tables"]["vendors"]["Row"];

interface VendorBillWithVendor extends VendorBill {
  vendors?: Vendor;
}

const VendorBillDetail = () => {
  const { billId } = useParams<{ billId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bill, setBill] = useState<VendorBillWithVendor | null>(null);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  const handlePrint = () => {
    if (!bill) return;
    // Use the enhanced vendor bill PDF generation
    generateVendorBillPDF(bill, `vendor-bill-${bill.bill_number}`);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/sells/vendor-bills')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Vendor Bills
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Vendor Bill #{bill.bill_number}</h1>
            <p className="text-muted-foreground">View vendor bill details and information</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/sells/vendor-bills/${bill.id}/edit`)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Bill
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bill Information */}
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
                  <h3 className="text-sm font-medium text-muted-foreground">Bill Number</h3>
                  <p className="font-medium">{bill.bill_number}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Vendor Name</h3>
                  <p className="font-medium">{bill.vendor_name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Job Type</h3>
                  <Badge variant="outline" className="capitalize">
                    {bill.job_type}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Company</h3>
                  <p className="font-medium">{bill.company_name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Quantity</h3>
                  <p className="font-medium">{bill.quantity.toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Rate</h3>
                  <p className="font-medium">{formatCurrency(bill.rate)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Created Date</h3>
                  <p className="font-medium">{formatDate(bill.created_at)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <Badge
                    variant={
                      bill.status === 'paid' ? 'default' :
                      bill.status === 'pending' ? 'secondary' :
                      'destructive'
                    }
                  >
                    {bill.status?.charAt(0).toUpperCase() + (bill.status?.slice(1) || '')}
                  </Badge>
                </div>
              </div>

              {bill.notes && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                  <p className="text-sm bg-muted p-3 rounded-md">{bill.notes}</p>
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
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(bill.subtotal)}</span>
                </div>
                  <div className="flex justify-between">
                  <span className="text-muted-foreground">GST ({bill.gst_percentage}%):</span>
                  <span className="font-medium">{formatCurrency(bill.gst_amount)}</span>
                </div>
                
                {bill.other_expenses > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Other Expenses:</span>
                    <span className="font-medium">{formatCurrency(bill.other_expenses)}</span>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount:</span>
                <span className="text-primary">{formatCurrency(bill.total_amount)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vendor Information */}
        <div className="space-y-6">
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
                {bill.vendors.phone && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
                    <p className="text-sm">{bill.vendors.phone}</p>
                  </div>
                )}
                {bill.vendors.email && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                    <p className="text-sm">{bill.vendors.email}</p>
                  </div>
                )}                {bill.vendors.service_type && (
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

          {/* Job Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Job Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Job Type</h3>
                <Badge variant="outline" className="mt-1 capitalize">
                  {bill.job_type}
                </Badge>
              </div>
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
                <h3 className="text-sm font-medium text-muted-foreground">Quantity</h3>
                <p className="text-sm">{bill.quantity.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/sells/vendor-bills/${bill.id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Bill
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Bill
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VendorBillDetail;
