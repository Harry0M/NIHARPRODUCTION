
import { useState, useEffect } from "react";
import { DispatchFilters } from "./DispatchFilters";
import { DispatchTable } from "./DispatchTable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDispatchData } from "@/hooks/use-dispatch-data";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { usePagination } from "@/hooks/use-pagination";
import { OrderWithJobStatus } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

export function DispatchList() {
  const { orders, loading, error } = useDispatchData();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filteredOrders, setFilteredOrders] = useState<OrderWithJobStatus[]>([]);
  
  // Pagination setup
  const pagination = usePagination({
    totalItems: filteredOrders.length,
    itemsPerPage: 5,
  });
  
  const paginatedOrders = pagination.getCurrentPageItems(filteredOrders);

  useEffect(() => {
    // Apply filters whenever orders, search term or status filter changes
    if (!orders) return;

    let filtered = [...orders];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        order => 
          order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.company_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
    
    // Reset to first page when filters change
    if (pagination.currentPage > 1) {
      pagination.goToPage(1);
    }
    
  }, [orders, searchTerm, statusFilter]);

  // Determine if an order is ready for dispatch based on job status
  const isOrderReadyForDispatch = (order: OrderWithJobStatus) => {
    if (!order.job_cards || order.job_cards.length === 0) return false;
    
    // Check if there are any completed job cards
    const jobCard = order.job_cards[0];
    
    const hasCuttingStage = jobCard.cutting_jobs && jobCard.cutting_jobs.length > 0;
    const hasPrintingStage = jobCard.printing_jobs && jobCard.printing_jobs.length > 0;
    const hasStitchingStage = jobCard.stitching_jobs && jobCard.stitching_jobs.length > 0;
    
    const cuttingComplete = hasCuttingStage ? jobCard.cutting_jobs.every(job => job.status === 'completed') : true;
    const printingComplete = hasPrintingStage ? jobCard.printing_jobs.every(job => job.status === 'completed') : true;
    const stitchingComplete = hasStitchingStage ? jobCard.stitching_jobs.every(job => job.status === 'completed') : true;
    
    return cuttingComplete && printingComplete && stitchingComplete;
  };

  const handleRefresh = () => {
    window.location.reload();
  };
  
  const handlePageChange = (page: number) => {
    pagination.goToPage(page);
    // Scroll to top of the list
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderWithJobStatus["status"]) => {
    try {
      // Ensure we're using a valid enum value for the database
      const dbStatus: Database['public']['Enums']['order_status'] = 
        newStatus as Database['public']['Enums']['order_status'];
      
      const { error } = await supabase
        .from('orders')
        .update({ status: dbStatus })
        .eq('id', orderId);
      
      if (error) throw error;
      
      // Update local state
      setFilteredOrders(prev => 
        prev.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      
      toast({
        title: "Status updated",
        description: `Order status has been changed to ${newStatus}`,
      });
      
      return Promise.resolve();
    } catch (error: any) {
      console.error("Error updating order status:", error);
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      });
      
      return Promise.reject(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dispatch Management</CardTitle>
      </CardHeader>
      <CardContent>
        <DispatchFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          onRefresh={handleRefresh}
        />
        
        <ScrollArea className="h-[calc(100vh-240px)]">
          <DispatchTable
            orders={paginatedOrders}
            isOrderReadyForDispatch={isOrderReadyForDispatch}
            onUpdateStatus={updateOrderStatus}
          />
        </ScrollArea>
        
        {filteredOrders.length > pagination.itemsPerPage && (
          <div className="mt-6 flex justify-center">
            <PaginationControls
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
