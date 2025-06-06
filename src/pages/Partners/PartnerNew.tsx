import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface PartnerFormData {
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  materials_provided?: string;
  service_type?: string;
  payment_terms: string;
  status: string;
  gst: string;
}

const PartnerNew = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [partnerType, setPartnerType] = useState<'supplier' | 'vendor'>(
    (searchParams.get('type') === 'vendor' ? 'vendor' : 'supplier')
  );
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<PartnerFormData>({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    materials_provided: "",
    service_type: "",
    payment_terms: "",
    status: "active",
    gst: ""
  });

  useEffect(() => {
    // Check if we're in edit mode
    if (id) {
      setIsEditMode(true);
      fetchPartnerData();
    }
  }, [id]);

  useEffect(() => {
    // Update partner type when search param changes
    const type = searchParams.get('type');
    if (type === 'supplier' || type === 'vendor') {
      setPartnerType(type);
    }
  }, [searchParams]);

  const fetchPartnerData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // Determine partner type from URL path params if available
      const pathType = window.location.pathname.includes('/supplier/') ? 'supplier' : 
                      window.location.pathname.includes('/vendor/') ? 'vendor' : null;
                      
      // Use path type or search param type or current state
      const effectiveType = pathType || searchParams.get('type') || partnerType;
      
      // Update state if needed
      if (effectiveType === 'supplier' || effectiveType === 'vendor') {
        setPartnerType(effectiveType);
      }
      
      const tableName = effectiveType === 'supplier' ? 'suppliers' : 'vendors';
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      if (data) {
        // Type-safe approach to handle different table schemas
        if (partnerType === 'supplier') {
          const supplierData = data as any; // Using any for simplicity
          setFormData({
            name: supplierData.name || "",
            contact_person: supplierData.contact_person || "",
            phone: supplierData.phone || "",
            email: supplierData.email || "",
            address: supplierData.address || "",
            materials_provided: supplierData.materials_provided || "",
            service_type: "", // Not relevant for suppliers
            payment_terms: supplierData.payment_terms || "",
            status: supplierData.status || "active",
            gst: supplierData.gst || ""
          });
        } else {
          const vendorData = data as any; // Using any for simplicity
          setFormData({
            name: vendorData.name || "",
            contact_person: vendorData.contact_person || "",
            phone: vendorData.phone || "",
            email: vendorData.email || "",
            address: vendorData.address || "",
            materials_provided: "", // Not relevant for vendors
            service_type: vendorData.service_type || "",
            payment_terms: vendorData.payment_terms || "",
            status: vendorData.status || "active",
            gst: vendorData.gst || ""
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast({
        title: "Missing required fields",
        description: `${partnerType === 'supplier' ? 'Supplier' : 'Vendor'} name is required`,
        variant: "destructive",
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      const tableName = partnerType === 'supplier' ? 'suppliers' : 'vendors';
      
      // Filter the form data based on partner type
      const dataToSubmit = { ...formData };
      
      // Remove fields not relevant to this partner type
      if (partnerType === 'supplier') {
        delete dataToSubmit.service_type;
      } else {
        delete dataToSubmit.materials_provided;
      }
      
      let result;
      
      if (isEditMode && id) {
        // Update existing partner
        result = await supabase
          .from(tableName)
          .update(dataToSubmit)
          .eq('id', id)
          .select()
          .single();
      } else {
        // Create new partner
        result = await supabase
          .from(tableName)
          .insert(dataToSubmit)
          .select()
          .single();
      }
      
      const { error } = result;
      if (error) throw error;
      
      toast({
        title: isEditMode 
          ? `${partnerType === 'supplier' ? 'Supplier' : 'Vendor'} updated`
          : `${partnerType === 'supplier' ? 'Supplier' : 'Vendor'} created`,
        description: isEditMode
          ? `${partnerType} has been updated successfully`
          : `New ${partnerType} has been added successfully`,
      });
      
      // Use window.location.href instead of navigate for reliable page refresh
      window.location.href = "/partners";
    } catch (error: any) {
      toast({
        title: `Error ${isEditMode ? 'updating' : 'creating'} ${partnerType}`,
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 slide-up" style={{animationDelay: '0.1s'}}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/partners")}
            className="gap-1.5 w-fit shadow-subtle group relative overflow-hidden"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Partners</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <span className="inline-block h-6 w-1.5 rounded-full bg-primary"></span>
              {isEditMode ? 'Edit' : 'New'} {partnerType === 'supplier' ? 'Supplier' : 'Vendor'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEditMode 
                ? `Update ${partnerType === 'supplier' ? 'supplier' : 'vendor'} information` 
                : `Add a new ${partnerType === 'supplier' ? 'material supplier' : 'production vendor'} to your system`
              }
            </p>
          </div>
        </div>
      </div>

      <Card className="border-border/60 shadow-elevated overflow-hidden slide-up" style={{animationDelay: '0.2s'}}>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center">
            <span className={`mr-2 h-5 w-5 rounded-full ${partnerType === 'supplier' ? 'bg-blue-500/20 text-blue-600 dark:bg-blue-500/30 dark:text-blue-300' : 'bg-purple-500/20 text-purple-600 dark:bg-purple-500/30 dark:text-purple-300'} flex items-center justify-center text-xs font-semibold`}>
              {partnerType === 'supplier' ? 'S' : 'V'}
            </span>
            {partnerType === 'supplier' ? 'Supplier' : 'Vendor'} Information
          </CardTitle>
          <CardDescription className="mt-1">
            {isEditMode 
              ? `Update details for this ${partnerType}` 
              : `Enter the details for this ${partnerType}`
            }
          </CardDescription>
          
          {!isEditMode && (
            <div className="pt-4">
              <Tabs 
                value={partnerType} 
                onValueChange={(value) => {
                  setPartnerType(value as 'supplier' | 'vendor');
                  navigate(`/partners/new?type=${value}`);
                }}
              >
                <TabsList className="grid w-full sm:w-[400px] grid-cols-2">
                  <TabsTrigger value="supplier" className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                    Supplier
                  </TabsTrigger>
                  <TabsTrigger value="vendor" className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                    Vendor
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="name" className="flex items-center text-sm font-medium">
                  Name <span className="text-destructive ml-1">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={`${partnerType === 'supplier' ? 'Supplier' : 'Vendor'} name`}
                  className="border-border/60 focus:border-primary/60"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="contact_person">Contact Person</Label>
                  <Input
                    id="contact_person"
                    name="contact_person"
                    value={formData.contact_person}
                    onChange={handleChange}
                    placeholder="Primary contact name"
                  />
                </div>
                
                <div className="grid gap-3">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Contact phone number"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Contact email address"
                  />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="gst">GST Number</Label>
                  <Input
                    id="gst"
                    name="gst"
                    value={formData.gst}
                    onChange={handleChange}
                    placeholder="Enter GST number"
                  />
                </div>
              </div>
              
              <div className="grid gap-3">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Physical address"
                  rows={3}
                />
              </div>
              
              {partnerType === 'vendor' && (
                <div className="grid gap-3">
                  <Label htmlFor="service_type">Service Type/Role</Label>
                  <Select
                    value={formData.service_type}
                    onValueChange={(value) => handleSelectChange("service_type", value)}
                  >
                    <SelectTrigger id="service_type" className="border-border/60">
                      <SelectValue placeholder="Select vendor role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="printing">Printing</SelectItem>
                      <SelectItem value="cutting">Cutting</SelectItem>
                      <SelectItem value="stitching">Stitching</SelectItem>
                      <SelectItem value="dyeing">Dyeing</SelectItem>
                      <SelectItem value="finishing">Finishing</SelectItem>
                      <SelectItem value="embroidery">Embroidery</SelectItem>
                      <SelectItem value="packaging">Packaging</SelectItem>
                      <SelectItem value="logistics">Logistics/Transport</SelectItem>
                      <SelectItem value="quality_control">Quality Control</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.service_type === "other" && (
                    <Textarea
                      id="service_type_other"
                      name="service_type"
                      value={formData.service_type === "other" ? "" : formData.service_type}
                      onChange={handleChange}
                      placeholder="Specify the service type"
                      className="mt-2"
                      rows={2}
                    />
                  )}
                </div>
              )}
              
              <div className="grid gap-3">
                <Label htmlFor="payment_terms">Payment Terms</Label>
                <Textarea
                  id="payment_terms"
                  name="payment_terms"
                  value={formData.payment_terms}
                  onChange={handleChange}
                  placeholder="Payment terms and conditions"
                  rows={3}
                />
              </div>
              
              <div className="grid gap-3">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 border-t border-border/40 mt-6">
              <Button
                variant="outline"
                type="button"
                onClick={() => navigate("/partners")}
                className="border-border/60"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitting || loading}
                className={`${partnerType === 'supplier' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'} text-white shadow-subtle`}
              >
                {submitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                    Saving...
                  </>
                ) : loading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                    Loading...
                  </>
                ) : (
                  `${isEditMode ? 'Update' : 'Create'} ${partnerType === 'supplier' ? 'Supplier' : 'Vendor'}`
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnerNew;
