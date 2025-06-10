
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle } from "lucide-react";

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

interface DeleteStockDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting?: boolean;
  itemName?: string;
  hasTransactions?: boolean;
  deleteWithTransactions?: boolean;
  onToggleDeleteWithTransactions?: (value: boolean) => void;
  deletionPreview?: DeletionPreview | null;
}

export const DeleteStockDialog = ({ 
  isOpen, 
  onOpenChange, 
  onConfirm,
  isDeleting = false,
  itemName = "this inventory item",
  hasTransactions = false,
  deleteWithTransactions = false,
  onToggleDeleteWithTransactions = () => {},
  deletionPreview = null
}: DeleteStockDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>        <AlertDialogHeader>
          <AlertDialogTitle>Hard Delete Inventory Item</AlertDialogTitle>
          <AlertDialogDescription>
            This will <strong>completely delete</strong> {itemName} from the database. 
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {deletionPreview && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 my-2">
            <div className="flex gap-2 items-start text-blue-700">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="font-medium">Deletion Impact Preview</p>
                <div className="text-sm text-blue-600 space-y-1">
                  <p><strong>Will be deleted:</strong></p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li>Inventory item: {deletionPreview.material_name}</li>
                    <li>Non-consumption transactions: {deletionPreview.deletion_preview.will_be_deleted.non_consumption_transactions}</li>
                    <li>Catalog material references: {deletionPreview.deletion_preview.will_be_deleted.catalog_material_references}</li>
                  </ul>
                  
                  <p className="mt-2"><strong>Will be preserved:</strong></p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li>Consumption transactions: {deletionPreview.deletion_preview.will_be_preserved.consumption_transactions}</li>
                    <li>Purchase history: {deletionPreview.deletion_preview.will_be_preserved.purchase_history} records</li>
                    <li>Order history: {deletionPreview.deletion_preview.will_be_preserved.order_history} records</li>
                  </ul>
                  
                  {(deletionPreview.deletion_preview.will_be_modified.purchase_items_lose_material_ref > 0 || 
                    deletionPreview.deletion_preview.will_be_modified.order_components_lose_material_ref > 0) && (
                    <>
                      <p className="mt-2"><strong>Will lose material reference:</strong></p>
                      <ul className="list-disc list-inside ml-2 space-y-1">
                        {deletionPreview.deletion_preview.will_be_modified.purchase_items_lose_material_ref > 0 && (
                          <li>Purchase items: {deletionPreview.deletion_preview.will_be_modified.purchase_items_lose_material_ref}</li>
                        )}
                        {deletionPreview.deletion_preview.will_be_modified.order_components_lose_material_ref > 0 && (
                          <li>Order components: {deletionPreview.deletion_preview.will_be_modified.order_components_lose_material_ref}</li>
                        )}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {hasTransactions && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 my-2">
            <div className="flex gap-2 items-start text-amber-700">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Enhanced Hard Delete</p>
                <p className="text-sm text-amber-600">
                  This hard delete will completely remove the inventory item while preserving 
                  consumption transactions for audit trail. Purchase and order history will be 
                  maintained but will lose the material reference.
                </p>
              </div>
            </div>
            
            <div className="mt-3 flex items-center space-x-2">
              <Checkbox 
                id="delete-transactions"
                checked={deleteWithTransactions}
                onCheckedChange={(checked) => 
                  onToggleDeleteWithTransactions(checked === true)
                }
              />
              <label 
                htmlFor="delete-transactions" 
                className="text-sm font-medium leading-none text-amber-700 cursor-pointer"
              >
                I understand this is a hard delete with consumption preservation
              </label>
            </div>
          </div>
        )}
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>          <AlertDialogAction 
            onClick={onConfirm} 
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isDeleting || (hasTransactions && !deleteWithTransactions)}
          >
            {isDeleting ? 'Hard Deleting...' : 'Hard Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
