
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Plus, SearchIcon, DownloadIcon, RefreshCw, FilePlus } from "lucide-react";
import { useInventoryStocks } from "@/hooks/inventory/useInventoryStocks";
import { StockTable } from "@/components/inventory/StockTable";
import { EmptyStockState } from "@/components/inventory/EmptyStockState";
import { StockFilter } from "@/components/inventory/StockFilter";
import { Card, CardContent } from "@/components/ui/card";
import { StockDetailDialog } from "@/components/inventory/StockDetailDialog";
import { DeleteStockDialog } from "@/components/inventory/dialogs/DeleteStockDialog";
import { useDeleteInventoryItem } from "@/hooks/inventory/useDeleteInventoryItem";
import { useNavigate } from "react-router-dom";
import { showToast } from "@/components/ui/enhanced-toast";

export default function StockList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedStockId, setSelectedStockId] = useState<string | null>(null);
  const [initialTab, setInitialTab] = useState<string>("details");
  
  const { 
    isDeleteDialogOpen, 
    setIsDeleteDialogOpen, 
    deleteWithTransactions, 
    setDeleteWithTransactions, 
    itemToDelete, 
    confirmDeleteItem,
    openDeleteDialog, 
    isDeleting 
  } = useDeleteInventoryItem();

  const {
    stocks,
    isLoading,
    error,
    refresh,
    isRefreshing,
    currentFilters,
    setFilter,
    hasFilters,
    resetFilters,
  } = useInventoryStocks({ 
    search 
  });

  const handleViewDetail = (id: string, tab: string = "details") => {
    setSelectedStockId(id);
    setInitialTab(tab);
    setIsViewDialogOpen(true);
  };

  const handleEditStock = () => {
    if (selectedStockId) {
      navigate(`/inventory/stock/${selectedStockId}/edit`);
      setIsViewDialogOpen(false);
    }
  };

  const handleDeleteStock = () => {
    if (selectedStockId && stocks) {
      const stockToDelete = stocks.find(s => s.id === selectedStockId);
      if (stockToDelete) {
        // Check if the item has transactions
        const hasTransactions = stockToDelete.transactionCount && stockToDelete.transactionCount > 0;
        
        // Open the delete dialog
        openDeleteDialog({
          id: stockToDelete.id,
          name: stockToDelete.material_name,
          hasTransactions
        });
        
        setIsViewDialogOpen(false);
      }
    }
  };

  useEffect(() => {
    // Check if there's a highlight material ID from URL search params
    const params = new URLSearchParams(window.location.search);
    const highlightId = params.get('highlight');
    const showTransaction = params.get('show_transactions') === 'true';
    
    if (highlightId) {
      handleViewDetail(highlightId, showTransaction ? "transactions" : "details");
      
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleRefresh = () => {
    refresh();
    showToast({
      title: "Refreshed",
      description: "Inventory data has been refreshed",
      type: "info",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search inventory..."
              className="w-full pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/inventory/stock/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Stock
            </Link>
          </Button>
          <Button variant="outline">
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline">
            <FilePlus className="mr-2 h-4 w-4" />
            Import
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1">
          <StockFilter 
            filters={currentFilters}
            onFilterChange={setFilter}
            hasFilters={hasFilters}
            onReset={resetFilters}
          />
        </div>
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center">Loading inventory...</div>
              ) : error ? (
                <div className="p-8 text-center text-red-500">
                  Error loading inventory: {error.message}
                </div>
              ) : stocks && stocks.length > 0 ? (
                <StockTable
                  stocks={stocks}
                  onViewDetail={handleViewDetail}
                />
              ) : (
                <EmptyStockState />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stock Detail Dialog */}
      <StockDetailDialog
        stockId={selectedStockId}
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        onEdit={handleEditStock}
        onDelete={handleDeleteStock}
        initialTab={initialTab}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteStockDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDeleteItem}
        isDeleting={isDeleting}
        itemName={itemToDelete?.name || "this inventory item"}
        hasTransactions={itemToDelete?.hasTransactions || false}
        deleteWithTransactions={deleteWithTransactions}
        onToggleDeleteWithTransactions={setDeleteWithTransactions}
      />
    </div>
  );
}
