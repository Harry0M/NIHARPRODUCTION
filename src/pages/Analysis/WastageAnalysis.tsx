import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  ArrowLeft, Search, AlertTriangle, AlertCircle, 
  BarChart, FilterX, ArrowUpDown, Percent
} from "lucide-react";
import { LoadingSpinner } from "@/components/production/LoadingSpinner";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

// Types
interface WastageFilters {
  dateRange: DateRange;
  vendorId: string | null;
  jobType: 'all' | 'stitching' | 'printing';
  searchQuery: string;
}

interface StitchingWastage {
  id: string;
  job_card_id: string;
  job_name: string;
  vendor_id: string;
  vendor_name: string;
  provided_quantity: number;
  received_quantity: number;
  wastage_quantity: number;
  wastage_percentage: number;
  date: string;
  status: string;
}

interface PrintingWastage {
  id: string;
  job_card_id: string;
  job_name: string;
  vendor_id: string;
  vendor_name: string;
  pulling_quantity: number;
  received_quantity: number;
  wastage_quantity: number;
  wastage_percentage: number;
  date: string;
  status: string;
}

interface VendorSummary {
  vendor_id: string;
  vendor_name: string;
  total_wastage: number;
  total_provided: number;
  wastage_percentage: number;
  job_count: number;
}

