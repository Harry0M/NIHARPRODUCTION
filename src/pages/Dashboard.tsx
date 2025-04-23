
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Package, Truck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Import Layers from lucide-react
import { Layers } from "lucide-react";

type Stats = {
  activeOrders: number;
  inProduction: number;
  readyForDispatch: number;
  activeVendors: number;
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
  const [stats, setStats] = useState<Stats>({
    activeOrders: 0,
    inProduction: 0,
    readyForDispatch: 0,
    activeVendors: 0,
  });
  const [productionStages, setProductionStages] = useState<ProductionStage[]>([
    { name: "Cutting", complete: 0 },
    { name: "Printing", complete: 0 },
    { name: "Stitching", complete: 0 },
    { name: "Dispatch", complete: 0 },
  ]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch active orders count
        const { data: activeOrdersData, error: activeOrdersError } = await supabase
          .from('orders')
          .select('count')
          .not('status', 'eq', 'completed');
        
        if (activeOrdersError) throw activeOrdersError;
        
        // Fetch production orders count
        const { data: productionOrdersData, error: productionOrdersError } = await supabase
          .from('orders')
          .select('count')
          .eq('status', 'in_production');
        
        if (productionOrdersError) throw productionOrdersError;
        
        // Fetch ready for dispatch orders count
        const { data: dispatchOrdersData, error: dispatchOrdersError } = await supabase
          .from('orders')
          .select('count')
          .eq('status', 'ready_for_dispatch');
        
        if (dispatchOrdersError) throw dispatchOrdersError;
        
        // Fetch active vendors count
        const { data: vendorsData, error: vendorsError } = await supabase
          .from('vendors')
          .select('count')
          .eq('status', 'active');
        
        if (vendorsError) throw vendorsError;

        // Fetch recent orders
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (ordersError) throw ordersError;

        // Fetch production stages data
        const { data: jobCards, error: jobCardsError } = await supabase
          .from('job_cards')
          .select(`
            id,
            cutting_jobs!left(status),
            printing_jobs!left(status),
            stitching_jobs!left(status)
          `);
        
        if (jobCardsError) throw jobCardsError;

        // Calculate production stages percentages
        const stages = {
          cutting: { total: 0, completed: 0 },
          printing: { total: 0, completed: 0 },
          stitching: { total: 0, completed: 0 },
          dispatch: { total: 0, completed: 0 }
        };

        jobCards.forEach(card => {
          // Count cutting jobs
          if (card.cutting_jobs && card.cutting_jobs.length > 0) {
            stages.cutting.total += card.cutting_jobs.length;
            stages.cutting.completed += card.cutting_jobs.filter(job => job.status === 'completed').length;
          }
          
          // Count printing jobs
          if (card.printing_jobs && card.printing_jobs.length > 0) {
            stages.printing.total += card.printing_jobs.length;
            stages.printing.completed += card.printing_jobs.filter(job => job.status === 'completed').length;
          }
          
          // Count stitching jobs
          if (card.stitching_jobs && card.stitching_jobs.length > 0) {
            stages.stitching.total += card.stitching_jobs.length;
            stages.stitching.completed += card.stitching_jobs.filter(job => job.status === 'completed').length;
          }
        });

        // Calculate percentages for each stage
        const newProductionStages = [
          { 
            name: "Cutting", 
            complete: stages.cutting.total > 0 
              ? Math.round((stages.cutting.completed / stages.cutting.total) * 100) 
              : 0 
          },
          { 
            name: "Printing", 
            complete: stages.printing.total > 0 
              ? Math.round((stages.printing.completed / stages.printing.total) * 100) 
              : 0 
          },
          { 
            name: "Stitching", 
            complete: stages.stitching.total > 0 
              ? Math.round((stages.stitching.completed / stages.stitching.total) * 100) 
              : 0 
          },
          { 
            name: "Dispatch", 
            complete: stages.dispatch.total > 0 
              ? Math.round((stages.dispatch.completed / stages.dispatch.total) * 100) 
              : 0 
          }
        ];

        // Format recent orders
        const formattedOrders = ordersData.map(order => ({
          id: order.id,
          order_number: order.order_number,
          company_name: order.company_name,
          product: `Bag ${order.bag_length}×${order.bag_width}`,
          quantity: order.quantity,
          status: order.status,
          date: order.order_date
        }));

        // Update state
        setStats({
          activeOrders: activeOrdersData?.[0]?.count || 0,
          inProduction: productionOrdersData?.[0]?.count || 0,
          readyForDispatch: dispatchOrdersData?.[0]?.count || 0,
          activeVendors: vendorsData?.[0]?.count || 0
        });
        setProductionStages(newProductionStages);
        setRecentOrders(formattedOrders);
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: "Failed to load dashboard data",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
      linkTo: "/orders?status=in_production"
    },
    {
      title: "In Production",
      value: stats.inProduction.toString(),
      icon: Layers,
      change: "",
      positive: null,
      linkTo: "/production"
    },
    {
      title: "Ready for Dispatch",
      value: stats.readyForDispatch.toString(),
      icon: Truck,
      change: "",
      positive: null,
      linkTo: "/orders?status=ready_for_dispatch"
    },
    {
      title: "Active Vendors",
      value: stats.activeVendors.toString(),
      icon: Users,
      change: "",
      positive: null,
      linkTo: "/vendors"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your manufacturing operations</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[60vh]">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {statsCards.map((card) => (
              <Link key={card.title} to={card.linkTo} className="block">
                <Card className="hover:border-primary hover:shadow-md transition-all duration-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                    <card.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{card.value}</div>
                    {card.change && (
                      <p className={`text-xs ${card.positive === true ? 'text-green-500' : card.positive === false ? 'text-red-500' : 'text-muted-foreground'}`}>
                        {card.change}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
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

          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {recentOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 px-4 text-left font-medium">Order ID</th>
                        <th className="py-3 px-4 text-left font-medium">Customer</th>
                        <th className="py-3 px-4 text-left font-medium">Product</th>
                        <th className="py-3 px-4 text-left font-medium">Quantity</th>
                        <th className="py-3 px-4 text-left font-medium">Status</th>
                        <th className="py-3 px-4 text-left font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => (
                        <tr 
                          key={order.id} 
                          className="border-b hover:bg-muted/50 cursor-pointer"
                          onClick={() => window.location.href = `/orders/${order.id}`}
                        >
                          <td className="py-3 px-4">{order.order_number}</td>
                          <td className="py-3 px-4">{order.company_name}</td>
                          <td className="py-3 px-4">{order.product}</td>
                          <td className="py-3 px-4">{order.quantity.toLocaleString()}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(order.status)}`}>
                              {getStatusDisplay(order.status)}
                            </span>
                          </td>
                          <td className="py-3 px-4">{formatDate(order.date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No recent orders found</p>
                  <Link to="/orders/new" className="text-primary hover:underline inline-block mt-2">
                    Create your first order
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Dashboard;
