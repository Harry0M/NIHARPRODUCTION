import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { DateRange } from "react-day-picker"
import { 
  ArrowLeft, Users, BadgeCheck, BarChart3, Calendar, 
  DollarSign, TrendingUp, AlertCircle, PackageCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { JobStatus, PrintingJobData, CuttingJobData } from '@/types/production';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';

interface PartnerData {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  partnerType: 'supplier' | 'vendor';
  service_type?: string | null;
  materials_provided?: string | null;
  status: string;
}

interface JobSummary {
  totalJobs: number;
  completedJobs: number;
  pendingJobs: number;
  inProgressJobs: number;
  totalCost: number;
  averageRate: number;
  efficiencyRatio: number;
  totalReceivedQuantity: number;
  totalProvidedQuantity: number;
}

interface JobAnalysis {
  cutting: JobSummary;
  printing: JobSummary;
  stitching: JobSummary;
  overall: JobSummary;
}

interface JobRecord {
  id: string;
  job_card_id: string;
  job_number: string;
  order_number: string;
  company_name: string;
  created_at: string;
  status: JobStatus;
  rate: number | null;
  provided_quantity?: number | null;
  received_quantity?: number | null;
  pulling?: string | null;
  worker_name: string | null;
}

const PartnerPerformance = () => {
  const { id, type: routeType } = useParams<{ id: string, type?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryType = searchParams.get('type');
  const type = routeType || queryType;

  const [loading, setLoading] = useState(true);
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null);
  const [jobs, setJobs] = useState<{
    cutting: JobRecord[];
    printing: JobRecord[];
    stitching: JobRecord[];
  }>({
    cutting: [],
    printing: [],
    stitching: []
  });
  const [jobAnalysis, setJobAnalysis] = useState<JobAnalysis>({
    cutting: {
      totalJobs: 0,
      completedJobs: 0,
      pendingJobs: 0,
      inProgressJobs: 0,
      totalCost: 0,
      averageRate: 0,
      efficiencyRatio: 0,
      totalReceivedQuantity: 0,
      totalProvidedQuantity: 0
    },
    printing: {
      totalJobs: 0,
      completedJobs: 0,
      pendingJobs: 0,
      inProgressJobs: 0,
      totalCost: 0,
      averageRate: 0,
      efficiencyRatio: 0,
      totalReceivedQuantity: 0,
      totalProvidedQuantity: 0
    },
    stitching: {
      totalJobs: 0,
      completedJobs: 0,
      pendingJobs: 0,
      inProgressJobs: 0,
      totalCost: 0,
      averageRate: 0,
      efficiencyRatio: 0,
      totalReceivedQuantity: 0,
      totalProvidedQuantity: 0
    },
    overall: {
      totalJobs: 0,
      completedJobs: 0,
      pendingJobs: 0,
      inProgressJobs: 0,
      totalCost: 0,
      averageRate: 0,
      efficiencyRatio: 0,
      totalReceivedQuantity: 0,
      totalProvidedQuantity: 0
    }
  });
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [jobTypeFilter, setJobTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  useEffect(() => {
    if (id && type) {
      fetchPartnerData();
      fetchJobs();
    } else if (id && !type) {
      // If we have an ID but no type, redirect to partners list
      toast({
        title: "Missing partner type",
        description: "Please select a vendor or supplier from the partners list",
        variant: "destructive"
      });
      navigate("/partners");
    }
  }, [id, type]);

  useEffect(() => {
    if (jobs) {
      analyzeJobData();
    }
  }, [jobs]);

  const fetchPartnerData = async () => {
    try {
      setLoading(true);
      
      const tableName = type === 'vendor' ? 'vendors' : 'suppliers';
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setPartnerData({
          ...data,
          partnerType: type as 'supplier' | 'vendor'
        });
      }
    } catch (error: any) {
      console.error('Error fetching partner data:', error);
      toast({
        title: 'Error fetching partner data',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      
      // Get partner name for matching with worker_name field
      let partnerName = '';
      if (type === 'vendor') {
        const { data } = await supabase.from('vendors').select('name').eq('id', id).single();
        partnerName = data?.name || '';
      } else {
        const { data } = await supabase.from('suppliers').select('name').eq('id', id).single();
        partnerName = data?.name || '';
      }
      
      console.log('Searching for jobs with partner name:', partnerName);
      
      // Fetch cutting jobs with LIKE query to handle cases where worker_name might contain additional characters
      const { data: cuttingData, error: cuttingError } = await supabase
        .from('cutting_jobs')
        .select(`
          *,
          job_card:job_card_id (job_number, order:order_id (order_number, company_name))
        `)
        .ilike('worker_name', `%${partnerName}%`);
      
      if (cuttingError) throw cuttingError;
      
      // Fetch printing jobs with LIKE query
      const { data: printingData, error: printingError } = await supabase
        .from('printing_jobs')
        .select(`
          *,
          job_card:job_card_id (job_number, order:order_id (order_number, company_name))
        `)
        .ilike('worker_name', `%${partnerName}%`);
      
      if (printingError) throw printingError;
      
      // Fetch stitching jobs with LIKE query
      const { data: stitchingData, error: stitchingError } = await supabase
        .from('stitching_jobs')
        .select(`
          *,
          job_card:job_card_id (job_number, order:order_id (order_number, company_name))
        `)
        .ilike('worker_name', `%${partnerName}%`);
      
      if (stitchingError) throw stitchingError;
      
      // Format and store job data
      setJobs({
        cutting: formatCuttingJobs(cuttingData || []),
        printing: formatPrintingJobs(printingData || []),
        stitching: formatStitchingJobs(stitchingData || [])
      });
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      toast({
        title: 'Error fetching job data',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCuttingJobs = (jobs: any[]): JobRecord[] => {
    return jobs.map(job => ({
      id: job.id,
      job_card_id: job.job_card_id,
      job_number: job.job_card?.job_number || 'Unknown',
      order_number: job.job_card?.order?.order_number || 'Unknown',
      company_name: job.job_card?.order?.company_name || 'Unknown',
      created_at: job.created_at,
      status: job.status,
      rate: job.rate,
      received_quantity: job.received_quantity,
      worker_name: job.worker_name
    }));
  };

  const formatPrintingJobs = (jobs: any[]): JobRecord[] => {
    return jobs.map(job => ({
      id: job.id,
      job_card_id: job.job_card_id,
      job_number: job.job_card?.job_number || 'Unknown',
      order_number: job.job_card?.order?.order_number || 'Unknown',
      company_name: job.job_card?.order?.company_name || 'Unknown',
      created_at: job.created_at,
      status: job.status,
      rate: job.rate,
      pulling: job.pulling,
      received_quantity: job.received_quantity,
      worker_name: job.worker_name
    }));
  };

  const formatStitchingJobs = (jobs: any[]): JobRecord[] => {
    return jobs.map(job => ({
      id: job.id,
      job_card_id: job.job_card_id,
      job_number: job.job_card?.job_number || 'Unknown',
      order_number: job.job_card?.order?.order_number || 'Unknown',
      company_name: job.job_card?.order?.company_name || 'Unknown',
      created_at: job.created_at,
      status: job.status,
      rate: job.rate,
      provided_quantity: job.provided_quantity,
      received_quantity: job.received_quantity,
      worker_name: job.worker_name
    }));
  };

  const analyzeJobData = () => {
    // Analyze cutting jobs
    const cuttingAnalysis = analyzeJobs(jobs.cutting);
    
    // Analyze printing jobs
    const printingAnalysis = analyzeJobsWithEfficiency(jobs.printing, 'printing');
    
    // Analyze stitching jobs
    const stitchingAnalysis = analyzeJobsWithEfficiency(jobs.stitching, 'stitching');
    
    // Calculate overall stats
    const totalJobs = cuttingAnalysis.totalJobs + printingAnalysis.totalJobs + stitchingAnalysis.totalJobs;
    const overallAnalysis = {
      totalJobs,
      completedJobs: cuttingAnalysis.completedJobs + printingAnalysis.completedJobs + stitchingAnalysis.completedJobs,
      pendingJobs: cuttingAnalysis.pendingJobs + printingAnalysis.pendingJobs + stitchingAnalysis.pendingJobs,
      inProgressJobs: cuttingAnalysis.inProgressJobs + printingAnalysis.inProgressJobs + stitchingAnalysis.inProgressJobs,
      totalCost: cuttingAnalysis.totalCost + printingAnalysis.totalCost + stitchingAnalysis.totalCost,
      averageRate: totalJobs > 0 ? 
        (cuttingAnalysis.averageRate * cuttingAnalysis.totalJobs + 
         printingAnalysis.averageRate * printingAnalysis.totalJobs + 
         stitchingAnalysis.averageRate * stitchingAnalysis.totalJobs) / totalJobs : 0,
      efficiencyRatio: (printingAnalysis.totalJobs + stitchingAnalysis.totalJobs) > 0 ?
        (printingAnalysis.efficiencyRatio * printingAnalysis.totalJobs + 
         stitchingAnalysis.efficiencyRatio * stitchingAnalysis.totalJobs) / 
        (printingAnalysis.totalJobs + stitchingAnalysis.totalJobs) : 0,
      totalReceivedQuantity: cuttingAnalysis.totalReceivedQuantity + 
        printingAnalysis.totalReceivedQuantity + stitchingAnalysis.totalReceivedQuantity,
      totalProvidedQuantity: printingAnalysis.totalProvidedQuantity + stitchingAnalysis.totalProvidedQuantity
    };
    
    setJobAnalysis({
      cutting: cuttingAnalysis,
      printing: printingAnalysis,
      stitching: stitchingAnalysis,
      overall: overallAnalysis
    });
  };

  const analyzeJobs = (jobsList: JobRecord[]): JobSummary => {
    const totalJobs = jobsList.length;
    const completedJobs = jobsList.filter(job => job.status === 'completed').length;
    const pendingJobs = jobsList.filter(job => job.status === 'pending').length;
    const inProgressJobs = jobsList.filter(job => job.status === 'in_progress').length;
    
    // Calculate costs
    let totalCost = 0;
    let ratesSum = 0;
    let ratesCount = 0;
    let totalReceivedQuantity = 0;
    
    jobsList.forEach(job => {
      const rate = job.rate || 0;
      const quantity = job.received_quantity || 0;
      
      totalReceivedQuantity += quantity;
      
      if (rate > 0) {
        ratesSum += rate;
        ratesCount++;
        totalCost += rate * quantity;
      }
    });
    
    return {
      totalJobs,
      completedJobs,
      pendingJobs,
      inProgressJobs,
      totalCost,
      averageRate: ratesCount > 0 ? ratesSum / ratesCount : 0,
      efficiencyRatio: 0, // No efficiency for basic jobs
      totalReceivedQuantity,
      totalProvidedQuantity: 0 // Not applicable for basic jobs
    };
  };

  const analyzeJobsWithEfficiency = (
    jobsList: JobRecord[], 
    jobType: 'printing' | 'stitching'
  ): JobSummary => {
    // First get base analysis
    const baseAnalysis = analyzeJobs(jobsList);
    
    // Now calculate efficiency-specific metrics
    let totalProvidedQuantity = 0;
    let jobsWithBothQuantities = 0;
    let efficiencySumRatio = 0;
    
    jobsList.forEach(job => {
      let providedQty = 0;
      const receivedQty = job.received_quantity || 0;
      
      if (jobType === 'printing') {
        // For printing jobs, "pulling" is the provided quantity field
        providedQty = job.pulling ? parseInt(job.pulling) || 0 : 0;
      } else {
        // For stitching jobs, we already have provided_quantity
        providedQty = job.provided_quantity || 0;
      }
      
      totalProvidedQuantity += providedQty;
      
      // Calculate efficiency ratio for this job if both quantities exist
      if (providedQty > 0 && receivedQty > 0) {
        jobsWithBothQuantities++;
        efficiencySumRatio += (receivedQty / providedQty);
      }
    });
    
    // Calculate average efficiency ratio
    const efficiencyRatio = jobsWithBothQuantities > 0 ? 
      efficiencySumRatio / jobsWithBothQuantities : 0;
    
    return {
      ...baseAnalysis,
      efficiencyRatio,
      totalProvidedQuantity
    };
  };

  const getEfficiencyRating = (ratio: number): { label: string, color: string } => {
    if (ratio >= 0.95) {
      return { label: 'Excellent', color: 'text-green-500' };
    } else if (ratio >= 0.85) {
      return { label: 'Good', color: 'text-emerald-500' };
    } else if (ratio >= 0.75) {
      return { label: 'Average', color: 'text-amber-500' };
    } else if (ratio > 0) {
      return { label: 'Poor', color: 'text-red-500' };
    } else {
      return { label: 'Unknown', color: 'text-gray-500' };
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'INR',
      maximumFractionDigits: 0 
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat().format(Math.round(num * 100) / 100);
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Filter jobs based on selected time period
  const getFilteredJobs = (jobsList: JobRecord[], jobType: string) => {
    if (jobTypeFilter !== 'all' && jobTypeFilter !== jobType) {
      return [];
    }

    let filteredJobs = jobsList;

    if (dateRange?.from && dateRange?.to) {
      filteredJobs = filteredJobs.filter(job => {
        const jobDate = new Date(job.created_at);
        return jobDate >= dateRange.from! && jobDate <= dateRange.to!;
      });
    } else if (timeFilter !== 'all') {
        const now = new Date();
        const cutoffDate = new Date();
        
        switch (timeFilter) {
          case '7days':
            cutoffDate.setDate(now.getDate() - 7);
            break;
          case '30days':
            cutoffDate.setDate(now.getDate() - 30);
            break;
          case '90days':
            cutoffDate.setDate(now.getDate() - 90);
            break;
          case '6months':
            cutoffDate.setMonth(now.getMonth() - 6);
            break;
          case '1year':
            cutoffDate.setFullYear(now.getFullYear() - 1);
            break;
          case '2years':
            cutoffDate.setFullYear(now.getFullYear() - 2);
            break;
          case '3years':
            cutoffDate.setFullYear(now.getFullYear() - 3);
            break;
          case '4years':
            cutoffDate.setFullYear(now.getFullYear() - 4);
            break;
        }
        
        filteredJobs = filteredJobs.filter(job => new Date(job.created_at) >= cutoffDate);
    }

    return filteredJobs;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!partnerData) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-2">Partner Not Found</h2>
        <p className="mb-4">The partner you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={() => navigate("/partners")}>
          Return to Partners List
        </Button>
      </div>
    );
  }

  const analysisData = jobAnalysis[jobTypeFilter === 'all' ? 'overall' : jobTypeFilter as keyof typeof jobAnalysis];
  const efficiencyRating = getEfficiencyRating(analysisData.efficiencyRatio);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/partners")}
              className="gap-1"
            >
              <ArrowLeft size={16} />
              Back
            </Button>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-7 w-7" />
              {partnerData.name}
            </h1>
          </div>
          <p className="text-muted-foreground mt-1 ml-9">
            {partnerData.partnerType === 'vendor' ? 'Vendor' : 'Supplier'} {' '}
            {partnerData.partnerType === 'vendor' && partnerData.service_type && (
              <span className="ml-1">• {partnerData.service_type}</span>
            )}
            {partnerData.partnerType === 'supplier' && partnerData.materials_provided && (
              <span className="ml-1">• {partnerData.materials_provided}</span>
            )}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 ml-9 sm:ml-0">
          <Button variant="outline" onClick={() => navigate(`/partners/${id}/edit?type=${partnerData.partnerType}`)}>
            Edit Partner
          </Button>
          <Button onClick={() => navigate(`/partners/${id}/job-history?type=${partnerData.partnerType}`)}>
            Job History
          </Button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analysisData.totalJobs}</div>
            <div className="mt-1 flex items-baseline text-sm">
              <div className="flex space-x-1 text-muted-foreground">
                <span className="font-medium text-green-600">{analysisData.completedJobs}</span> completed,
                <span className="font-medium text-blue-600">{analysisData.inProgressJobs}</span> in progress,
                <span className="font-medium text-amber-600">{analysisData.pendingJobs}</span> pending
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analysisData.totalCost)}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Average rate: {formatCurrency(analysisData.averageRate)} per unit
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Quantities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analysisData.totalReceivedQuantity)}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {analysisData.totalProvidedQuantity > 0 && (
                <>Provided: {formatNumber(analysisData.totalProvidedQuantity)} units</>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${efficiencyRating.color}`}>
              {analysisData.efficiencyRatio > 0 ? formatPercentage(analysisData.efficiencyRatio) : 'N/A'}
            </div>
            <div className={`mt-1 text-sm ${efficiencyRating.color}`}>
              Rating: {efficiencyRating.label}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-64">
          <Select value={timeFilter} onValueChange={setTimeFilter} disabled={!!dateRange}>
            <SelectTrigger>
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
              <SelectItem value="2years">Last 2 Years</SelectItem>
              <SelectItem value="3years">Last 3 Years</SelectItem>
              <SelectItem value="4years">Last 4 Years</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full sm:w-64">
          <DatePickerWithRange date={dateRange} onChange={setDateRange} />
        </div>
        
        <div className="w-full sm:w-64">
          <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Job Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              <SelectItem value="cutting">Cutting Only</SelectItem>
              <SelectItem value="printing">Printing Only</SelectItem>
              <SelectItem value="stitching">Stitching Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Job Lists */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Jobs</TabsTrigger>
          <TabsTrigger value="cutting">Cutting Jobs</TabsTrigger>
          <TabsTrigger value="printing">Printing Jobs</TabsTrigger>
          <TabsTrigger value="stitching">Stitching Jobs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {(jobTypeFilter === 'all' || jobTypeFilter === 'cutting') && getFilteredJobs(jobs.cutting, 'cutting').length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cutting Jobs</CardTitle>
                <CardDescription>Jobs assigned for cutting work</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job #</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Received Qty</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Total Cost</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredJobs(jobs.cutting, 'cutting').map((job) => (
                        <TableRow key={`cutting-${job.id}`} className="group">
                          <TableCell className="font-medium">{job.job_number}</TableCell>
                          <TableCell>{job.order_number}</TableCell>
                          <TableCell>{job.company_name}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              job.status === 'completed' ? 'bg-green-50 text-green-700' : 
                              job.status === 'in_progress' ? 'bg-blue-50 text-blue-700' : 
                              'bg-amber-50 text-amber-700'
                            }`}>
                              {job.status.replace('_', ' ').charAt(0).toUpperCase() + job.status.replace('_', ' ').slice(1)}
                            </span>
                          </TableCell>
                          <TableCell>{job.received_quantity || 0}</TableCell>
                          <TableCell>{job.rate ? formatCurrency(job.rate) : '-'}</TableCell>
                          <TableCell>{job.rate && job.received_quantity ? formatCurrency(job.rate * job.received_quantity) : '-'}</TableCell>
                          <TableCell>{formatDate(job.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
          
          {(jobTypeFilter === 'all' || jobTypeFilter === 'printing') && getFilteredJobs(jobs.printing, 'printing').length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Printing Jobs</CardTitle>
                <CardDescription>Jobs assigned for printing work</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job #</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Pulling</TableHead>
                        <TableHead>Received</TableHead>
                        <TableHead>Efficiency</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Total Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredJobs(jobs.printing, 'printing').map((job) => {
                        const pullingQty = job.pulling ? parseInt(job.pulling) : 0;
                        const receivedQty = job.received_quantity || 0;
                        const efficiency = pullingQty > 0 ? receivedQty / pullingQty : 0;
                        const efficiencyRating = getEfficiencyRating(efficiency);
                        
                        return (
                          <TableRow key={`printing-${job.id}`} className="group">
                            <TableCell className="font-medium">{job.job_number}</TableCell>
                            <TableCell>{job.order_number}</TableCell>
                            <TableCell>{job.company_name}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                job.status === 'completed' ? 'bg-green-50 text-green-700' : 
                                job.status === 'in_progress' ? 'bg-blue-50 text-blue-700' : 
                                'bg-amber-50 text-amber-700'
                              }`}>
                                {job.status.replace('_', ' ').charAt(0).toUpperCase() + job.status.replace('_', ' ').slice(1)}
                              </span>
                            </TableCell>
                            <TableCell>{pullingQty || '-'}</TableCell>
                            <TableCell>{receivedQty || '-'}</TableCell>
                            <TableCell>
                              {pullingQty > 0 && receivedQty > 0 ? (
                                <span className={efficiencyRating.color}>
                                  {formatPercentage(efficiency)} ({efficiencyRating.label})
                                </span>
                              ) : '-'}
                            </TableCell>
                            <TableCell>{job.rate ? formatCurrency(job.rate) : '-'}</TableCell>
                            <TableCell>{job.rate && receivedQty ? formatCurrency(job.rate * receivedQty) : '-'}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
          
          {(jobTypeFilter === 'all' || jobTypeFilter === 'stitching') && getFilteredJobs(jobs.stitching, 'stitching').length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Stitching Jobs</CardTitle>
                <CardDescription>Jobs assigned for stitching work</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job #</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Provided</TableHead>
                        <TableHead>Received</TableHead>
                        <TableHead>Efficiency</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Total Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredJobs(jobs.stitching, 'stitching').map((job) => {
                        const providedQty = job.provided_quantity || 0;
                        const receivedQty = job.received_quantity || 0;
                        const efficiency = providedQty > 0 ? receivedQty / providedQty : 0;
                        const efficiencyRating = getEfficiencyRating(efficiency);
                        
                        return (
                          <TableRow key={`stitching-${job.id}`} className="group">
                            <TableCell className="font-medium">{job.job_number}</TableCell>
                            <TableCell>{job.order_number}</TableCell>
                            <TableCell>{job.company_name}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                job.status === 'completed' ? 'bg-green-50 text-green-700' : 
                                job.status === 'in_progress' ? 'bg-blue-50 text-blue-700' : 
                                'bg-amber-50 text-amber-700'
                              }`}>
                                {job.status.replace('_', ' ').charAt(0).toUpperCase() + job.status.replace('_', ' ').slice(1)}
                              </span>
                            </TableCell>
                            <TableCell>{providedQty || '-'}</TableCell>
                            <TableCell>{receivedQty || '-'}</TableCell>
                            <TableCell>
                              {providedQty > 0 && receivedQty > 0 ? (
                                <span className={efficiencyRating.color}>
                                  {formatPercentage(efficiency)} ({efficiencyRating.label})
                                </span>
                              ) : '-'}
                            </TableCell>
                            <TableCell>{job.rate ? formatCurrency(job.rate) : '-'}</TableCell>
                            <TableCell>{job.rate && receivedQty ? formatCurrency(job.rate * receivedQty) : '-'}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Show a message when no jobs are available */}
          {getFilteredJobs(jobs.cutting, 'cutting').length === 0 && 
           getFilteredJobs(jobs.printing, 'printing').length === 0 && 
           getFilteredJobs(jobs.stitching, 'stitching').length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No jobs found</h3>
              <p className="text-muted-foreground max-w-md mt-2">
                There are no jobs matching your current filter criteria. Try changing your filters or check back later.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="cutting" className="space-y-4">
          {getFilteredJobs(jobs.cutting, 'cutting').length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Cutting Jobs</CardTitle>
                <CardDescription>Jobs assigned for cutting work</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Detailed cutting jobs table - similar to the one above but with more details */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job #</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Received Qty</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Total Cost</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredJobs(jobs.cutting, 'cutting').map((job) => (
                        <TableRow key={`cutting-detail-${job.id}`} className="group">
                          <TableCell className="font-medium">{job.job_number}</TableCell>
                          <TableCell>{job.order_number}</TableCell>
                          <TableCell>{job.company_name}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              job.status === 'completed' ? 'bg-green-50 text-green-700' : 
                              job.status === 'in_progress' ? 'bg-blue-50 text-blue-700' : 
                              'bg-amber-50 text-amber-700'
                            }`}>
                              {job.status.replace('_', ' ').charAt(0).toUpperCase() + job.status.replace('_', ' ').slice(1)}
                            </span>
                          </TableCell>
                          <TableCell>{job.received_quantity || 0}</TableCell>
                          <TableCell>{job.rate ? formatCurrency(job.rate) : '-'}</TableCell>
                          <TableCell>{job.rate && job.received_quantity ? formatCurrency(job.rate * job.received_quantity) : '-'}</TableCell>
                          <TableCell>{formatDate(job.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <PackageCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No cutting jobs found</h3>
              <p className="text-muted-foreground max-w-md mt-2">
                There are no cutting jobs matching your current filter criteria. Try changing your filters or check back later.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="printing" className="space-y-4">
          {getFilteredJobs(jobs.printing, 'printing').length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Printing Jobs</CardTitle>
                <CardDescription>Jobs assigned for printing work</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Detailed printing jobs table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job #</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Pulling</TableHead>
                        <TableHead>Received</TableHead>
                        <TableHead>Efficiency</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Total Cost</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredJobs(jobs.printing, 'printing').map((job) => {
                        const pullingQty = job.pulling ? parseInt(job.pulling) : 0;
                        const receivedQty = job.received_quantity || 0;
                        const efficiency = pullingQty > 0 ? receivedQty / pullingQty : 0;
                        const efficiencyRating = getEfficiencyRating(efficiency);
                        
                        return (
                          <TableRow key={`printing-detail-${job.id}`} className="group">
                            <TableCell className="font-medium">{job.job_number}</TableCell>
                            <TableCell>{job.order_number}</TableCell>
                            <TableCell>{job.company_name}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                job.status === 'completed' ? 'bg-green-50 text-green-700' : 
                                job.status === 'in_progress' ? 'bg-blue-50 text-blue-700' : 
                                'bg-amber-50 text-amber-700'
                              }`}>
                                {job.status.replace('_', ' ').charAt(0).toUpperCase() + job.status.replace('_', ' ').slice(1)}
                              </span>
                            </TableCell>
                            <TableCell>{pullingQty || '-'}</TableCell>
                            <TableCell>{receivedQty || '-'}</TableCell>
                            <TableCell>
                              {pullingQty > 0 && receivedQty > 0 ? (
                                <span className={efficiencyRating.color}>
                                  {formatPercentage(efficiency)} ({efficiencyRating.label})
                                </span>
                              ) : '-'}
                            </TableCell>
                            <TableCell>{job.rate ? formatCurrency(job.rate) : '-'}</TableCell>
                            <TableCell>{job.rate && receivedQty ? formatCurrency(job.rate * receivedQty) : '-'}</TableCell>
                            <TableCell>{formatDate(job.created_at)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <PackageCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No printing jobs found</h3>
              <p className="text-muted-foreground max-w-md mt-2">
                There are no printing jobs matching your current filter criteria. Try changing your filters or check back later.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="stitching" className="space-y-4">
          {getFilteredJobs(jobs.stitching, 'stitching').length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Stitching Jobs</CardTitle>
                <CardDescription>Jobs assigned for stitching work</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Detailed stitching jobs table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job #</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Provided</TableHead>
                        <TableHead>Received</TableHead>
                        <TableHead>Efficiency</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Total Cost</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredJobs(jobs.stitching, 'stitching').map((job) => {
                        const providedQty = job.provided_quantity || 0;
                        const receivedQty = job.received_quantity || 0;
                        const efficiency = providedQty > 0 ? receivedQty / providedQty : 0;
                        const efficiencyRating = getEfficiencyRating(efficiency);
                        
                        return (
                          <TableRow key={`stitching-detail-${job.id}`} className="group">
                            <TableCell className="font-medium">{job.job_number}</TableCell>
                            <TableCell>{job.order_number}</TableCell>
                            <TableCell>{job.company_name}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                job.status === 'completed' ? 'bg-green-50 text-green-700' : 
                                job.status === 'in_progress' ? 'bg-blue-50 text-blue-700' : 
                                'bg-amber-50 text-amber-700'
                              }`}>
                                {job.status.replace('_', ' ').charAt(0).toUpperCase() + job.status.replace('_', ' ').slice(1)}
                              </span>
                            </TableCell>
                            <TableCell>{providedQty || '-'}</TableCell>
                            <TableCell>{receivedQty || '-'}</TableCell>
                            <TableCell>
                              {providedQty > 0 && receivedQty > 0 ? (
                                <span className={efficiencyRating.color}>
                                  {formatPercentage(efficiency)} ({efficiencyRating.label})
                                </span>
                              ) : '-'}
                            </TableCell>
                            <TableCell>{job.rate ? formatCurrency(job.rate) : '-'}</TableCell>
                            <TableCell>{job.rate && receivedQty ? formatCurrency(job.rate * receivedQty) : '-'}</TableCell>
                            <TableCell>{formatDate(job.created_at)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <PackageCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No stitching jobs found</h3>
              <p className="text-muted-foreground max-w-md mt-2">
                There are no stitching jobs matching your current filter criteria. Try changing your filters or check back later.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PartnerPerformance;
