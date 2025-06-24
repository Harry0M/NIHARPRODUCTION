import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Eye, FileText, Filter } from "lucide-react";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { Database } from "@/integrations/supabase/types";

type VendorBill = Database["public"]["Tables"]["vendor_bills"]["Row"];

interface JobWithDetails {
  id: string;
  job_type: 'cutting' | 'printing' | 'stitching';
  worker_name: string | null;
  vendor_id: string | null;
  is_internal: boolean | null;
  rate: number | null;
  received_quantity: number | null;
  status: string | null;
  created_at: string;
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

const VendorBillsList = () => {
  const navigate = useNavigate();
  const [bills, setBills] = useState<VendorBill[]>([]);
  const [availableJobs, setAvailableJobs] = useState<JobWithDetails[]>([]);
  const [vendors, setVendors] = useState<{ [key: string]: { name: string; service_type: string } }>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [jobTypeFilter, setJobTypeFilter] = useState<string>("all");

  useEffect(() => {
    fetchVendors();
    fetchBills();
    fetchAvailableJobs();
  }, []);

  const fetchVendors = async () => {
    try {
      const { data: vendorsData, error } = await supabase
        .from('vendors')
        .select('id, name, service_type');

      if (error) throw error;
      
      // Create a map of vendor_id -> vendor info for quick lookup
      const vendorMap: { [key: string]: { name: string; service_type: string } } = {};
      vendorsData?.forEach(vendor => {
        vendorMap[vendor.id] = {
          name: vendor.name,
          service_type: vendor.service_type
        };
      });
      
      setVendors(vendorMap);
      console.log('✅ Loaded vendors:', Object.keys(vendorMap).length);
    } catch (error) {
      console.error('❌ Error fetching vendors:', error);
      toast({
        title: "Error fetching vendors",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const fetchBills = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_bills')
        .select(`
          *,
          vendors (
            name,
            contact_person,
            service_type
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBills(data || []);
    } catch (error) {
      toast({
        title: "Error fetching vendor bills",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const fetchAvailableJobs = async () => {
    try {
      console.log('🔍 Fetching completed vendor jobs for billing...');
      
      // Get existing bill job IDs to filter out already billed jobs
      const { data: existingBills } = await supabase
        .from('vendor_bills')
        .select('job_id, job_type');

      const billedJobIds = new Set(existingBills?.map(bill => `${bill.job_type}-${bill.job_id}`) || []);

      // Simple logic: Get all completed jobs with vendor_id directly from job tables
      const [cuttingJobs, printingJobs, stitchingJobs] = await Promise.all([
        // Cutting jobs: completed + has vendor_id
        supabase
          .from('cutting_jobs')
          .select(`
            id,
            vendor_id,
            worker_name,
            received_quantity,
            status,
            created_at,
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
          .eq('status', 'completed')
          .not('vendor_id', 'is', null),

        // Printing jobs: completed + has vendor_id
        supabase
          .from('printing_jobs')
          .select(`
            id,
            vendor_id,
            worker_name,
            rate,
            received_quantity,
            status,
            created_at,
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
          .eq('status', 'completed')
          .not('vendor_id', 'is', null),

        // Stitching jobs: completed + has vendor_id
        supabase
          .from('stitching_jobs')
          .select(`
            id,
            vendor_id,
            worker_name,
            rate,
            received_quantity,
            status,
            created_at,
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
          .eq('status', 'completed')
          .not('vendor_id', 'is', null)
      ]);

      console.log('📊 Completed jobs with vendor IDs:');
      console.log('- Cutting jobs:', cuttingJobs.data?.length || 0);
      console.log('- Printing jobs:', printingJobs.data?.length || 0);
      console.log('- Stitching jobs:', stitchingJobs.data?.length || 0);

      if (cuttingJobs.error) console.error('❌ Cutting jobs error:', cuttingJobs.error);
      if (printingJobs.error) console.error('❌ Printing jobs error:', printingJobs.error);
      if (stitchingJobs.error) console.error('❌ Stitching jobs error:', stitchingJobs.error);

      // Combine all jobs
      const allJobs: JobWithDetails[] = [];
      
      // Add cutting jobs
      if (cuttingJobs.data) {
        cuttingJobs.data.forEach(job => {
          allJobs.push({
            id: job.id,
            job_type: 'cutting',
            vendor_id: job.vendor_id,
            worker_name: job.worker_name,
            is_internal: false, // Since it has vendor_id, it's external
            rate: null, // Cutting jobs don't have rates
            received_quantity: job.received_quantity,
            status: job.status,
            created_at: job.created_at,
            job_cards: job.job_cards
          });
        });
      }
      
      // Add printing jobs
      if (printingJobs.data) {
        printingJobs.data.forEach(job => {
          allJobs.push({
            id: job.id,
            job_type: 'printing',
            vendor_id: job.vendor_id,
            worker_name: job.worker_name,
            is_internal: false, // Since it has vendor_id, it's external
            rate: job.rate,
            received_quantity: job.received_quantity,
            status: job.status,
            created_at: job.created_at,
            job_cards: job.job_cards
          });
        });
      }
      
      // Add stitching jobs
      if (stitchingJobs.data) {
        stitchingJobs.data.forEach(job => {
          allJobs.push({
            id: job.id,
            job_type: 'stitching',
            vendor_id: job.vendor_id,
            worker_name: job.worker_name,
            is_internal: false, // Since it has vendor_id, it's external
            rate: job.rate,
            received_quantity: job.received_quantity,
            status: job.status,
            created_at: job.created_at,
            job_cards: job.job_cards
          });
        });
      }

      // Filter out already billed jobs
      const filteredJobs = allJobs.filter(job => !billedJobIds.has(`${job.job_type}-${job.id}`));
      
      console.log('✅ Simple vendor bills logic results:');
      console.log('- Total completed jobs with vendor_id:', allJobs.length);
      console.log('- Existing bills to exclude:', existingBills?.length || 0);
      console.log('- Available for billing:', filteredJobs.length);
      
      if (filteredJobs.length > 0) {
        console.log('📝 Jobs ready for billing:');
        filteredJobs.slice(0, 5).forEach((job, i) => {
          console.log(`   ${i + 1}. ${job.job_type} - ${job.job_cards?.job_number || 'No Job#'} - Vendor ID: ${job.vendor_id}`);
        });
      } else {
        console.log('❗ No jobs available for billing. Check if you have:');
        console.log('1. Completed jobs (status = "completed")');
        console.log('2. Jobs with vendor_id assigned');
        console.log('3. Jobs that haven\'t been billed yet');
      }
      
      setAvailableJobs(filteredJobs);
    } catch (error) {
      console.error('❌ Error fetching available jobs:', error);
      toast({
        title: "Error fetching available jobs",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewBill = (billId: string) => {
    navigate(`/sells/vendor-bills/${billId}`);
  };

  const handleCreateBill = (job: JobWithDetails) => {
    navigate(`/sells/vendor-bills/create/${job.job_type}/${job.id}`);
  };

  const filteredBills = bills.filter(bill => {
    const matchesSearch = 
      bill.bill_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || bill.status === statusFilter;
    const matchesJobType = jobTypeFilter === "all" || bill.job_type === jobTypeFilter;
    
    return matchesSearch && matchesStatus && matchesJobType;
  });

  const filteredJobs = availableJobs.filter(job => {
    const matchesSearch = 
      job.worker_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.job_cards?.orders?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.job_cards?.orders?.order_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesJobType = jobTypeFilter === "all" || job.job_type === jobTypeFilter;
    
    return matchesSearch && matchesJobType;
  });

  const getTotalBillAmount = () => {
    return filteredBills.reduce((total, bill) => total + bill.total_amount, 0);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendor Bills</h1>
          <p className="text-muted-foreground">
            Manage bills for vendor jobs - cutting, printing, and stitching
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by bill number, vendor, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Job Type</label>
              <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="cutting">Cutting</SelectItem>
                  <SelectItem value="printing">Printing</SelectItem>
                  <SelectItem value="stitching">Stitching</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Total Bills</p>
                <div className="text-2xl font-bold">{filteredBills.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                <div className="text-2xl font-bold">{formatCurrency(getTotalBillAmount())}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Pending Bills</p>
                <div className="text-2xl font-bold">
                  {filteredBills.filter(bill => bill.status === 'pending').length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Available Jobs</p>
                <div className="text-2xl font-bold">{filteredJobs.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Jobs for Billing */}
      {filteredJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Available Jobs for Billing
            </CardTitle>
            <CardDescription>
              Completed vendor jobs that haven't been billed yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Type</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Worker</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.map((job) => (
                    <TableRow key={`${job.job_type}-${job.id}`}>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {job.job_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {job.vendor_id && vendors[job.vendor_id] 
                          ? vendors[job.vendor_id].name 
                          : `Vendor ID: ${job.vendor_id || 'N/A'}`
                        }
                      </TableCell>
                      <TableCell>{job.worker_name || '-'}</TableCell>
                      <TableCell>
                        {job.job_cards?.orders?.order_number || '-'}
                      </TableCell>
                      <TableCell>
                        {job.job_cards?.orders?.company_name || '-'}
                      </TableCell>
                      <TableCell>{job.received_quantity || 0}</TableCell>
                      <TableCell>{job.rate ? formatCurrency(job.rate) : '-'}</TableCell>
                      <TableCell>
                        {job.rate && job.received_quantity 
                          ? formatCurrency(job.rate * job.received_quantity) 
                          : '-'
                        }
                      </TableCell>
                      <TableCell>{formatDate(job.created_at)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCreateBill(job)}
                          className="gap-1"
                        >
                          <Plus className="h-4 w-4" />
                          Create Bill
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Bills */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Bills</CardTitle>
          <CardDescription>
            All generated vendor bills
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredBills.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No vendor bills found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Complete some vendor jobs to create bills.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill Number</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Job Type</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBills.map((bill) => (
                    <TableRow key={bill.id}>
                      <TableCell className="font-medium">{bill.bill_number}</TableCell>
                      <TableCell>{bill.vendor_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {bill.job_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{bill.company_name}</TableCell>
                      <TableCell>{bill.quantity}</TableCell>
                      <TableCell>{formatCurrency(bill.total_amount)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            bill.status === 'paid' ? 'default' :
                            bill.status === 'pending' ? 'secondary' :
                            'destructive'
                          }
                        >
                          {bill.status?.charAt(0).toUpperCase() + (bill.status?.slice(1) || '')}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(bill.created_at)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewBill(bill.id)}
                          title="View bill details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorBillsList;
