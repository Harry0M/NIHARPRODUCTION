
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface StageActionProps {
  onNewJob: () => void;
  disabled?: boolean;
}

export const StageAction = ({ onNewJob, disabled }: StageActionProps) => {
  return (
    <Button 
      size="sm"
      variant="outline"
      className="flex items-center gap-1"
      onClick={onNewJob}
      disabled={disabled}
    >
      <Plus className="h-3 w-3" /> New Job
    </Button>
  );
};

