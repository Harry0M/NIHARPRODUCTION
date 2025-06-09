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
import { Loader2 } from "lucide-react";

interface DeletePurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
  purchaseNumber?: string;
  status?: string;
}

export const DeletePurchaseDialog = ({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  purchaseNumber,
  status
}: DeletePurchaseDialogProps) => {
  const isCompleted = status === 'completed';

  return (
    <AlertDialog open={open} onOpenChange={isLoading ? undefined : onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete this purchase?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                This will permanently delete purchase {purchaseNumber && `"${purchaseNumber}"`} and all associated purchase items. 
                This action cannot be undone.
              </p>
              {isCompleted && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
                  <p className="text-amber-800 font-medium">
                    ⚠️ Inventory Impact
                  </p>
                  <p className="text-amber-700 text-sm mt-1">
                    This purchase is marked as "completed". Deleting it will automatically reverse any inventory 
                    additions that were made when the purchase was completed. Material quantities will be reduced 
                    accordingly.
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Purchase"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
