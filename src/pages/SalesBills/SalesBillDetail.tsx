import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  FileText, 
  Edit, 
  Download, 
  Copy, 
  Clock, 
  CheckCircle2, 
  BanknoteIcon, 
  XCircle,
  Calendar,
  Eye
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showToast } from "@/components/ui/enhanced-toast";
import { 
  fetchSalesBillById, 
  updateSalesBillStatus, 
  updateSalesBillPaymentStatus 
} from "@/services/salesBillService";
import { SalesBill } from "@/types/salesBill";
import { Badge } from "@/components/ui/badge";
import { downloadSalesBillPDF, openSalesBillPDF } from "@/utils/pdfGenerator";

export default function SalesBillDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [bill, setBill] = useState<SalesBill | null>(null);

  // Fetch sales bill details when component mounts
  useEffect(() => {
    const fetchBillDetails = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const data = await fetchSalesBillById(id);
        setBill(data);      } catch (error) {
        showToast({
          title: "Error fetching sales bill",
          description: error instanceof Error ? error.message : "Unknown error occurred",
          type: "error"
        });
        navigate("/sales-bills");
      } finally {
        setLoading(false);
      }
    };

    fetchBillDetails();
  }, [id, navigate]);

  // Handle bill status change
  const handleStatusChange = async (status: string) => {
    if (!bill || !id) return;
    
    setUpdating(true);
    try {
      const updatedBill = await updateSalesBillStatus(id, status);
      setBill(updatedBill);
      showToast({
        title: "Status updated",
        description: `The bill status has been updated to ${status}.`,
        type: "success"
      });    } catch (error) {
      showToast({
        title: "Error updating status",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        type: "error"
      });
    } finally {
      setUpdating(false);
    }
  };

  // Handle payment status change
  const handlePaymentStatusChange = async (paymentStatus: string) => {
    if (!bill || !id) return;
    
    setUpdating(true);
    try {
      const updatedBill = await updateSalesBillPaymentStatus(id, paymentStatus);
      setBill(updatedBill);
      showToast({
        title: "Payment status updated",
        description: `The payment status has been updated to ${paymentStatus}.`,
        type: "success"
      });    } catch (error) {
      showToast({
        title: "Error updating payment status",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        type: "error"
      });
    } finally {
      setUpdating(false);
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "draft":
        return "secondary";
      case "sent":
        return "default";
      case "paid":
        return "success";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Get payment status badge variant
  const getPaymentStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "warning";
      case "partial":
        return "default";
      case "paid":
        return "success";
      case "overdue":
        return "destructive";
      default:
        return "outline";
    }
  };
  // Generate and download PDF of the sales bill
  const handleGeneratePDF = () => {
    if (!bill) return;
    
    try {
      downloadSalesBillPDF(bill);
      
      showToast({
        title: "PDF Generated",
        description: "Sales bill PDF has been downloaded.",
        type: "success"
      });
    } catch (error) {
      showToast({
        title: "PDF Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate PDF",
        type: "error"
      });
    }
  };
  
  // Generate and view PDF in new tab
  const handleViewPDF = () => {
    if (!bill) return;
    
    try {
      openSalesBillPDF(bill);
    } catch (error) {
      showToast({
        title: "PDF Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate PDF",
        type: "error"
      });
    }
  };

  // Copy bill info to clipboard
  const handleCopyBillInfo = () => {
    if (!bill) return;
    
    const billInfo = `
Bill Number: ${bill.bill_number}
Company: ${bill.company_name}
Product: ${bill.catalog_name}
Amount: ₹${bill.total_amount.toFixed(2)}
Date: ${new Date(bill.bill_date).toLocaleDateString()}
Status: ${bill.status}
Payment Status: ${bill.payment_status}
    `;
    
    navigator.clipboard.writeText(billInfo.trim());
    
    showToast({
      title: "Copied to clipboard",
      description: "Bill information has been copied to clipboard.",
      type: "success"
    });
  };

  // Get the appropriate status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <FileText className="h-4 w-4" />;
      case "sent":
        return <CheckCircle2 className="h-4 w-4" />;
      case "paid":
        return <BanknoteIcon className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Sales Bill {bill?.bill_number}
          </h1>
          <p className="text-muted-foreground">View and manage sales bill details</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate("/sales-bills")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sales Bills
          </Button>
          <Button variant="outline" onClick={() => navigate(`/sales-bills/${id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p>Loading sales bill details...</p>
          </CardContent>
        </Card>
      ) : !bill ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p>Sales bill not found.</p>
            <Button className="mt-4" onClick={() => navigate("/sales-bills")}>
              Back to Sales Bills
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Bill Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Bill Information
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusBadgeVariant(bill.status)} className="flex items-center gap-1">
                    {getStatusIcon(bill.status)}
                    {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                  </Badge>
                  <Badge variant={getPaymentStatusBadgeVariant(bill.payment_status)}>
                    {bill.payment_status.charAt(0).toUpperCase() + bill.payment_status.slice(1)}
                  </Badge>
                </div>
              </CardTitle>
              <CardDescription>Detailed information about this sales bill</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-muted-foreground">Bill Number</Label>
                  <p className="font-medium">{bill.bill_number}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Company</Label>
                  <p className="font-medium">{bill.company_name}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Company Address</Label>
                <p className="font-medium">{bill.company_address || "Not specified"}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-muted-foreground">Product</Label>
                  <p className="font-medium">{bill.catalog_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Quantity</Label>
                  <p className="font-medium">{bill.quantity}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-muted-foreground">Bill Date</Label>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(bill.bill_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Due Date</Label>
                  <p className="font-medium">
                    {bill.due_date 
                      ? new Date(bill.due_date).toLocaleDateString() 
                      : "Not specified"
                    }
                  </p>
                </div>
              </div>
              
              {bill.notes && (
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="font-medium">{bill.notes}</p>
                </div>
              )}
              
              {bill.terms_and_conditions && (
                <div>
                  <Label className="text-muted-foreground">Terms & Conditions</Label>
                  <p className="font-medium">{bill.terms_and_conditions}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Bill Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
              <CardDescription>Summary of financial details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate:</span>
                <span>₹{bill.rate.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>₹{bill.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  GST ({bill.gst_percentage}%):
                </span>
                <span>₹{bill.gst_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transport Charge:</span>
                <span>₹{bill.transport_charge.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total Amount:</span>
                <span>₹{bill.total_amount.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">              <Button className="w-full" onClick={handleGeneratePDF}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button variant="secondary" className="w-full" onClick={handleViewPDF}>
                <Eye className="mr-2 h-4 w-4" />
                View PDF
              </Button>
              <Button variant="outline" className="w-full" onClick={handleCopyBillInfo}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Bill Info
              </Button>
            </CardFooter>
          </Card>
          
          {/* Status Management */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Status Management</CardTitle>
              <CardDescription>Update the bill and payment status</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Label>Bill Status</Label>
                <Select 
                  value={bill.status}
                  onValueChange={handleStatusChange}
                  disabled={updating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Draft
                      </div>
                    </SelectItem>
                    <SelectItem value="sent">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Sent
                      </div>
                    </SelectItem>
                    <SelectItem value="paid">
                      <div className="flex items-center gap-2">
                        <BanknoteIcon className="h-4 w-4" />
                        Paid
                      </div>
                    </SelectItem>
                    <SelectItem value="cancelled">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Cancelled
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  The current status of this sales bill.
                </p>
              </div>
              
              <div className="space-y-4">
                <Label>Payment Status</Label>
                <Select 
                  value={bill.payment_status}
                  onValueChange={handlePaymentStatusChange}
                  disabled={updating}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="partial">Partially Paid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  The current payment status of this sales bill.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
