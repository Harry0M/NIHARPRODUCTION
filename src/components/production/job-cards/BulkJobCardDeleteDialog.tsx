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

interface BulkJobCardDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deleteLoading: boolean;
  onDelete: () => void;
  jobCardCount: number;
}

const BulkJobCardDeleteDialog = ({
  open,
  onOpenChange,
  deleteLoading,
  onDelete,
  jobCardCount
}: BulkJobCardDeleteDialogProps) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    onDelete();
  };

  return (
    <AlertDialog open={open} onOpenChange={deleteLoading ? undefined : onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete {jobCardCount} job cards?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete {jobCardCount} job cards and all associated cutting, printing, and stitching jobs.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={deleteLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting {jobCardCount} job cards...
              </>
            ) : (
              `Delete ${jobCardCount} Job Cards`
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default BulkJobCardDeleteDialog;