const WastageAnalysis = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("overview");
  
  // Filter state
  const [filters, setFilters] = useState<WastageFilters>({
    dateRange: { from: null, to: null },
    vendorId: null,
    jobType: 'all',
    searchQuery: "",
  });
  
  // Fetch vendors for dropdown
  const { data: vendors, isLoading: vendorsLoading } = useQuery({
    queryKey: ['vendors-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("id, name");
        
      if (error) throw error;
      return data || [];
    }
  });
  
  // Fetch stitching wastage data
  const { data: stitchingData, isLoading: stitchingLoading } = useQuery({
    queryKey: ['stitching-wastage', filters],
    queryFn: async () => {
      try {
        // Start with base query to get stitching jobs with vendor info
        let query = supabase
          .from("stitching_jobs")
          .select(`
            id, 
            provided_quantity, 
            received_quantity,
            status,
            created_at,
            is_internal,
            worker_name,
            job_card_id,
            job_cards!inner (
              job_name,
              order_id
            )
          `);
        
        // Apply filters
        if (filters.vendorId && filters.vendorId !== 'all') {
          // For vendors, we need to filter by worker_name since there's no direct vendor_id
          // First get the vendor name
          const { data: vendor } = await supabase
            .from('vendors')
            .select('name')
            .eq('id', filters.vendorId)
            .single();
            
          if (vendor) {
            query = query.ilike('worker_name', `%${vendor.name}%`);
          }
        }
        
        if (filters.dateRange?.from) {
          query = query.gte('created_at', filters.dateRange.from.toISOString());
        }
        
        if (filters.dateRange?.to) {
          query = query.lte('created_at', filters.dateRange.to.toISOString());
        }
        
        // We want to see jobs with wastage - both quantities must be recorded 
        // and only include the jobs that have actually been completed
        query = query
          .not('provided_quantity', 'is', null)
          .not('received_quantity', 'is', null)
          .eq('status', 'completed')
          .eq('is_internal', false) // Only external vendors
          .order('created_at', { ascending: false });
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Error in stitching query:', error);
          throw error;
        }
        
        // Get vendor names by worker names (this is how vendors are linked in the system)
        const workerNames = data
          .filter(job => job.worker_name)
          .map(job => job.worker_name);
        
        let vendorMap: Record<string, any> = {};
        if (workerNames.length > 0) {
          // Use ilike with OR for each worker name
          let vendorQuery = supabase
            .from('vendors')
            .select('id, name')
          
          // Only query if we have worker names
          if (workerNames.length > 0) {
            const orConditions = workerNames.map(name => 
              `name.ilike.%${name}%`
            ).join(',');
            vendorQuery = vendorQuery.or(orConditions);
              
            const { data: vendors, error: vendorError } = await vendorQuery;
                
            if (!vendorError && vendors) {
              vendorMap = vendors.reduce((acc: Record<string, any>, vendor) => {
                if (vendor.name && vendor.id) {
                  acc[vendor.name] = {
                    id: vendor.id,
                    name: vendor.name
                  };
                }
                return acc;
              }, {});
            }
          }
        }
        
        // Process the results to calculate wastage
        const processedData: StitchingWastage[] = data
          .filter(job => Number(job.provided_quantity) > 0) // Ensure we don't divide by zero
          .map(job => {
            const provided = Number(job.provided_quantity) || 0;
            const received = Number(job.received_quantity) || 0;
            const wastage = Math.max(0, provided - received); // Negative wastage not possible
            
            // Try to match the worker name to a vendor
            let vendorId = 'unknown';
            let vendorName = job.worker_name || 'Unknown';
            
            // Helper function to strip numbers from the end of names
            const stripNumbers = (name: string) => {
              // Replace trailing digits and spaces at the end
              return name.replace(/\s*\d+\s*$/, '').trim();
            };
            
            if (job.worker_name) {
              // Try exact match first
              if (vendorMap[job.worker_name]) {
                vendorId = vendorMap[job.worker_name].id;
                vendorName = vendorMap[job.worker_name].name;
              } else {
                // Try matching by stripping numbers
                const cleanWorkerName = stripNumbers(job.worker_name);
                
                // Try partial match with cleaned names
                for (const [key, value] of Object.entries<any>(vendorMap)) {
                  const cleanVendorName = stripNumbers(key);
                  
                  // Check if worker name contains vendor name or vice versa
                  // after removing trailing numbers
                  if (cleanWorkerName.includes(cleanVendorName) || 
                      cleanVendorName.includes(cleanWorkerName)) {
                    vendorId = value.id;
                    vendorName = value.name;
                    break;
                  }
                }
              }
            }
            
            return {
              id: job.id,
              job_card_id: job.job_card_id,
              job_name: job.job_cards?.job_name || 'Unknown Job',
              vendor_id: vendorId,
              vendor_name: vendorName,
              provided_quantity: provided,
              received_quantity: received,
              wastage_quantity: wastage,
              wastage_percentage: (wastage / provided) * 100,
              date: job.created_at,
              status: job.status
            };
          });
        
        console.log(`Fetched ${processedData.length} stitching records with wastage`);
        return processedData;
      } catch (error) {
        console.error('Error fetching stitching wastage:', error);
        return [];
      }
    },
    enabled: filters.jobType === 'all' || filters.jobType === 'stitching'
  });
  
  // Fetch printing wastage data
  const { data: printingData, isLoading: printingLoading } = useQuery({
    queryKey: ['printing-wastage', filters],
    queryFn: async () => {
      try {
        // Start with base query to get printing jobs with vendor info
        let query = supabase
          .from("printing_jobs")
          .select(`
            id, 
            pulling, 
            received_quantity,
            status,
            created_at,
            is_internal,
            worker_name,
            job_card_id,
            job_cards!inner (
              job_name,
              order_id
            )
          `);
        
        // Apply filters
        if (filters.vendorId && filters.vendorId !== 'all') {
          // For vendors, we need to filter by worker_name since there's no direct vendor_id
          // First get the vendor name
          const { data: vendor } = await supabase
            .from('vendors')
            .select('name')
            .eq('id', filters.vendorId)
            .single();
            
          if (vendor) {
            query = query.ilike('worker_name', `%${vendor.name}%`);
          }
        }
        
        if (filters.dateRange?.from) {
          query = query.gte('created_at', filters.dateRange.from.toISOString());
        }
        
        if (filters.dateRange?.to) {
          query = query.lte('created_at', filters.dateRange.to.toISOString());
        }
        
        // We want to see jobs with wastage - both quantities must be recorded
        // and only include the jobs that have actually been completed
        query = query
          .not('pulling', 'is', null)
          .not('received_quantity', 'is', null)
          .eq('status', 'completed')
          .eq('is_internal', false) // Only external vendors
          .order('created_at', { ascending: false });
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Error in printing query:', error);
          throw error;
        }
        
        // Get vendor names by worker names (this is how vendors are linked in the system)
        const workerNames = data
          .filter(job => job.worker_name)
          .map(job => job.worker_name);
        
        let vendorMap: Record<string, any> = {};
        if (workerNames.length > 0) {
          // Use ilike with OR for each worker name
          let vendorQuery = supabase
            .from('vendors')
            .select('id, name')
          
          // Only query if we have worker names
          if (workerNames.length > 0) {
            const orConditions = workerNames.map(name => 
              `name.ilike.%${name}%`
            ).join(',');
            vendorQuery = vendorQuery.or(orConditions);
              
            const { data: vendors, error: vendorError } = await vendorQuery;
                
            if (!vendorError && vendors) {
              vendorMap = vendors.reduce((acc: Record<string, any>, vendor) => {
                if (vendor.name && vendor.id) {
                  acc[vendor.name] = {
                    id: vendor.id,
                    name: vendor.name
                  };
                }
                return acc;
              }, {});
            }
          }
        }
        
        // Process the results to calculate wastage
        const processedData: PrintingWastage[] = data
          .filter(job => Number(job.pulling) > 0) // Ensure we don't divide by zero
          .map(job => {
            const pulling = Number(job.pulling) || 0;
            const received = Number(job.received_quantity) || 0;
            const wastage = Math.max(0, pulling - received); // Negative wastage not possible
            
            // Try to match the worker name to a vendor
            let vendorId = 'unknown';
            let vendorName = job.worker_name || 'Unknown';
            
            // Helper function to strip numbers from the end of names
            const stripNumbers = (name: string) => {
              // Replace trailing digits and spaces at the end
              return name.replace(/\s*\d+\s*$/, '').trim();
            };
            
            if (job.worker_name) {
              // Try exact match first
              if (vendorMap[job.worker_name]) {
                vendorId = vendorMap[job.worker_name].id;
                vendorName = vendorMap[job.worker_name].name;
              } else {
                // Try matching by stripping numbers
                const cleanWorkerName = stripNumbers(job.worker_name);
                
                // Try partial match with cleaned names
                for (const [key, value] of Object.entries<any>(vendorMap)) {
                  const cleanVendorName = stripNumbers(key);
                  
                  // Check if worker name contains vendor name or vice versa
                  // after removing trailing numbers
                  if (cleanWorkerName.includes(cleanVendorName) || 
                      cleanVendorName.includes(cleanWorkerName)) {
                    vendorId = value.id;
                    vendorName = value.name;
                    break;
                  }
                }
              }
            }
            
            return {
              id: job.id,
              job_card_id: job.job_card_id,
              job_name: job.job_cards?.job_name || 'Unknown Job',
              vendor_id: vendorId,
              vendor_name: vendorName,
              pulling_quantity: pulling,
              received_quantity: received,
              wastage_quantity: wastage,
              wastage_percentage: (wastage / pulling) * 100,
              date: job.created_at,
              status: job.status
            };
          });
        
        console.log(`Fetched ${processedData.length} printing records with wastage`);
        return processedData;
      } catch (error) {
        console.error('Error fetching printing wastage:', error);
        return [];
      }
    },
    enabled: filters.jobType === 'all' || filters.jobType === 'printing'
  });
  
  // Compute vendor summary data
  const vendorSummary = useMemo(() => {
    const summary: Record<string, VendorSummary> = {};
    
    // Add stitching data to summary
    if (stitchingData) {
      stitchingData.forEach(job => {
        if (!summary[job.vendor_id]) {
          summary[job.vendor_id] = {
            vendor_id: job.vendor_id,
            vendor_name: job.vendor_name,
            total_wastage: 0,
            total_provided: 0,
            wastage_percentage: 0,
            job_count: 0
          };
        }
        
        summary[job.vendor_id].total_wastage += job.wastage_quantity;
        summary[job.vendor_id].total_provided += job.provided_quantity;
        summary[job.vendor_id].job_count += 1;
      });
    }
    
    // Add printing data to summary
    if (printingData) {
      printingData.forEach(job => {
        if (!summary[job.vendor_id]) {
          summary[job.vendor_id] = {
            vendor_id: job.vendor_id,
            vendor_name: job.vendor_name,
            total_wastage: 0,
            total_provided: 0,
            wastage_percentage: 0,
            job_count: 0
          };
        }
        
        summary[job.vendor_id].total_wastage += job.wastage_quantity;
        summary[job.vendor_id].total_provided += job.pulling_quantity;
        summary[job.vendor_id].job_count += 1;
      });
    }
    
    // Calculate final percentage for each vendor
    Object.values(summary).forEach(vendor => {
      vendor.wastage_percentage = vendor.total_provided > 0 
        ? (vendor.total_wastage / vendor.total_provided) * 100 
        : 0;
    });
    
    return Object.values(summary)
      .sort((a, b) => b.wastage_percentage - a.wastage_percentage);
  }, [stitchingData, printingData]);
  
  // Compute overall totals
  const totals = useMemo(() => {
    const total = {
      provided: 0,
      wastage: 0,
      percentage: 0,
      stitchingJobs: stitchingData?.length || 0,
      printingJobs: printingData?.length || 0
    };
    
    vendorSummary.forEach(vendor => {
      total.provided += vendor.total_provided;
      total.wastage += vendor.total_wastage;
    });
    
    total.percentage = total.provided > 0 
      ? (total.wastage / total.provided) * 100 
      : 0;
    
    return total;
  }, [vendorSummary, stitchingData, printingData]);
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({
      dateRange: { from: null, to: null },
      vendorId: null,
      jobType: 'all',
      searchQuery: "",
    });
  };
  
  // Update a single filter
  const updateFilter = (key: keyof WastageFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  // Get wastage severity color
  const getWastageColor = (percentage: number) => {
    if (percentage <= 3) return 'bg-green-500';
    if (percentage <= 5) return 'bg-yellow-500';
    if (percentage <= 10) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  // Loading state
  const isLoading = (filters.jobType === 'all' && (stitchingLoading || printingLoading)) || 
                    (filters.jobType === 'stitching' && stitchingLoading) ||
                    (filters.jobType === 'printing' && printingLoading) ||
                    vendorsLoading;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/analysis")}
            className="gap-1"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <AlertTriangle className="h-8 w-8" />
              Wastage Analysis
            </h1>
            <p className="text-muted-foreground">
              Track material wastage by vendor across stitching and printing operations
            </p>
          </div>
        </div>
      </div>

      {/* Filter Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Options</CardTitle>
          <CardDescription>Narrow down wastage data by vendor, date, or job type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendor-filter">Vendor</Label>
              <Select
                value={filters.vendorId || "all"}
                onValueChange={(value) => updateFilter("vendorId", value === "all" ? null : value)}
              >
                <SelectTrigger id="vendor-filter">
                  <SelectValue placeholder="All Vendors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {vendors?.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="job-type-filter">Job Type</Label>
              <Select
                value={filters.jobType}
                onValueChange={(value) => updateFilter("jobType", value as WastageFilters["jobType"])}
              >
                <SelectTrigger id="job-type-filter">
                  <SelectValue placeholder="All Jobs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobs</SelectItem>
                  <SelectItem value="stitching">Stitching Only</SelectItem>
                  <SelectItem value="printing">Printing Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label>Date Range</Label>
              <DatePickerWithRange
                date={filters.dateRange}
                onChange={(range) => updateFilter("dateRange", range)}
              />
            </div>
            
            <div className="md:col-span-4 flex justify-end">
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="gap-2"
              >
                <FilterX size={16} />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stitching">Stitching Wastage</TabsTrigger>
          <TabsTrigger value="printing">Printing Wastage</TabsTrigger>
          <TabsTrigger value="vendors">Vendor Performance</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Total Wastage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <div className="text-3xl font-bold">{totals.wastage.toLocaleString()}</div>
                  <div className="text-muted-foreground text-sm">
                    Out of {totals.provided.toLocaleString()} total provided units
                  </div>
                  <Progress 
                    value={totals.percentage} 
                    className={`h-2 mt-2 ${getWastageColor(totals.percentage)}`} 
                  />
                  <div className="flex justify-between text-sm mt-1">
                    <span>{totals.percentage.toFixed(2)}% wastage rate</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  Jobs with Wastage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-2">
                    <div>
                      <div className="text-3xl font-bold">{totals.stitchingJobs}</div>
                      <div className="text-muted-foreground text-sm">Stitching Jobs</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold">{totals.printingJobs}</div>
                      <div className="text-muted-foreground text-sm">Printing Jobs</div>
                    </div>
                  </div>
                  <div className="text-muted-foreground text-sm mt-2">
                    Across {vendorSummary.length} vendors
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Highest Wastage Vendor
                </CardTitle>
              </CardHeader>
              <CardContent>
                {vendorSummary.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <div className="text-xl font-bold">{vendorSummary[0].vendor_name}</div>
                    <div className="text-3xl font-bold">
                      {vendorSummary[0].wastage_percentage.toFixed(2)}%
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {vendorSummary[0].total_wastage.toLocaleString()} units wasted out of {vendorSummary[0].total_provided.toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">No vendor data available</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Wastage Vendors Table */}
          <Card>
            <CardHeader>
              <CardTitle>Top Wastage Vendors</CardTitle>
              <CardDescription>Vendors with the highest wastage rates</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Total Provided</TableHead>
                    <TableHead>Total Wasted</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        Wastage Rate
                        <ArrowUpDown size={14} />
                      </div>
                    </TableHead>
                    <TableHead>Job Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendorSummary.slice(0, 5).map((vendor) => (
                    <TableRow key={vendor.vendor_id}>
                      <TableCell className="font-medium">{vendor.vendor_name}</TableCell>
                      <TableCell>{vendor.total_provided.toLocaleString()}</TableCell>
                      <TableCell>{vendor.total_wastage.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge 
                          className={getWastageColor(vendor.wastage_percentage)}
                          variant="outline"
                        >
                          {vendor.wastage_percentage.toFixed(2)}%
                        </Badge>
                      </TableCell>
                      <TableCell>{vendor.job_count}</TableCell>
                    </TableRow>
                  ))}
                  
                  {vendorSummary.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                        No vendor data available for the selected filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              
              {vendorSummary.length > 5 && (
                <div className="flex justify-end mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveTab("vendors")}
                  >
                    View All Vendors
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Stitching Wastage Tab */}
        <TabsContent value="stitching" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stitching Job Wastage</CardTitle>
              <CardDescription>Difference between provided and received quantities in stitching jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Name</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Provided Qty</TableHead>
                    <TableHead>Received Qty</TableHead>
                    <TableHead>Wastage Qty</TableHead>
                    <TableHead>Wastage %</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stitchingData && stitchingData.length > 0 ? (
                    stitchingData.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.job_name}</TableCell>
                        <TableCell>{job.vendor_name}</TableCell>
                        <TableCell>{job.provided_quantity.toLocaleString()}</TableCell>
                        <TableCell>{job.received_quantity.toLocaleString()}</TableCell>
                        <TableCell>{job.wastage_quantity.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge 
                            className={getWastageColor(job.wastage_percentage)}
                            variant="outline"
                          >
                            {job.wastage_percentage.toFixed(2)}%
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(job.date), 'dd MMM yyyy')}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                        No stitching wastage data available for the selected filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Printing Wastage Tab */}
        <TabsContent value="printing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Printing Job Wastage</CardTitle>
              <CardDescription>Difference between pulling and received quantities in printing jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Name</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Pulling Qty</TableHead>
                    <TableHead>Received Qty</TableHead>
                    <TableHead>Wastage Qty</TableHead>
                    <TableHead>Wastage %</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {printingData && printingData.length > 0 ? (
                    printingData.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.job_name}</TableCell>
                        <TableCell>{job.vendor_name}</TableCell>
                        <TableCell>{job.pulling_quantity.toLocaleString()}</TableCell>
                        <TableCell>{job.received_quantity.toLocaleString()}</TableCell>
                        <TableCell>{job.wastage_quantity.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge 
                            className={getWastageColor(job.wastage_percentage)}
                            variant="outline"
                          >
                            {job.wastage_percentage.toFixed(2)}%
                          </Badge>
                        </TableCell>
                        <TableCell>{format(new Date(job.date), 'dd MMM yyyy')}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                        No printing wastage data available for the selected filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Vendor Performance Tab */}
        <TabsContent value="vendors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Wastage Performance</CardTitle>
              <CardDescription>Comprehensive analysis of wastage rates by vendor</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Total Provided</TableHead>
                    <TableHead>Total Wasted</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        Wastage Rate
                        <ArrowUpDown size={14} />
                      </div>
                    </TableHead>
                    <TableHead>Job Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendorSummary.length > 0 ? (
                    vendorSummary.map((vendor) => (
                      <TableRow key={vendor.vendor_id}>
                        <TableCell className="font-medium">{vendor.vendor_name}</TableCell>
                        <TableCell>{vendor.total_provided.toLocaleString()}</TableCell>
                        <TableCell>{vendor.total_wastage.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge 
                              className={getWastageColor(vendor.wastage_percentage)}
                              variant="outline"
                            >
                              {vendor.wastage_percentage.toFixed(2)}%
                            </Badge>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <div className="w-36 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full ${getWastageColor(vendor.wastage_percentage)}`} 
                                      style={{ width: `${Math.min(vendor.wastage_percentage * 10, 100)}%` }}
                                    ></div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{vendor.wastage_percentage.toFixed(2)}% wastage rate</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                        <TableCell>{vendor.job_count}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                        No vendor data available for the selected filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WastageAnalysis;
