import { useState, useEffect } from "react";
import { Truck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DispatchFilters } from "@/components/production/dispatch/list/DispatchFilters";
import { DispatchTable } from "@/components/production/dispatch/list/DispatchTable";
import type { OrderWithJobStatus } from "@/components/production/dispatch/types";
import { useNavigate } from "react-router-dom";
import { Database } from "@/integrations/supabase/types";

const Dispatch = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderWithJobStatus[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, 
          order_number,
          company_name,
          quantity,
          rate,
          status,
          created_at,
          job_cards (
            id,
            job_name,
            status,
            cutting_jobs (status),
            printing_jobs (status),
            stitching_jobs (status)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching orders",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isOrderReadyForDispatch = (order: OrderWithJobStatus): boolean => {
    if (!order.job_cards || order.job_cards.length === 0) return false;
    
    for (const jobCard of order.job_cards) {
      const hasCuttingJobs = jobCard.cutting_jobs && jobCard.cutting_jobs.length > 0;
      const allCuttingCompleted = hasCuttingJobs && 
        jobCard.cutting_jobs?.every(job => job.status === 'completed');
      
      const hasPrintingJobs = jobCard.printing_jobs && jobCard.printing_jobs.length > 0;
      const allPrintingCompleted = hasPrintingJobs && 
        jobCard.printing_jobs?.every(job => job.status === 'completed');
      
      const hasStitchingJobs = jobCard.stitching_jobs && jobCard.stitching_jobs.length > 0;
      const allStitchingCompleted = hasStitchingJobs && 
        jobCard.stitching_jobs?.every(job => job.status === 'completed');
      
      if ((hasCuttingJobs && !allCuttingCompleted) ||
          (hasPrintingJobs && !allPrintingCompleted) ||
          (hasStitchingJobs && !allStitchingCompleted)) {
        return false;
      }
    }
    
    return true;
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderWithJobStatus["status"]) => {
    try {
      const dbStatus: Database['public']['Enums']['order_status'] = 
        newStatus === "dispatched" 
          ? "ready_for_dispatch" 
          : newStatus as Database['public']['Enums']['order_status'];
      
      const { error } = await supabase
        .from('orders')
        .update({ status: dbStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus } 
            : order
        )
      );
      
      toast({
        title: "Status Updated",
        description: `Order status has been updated to ${newStatus}`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = (
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.company_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dispatch</h1>
        <p className="text-muted-foreground">Manage order dispatch and delivery</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck size={18} />
            Orders Ready for Dispatch
          </CardTitle>
          <CardDescription>View and manage orders that are ready for dispatch</CardDescription>
        </CardHeader>
        <CardContent>
          <DispatchFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            onRefresh={fetchOrders}
          />

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Truck className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No orders found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || statusFilter !== "all"
                      ? "Try changing your search or filter"
                      : "No orders are currently available for dispatch"}
                  </p>
                </div>
              ) : (
                <DispatchTable
                  orders={filteredOrders}
                  isOrderReadyForDispatch={isOrderReadyForDispatch}
                  onUpdateStatus={updateOrderStatus}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dispatch;
