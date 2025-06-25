import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Eye, FileText, Filter } from "lucide-react";
import { formatCurrency, formatDate } from "@/utils/formatters";

// Local interfaces for vendor bills system
interface LocalVendor {
  id: string;
  name: string;
  contact_person?: string;
  service_type: string;
  status: string;
}

interface LocalJobWithVendor {
  id: string;
  job_type: 'cutting' | 'printing' | 'stitching';
  worker_name: string;
  vendor_id?: string;
  vendor_name?: string;
  is_internal: boolean;
  rate?: number;
  received_quantity?: number;
  status: string;
  created_at: string;
  job_card_name?: string;
  order_number?: string;
  company_name?: string;
}

interface LocalVendorBill {
  id: string;
  bill_number: string;
  vendor_id: string;
  vendor_name: string;
  job_id: string;
  job_type: 'cutting' | 'printing' | 'stitching';
  company_name: string;
  quantity: number;
  rate: number;
  total_amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
}

const VendorBillsListLocal = () => {
  const navigate = useNavigate();
  const [bills, setBills] = useState<LocalVendorBill[]>([]);
  const [availableJobs, setAvailableJobs] = useState<LocalJobWithVendor[]>([]);
  const [vendors, setVendors] = useState<LocalVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [jobTypeFilter, setJobTypeFilter] = useState<string>("all");

  useEffect(() => {
    loadLocalData();
  }, []);

  const loadLocalData = async () => {
    try {
      console.log('🔍 Loading local vendor bills data...');
      
      // Load vendors from localStorage or create sample data
      const vendorsData = getLocalVendors();
      setVendors(vendorsData);
      
      // Load existing bills from localStorage
      const existingBills = getLocalVendorBills();
      setBills(existingBills);
      
      // Scan for jobs with vendor connections
      const jobsWithVendors = await scanJobsForVendorBills(vendorsData);
      setAvailableJobs(jobsWithVendors);
      
      console.log('✅ Local data loaded:', {
        vendors: vendorsData.length,
        bills: existingBills.length,
        availableJobs: jobsWithVendors.length
      });
      
    } catch (error) {
      console.error('❌ Error loading local data:', error);
      toast({
        title: "Error loading vendor bills",
        description: "Failed to load local data. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getLocalVendors = (): LocalVendor[] => {
    // Try to get from localStorage first
    const stored = localStorage.getItem('local_vendors');
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Create sample vendors if none exist
    const sampleVendors: LocalVendor[] = [
      {
        id: 'vendor-001',
        name: 'ABC Cutting Services',
        contact_person: 'John Doe',
        service_type: 'cutting',
        status: 'active'
      },
      {
        id: 'vendor-002',
        name: 'XYZ Printing Works',
        contact_person: 'Jane Smith',
        service_type: 'printing',
        status: 'active'
      },
      {
        id: 'vendor-003',
        name: 'Quality Stitching Co.',
        contact_person: 'Bob Wilson',
        service_type: 'stitching',
        status: 'active'
      }
    ];
    
    localStorage.setItem('local_vendors', JSON.stringify(sampleVendors));
    return sampleVendors;
  };

  const getLocalVendorBills = (): LocalVendorBill[] => {
    const stored = localStorage.getItem('local_vendor_bills');
    return stored ? JSON.parse(stored) : [];
  };

  const saveLocalVendorBills = (bills: LocalVendorBill[]) => {
    localStorage.setItem('local_vendor_bills', JSON.stringify(bills));
  };

  const scanJobsForVendorBills = async (vendorsData: LocalVendor[]): Promise<LocalJobWithVendor[]> => {
    const jobsWithVendors: LocalJobWithVendor[] = [];
    
    try {
      // Create vendor lookup map
      const vendorMap = new Map(vendorsData.map(v => [v.id, v]));
      
      // Sample job data - in a real app, this would come from your actual data source
      const sampleJobs = createSampleJobsWithVendors(vendorsData);
      
      // Filter jobs that meet vendor billing criteria
      for (const job of sampleJobs) {
        const meetsVendorBillCriteria = (
          job.status === 'completed' &&
          !job.is_internal &&
          job.vendor_id &&
          job.received_quantity && 
          job.received_quantity > 0 &&
          // For printing and stitching, also require rate
          (job.job_type === 'cutting' || (job.rate && job.rate > 0))
        );
        
        if (meetsVendorBillCriteria) {
          const vendor = vendorMap.get(job.vendor_id!);
          if (vendor) {
            jobsWithVendors.push({
              ...job,
              vendor_name: vendor.name
            });
          }
        }
      }
      
      // Filter out jobs that already have bills
      const existingBills = getLocalVendorBills();
      const billedJobIds = new Set(existingBills.map(bill => `${bill.job_type}-${bill.job_id}`));
      
      return jobsWithVendors.filter(job => !billedJobIds.has(`${job.job_type}-${job.id}`));
      
    } catch (error) {
      console.error('Error scanning jobs for vendor bills:', error);
      return [];
    }
  };

  const createSampleJobsWithVendors = (vendorsData: LocalVendor[]): LocalJobWithVendor[] => {
    // This creates sample data - replace with your actual data source
    const sampleJobs: LocalJobWithVendor[] = [
      {
        id: 'cutting-job-001',
        job_type: 'cutting',
        worker_name: 'ABC Cutting Services',
        vendor_id: 'vendor-001',
        is_internal: false,
        received_quantity: 500,
        status: 'completed',
        created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        job_card_name: 'Job Card - Order #001',
        order_number: 'ORD-2024-001',
        company_name: 'Test Company Ltd'
      },
      {
        id: 'printing-job-001',
        job_type: 'printing',
        worker_name: 'XYZ Printing Works',
        vendor_id: 'vendor-002',
        is_internal: false,
        rate: 25,
        received_quantity: 480,
        status: 'completed',
        created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        job_card_name: 'Job Card - Order #002',
        order_number: 'ORD-2024-002',
        company_name: 'Another Company'
      },
      {
        id: 'stitching-job-001',
        job_type: 'stitching',
        worker_name: 'Quality Stitching Co.',
        vendor_id: 'vendor-003',
        is_internal: false,
        rate: 15,
        received_quantity: 450,
        status: 'completed',
        created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        job_card_name: 'Job Card - Order #003',
        order_number: 'ORD-2024-003',
        company_name: 'Third Company'
      },
      // Internal job (should not appear)
      {
        id: 'internal-job-001',
        job_type: 'cutting',
        worker_name: 'Internal Team',
        is_internal: true,
        received_quantity: 300,
        status: 'completed',
        created_at: new Date().toISOString(),
        job_card_name: 'Internal Job',
        order_number: 'ORD-2024-004',
        company_name: 'Internal Work'
      }
    ];

    return sampleJobs;
  };

  const handleCreateBill = (job: LocalJobWithVendor) => {
    // Create a new vendor bill
    const newBill: LocalVendorBill = {
      id: `bill-${Date.now()}`,
      bill_number: `VB-${Date.now().toString().slice(-6)}`,
      vendor_id: job.vendor_id!,
      vendor_name: job.vendor_name!,
      job_id: job.id,
      job_type: job.job_type,
      company_name: job.company_name || 'Unknown Company',
      quantity: job.received_quantity || 0,
      rate: job.rate || 0,
      total_amount: (job.received_quantity || 0) * (job.rate || 0),
      status: 'pending',
      created_at: new Date().toISOString()
    };

    // Add to bills list
    const updatedBills = [...bills, newBill];
    setBills(updatedBills);
    saveLocalVendorBills(updatedBills);

    // Remove from available jobs
    setAvailableJobs(availableJobs.filter(j => j.id !== job.id));

    toast({
      title: "Vendor Bill Created",
      description: `Bill ${newBill.bill_number} created for ${job.vendor_name}`,
    });
  };

  const handleViewBill = (billId: string) => {
    toast({
      title: "View Bill",
      description: `Viewing bill details for ${billId}`,
    });
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
      job.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.order_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
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
          <h1 className="text-3xl font-bold tracking-tight">Vendor Bills (Local Mode)</h1>
          <p className="text-muted-foreground">
            Manage bills for vendor jobs - cutting, printing, and stitching (using local data)
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={loadLocalData}
          className="gap-2"
        >
          🔄 Refresh Data
        </Button>
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
              Completed external vendor jobs that haven't been billed yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Type</TableHead>
                    <TableHead>Worker/Vendor</TableHead>
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
                      <TableCell className="font-medium">{job.worker_name}</TableCell>
                      <TableCell>
                        {job.order_number || '-'}
                      </TableCell>
                      <TableCell>
                        {job.company_name || '-'}
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
                    <TableHead>Rate</TableHead>
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
                      <TableCell>{formatCurrency(bill.rate)}</TableCell>
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

export default VendorBillsListLocal;
