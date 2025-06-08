import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { showToast } from "@/components/ui/enhanced-toast";
import { fetchSalesBillById } from "@/services/salesBillService";
import { supabase } from "@/integrations/supabase/client";

export default function SalesBillEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
    bill_date: "",
    due_date: "",
    notes: "",
    terms_and_conditions: ""
  });

  // Calculated fields
  const subtotal = formData.quantity * formData.rate;
  const gstAmount = (subtotal * formData.gst_percentage) / 100;
  const totalAmount = subtotal + gstAmount + formData.transport_charge;

  // Fetch sales bill details when component mounts
  useEffect(() => {
    const fetchBillDetails = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const data = await fetchSalesBillById(id);
        
        // Format dates to YYYY-MM-DD for input fields
        const formatDate = (dateString: string | null) => {
          if (!dateString) return "";
          return new Date(dateString).toISOString().split("T")[0];
        };
        
        setFormData({
          bill_number: data.bill_number || "",
          company_name: data.company_name || "",
          company_address: data.company_address || "",
          catalog_name: data.catalog_name || "",
          quantity: data.quantity || 0,
          rate: data.rate || 0,
          gst_percentage: data.gst_percentage || 0,
          transport_charge: data.transport_charge || 0,
          bill_date: formatDate(data.bill_date),
          due_date: formatDate(data.due_date),
          notes: data.notes || "",
          terms_and_conditions: data.terms_and_conditions || ""
        });      } catch (error) {
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
    
    if (!id) return;
    
    setSubmitting(true);
    try {
      // Prepare data for submission
      const salesBillData = {
        company_name: formData.company_name,
        company_address: formData.company_address || null,
        catalog_name: formData.catalog_name,
        quantity: formData.quantity,
        rate: formData.rate,
        gst_percentage: formData.gst_percentage,
        transport_charge: formData.transport_charge,
        subtotal: subtotal,
        gst_amount: gstAmount,
        total_amount: totalAmount,
        bill_number: formData.bill_number,
        bill_date: formData.bill_date,
        due_date: formData.due_date || null,
        notes: formData.notes || null,
        terms_and_conditions: formData.terms_and_conditions || null,
      };
      
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        salesBillData.updated_by = user.id;
      }
      
      // Update sales bill
      const { data, error } = await supabase
        .from('sales_bills')
        .update(salesBillData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      showToast({
        title: "Sales bill updated",
        description: `Sales bill #${data.bill_number} has been updated.`,
        type: "success"
      });
      
      // Navigate to sales bill detail
      navigate(`/sales-bills/${id}`);    } catch (error) {
      showToast({
        title: "Error updating sales bill",
        description: error instanceof Error ? error.message : "Unknown error occurred",
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
          <h1 className="text-3xl font-bold tracking-tight">Edit Sales Bill</h1>
          <p className="text-muted-foreground">Update sales bill information</p>
        </div>
        <Button variant="ghost" onClick={() => navigate(`/sales-bills/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Bill Details
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p>Loading sales bill details...</p>
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
                  <Label htmlFor="bill_number">Bill Number</Label>
                  <Input
                    id="bill_number"
                    name="bill_number"
                    value={formData.bill_number}
                    onChange={handleInputChange}
                    required
                  />
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        GST ({formData.gst_percentage}%):
                      </span>
                      <span>₹{gstAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transport Charge:</span>
                      <span>₹{formData.transport_charge.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total Amount:</span>
                      <span>₹{totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/sales-bills/${id}`)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  <Save className="mr-2 h-4 w-4" />
                  {submitting ? "Updating..." : "Update Sales Bill"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      )}
    </div>
  );
}
