import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, History, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { EmptyStockState } from "@/components/inventory/EmptyStockState";
import { StockDetailDialog } from "@/components/inventory/StockDetailDialog";
import { DeleteStockDialog } from "@/components/inventory/dialogs/DeleteStockDialog";
import { showToast } from "@/components/ui/enhanced-toast";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const StockList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedStockId, setSelectedStockId] = useState<string | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingStockId, setDeletingStockId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasTransactions, setHasTransactions] = useState(false);
  const [deleteWithTransactions, setDeleteWithTransactions] = useState(false);
  const [recentlyUpdatedItems, setRecentlyUpdatedItems] = useState<string[]>([]);

  // Track materials with recent updates
  useEffect(() => {
    try {
      const updatedMaterialIds = localStorage.getItem('updated_material_ids');
      const lastUpdate = localStorage.getItem('last_inventory_update');
      
      if (updatedMaterialIds && lastUpdate) {
        const materialIds = JSON.parse(updatedMaterialIds);
        const updateTime = new Date(lastUpdate).getTime();
        const currentTime = new Date().getTime();
        const isRecent = (currentTime - updateTime) < 300000; // Within last 5 minutes
        
        if (isRecent) {
          console.log("Recently updated materials detected:", materialIds);
          setRecentlyUpdatedItems(materialIds);
        }
      }
    } catch (e) {
      console.error("Error checking for recently updated items:", e);
    }
  }, []);

  const { data: stock, isLoading, refetch } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      console.log("Fetching inventory data...");
      const { data, error } = await supabase
        .from('inventory')
        .select('*, suppliers(name)');
      
      if (error) {
        console.error("Error fetching inventory:", error);
        throw error;
      }
      
      console.log(`Fetched ${data?.length || 0} inventory items`);
      return data;
    },
  });

  // Also fetch transaction counts for each material
  const { data: transactionCounts } = useQuery({
    queryKey: ['inventory-transactions-count'],
    queryFn: async () => {
      console.log("Fetching transaction counts...");
      const { data, error } = await supabase
        .from('inventory_transactions')
        .select('material_id, count')
        .eq('created_at', '>', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .then(({ data, error }) => {
          if (error) {
            console.error("Error fetching transaction counts:", error);
            return { data: [], error };
          }
          
          // Process data to get counts by material_id
          const counts: Record<string, number> = {};
          data?.forEach(item => {
            if (counts[item.material_id]) {
              counts[item.material_id]++;
            } else {
              counts[item.material_id] = 1;
            }
          });
          
          console.log("Transaction counts:", counts);
          return { data: counts, error: null };
        });
      
      return data || {};
    },
  });

  // Refresh data when storage events occur
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'last_inventory_update') {
        console.log("Storage event detected, refreshing inventory...");
        refetch();
        
        // Update recently updated items
        try {
          const updatedMaterialIds = localStorage.getItem('updated_material_ids');
          if (updatedMaterialIds) {
            const materialIds = JSON.parse(updatedMaterialIds);
            console.log("Setting recently updated items:", materialIds);
            setRecentlyUpdatedItems(materialIds);
            
            // Show toast for updates
            if (materialIds.length > 0) {
              showToast({
                title: `${materialIds.length} material(s) updated`,
                description: "Click on any highlighted material to view details",
                type: "info"
              });
            }
          }
        } catch (e) {
          console.error("Error handling storage event:", e);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refetch]);

  const handleStockClick = (id: string) => {
    console.log(`Selecting stock item: ${id}`);
    setSelectedStockId(id);
    setIsDetailDialogOpen(true);
    
    // If this was a recently updated item, we want to default to the transactions tab
    if (recentlyUpdatedItems.includes(id)) {
      // We'll pass this information via localStorage for the dialog to pick up
      localStorage.setItem('view_transactions_for_material', id);
    }
  };

  const handleCloseDialog = () => {
    setIsDetailDialogOpen(false);
    setSelectedStockId(null);
    // Clear the view transactions flag
    localStorage.removeItem('view_transactions_for_material');
  };

  const checkForTransactions = async (stockId: string) => {
    const { data, error } = await supabase
      .from('inventory_transactions')
      .select('id')
      .eq('material_id', stockId)
      .limit(1);
    
    if (error) {
      console.error("Error checking for transactions:", error);
      return false;
    }
    
    return data && data.length > 0;
  };

  const handleDeleteClick = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation(); // Prevent triggering the row click
    setDeletingStockId(id);
    
    // Check if this inventory has transactions
    const hasRelatedTransactions = await checkForTransactions(id);
    setHasTransactions(hasRelatedTransactions);
    setDeleteWithTransactions(false);
    
    setIsDeleteDialogOpen(true);
  };

  const deleteTransactions = async (stockId: string) => {
    const { error } = await supabase
      .from('inventory_transactions')
      .delete()
      .eq('material_id', stockId);
      
    if (error) {
      console.error("Error deleting related transactions:", error);
      throw error;
    }
    
    return true;
  };

  const handleDeleteConfirm = async () => {
    if (!deletingStockId) return;
    
    setIsDeleting(true);
    try {
      // If this inventory has transactions and user confirmed to delete them too
      if (hasTransactions && deleteWithTransactions) {
        // First delete all related transactions
        await deleteTransactions(deletingStockId);
      }
      
      // Then delete the inventory item
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', deletingStockId);

      if (error) {
        console.error("Error deleting stock:", error);
        
        // Show specific message for constraint violation
        if (error.code === '23503') {
          showToast({
            title: "Cannot delete this item",
            description: "This inventory item has transaction history. Please delete the transactions first or use the option to delete everything.",
            type: "error"
          });
        } else {
          showToast({
            title: "Delete failed",
            description: error.message,
            type: "error"
          });
        }
        throw error;
      }

      showToast({
        title: "Stock deleted successfully",
        type: "success"
      });
      
      // Refetch inventory data
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    } catch (error) {
      console.error("Unexpected error during deletion:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setDeletingStockId(null);
      setHasTransactions(false);
      setDeleteWithTransactions(false);
    }
  };

  // Function to initiate deletion process from detail dialog
  const handleInitiateDelete = async (stockId: string) => {
    if (!stockId) return;
    
    // Check if this inventory has transactions
    const hasRelatedTransactions = await checkForTransactions(stockId);
    setHasTransactions(hasRelatedTransactions);
    setDeleteWithTransactions(false);
    
    // Set the ID of the stock item to delete
    setDeletingStockId(stockId);
    
    // Open the delete confirmation dialog
    setIsDeleteDialogOpen(true);
  };

  return (
    <Card>
      <div className="p-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Inventory Stock</h2>
        <Button onClick={() => navigate('/inventory/stock/new')}>
          <Plus size={16} className="mr-2" />
          Add Stock
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <div className="rounded-full h-8 w-8 border-b-2 border-primary animate-spin"></div>
        </div>
      ) : stock?.length === 0 ? (
        <EmptyStockState />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material Name</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>GSM</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit</TableHead>
                {stock?.some(item => item.alternate_unit) && (
                  <TableHead>Alt. Quantity</TableHead>
                )}
                {stock?.some(item => item.track_cost) && (
                  <>
                    <TableHead>Purchase Price</TableHead>
                    <TableHead>Selling Price</TableHead>
                  </>
                )}
                <TableHead>Supplier</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stock?.map((item) => {
                const hasRecentUpdate = recentlyUpdatedItems.includes(item.id);
                const transactionCount = transactionCounts?.[item.id] || 0;
                
                return (
                  <TableRow 
                    key={item.id}
                    className={`cursor-pointer hover:bg-muted ${hasRecentUpdate ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/30' : ''}`}
                    onClick={() => handleStockClick(item.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {hasRecentUpdate && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                          </span>
                        )}
                        {item.material_name}
                      </div>
                    </TableCell>
                    <TableCell>{item.color || 'N/A'}</TableCell>
                    <TableCell>{item.gsm || 'N/A'}</TableCell>
                    <TableCell>{item.quantity} {item.unit}</TableCell>
                    {stock?.some(i => i.alternate_unit) && (
                      <TableCell>
                        {item.alternate_unit ? 
                          `${(item.quantity * (item.conversion_rate || 0)).toFixed(2)} ${item.alternate_unit}` : 
                          'N/A'}
                      </TableCell>
                    )}
                    {stock?.some(i => i.track_cost) && (
                      <>
                        <TableCell>{item.track_cost && item.purchase_price ? `₹${item.purchase_price}` : 'N/A'}</TableCell>
                        <TableCell>{item.track_cost && item.selling_price ? `₹${item.selling_price}` : 'N/A'}</TableCell>
                      </>
                    )}
                    <TableCell>{item.suppliers?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            {transactionCount > 0 ? (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <History className="h-3 w-3" />
                                {transactionCount}
                              </Badge>
                            ) : hasRecentUpdate ? (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Bell className="h-3 w-3" />
                                Updated
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">None</span>
                            )}
                          </TooltipTrigger>
                          <TooltipContent>
                            {transactionCount > 0
                              ? `${transactionCount} recent transactions`
                              : hasRecentUpdate
                                ? "Recently updated"
                                : "No recent activity"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => handleDeleteClick(e, item.id, item.material_name)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <StockDetailDialog 
        stockId={selectedStockId}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        onEdit={() => {
          if (selectedStockId) {
            navigate(`/inventory/stock/${selectedStockId}/edit`);
            setIsDetailDialogOpen(false);
          }
        }}
        onDelete={() => {
          if (selectedStockId) {
            handleInitiateDelete(selectedStockId);
          }
        }}
        initialTab={recentlyUpdatedItems.includes(selectedStockId || '') ? "transactions" : "details"}
      />

      <DeleteStockDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        itemName="this inventory item"
        hasTransactions={hasTransactions}
        deleteWithTransactions={deleteWithTransactions}
        onToggleDeleteWithTransactions={setDeleteWithTransactions}
      />
    </Card>
  );
};

export default StockList;
