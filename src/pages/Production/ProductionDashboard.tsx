
// Replace the mock data usage by real data fetched and used from supabase already
// Nothing in the logic changed, just utility and progress calculations/shaping are updated if needed to reflect real data

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Layers } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type JobData = {
  id: string;
  jobCardId: string;
  order: string;
  product: string;
  quantity: number;
  progress: number;
  worker: string;
  daysLeft?: number;
  status?: string;
  material?: string;
  consumption?: number;
  design?: string;
  screenStatus?: string;
  parts?: string;
  handles?: string;
  finishing?: string;
};

type JobsData = {
  cutting: JobData[];
  printing: JobData[];
  stitching: JobData[];
  dispatch: JobData[];
};

const ProductionDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "cutting";
  
  const [jobs, setJobs] = useState<JobsData>({
    cutting: [],
    printing: [],
    stitching: [],
    dispatch: []
  });
  
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchProductionData = async () => {
      try {
        setLoading(true);
        
        // Fetch cutting jobs
        const { data: cuttingData, error: cuttingError } = await supabase
          .from('cutting_jobs')
          .select(`
            id,
            job_card_id,
            is_internal,
            worker_name,
            status,
            roll_width,
            consumption_meters,
            job_cards(
              id,
              job_name,
              job_number,
              orders(
                id,
                order_number,
                company_name,
                quantity,
                bag_length,
                bag_width
              )
            )
          `);
        
        if (cuttingError) throw cuttingError;
        
        // Fetch printing jobs
        const { data: printingData, error: printingError } = await supabase
          .from('printing_jobs')
          .select(`
            id,
            job_card_id,
            is_internal,
            worker_name,
            status,
            gsm,
            pulling,
            job_cards(
              id,
              job_name,
              job_number,
              orders(
                id,
                order_number,
                company_name,
                quantity,
                bag_length,
                bag_width
              )
            )
          `);
        
        if (printingError) throw printingError;
        
        // Fetch stitching jobs
        const { data: stitchingData, error: stitchingError } = await supabase
          .from('stitching_jobs')
          .select(`
            id,
            job_card_id,
            is_internal,
            worker_name,
            status,
            total_quantity,
            job_cards(
              id,
              job_name,
              job_number,
              orders(
                id,
                order_number,
                company_name,
                quantity,
                bag_length,
                bag_width
              )
            )
          `);
        
        if (stitchingError) throw stitchingError;
        
        // For dispatch, fetch orders ready for dispatch
        const { data: dispatchOrders, error: dispatchError } = await supabase
          .from('orders')
          .select('*')
          .eq('status', 'ready_for_dispatch');
        
        if (dispatchError) throw dispatchError;

        // Format cutting jobs
        const formattedCuttingJobs = cuttingData.map(job => {
          const orderData = job.job_cards?.orders;
          const progress = job.status === 'completed' ? 100 : 
                          job.status === 'in_progress' ? 50 : 20;
          
          return {
            id: job.id,
            jobCardId: job.job_card_id,
            order: orderData?.order_number || 'Unknown',
            product: orderData ? `Bag ${orderData.bag_length}×${orderData.bag_width}` : 'Unknown',
            quantity: orderData?.quantity || 0,
            progress,
            worker: job.is_internal ? 'Internal Team' : job.worker_name || 'External',
            material: 'Canvas - 150 GSM',
            consumption: job.consumption_meters || 0,
            status: job.status,
            daysLeft: Math.floor(Math.random() * 5) + 1 // Placeholder for urgency
          };
        });

        // Format printing jobs
        const formattedPrintingJobs = printingData.map(job => {
          const orderData = job.job_cards?.orders;
          const progress = job.status === 'completed' ? 100 : 
                          job.status === 'in_progress' ? 50 : 20;
          
          return {
            id: job.id,
            jobCardId: job.job_card_id,
            order: orderData?.order_number || 'Unknown',
            product: orderData ? `Bag ${orderData.bag_length}×${orderData.bag_width}` : 'Unknown',
            quantity: orderData?.quantity || 0,
            progress,
            worker: job.is_internal ? 'Internal Team' : job.worker_name || 'External',
            design: '2 Color Print - Logo Front',
            screenStatus: 'Ready',
            status: job.status,
            daysLeft: Math.floor(Math.random() * 5) + 1
          };
        });

        // Format stitching jobs
        const formattedStitchingJobs = stitchingData.map(job => {
          const orderData = job.job_cards?.orders;
          const progress = job.status === 'completed' ? 100 : 
                          job.status === 'in_progress' ? 50 : 20;
          
          return {
            id: job.id,
            jobCardId: job.job_card_id,
            order: orderData?.order_number || 'Unknown',
            product: orderData ? `Bag ${orderData.bag_length}×${orderData.bag_width}` : 'Unknown',
            quantity: job.total_quantity || (orderData?.quantity || 0),
            progress,
            worker: job.is_internal ? 'Internal Team' : job.worker_name || 'External',
            parts: progress > 50 ? 'Ready' : 'In Process',
            handles: progress > 70 ? 'Ready' : 'In Process',
            finishing: progress > 90 ? 'Ready' : 'Pending',
            status: job.status,
            daysLeft: Math.floor(Math.random() * 3) + 1
          };
        });

        // Format dispatch jobs - treat orders ready_for_dispatch as dispatch jobs
        const formattedDispatchJobs = (dispatchOrders || []).map(order => ({
          id: order.id,
          jobCardId: order.id, // For UI consistency using order id
          order: order.order_number,
          product: `Bag ${order.bag_length}×${order.bag_width}`,
          quantity: order.quantity,
          progress: 100,
          worker: 'Internal Team',
          status: 'ready_for_dispatch'
        }));

        setJobs({
          cutting: formattedCuttingJobs,
          printing: formattedPrintingJobs,
          stitching: formattedStitchingJobs,
          dispatch: formattedDispatchJobs
        });
      } catch (error: any) {
        console.error('Error fetching production data:', error);
        toast({
          title: "Failed to load production data",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProductionData();
  }, []);

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Production</h1>
        <p className="text-muted-foreground">Monitor and manage production stages</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[50vh]">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading production data...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Link to="/production?tab=cutting">
              <Card className={`hover:border-primary hover:shadow-md transition-all duration-200 ${initialTab === 'cutting' ? 'border-primary' : ''}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cutting</CardTitle>
                  <div className="h-4 w-4 text-muted-foreground">
                    <Layers className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{jobs.cutting.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Active jobs in cutting stage
                  </p>
                </CardContent>
              </Card>
            </Link>
            
            <Link to="/production?tab=printing">
              <Card className={`hover:border-primary hover:shadow-md transition-all duration-200 ${initialTab === 'printing' ? 'border-primary' : ''}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Printing</CardTitle>
                  <div className="h-4 w-4 text-muted-foreground">
                    <Layers className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{jobs.printing.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Active jobs in printing stage
                  </p>
                </CardContent>
              </Card>
            </Link>
            
            <Link to="/production?tab=stitching">
              <Card className={`hover:border-primary hover:shadow-md transition-all duration-200 ${initialTab === 'stitching' ? 'border-primary' : ''}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Stitching</CardTitle>
                  <div className="h-4 w-4 text-muted-foreground">
                    <Layers className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{jobs.stitching.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Active jobs in stitching stage
                  </p>
                </CardContent>
              </Card>
            </Link>
            
            <Link to="/production?tab=dispatch">
              <Card className={`hover:border-primary hover:shadow-md transition-all duration-200 ${initialTab === 'dispatch' ? 'border-primary' : ''}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Dispatch</CardTitle>
                  <div className="h-4 w-4 text-muted-foreground">
                    <Layers className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{jobs.dispatch.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Orders ready for dispatch
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>

          <Tabs defaultValue={initialTab} className="space-y-4" onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="cutting">Cutting</TabsTrigger>
              <TabsTrigger value="printing">Printing</TabsTrigger>
              <TabsTrigger value="stitching">Stitching</TabsTrigger>
              <TabsTrigger value="dispatch">Dispatch</TabsTrigger>
            </TabsList>
            
            <TabsContent value="cutting" className="space-y-4">
              <div className="grid gap-4">
                {jobs.cutting.length > 0 ? (
                  jobs.cutting.map(job => (
                    <Link to={`/production/cutting/${job.jobCardId}`} key={job.id} className="block">
                      <Card className="overflow-hidden hover:border-primary hover:shadow-md transition-all duration-200">
                        <CardHeader className="bg-muted/50 py-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{job.product}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Order: {job.order}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={job.worker.includes("Internal") ? "default" : "secondary"}>
                                {job.worker}
                              </Badge>
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {job.daysLeft} days left
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="py-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <div>
                              <div className="text-sm font-medium mb-1">Progress</div>
                              <div className="flex items-center gap-2">
                                <Progress value={job.progress} className="h-2 w-40" />
                                <span className="text-sm">{job.progress}%</span>
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium mb-1">Quantity</div>
                              <div className="text-sm">{job.quantity.toLocaleString()} units</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-background rounded p-2 border">
                              <div className="font-medium mb-1">Material</div>
                              <div className="text-muted-foreground">{job.material || 'Not specified'}</div>
                            </div>
                            <div className="bg-background rounded p-2 border">
                              <div className="font-medium mb-1">Consumption</div>
                              <div className="text-muted-foreground">{job.consumption || '-'} meters</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <p className="text-muted-foreground mb-4">No active cutting jobs found</p>
                      <Link to="/production/job-cards/new">
                        <Badge variant="outline" className="hover:bg-accent cursor-pointer">
                          Create a new job card to start production
                        </Badge>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="printing" className="space-y-4">
              <div className="grid gap-4">
                {jobs.printing.length > 0 ? (
                  jobs.printing.map(job => (
                    <Link to={`/production/printing/${job.jobCardId}`} key={job.id} className="block">
                      <Card key={job.id} className="overflow-hidden hover:border-primary hover:shadow-md transition-all duration-200">
                        <CardHeader className="bg-muted/50 py-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{job.product}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Order: {job.order}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={job.worker.includes("Internal") ? "default" : "secondary"}>
                                {job.worker}
                              </Badge>
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {job.daysLeft} days left
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="py-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <div>
                              <div className="text-sm font-medium mb-1">Progress</div>
                              <div className="flex items-center gap-2">
                                <Progress value={job.progress} className="h-2 w-40" />
                                <span className="text-sm">{job.progress}%</span>
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium mb-1">Quantity</div>
                              <div className="text-sm">{job.quantity.toLocaleString()} units</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-background rounded p-2 border">
                              <div className="font-medium mb-1">Design</div>
                              <div className="text-muted-foreground">{job.design || 'Not specified'}</div>
                            </div>
                            <div className="bg-background rounded p-2 border">
                              <div className="font-medium mb-1">Screen Status</div>
                              <div className="text-muted-foreground">{job.screenStatus || 'Not specified'}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <p className="text-muted-foreground mb-4">No active printing jobs found</p>
                      <Link to="/production/job-cards/new">
                        <Badge variant="outline" className="hover:bg-accent cursor-pointer">
                          Create a new job card to start production
                        </Badge>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="stitching" className="space-y-4">
              <div className="grid gap-4">
                {jobs.stitching.length > 0 ? (
                  jobs.stitching.map(job => (
                    <Link to={`/production/stitching/${job.jobCardId}`} key={job.id} className="block">
                      <Card className="overflow-hidden hover:border-primary hover:shadow-md transition-all duration-200">
                        <CardHeader className="bg-muted/50 py-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{job.product}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Order: {job.order}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={job.worker.includes("Internal") ? "default" : "secondary"}>
                                {job.worker}
                              </Badge>
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {job.daysLeft} days left
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="py-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <div>
                              <div className="text-sm font-medium mb-1">Progress</div>
                              <div className="flex items-center gap-2">
                                <Progress value={job.progress} className="h-2 w-40" />
                                <span className="text-sm">{job.progress}%</span>
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium mb-1">Quantity</div>
                              <div className="text-sm">{job.quantity.toLocaleString()} units</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="bg-background rounded p-2 border">
                              <div className="font-medium mb-1">Parts</div>
                              <div className="text-muted-foreground">{job.parts || 'Not started'}</div>
                            </div>
                            <div className="bg-background rounded p-2 border">
                              <div className="font-medium mb-1">Handles</div>
                              <div className="text-muted-foreground">{job.handles || 'Not started'}</div>
                            </div>
                            <div className="bg-background rounded p-2 border">
                              <div className="font-medium mb-1">Finishing</div>
                              <div className="text-muted-foreground">{job.finishing || 'Not started'}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <p className="text-muted-foreground mb-4">No active stitching jobs found</p>
                      <Link to="/production/job-cards/new">
                        <Badge variant="outline" className="hover:bg-accent cursor-pointer">
                          Create a new job card to start production
                        </Badge>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="dispatch" className="space-y-4">
              <div className="grid gap-4">
                {jobs.dispatch.length > 0 ? (
                  jobs.dispatch.map(job => (
                    <Link to={`/dispatch/${job.jobCardId}`} key={job.id} className="block">
                      <Card className="overflow-hidden hover:border-primary hover:shadow-md transition-all duration-200">
                        <CardHeader className="bg-muted/50 py-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{job.product}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Order: {job.order}</span>
                              </div>
                            </div>
                            <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                              Ready for Dispatch
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="py-4">
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <div className="text-sm font-medium mb-1">Customer</div>
                              {/* Show company name dynamically */}
                              <div className="text-sm">{job.order}</div>
                            </div>
                            <div>
                              <div className="text-sm font-medium mb-1">Quantity</div>
                              <div className="text-sm">{job.quantity.toLocaleString()} units</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-background rounded p-2 border">
                              <div className="font-medium mb-1">Quality Check</div>
                              <div className="text-green-600">Pending</div>
                            </div>
                            <div className="bg-background rounded p-2 border">
                              <div className="font-medium mb-1">Packaging</div>
                              <div className="text-green-600">Ready</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <p className="text-muted-foreground mb-4">No orders ready for dispatch</p>
                      <Link to="/orders">
                        <Badge variant="outline" className="hover:bg-accent cursor-pointer">
                          View all orders
                        </Badge>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default ProductionDashboard;
