import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

const VendorBillCreateSimple = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState<{ id: string; name: string; }[]>([]);

  // Get job details from URL params
  const jobData = {
    jobType: searchParams.get('jobType') || '',
    jobId: searchParams.get('jobId') || '',
    vendorId: searchParams.get('vendorId') || '',
    workerName: searchParams.get('workerName') || '',
    orderNumber: searchParams.get('orderNumber') || '',
    companyName: searchParams.get('companyName') || '',
    quantity: parseInt(searchParams.get('quantity') || '0'),
    rate: parseFloat(searchParams.get('rate') || '0')
  };  // Form state - initialize with default bill number
  const [formData, setFormData] = useState({
    bill_number: `VB${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    vendor_id: jobData.vendorId,
    job_type: jobData.jobType,
    job_id: jobData.jobId,
    worker_name: jobData.workerName,
    order_number: jobData.orderNumber,
    company_name: jobData.companyName,
    product_name: 'Service Work', // Default value for service work
    quantity: jobData.quantity,
    rate: jobData.rate,
    gst_percentage: 18,
    other_expenses: 0,
    notes: ''
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast({
        title: "Error fetching vendors",
        description: "Failed to load vendors list",
        variant: "destructive",
      });
    }
  };
  const calculateTotal = () => {
    const baseAmount = formData.quantity * formData.rate;
    const gstAmount = (baseAmount * formData.gst_percentage) / 100;
    return baseAmount + gstAmount + formData.other_expenses;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const selectedVendor = vendors.find(v => v.id === formData.vendor_id);
        if (!selectedVendor) {
        throw new Error('Please select a vendor');
      }

      if (!formData.bill_number.trim()) {
        throw new Error('Please enter a bill number');
      }

      const billData = {
        bill_number: formData.bill_number.trim(),
        vendor_id: formData.vendor_id,
        vendor_name: selectedVendor.name,
        job_id: formData.job_id,
        job_type: formData.job_type,
        job_number: null, // Will be auto-generated or fetched
        order_id: null, // Can be linked later if needed
        order_number: formData.order_number || null,
        product_name: formData.product_name,
        company_name: formData.company_name,
        quantity: formData.quantity,
        rate: formData.rate,
        subtotal: formData.quantity * formData.rate,
        gst_percentage: formData.gst_percentage,
        gst_amount: (formData.quantity * formData.rate * formData.gst_percentage) / 100,
        other_expenses: formData.other_expenses,
        total_amount: calculateTotal(),
        status: 'pending' as const,
        notes: formData.notes || null
      };

      console.log('Creating vendor bill:', billData);

      const { data, error } = await supabase
        .from('vendor_bills')
        .insert(billData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Vendor bill created successfully!",
        description: `Bill number: ${billData.bill_number}`,
      });

      navigate('/sells/vendor-bills');
    } catch (error) {
      console.error('Error creating vendor bill:', error);
      toast({
        title: "Error creating vendor bill",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/sells/vendor-bills')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Vendor Bills
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Vendor Bill</h1>
          <p className="text-muted-foreground">
            Create a bill for completed vendor job
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
            <CardDescription>Information about the completed job</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Job Type</Label>
                <Input 
                  value={formData.job_type} 
                  disabled 
                  className="capitalize"
                />
              </div>
              <div>
                <Label>Worker Name</Label>
                <Input 
                  value={formData.worker_name} 
                  onChange={(e) => setFormData(prev => ({ ...prev, worker_name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Order Number</Label>
                <Input 
                  value={formData.order_number} 
                  onChange={(e) => setFormData(prev => ({ ...prev, order_number: e.target.value }))}
                />
              </div>              <div>
                <Label>Company Name</Label>
                <Input 
                  value={formData.company_name} 
                  onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Product/Service Name</Label>
                <Input 
                  value={formData.product_name} 
                  onChange={(e) => setFormData(prev => ({ ...prev, product_name: e.target.value }))}
                  placeholder="e.g., Cutting Service, Printing Service"
                />
              </div>
            </div>
          </CardContent>
        </Card>        <Card>
          <CardHeader>
            <CardTitle>Vendor & Billing Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Bill Number *</Label>
                <Input 
                  value={formData.bill_number} 
                  onChange={(e) => setFormData(prev => ({ ...prev, bill_number: e.target.value }))}
                  placeholder="e.g., VB-2025-001"
                  required
                />
              </div>
              <div>
                <Label>Vendor *</Label>
                <Select 
                  value={formData.vendor_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, vendor_id: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map(vendor => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Quantity *</Label>
                <Input 
                  type="number" 
                  value={formData.quantity} 
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                  required
                />
              </div>
              <div>
                <Label>Rate (₹) *</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  value={formData.rate} 
                  onChange={(e) => setFormData(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                  required
                />
              </div>
              <div>
                <Label>Base Amount</Label>
                <Input 
                  value={formatCurrency(formData.quantity * formData.rate)} 
                  disabled 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>GST (%)</Label>
                <Input 
                  type="number" 
                  value={formData.gst_percentage} 
                  onChange={(e) => setFormData(prev => ({ ...prev, gst_percentage: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label>Other Expenses (₹)</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  value={formData.other_expenses} 
                  onChange={(e) => setFormData(prev => ({ ...prev, other_expenses: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea 
                value={formData.notes} 
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes or comments..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bill Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Base Amount:</span>
                <span>{formatCurrency(formData.quantity * formData.rate)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST ({formData.gst_percentage}%):</span>
                <span>{formatCurrency((formData.quantity * formData.rate * formData.gst_percentage) / 100)}</span>
              </div>
              <div className="flex justify-between">
                <span>Other Expenses:</span>
                <span>{formatCurrency(formData.other_expenses)}</span>
              </div>
              <hr />
              <div className="flex justify-between font-bold text-lg">
                <span>Total Amount:</span>
                <span>{formatCurrency(calculateTotal())}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/sells/vendor-bills')}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Creating...' : 'Create Bill'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default VendorBillCreateSimple;
