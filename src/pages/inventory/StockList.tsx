import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, History, Bell, Search, Box, Layers, Package, FileCheck, AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyStockState } from "@/components/inventory/EmptyStockState";
import { StockDetailDialog } from "@/components/inventory/StockDetailDialog";
import { DeleteStockDialog } from "@/components/inventory/dialogs/DeleteStockDialog";
import { showToast } from "@/components/ui/enhanced-toast";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { DownloadButton } from "@/components/DownloadButton";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DeletionPreview {
  inventory_id: string;
  material_name: string;
  deletion_preview: {
    will_be_deleted: {
      inventory_item: boolean;
      non_consumption_transactions: number;
      catalog_material_references: number;
    };
    will_be_preserved: {
      consumption_transactions: number;
      purchase_history: number;
      order_history: number;
    };
    will_be_modified: {
      purchase_items_lose_material_ref: number;
      order_components_lose_material_ref: number;
    };
  };
  summary: string;
}

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
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [deletionPreview, setDeletionPreview] = useState<DeletionPreview | null>(null);

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

  // Main inventory query with pagination
  const { data: inventoryData, isLoading, refetch } = useQuery({
    queryKey: ['inventory', page, pageSize, searchTerm],
    queryFn: async () => {
      console.log("Fetching inventory data...");
      
      // First get the total count for pagination
      const countQuery = supabase
        .from('inventory')
        .select('id', { count: 'exact', head: true })
        // Only show active (non-deleted) items
        .eq('is_deleted', false);
      
      if (searchTerm) {
        countQuery.or(
          `material_name.ilike.%${searchTerm}%,color.ilike.%${searchTerm}%`
        );
      }
      
      const { count, error: countError } = await countQuery;
      
      if (countError) {
        console.error("Error fetching inventory count:", countError);
        throw countError;
      }
      
      setTotalCount(count || 0);
      
      // Then fetch the paginated data
      // Add explicit type annotation to avoid excessive type depth error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = supabase
        .from('inventory')
        .select(`
          id,
          material_name,
          color,
          gsm,
          quantity,
          unit,
          alternate_unit,
          conversion_rate,
          track_cost,
          purchase_price,
          selling_price,
          status,
          min_stock_level,
          reorder_level,
          category_id,
          location_id,
          supplier_id,
          created_at,
          updated_at,
          rate,
          reorder_quantity,
          roll_width,
          purchase_rate,
          suppliers (
            id,
            name,
            contact_person,
            email,
            phone,
            address
          )
        `)
        // Only show active (non-deleted) items
        .eq('is_deleted', false);
      
      if (searchTerm) {
        query = query.or(
          `material_name.ilike.%${searchTerm}%,color.ilike.%${searchTerm}%`
        );
      }
      
      // Add pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      query = query
        .order('created_at', { ascending: false })
        .range(from, to);
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching inventory:", error);
        throw error;
      }
      
      console.log(`Fetched ${data?.length || 0} inventory items`);
      return data;
    },
    // Use staleTime and refetchOnMount settings instead of keepPreviousData/placeholderData
    staleTime: 5000,
    refetchOnMount: true
  });

  // Also fetch transaction counts for each material
  const { data: transactionCounts } = useQuery({
    queryKey: ['inventory-transactions-count'],
    queryFn: async () => {
      console.log("Fetching transaction counts...");
      const { data, error } = await supabase
        .from('inventory_transactions')
        .select('material_id')
        .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
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
    
    // Get deletion preview
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: preview, error } = await (supabase.rpc as any)('preview_inventory_hard_deletion', {
        input_inventory_id: id
      });
      
      if (error) {
        console.error("Error getting deletion preview:", error);
      } else {
        setDeletionPreview(preview as DeletionPreview);
      }
    } catch (error) {
      console.error("Error getting deletion preview:", error);
    }
    
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingStockId) return;
    
    setIsDeleting(true);
    try {
      console.log(`Attempting to hard-delete inventory item: ${deletingStockId}`);
      
      // Use the new hard delete function with consumption preservation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('hard_delete_inventory_with_consumption_preserve', {
        input_inventory_id: deletingStockId
      });

      if (error) {
        console.error("Error hard-deleting inventory item:", error);
        showToast({
          title: "Hard delete failed",
          description: error.message,
          type: "error"
        });
        throw error;
      }

      const summary = (data as { message?: string })?.message || "Item has been hard deleted successfully";
      showToast({
        title: "Inventory item hard deleted",
        description: summary,
        type: "success"
      });
      
      // Refresh inventory data
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      
      // Also refresh transaction counts
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions-count'] });
      
    } catch (error) {
      console.error("Unexpected error during deletion:", error);
      // Error already shown in toast messages above
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setDeletingStockId(null);
      setHasTransactions(false);
      setDeletionPreview(null);
    }
  };

  // Function to initiate deletion process from detail dialog
  const handleInitiateDelete = async (stockId: string) => {
    if (!stockId) return;
    
    // Check if this inventory has transactions
    const hasRelatedTransactions = await checkForTransactions(stockId);
    setHasTransactions(hasRelatedTransactions);
    setDeleteWithTransactions(false);
    
    // Get deletion preview
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: preview, error } = await (supabase.rpc as any)('preview_inventory_hard_deletion', {
        input_inventory_id: stockId
      });
      
      if (error) {
        console.error("Error getting deletion preview:", error);
      } else {
        setDeletionPreview(preview as DeletionPreview);
      }
    } catch (error) {
      console.error("Error getting deletion preview:", error);
    }
    
    // Set the ID of the stock item to delete
    setDeletingStockId(stockId);
    
    // Open the delete confirmation dialog
    setIsDeleteDialogOpen(true);
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / pageSize);
  
  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 slide-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <span className="h-6 w-1.5 rounded-full bg-primary inline-block"></span>
            Inventory Stock
          </h1>
          <p className="text-muted-foreground mt-1">Manage your raw materials and inventory</p>
        </div>
        
        <div className="flex items-center gap-3 scale-in" style={{animationDelay: '0.1s'}}>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            className="border-border/60 shadow-sm transition-all"
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
          
          <Button 
            onClick={() => navigate('/inventory/stock/new')}
            className="shadow-sm transition-all font-medium"
          >
            <Plus size={16} className="mr-2" />
            Add Stock
          </Button>
        </div>
      </div>

      <Card className="border-border/60 shadow-sm fade-in overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl">
            <span className="h-5 w-1 rounded-full bg-primary inline-block"></span>
            All Materials
            {!isLoading && inventoryData && (
              <Badge 
                variant="outline" 
                className="ml-2 bg-muted/50 text-foreground/80 hover:bg-muted transition-colors border-border/40 shadow-sm"
              >
                <Box className="h-3 w-3 mr-1 text-primary" />
                {totalCount} {totalCount === 1 ? 'item' : 'items'}
              </Badge>
            )}
          </CardTitle>
          <CardDescription className="mt-1">View and manage all your raw materials and stock</CardDescription>
          
          <div className="mt-4 flex gap-2 flex-col sm:flex-row sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Input
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1); // Reset to first page when search term changes
                }}
                className="pl-9 border-border/60 focus:border-primary/60"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="flex items-center gap-2">
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setPage(1); // Reset to first page when page size changes
                }}
              >
                <SelectTrigger className="w-[110px]">
                  <SelectValue placeholder="Items per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center p-16 slide-up" style={{animationDelay: '0.2s'}}>
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mb-4"></div>
              <p className="text-muted-foreground">Loading inventory...</p>
            </div>
          ) : inventoryData?.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center bg-muted/20 dark:bg-muted/10 rounded-b-xl slide-up" style={{animationDelay: '0.2s'}}>
              <div className="w-16 h-16 mb-4 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary">
                <Layers className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {searchTerm ? 'No matching items found' : 'No inventory items'}
              </h3>
              <p className="text-muted-foreground max-w-md mb-6">
                {searchTerm 
                  ? `No materials match your search term "${searchTerm}". Try another search or clear the filter.` 
                  : 'You haven\'t added any materials to your inventory yet. Add your first material to get started.'}
              </p>
              {searchTerm && (
                <Button 
                  variant="outline" 
                  onClick={() => setSearchTerm('')} 
                  className="text-primary hover:bg-primary/5"
                >
                  <FileCheck className="h-4 w-4 mr-2" />
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border-t border-border/40 overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50 dark:bg-muted/20">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-medium">Material Name</TableHead>
                    <TableHead className="font-medium">Color</TableHead>
                    <TableHead className="font-medium">GSM</TableHead>
                    <TableHead className="font-medium text-right">Quantity</TableHead>
                    <TableHead className="font-medium">Unit</TableHead>
                    {inventoryData?.some(item => item.alternate_unit) && (
                      <TableHead className="font-medium">Alt. Quantity</TableHead>
                    )}
                    {inventoryData?.some(item => item.track_cost) && (
                      <>
                        <TableHead className="font-medium text-right">Purchase Price</TableHead>
                        <TableHead className="font-medium text-right">Selling Price</TableHead>
                      </>
                    )}
                    <TableHead className="font-medium">Supplier</TableHead>
                    <TableHead className="font-medium">Activity</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryData?.map((item, index) => (
                    <TableRow
                      key={item.id}
                      className={`cursor-pointer hover:bg-muted/40 dark:hover:bg-muted/20 transition-colors ${recentlyUpdatedItems.includes(item.id) ? 'bg-amber-50/70 hover:bg-amber-100/70 dark:bg-amber-900/20 dark:hover:bg-amber-900/30 border-l-2 border-l-amber-400' : ''}`}
                      onClick={() => handleStockClick(item.id)}
                      style={{animationDelay: `${0.05 * index}s`}}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className={`${recentlyUpdatedItems.includes(item.id) ? 'text-amber-600 dark:text-amber-400' : 'text-primary'}`}>
                            {item.material_name}
                          </span>
                          {recentlyUpdatedItems.includes(item.id) && (
                            <Badge 
                              variant="outline" 
                              className="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-700/30 text-[10px] px-1 py-0 h-4"
                            >
                              NEW
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.color ? (
                          <Badge variant="outline" className="bg-muted/30 dark:bg-muted/20 hover:bg-muted/50 border-border/60 text-xs font-normal">
                            {item.color}
                          </Badge>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{item.gsm || '—'}</TableCell>
                      <TableCell className="text-right font-medium">{item.quantity.toLocaleString()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.unit}</TableCell>
                      {inventoryData?.some(item => item.alternate_unit) && (
                        <TableCell>
                          {item.alternate_unit && item.quantity && item.conversion_rate
                            ? <span className="text-sm">{(item.quantity * item.conversion_rate).toLocaleString()} <span className="text-muted-foreground">{item.alternate_unit}</span></span>
                            : <span className="text-muted-foreground">\u2014</span>}
                        </TableCell>
                      )}
                      {inventoryData?.some(item => item.track_cost) && (
                        <>
                          <TableCell className="text-right">
                            {item.track_cost 
                              ? <span className="font-medium text-blue-600 dark:text-blue-400">₹{item.purchase_price?.toFixed(2) || '0.00'}</span>
                              : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.track_cost && item.selling_price
                              ? <span className="font-medium text-green-600 dark:text-green-400">₹{item.selling_price.toFixed(2)}</span>
                              : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                        </>
                      )}
                      <TableCell>
                        {item.suppliers?.name ? (
                          <span className="text-sm truncate max-w-[120px] inline-block">{item.suppliers.name}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {transactionCounts && typeof transactionCounts === 'object' && item.id in transactionCounts ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="inline-flex items-center">
                                  <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-100 border-green-200 dark:border-green-700/30 shadow-sm">
                                    <History className="h-3 w-3 mr-1" />
                                    {transactionCounts[item.id]}
                                  </Badge>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="border-border/60 shadow-md">
                                <p className="text-xs">{transactionCounts[item.id]} transactions in the last 24 hours</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : recentlyUpdatedItems.includes(item.id) ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="inline-flex items-center">
                                  <Badge variant="secondary" className="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 hover:bg-amber-100 border-amber-200 dark:border-amber-700/30 animate-pulse shadow-sm">
                                    <Bell className="h-3 w-3 mr-1" />
                                    Updated
                                  </Badge>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="border-border/60 shadow-md">
                                <p className="text-xs">This material was recently updated</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : ("—")
                        }
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDeleteClick(e, item.id, item.material_name)}
                          className="h-8 w-8 p-0 hover:bg-destructive/10 dark:hover:bg-destructive/20 hover:text-destructive rounded-full transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Pagination UI */}
          {totalPages > 1 && (
            <div className="flex justify-center py-4 border-t border-border/40">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {[...Array(totalPages)].map((_, i) => {
                    // Show first, last, and a few around current page
                    const pageNum = i + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= page - 1 && pageNum <= page + 1)
                    ) {
                      return (
                        <PaginationItem key={i}>
                          <PaginationLink
                            onClick={() => setPage(pageNum)}
                            isActive={page === pageNum}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    
                    // Add ellipsis but only once between ranges
                    if (
                      (pageNum === 2 && page > 3) ||
                      (pageNum === totalPages - 1 && page < totalPages - 2)
                    ) {
                      return (
                        <PaginationItem key={i}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    
                    return null;
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock detail dialog */}
      {isDetailDialogOpen && selectedStockId && (
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
          initialTab={recentlyUpdatedItems.includes(selectedStockId) ? "transactions" : "details"}
        />
      )}

      {/* Delete confirmation dialog */}
      <DeleteStockDialog 
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        itemName="stock item"
        hasTransactions={hasTransactions}
        deleteWithTransactions={deleteWithTransactions}
        onToggleDeleteWithTransactions={setDeleteWithTransactions}
        deletionPreview={deletionPreview}
      />
    </div>
  );
};

export default StockList;
