
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

interface JobCardDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deleteLoading: boolean;
  onDelete: () => void;
}

const JobCardDeleteDialog = ({
  open,
  onOpenChange,
  deleteLoading,
  onDelete
}: JobCardDeleteDialogProps) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    onDelete();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete this job card?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              This will permanently delete the job card and all associated cutting, printing, and stitching jobs.
            </p>
            <p className="text-orange-600 dark:text-orange-400 font-medium">
              ⚠️ Material consumption will be automatically reversed and inventory quantities will be restored.
            </p>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={deleteLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteLoading ? "Deleting..." : "Delete Job Card"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default JobCardDeleteDialog;
