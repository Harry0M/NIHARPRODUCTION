import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { showToast } from "@/components/ui/enhanced-toast";
import { fetchCompletedDispatches, createSalesBill } from "@/services/salesBillService";
import { DispatchWithOrderDetails } from "@/types/salesBill";
import { supabase } from "@/integrations/supabase/client";

export default function SalesBillNew() {
  const { dispatchId } = useParams<{ dispatchId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dispatch, setDispatch] = useState<DispatchWithOrderDetails | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    bill_number: "",
    company_name: "",
    company_address: "",
    catalog_name: "",
    quantity: 0,
    rate: 0,
    gst_percentage: 0,
    transport_charge: 0,
    bill_date: new Date().toISOString().split("T")[0],
    due_date: "",
    notes: "",
    terms_and_conditions: ""
  });

  // Calculated fields
  const subtotal = formData.quantity * formData.rate;
  const gstAmount = (subtotal * formData.gst_percentage) / 100;
  const totalAmount = subtotal + gstAmount + formData.transport_charge;

  // Fetch dispatch details when component mounts
  useEffect(() => {
    const fetchDispatchDetails = async () => {
      if (!dispatchId) return;
      
      setLoading(true);
      try {
        // Use the service to fetch all dispatches and filter the one we need
        const response = await fetchCompletedDispatches(1, 100);
        const selectedDispatch = response.data.find(d => d.id === dispatchId);
        
        if (!selectedDispatch) {
          showToast({
            title: "Dispatch not found",
            description: "The selected dispatch could not be found.",
            type: "error"
          });
          navigate("/sales-bills/select-dispatch");
          return;
        }
        
        setDispatch(selectedDispatch);
        
        // Calculate total quantity from dispatch batches
        const totalQuantity = selectedDispatch.dispatch_batches.reduce(
          (sum, batch) => sum + batch.quantity, 0
        );        // Populate form data from dispatch and order details
        setFormData({
          bill_number: "", // To be filled by user or auto-generated
          company_name: selectedDispatch.orders?.company_name || "",
          company_address: selectedDispatch.orders?.customer_address || "",
          catalog_name: selectedDispatch.catalog_name || "",
          quantity: totalQuantity,
          rate: selectedDispatch.orders?.rate || 0,
          gst_percentage: 18, // Default GST percentage for India
          transport_charge: selectedDispatch.orders?.transport_charge || 0,
          bill_date: new Date().toISOString().split("T")[0],
          due_date: "", // To be filled by user
          notes: "",
          terms_and_conditions: "Payment due within 30 days of invoice date."
        });
      } catch (error: any) {
        showToast({
          title: "Error fetching dispatch details",
          description: error.message,
          type: "error"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDispatchDetails();
  }, [dispatchId, navigate]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle numeric input changes with validation
  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = parseFloat(value) || 0;
    
    // Ensure non-negative values
    if (numericValue < 0) return;
    
    setFormData(prev => ({ ...prev, [name]: numericValue }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dispatch) return;
    
    setSubmitting(true);
    try {
      // Prepare data for submission
      const salesBillData = {
        dispatch_id: dispatch.id,
        order_id: dispatch.orders?.id,
        company_name: formData.company_name,
        company_address: formData.company_address,
        catalog_name: formData.catalog_name,
        catalog_id: dispatch.orders?.catalog_id,
        quantity: formData.quantity,
        rate: formData.rate,
        gst_percentage: formData.gst_percentage,
        transport_charge: formData.transport_charge,
        bill_number: formData.bill_number || undefined, // Let trigger generate if empty
        bill_date: formData.bill_date,
        due_date: formData.due_date || null,
        notes: formData.notes || null,
        terms_and_conditions: formData.terms_and_conditions || null,
        status: "draft",
        payment_status: "pending"
      };
      
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        salesBillData.created_by = user.id;
      }
      
      // Create sales bill
      const createdBill = await createSalesBill(salesBillData);
      
      showToast({
        title: "Sales bill created",
        description: `Sales bill #${createdBill.bill_number} has been created.`,
        type: "success"
      });
      
      // Navigate to sales bills list
      navigate("/sales-bills");
    } catch (error: any) {
      showToast({
        title: "Error creating sales bill",
        description: error.message,
        type: "error"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Sales Bill</h1>
          <p className="text-muted-foreground">Create a sales bill from a completed dispatch</p>
        </div>
        <Button variant="ghost" onClick={() => navigate("/sales-bills/select-dispatch")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dispatches
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p>Loading dispatch details...</p>
          </CardContent>
        </Card>
      ) : !dispatch ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p>No dispatch found. Please select a valid dispatch.</p>
            <Button className="mt-4" onClick={() => navigate("/sales-bills/select-dispatch")}>
              Select Dispatch
            </Button>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            {/* Bill Information */}
            <Card>
              <CardHeader>
                <CardTitle>Bill Information</CardTitle>
                <CardDescription>General information about the sales bill</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bill_number">Bill Number (optional)</Label>
                  <Input
                    id="bill_number"
                    name="bill_number"
                    value={formData.bill_number}
                    onChange={handleInputChange}
                    placeholder="Auto-generated if left empty"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for auto-generated bill number
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bill_date">Bill Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="bill_date"
                        name="bill_date"
                        type="date"
                        className="pl-8"
                        value={formData.bill_date}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date (optional)</Label>
                    <div className="relative">
                      <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="due_date"
                        name="due_date"
                        type="date"
                        className="pl-8"
                        value={formData.due_date}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Additional notes for this bill"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="terms_and_conditions">Terms & Conditions (optional)</Label>
                  <Textarea
                    id="terms_and_conditions"
                    name="terms_and_conditions"
                    value={formData.terms_and_conditions}
                    onChange={handleInputChange}
                    placeholder="Terms and conditions for this bill"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Customer & Product Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer & Product Information</CardTitle>
                <CardDescription>Details about the customer and product</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company_address">Company Address (optional)</Label>
                  <Textarea
                    id="company_address"
                    name="company_address"
                    value={formData.company_address}
                    onChange={handleInputChange}
                    placeholder="Company address"
                    rows={2}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="catalog_name">Catalog/Product Name</Label>
                  <Input
                    id="catalog_name"
                    name="catalog_name"
                    value={formData.catalog_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={handleNumericChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="rate">Rate</Label>
                    <Input
                      id="rate"
                      name="rate"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.rate}
                      onChange={handleNumericChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gst_percentage">GST Percentage</Label>
                    <Input
                      id="gst_percentage"
                      name="gst_percentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={formData.gst_percentage}
                      onChange={handleNumericChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="transport_charge">Transport Charge</Label>
                    <Input
                      id="transport_charge"
                      name="transport_charge"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.transport_charge}
                      onChange={handleNumericChange}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Bill Summary & Totals */}
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>Bill Summary</CardTitle>
                <CardDescription>Summary of charges and total amount</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span>{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        GST ({formData.gst_percentage}%):
                      </span>
                      <span>{gstAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transport Charge:</span>
                      <span>{formData.transport_charge.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total Amount:</span>
                      <span>{totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium">Order Information:</p>
                      <p>Order #: {dispatch.orders?.order_number || "N/A"}</p>
                      <p>Dispatch Date: {new Date(dispatch.created_at).toLocaleDateString()}</p>
                      <p>
                        Total Quantity: {
                          dispatch.dispatch_batches.reduce((sum, batch) => sum + batch.quantity, 0)
                        } pcs
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/sales-bills/select-dispatch")}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  <Save className="mr-2 h-4 w-4" />
                  {submitting ? "Creating..." : "Create Sales Bill"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      )}
    </div>
  );
}
