
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

interface DeleteStockDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting?: boolean;
  itemName?: string;
  hasTransactions?: boolean;
  deleteWithTransactions?: boolean;
  onToggleDeleteWithTransactions?: (value: boolean) => void;
}

export const DeleteStockDialog = ({ 
  isOpen, 
  onOpenChange, 
  onConfirm,
  isDeleting = false,
  itemName = "this inventory item",
  hasTransactions = false,
  deleteWithTransactions = false,
  onToggleDeleteWithTransactions = () => {}
}: DeleteStockDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete {itemName}.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {hasTransactions && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 my-2">
            <div className="flex gap-2 items-start text-amber-700">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">This item has transaction history</p>
                <p className="text-sm text-amber-600">
                  Deleting this item requires deleting all related transaction records as well.
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
                Yes, delete all related transaction history
              </label>
            </div>
          </div>
        )}
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isDeleting || (hasTransactions && !deleteWithTransactions)}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
