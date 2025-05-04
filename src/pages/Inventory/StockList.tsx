import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
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

  const { data: stock, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*, suppliers(name)');
      
      if (error) throw error;
      return data;
    },
  });

  const handleStockClick = (id: string) => {
    setSelectedStockId(id);
    setIsDetailDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDetailDialogOpen(false);
    setSelectedStockId(null);
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
          <div className="rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stock?.map((item) => (
                <TableRow 
                  key={item.id}
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleStockClick(item.id)}
                >
                  <TableCell>{item.material_name}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <StockDetailDialog 
        stockId={selectedStockId}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        onEdit={() => navigate(`/inventory/stock/${selectedStockId}/edit`)}
        onDelete={() => {
          if (selectedStockId) {
            handleInitiateDelete(selectedStockId);
          }
        }}
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
