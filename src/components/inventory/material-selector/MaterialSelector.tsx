import React, { useState } from "react";
import { useInventoryItems } from "@/hooks/use-catalog-products";
import { MaterialSearchBar } from "./MaterialSearchBar";
import { MaterialGrid } from "./MaterialGrid";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent as BaseDialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Plus } from "lucide-react";
import PaginationControls from "@/components/ui/pagination-controls";
import { StockFormDialog } from "../StockFormDialog";

// Custom DialogContent without animations
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

interface MaterialSelectorProps {
  onMaterialSelect: (materialId: string | null) => void;
  selectedMaterialId: string | null;
  componentType: string;
}

export const MaterialSelector = ({ 
  onMaterialSelect, 
  selectedMaterialId,
  componentType
}: MaterialSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [stockFormOpen, setStockFormOpen] = useState(false);
  
  const { data: materials = [], isLoading, refetch } = useInventoryItems();
  
  const filteredMaterials = materials.filter(material => {
    const searchLower = searchQuery.toLowerCase();
    return (
      material.material_name.toLowerCase().includes(searchLower) || 
      (material.color && material.color.toLowerCase().includes(searchLower)) ||
      (material.gsm && material.gsm?.toString().toLowerCase().includes(searchLower))
    );
  });

  // Calculate pagination
  const totalItems = filteredMaterials.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedMaterials = filteredMaterials.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const handleDialogOpen = () => {
    setDialogOpen(true);
    setPage(1); // Reset to first page when opening
  };
  
  const handleDialogClose = () => {
    setDialogOpen(false);
  };
  
  const clearMaterial = () => {
    onMaterialSelect(null);
  };
  
  const handleConfirmSelection = () => {
    setDialogOpen(false);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when changing page size
  };
  
  const handleCreateStockButtonClick = () => {
    setStockFormOpen(true);
  };
  
  const handleStockCreated = async (stockId: string) => {
    // Refetch materials to get the newly created item
    await refetch();
    // Select the newly created material
    onMaterialSelect(stockId);
    // Close the stock form dialog
    setStockFormOpen(false);
    // Close the material selector dialog
    setDialogOpen(false);
  };
  
  // Find the selected material to display its name
  const selectedMaterial = materials.find(m => m.id === selectedMaterialId);

  return (
    <div className="space-y-3 mt-2">
      <div className="flex flex-wrap gap-2">
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={handleDialogOpen}
        >
          Link Material
        </Button>
        
        {selectedMaterialId && (
          <>
            <Button 
              type="button" 
              variant="destructive" 
              size="sm"
              onClick={clearMaterial}
            >
              Clear Selection
            </Button>
            
            <div className="ml-2 flex items-center">
              <span className="text-sm font-medium">Selected: </span>
              <span className="ml-1 text-sm text-blue-600">
                {selectedMaterial?.material_name || 'Unknown material'}
              </span>
            </div>
          </>
        )}
      </div>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Select Material for {componentType}</DialogTitle>
          </DialogHeader>
          
          <div className="my-4 flex justify-between items-center">
            <div className="flex-1 mr-4">
              <MaterialSearchBar 
                searchQuery={searchQuery} 
                setSearchQuery={setSearchQuery}
                placeholder="Search for a material..." 
              />
            </div>            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCreateStockButtonClick}
              className="whitespace-nowrap"
            >
              <Plus className="h-4 w-4 mr-1" /> Create New Item
            </Button>
          </div>
          
          <div className="my-4">
            <MaterialGrid 
              isLoading={isLoading}
              filteredMaterials={paginatedMaterials}
              selectedMaterialId={selectedMaterialId}
              setSelectedMaterialId={onMaterialSelect}
              maxHeight="max-h-[60vh]"
            />
          </div>
          
          {totalPages > 1 && (
            <div className="my-2">
              <PaginationControls
                currentPage={page}
                totalPages={totalPages}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                totalCount={totalItems}
                pageSizeOptions={[5, 10, 20, 50]}
                showPageSizeSelector={true}
              />
            </div>
          )}
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleDialogClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmSelection}
            >
              Confirm Selection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <StockFormDialog
        open={stockFormOpen}
        onOpenChange={setStockFormOpen}
        onStockCreated={handleStockCreated}
      />
    </div>
  );
};
