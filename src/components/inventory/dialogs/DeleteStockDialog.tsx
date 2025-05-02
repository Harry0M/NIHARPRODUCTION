
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
import { useState } from "react";

interface DeleteStockDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onForceDelete?: () => void; // Optional force delete handler
  isDeleting?: boolean;
}

export const DeleteStockDialog = ({ 
  isOpen, 
  onOpenChange, 
  onConfirm,
  onForceDelete,
  isDeleting = false
}: DeleteStockDialogProps) => {
  // Add state to track deletion attempts
  const [deleteFailed, setDeleteFailed] = useState(false);

  // Handle normal delete with failure tracking
  const handleConfirm = () => {
    setDeleteFailed(false); // Reset the failure state
    onConfirm();
    
    // If we have a force delete option, set a timeout to show it if the normal delete fails
    if (onForceDelete) {
      setTimeout(() => {
        setDeleteFailed(true);
      }, 3000);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this inventory item.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col sm:flex-row">
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm} 
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
          
          {/* Show force delete option if normal delete fails and onForceDelete is provided */}
          {deleteFailed && onForceDelete && (
            <AlertDialogAction 
              onClick={onForceDelete}
              className="bg-red-700 text-white hover:bg-red-800 mt-2 sm:mt-0"
              disabled={isDeleting}
            >
              Force Delete
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
