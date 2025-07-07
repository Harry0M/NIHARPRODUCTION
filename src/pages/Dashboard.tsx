import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Package, Truck, Users, Layers, Calendar, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { SkeletonTable } from "@/components/ui/skeleton-table";
import { StatusBadge, StatusType } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DueOrdersModal } from "@/components/dashboard/DueOrdersModal";

type Stats = {
  activeOrders: number;
  inProduction: number;
  readyForDispatch: number;
  activePartners: number;
  dueThisWeek: number;
  jobsInProgress: number;
};

type ProductionStage = {
  name: string;
  complete: number;
};

type RecentOrder = {
  id: string;
  order_number: string;
  company_name: string;
  quantity: number;
  status: string;
  date: string;
  product?: string;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [showDueOrdersModal, setShowDueOrdersModal] = useState(false);

  // Fetch all dashboard data in a single query using React Query
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-data'],
    queryFn: async () => {
      try {
        // Execute all queries in parallel to improve performance
        const [
          activeOrdersResult, 
          inProductionResult, 
          readyForDispatchResult, 
          activeVendorsResult,
          activeSuppliersResult,
          ordersData,
          jobCardsResult,
          dueThisWeekResult,
          jobsInProgressResult
        ] = await Promise.all([
          // Active orders count
          supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .not('status', 'eq', 'completed'),
          
          // In production orders count
          supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'in_production'),
          
          // Ready for dispatch orders count
          supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'ready_for_dispatch'),
          
          // Active vendors count
          supabase
            .from('vendors')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'active'),
          
          // Active suppliers count
          supabase
            .from('suppliers')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'active'),
          
          // Recent orders with limit
          supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5),
          
          // Job cards with related jobs
          supabase
            .from('job_cards')
            .select(`
              id,
              cutting_jobs!left(status),
              printing_jobs!left(status),
              stitching_jobs!left(status)
            `),
          
          // Orders due this week (using delivery_date)
          supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .not('delivery_date', 'is', null)
            .gte('delivery_date', new Date().toISOString().split('T')[0])
            .lte('delivery_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
            .not('status', 'eq', 'completed')
            .not('status', 'eq', 'cancelled'),
          
          // Jobs in progress
          supabase
            .from('job_cards')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'in_progress')
        ]);
        
        // Process job cards data for production stages
        const jobCards = jobCardsResult.data || [];
        const stages = {
          cutting: { total: 0, completed: 0 },
          printing: { total: 0, completed: 0 },
          stitching: { total: 0, completed: 0 },
          dispatch: { total: 0, completed: 0 }
        };
        
        jobCards.forEach(card => {
          if (card.cutting_jobs && card.cutting_jobs.length > 0) {
            stages.cutting.total += card.cutting_jobs.length;
            stages.cutting.completed += card.cutting_jobs.filter((j: { status: string }) => j.status === 'completed').length;
          }
          if (card.printing_jobs && card.printing_jobs.length > 0) {
            stages.printing.total += card.printing_jobs.length;
            stages.printing.completed += card.printing_jobs.filter((j: { status: string }) => j.status === 'completed').length;
          }
          if (card.stitching_jobs && card.stitching_jobs.length > 0) {
            stages.stitching.total += card.stitching_jobs.length;
            stages.stitching.completed += card.stitching_jobs.filter((j: { status: string }) => j.status === 'completed').length;
          }
        });
        
        // Calculate production stages percentages
        const productionStages = [
          {
            name: 'Cutting',
            complete: stages.cutting.total > 0 ? Math.round((stages.cutting.completed / stages.cutting.total) * 100) : 0,
          },
          {
            name: 'Printing',
            complete: stages.printing.total > 0 ? Math.round((stages.printing.completed / stages.printing.total) * 100) : 0,
          },
          {
            name: 'Stitching',
            complete: stages.stitching.total > 0 ? Math.round((stages.stitching.completed / stages.stitching.total) * 100) : 0,
          },
          {
            name: 'Dispatch',
            complete: stages.dispatch.total > 0 ? Math.round((stages.dispatch.completed / stages.dispatch.total) * 100) : 0,
          },
        ];
        
        // Calculate total active partners
        const totalActivePartners = (activeVendorsResult.count || 0) + (activeSuppliersResult.count || 0);
        
        // Format recent orders
        const formattedOrders = (ordersData.data || []).map(order => ({
          id: order.id,
          order_number: order.order_number,
          company_name: order.company_name,
          product: `Bag ${order.bag_length}×${order.bag_width}`,
          quantity: order.quantity,
          status: order.status,
          date: order.order_date
        }));
        
        // Return all processed data
        return {
          stats: {
            activeOrders: activeOrdersResult.count || 0,
            inProduction: inProductionResult.count || 0,
            readyForDispatch: readyForDispatchResult.count || 0,
            activePartners: totalActivePartners,
            dueThisWeek: dueThisWeekResult.count || 0,
            jobsInProgress: jobsInProgressResult.count || 0,
          },
          productionStages,
          recentOrders: formattedOrders
        };
      } catch (error: unknown) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: "Failed to load dashboard data",
          description: error instanceof Error ? error.message : "Unknown error occurred",
          variant: "destructive"
        });
        throw error;
      }
    },
    staleTime: 60000, // Data will be fresh for 1 minute
    refetchOnWindowFocus: false // Don't refetch when window regains focus
  });

  // Use memoized values from the query result
  const stats = useMemo(() => 
    dashboardData?.stats || {
      activeOrders: 0,
      inProduction: 0,
      readyForDispatch: 0,
      activePartners: 0,
      dueThisWeek: 0,
      jobsInProgress: 0,
    }, 
  [dashboardData]);
  
  const productionStages = useMemo(() => 
    dashboardData?.productionStages || [
      { name: "Cutting", complete: 0 },
      { name: "Printing", complete: 0 },
      { name: "Stitching", complete: 0 },
      { name: "Dispatch", complete: 0 },
    ],
  [dashboardData]);
  
  // Update recent orders when data is available
  useEffect(() => {
    if (dashboardData?.recentOrders) {
      setRecentOrders(dashboardData.recentOrders);
    }
  }, [dashboardData]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "ready_for_dispatch":
        return "bg-blue-100 text-blue-800";
      case "in_production":
      case "cutting":
      case "printing":
      case "stitching":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusDisplay = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const statsCards = [
    {
      title: "Active Orders",
      value: stats.activeOrders.toString(),
      icon: Package,
      change: "",
      positive: null,
      linkTo: "/orders?status=in_production",
      className: "bg-blue-50",
      clickable: false
    },
    {
      title: "In Production",
      value: stats.inProduction.toString(),
      icon: Layers,
      change: "",
      positive: null,
      linkTo: "/production",
      className: "bg-amber-50",
      clickable: false
    },
    {
      title: "Ready for Dispatch",
      value: stats.readyForDispatch.toString(),
      icon: Truck,
      change: "",
      positive: null,
      linkTo: "/orders?status=ready_for_dispatch",
      className: "bg-green-50",
      clickable: false
    },
    {
      title: "Active Partners",
      value: stats.activePartners.toString(),
      icon: Users,
      change: "",
      positive: null,
      linkTo: "/partners",
      className: "bg-purple-50",
      clickable: false
    },
    {
      title: "Due This Week",
      value: stats.dueThisWeek.toString(),
      icon: Calendar,
      change: "",
      positive: null,
      linkTo: "/orders?due=week",
      className: stats.dueThisWeek > 0 ? "bg-yellow-50" : "bg-gray-50",
      clickable: true
    },
    {
      title: "Jobs in Progress",
      value: stats.jobsInProgress.toString(),
      icon: AlertCircle,
      change: "",
      positive: null,
      linkTo: "/production/job-cards?status=in_progress",
      className: "bg-blue-50",
      clickable: false
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="min-h-[120px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <SkeletonTable rows={4} columns={2} />
          <SkeletonTable rows={4} columns={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-6 fade-in">
      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statsCards.map((stat, i) => (
          stat.clickable ? (
            <div 
              key={i} 
              className="slide-up cursor-pointer" 
              style={{animationDelay: `${i * 0.05}s`}}
              onClick={() => {
                if (stat.title === "Due This Week") {
                  setShowDueOrdersModal(true);
                }
              }}
            >
              <Card 
                className={`h-full overflow-hidden hover:shadow-elevated transition-all duration-200 border-border/60 hover:translate-y-[-2px] ${stat.className} dark:bg-card/95 dark:border-border/30 dark:hover:border-primary/20`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={`${stat.className} dark:bg-background/30 p-2 rounded-full dark:text-primary`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.change && (
                      <span className={stat.positive ? "text-green-500" : "text-red-500"}>
                        {stat.positive ? "↗" : "↘"} {stat.change}
                      </span>
                    )}
                    {stat.title === "Due This Week" && parseInt(stat.value) > 0 && (
                      <span className="text-xs text-muted-foreground">
                        Click to view details
                      </span>
                    )}
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Link key={i} to={stat.linkTo} className="slide-up" style={{animationDelay: `${i * 0.05}s`}}>
              <Card 
                className={`h-full overflow-hidden hover:shadow-elevated transition-all duration-200 border-border/60 hover:translate-y-[-2px] ${stat.className} dark:bg-card/95 dark:border-border/30 dark:hover:border-primary/20`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={`${stat.className} dark:bg-background/30 p-2 rounded-full dark:text-primary`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.change && (
                      <span className={stat.positive ? "text-green-500" : "text-red-500"}>
                        {stat.positive ? "↗" : "↘"} {stat.change}
                      </span>
                    )}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Production Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productionStages.map((stage) => (
                <div key={stage.name}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{stage.name}</span>
                    <span className="text-sm text-muted-foreground">{stage.complete}%</span>
                  </div>
                  <Progress value={stage.complete} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Monthly Production</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="h-[220px] flex items-center justify-center border-2 border-dashed border-muted rounded-md">
              <p className="text-muted-foreground">Production chart will appear here</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Production Progress */}
        <Card className="md:col-span-2 border-border/60 shadow-sm slide-up" style={{animationDelay: '0.3s'}}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span className="h-5 w-1 rounded-full bg-primary inline-block"></span>
                Production Progress
              </CardTitle>
              <CardDescription className="mt-1">Status of ongoing production stages</CardDescription>
            </div>
            <div className="bg-muted/30 dark:bg-background/20 p-2 rounded-full">
              <BarChart className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {productionStages.map((stage, index) => (
                <div key={stage.name} className="flex items-center scale-in" style={{animationDelay: `${0.3 + (index * 0.1)}s`}}>
                  <div className="mr-3 shrink-0 w-24 font-medium text-sm">{stage.name}</div>
                  <div className="flex-1 flex items-center gap-3 relative">
                    <div className="relative w-full h-2 bg-muted/40 rounded-full overflow-hidden flex-1">
                      <div 
                        className={`absolute top-0 left-0 h-full rounded-full ${stage.complete > 85 ? 'bg-green-500' : stage.complete > 50 ? 'bg-blue-500' : stage.complete > 25 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${stage.complete}%` }}
                      />
                    </div>
                    <span className={`w-10 text-right text-sm font-medium ${stage.complete > 85 ? 'text-green-600 dark:text-green-400' : stage.complete > 50 ? 'text-blue-600 dark:text-blue-400' : stage.complete > 25 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                      {stage.complete}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card className="lg:col-span-1 border-border/60 shadow-sm slide-up" style={{animationDelay: '0.4s'}}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <span className="h-5 w-1 rounded-full bg-primary inline-block"></span>
              Recent Orders
            </CardTitle>
            <CardDescription className="mt-1">Latest orders received</CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center scale-in" style={{animationDelay: '0.5s'}}>
                <div className="w-12 h-12 mb-3 rounded-full bg-muted/50 flex items-center justify-center">
                  <Package className="h-6 w-6 text-muted-foreground/80" />
                </div>
                <p className="text-muted-foreground">No recent orders found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order, index) => (
                  <div 
                    key={order.id} 
                    className="flex items-center p-3 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer scale-in" 
                    style={{animationDelay: `${0.5 + (index * 0.1)}s`}}
                    onClick={() => navigate(`/orders/${order.id}`)}
                  >
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium leading-none flex items-center gap-2">
                        <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded text-xs">{order.order_number}</span>
                        {order.product && <span className="text-xs text-muted-foreground">{order.product}</span>}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {order.company_name} • {order.quantity.toLocaleString()} units
                      </p>
                    </div>
                    <div className="ml-auto flex flex-col items-end gap-1">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${order.status === 'completed' ? 'bg-green-500/10 text-green-600 ring-1 ring-inset ring-green-500/20 dark:bg-green-500/20 dark:text-green-300 dark:ring-green-500/30' : order.status === 'ready_for_dispatch' ? 'bg-blue-500/10 text-blue-600 ring-1 ring-inset ring-blue-500/20 dark:bg-blue-500/20 dark:text-blue-300 dark:ring-blue-500/30' : 'bg-amber-500/10 text-amber-600 ring-1 ring-inset ring-amber-500/20 dark:bg-amber-500/20 dark:text-amber-300 dark:ring-amber-500/30'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${order.status === 'completed' ? 'bg-green-500' : order.status === 'ready_for_dispatch' ? 'bg-blue-500' : 'bg-amber-500'}`}></span>
                        {getStatusDisplay(order.status)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(order.date)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Due Orders Modal */}
      <DueOrdersModal 
        open={showDueOrdersModal} 
        onOpenChange={setShowDueOrdersModal} 
      />
    </div>
  );
};

export default Dashboard;
