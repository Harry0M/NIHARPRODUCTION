import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calculator, Save, Package } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { Database } from "@/integrations/supabase/types";

type VendorBillInsert = Database["public"]["Tables"]["vendor_bills"]["Insert"];

interface JobDetails {
  id: string;
  job_type: 'cutting' | 'printing' | 'stitching';
  worker_name: string;
  is_internal: boolean;
  rate: number | null;
  received_quantity: number | null;
  status: string;
  job_cards: {
    id: string;
    job_name: string;
    job_number: string | null;
    orders: {
      id: string;
      order_number: string;
      company_name: string;
      product_name: string;
    } | null;
  } | null;
}

interface VendorDetails {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  service_type: string | null;
}

interface FormData {
  vendor_id: string;
  gst_percentage: number;
  other_expenses: number;
  notes: string;
}

const VendorBillCreateForm = () => {
  const { jobType, jobId } = useParams<{ jobType: string; jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobDetails | null>(null);
  const [vendors, setVendors] = useState<VendorDetails[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<VendorDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    vendor_id: "",
    gst_percentage: 18,
    other_expenses: 0,
    notes: ""
  });
  useEffect(() => {
    fetchJobDetails();
    fetchVendors();
  }, [fetchJobDetails, fetchVendors]);

  const fetchJobDetails = async () => {
    if (!jobType || !jobId) return;

    try {
      let query: any;
      
      switch (jobType) {
        case 'cutting':
          query = supabase
            .from('cutting_jobs')
            .select(`
              id,
              worker_name,
              is_internal,
              rate,
              received_quantity,
              status,
              job_cards (
                id,
                job_name,
                job_number,
                orders (
                  id,
                  order_number,
                  company_name,
                  product_name
                )
              )
            `)
            .eq('id', jobId)
            .single();
          break;
        
        case 'printing':
          query = supabase
            .from('printing_jobs')
            .select(`
              id,
              worker_name,
              is_internal,
              rate,
              received_quantity,
              status,
              job_cards (
                id,
                job_name,
                job_number,
                orders (
                  id,
                  order_number,
                  company_name,
                  product_name
                )
              )
            `)
            .eq('id', jobId)
            .single();
          break;
        
        case 'stitching':
          query = supabase
            .from('stitching_jobs')
            .select(`
              id,
              worker_name,
              is_internal,
              rate,
              received_quantity,
              status,
              job_cards (
                id,
                job_name,
                job_number,
                orders (
                  id,
                  order_number,
                  company_name,
                  product_name
                )
              )
            `)
            .eq('id', jobId)
            .single();
          break;
        
        default:
          throw new Error('Invalid job type');
      }

      const { data, error } = await query;
      if (error) throw error;

      setJob({ ...data, job_type: jobType as any });
    } catch (error: any) {
      toast({
        title: "Error fetching job details",
        description: error.message,
        variant: "destructive",
      });
      navigate('/sells/vendor-bills');
    }
  };

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, name, contact_person, phone, email, service_type, gst')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setVendors(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching vendors",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVendorChange = (vendorId: string) => {
    const vendor = vendors.find(v => v.id === vendorId);
    setSelectedVendor(vendor || null);
    setFormData(prev => ({
      ...prev,
      vendor_id: vendorId,
      gst_percentage: vendor?.gst ? parseFloat(vendor.gst) : 18
    }));
  };

  const calculateFinancials = () => {
    if (!job || !job.rate || !job.received_quantity) {
      return {
        subtotal: 0,
        gstAmount: 0,
        totalAmount: 0
      };
    }

    const subtotal = job.rate * job.received_quantity;
    const gstAmount = (subtotal * formData.gst_percentage) / 100;
    const totalAmount = subtotal + gstAmount + formData.other_expenses;

    return {
      subtotal,
      gstAmount,
      totalAmount
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job || !selectedVendor) return;

    // Validation
    if (!formData.vendor_id) {
      toast({
        title: "Validation Error",
        description: "Please select a vendor",
        variant: "destructive",
      });
      return;
    }

    if (!job.rate || !job.received_quantity) {
      toast({
        title: "Validation Error", 
        description: "Job must have valid rate and received quantity",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const financials = calculateFinancials();
      
      const billData: VendorBillInsert = {
        vendor_id: formData.vendor_id,
        vendor_name: selectedVendor.name,
        job_id: job.id,
        job_type: job.job_type,
        job_number: job.job_cards?.job_number || undefined,
        order_id: job.job_cards?.orders?.id || undefined,
        order_number: job.job_cards?.orders?.order_number || undefined,
        product_name: job.job_cards?.orders?.product_name || 'Unknown Product',
        company_name: job.job_cards?.orders?.company_name || 'Unknown Company',
        quantity: job.received_quantity,
        rate: job.rate,
        subtotal: financials.subtotal,
        gst_percentage: formData.gst_percentage,
        gst_amount: financials.gstAmount,
        other_expenses: formData.other_expenses,
        total_amount: financials.totalAmount,
        notes: formData.notes || undefined,
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('vendor_bills')
        .insert(billData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Vendor bill created successfully",
        description: `Bill ${data.bill_number} has been created`,
      });

      navigate(`/sells/vendor-bills/${data.id}`);
    } catch (error: any) {
      toast({
        title: "Error creating vendor bill",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const financials = calculateFinancials();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-2">Job Not Found</h2>
        <p className="mb-4">The job you're trying to bill doesn't exist or has been removed.</p>
        <Button onClick={() => navigate('/sells/vendor-bills')}>
          Return to Vendor Bills
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/sells/vendor-bills')}
            className="gap-1"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Vendor Bill</h1>
            <p className="text-muted-foreground">
              Generate bill for {job.job_type} job by {job.worker_name}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Job Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Job Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Job Type</Label>
                  <p className="font-medium capitalize">{job.job_type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Worker Name</Label>
                  <p className="font-medium">{job.worker_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Order Number</Label>
                  <p className="font-medium">{job.job_cards?.orders?.order_number || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Job Number</Label>
                  <p className="font-medium">{job.job_cards?.job_number || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Company</Label>
                  <p className="font-medium">{job.job_cards?.orders?.company_name || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Product</Label>
                  <p className="font-medium">{job.job_cards?.orders?.product_name || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Quantity</Label>
                  <p className="font-medium">{job.received_quantity || 0}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Rate</Label>
                  <p className="font-medium">{job.rate ? formatCurrency(job.rate) : '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vendor & Bill Details */}
          <Card>
            <CardHeader>
              <CardTitle>Vendor & Bill Details</CardTitle>
              <CardDescription>Select vendor and configure billing details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor *</Label>
                <Select value={formData.vendor_id} onValueChange={handleVendorChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{vendor.name}</span>
                          {vendor.service_type && (
                            <span className="text-sm text-muted-foreground">
                              {vendor.service_type}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedVendor && (
                <div className="p-3 bg-muted rounded-md">
                  <h4 className="font-medium mb-2">Vendor Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Contact:</span> {selectedVendor.contact_person || '-'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span> {selectedVendor.phone || '-'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span> {selectedVendor.email || '-'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Service:</span> {selectedVendor.service_type || '-'}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gst_percentage">GST Percentage (%)</Label>
                  <Input
                    id="gst_percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.gst_percentage}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      gst_percentage: parseFloat(e.target.value) || 0
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="other_expenses">Other Expenses</Label>
                  <Input
                    id="other_expenses"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.other_expenses}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      other_expenses: parseFloat(e.target.value) || 0
                    }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes for this bill..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Financial Summary */}
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
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary">{formatCurrency(financials.totalAmount)}</span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button
              type="submit"
              className="w-full gap-2"
              disabled={saving || !formData.vendor_id}
            >
              <Save className="h-4 w-4" />
              {saving ? "Creating Bill..." : "Create Bill"}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => navigate('/sells/vendor-bills')}
            >
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default VendorBillCreateForm;
