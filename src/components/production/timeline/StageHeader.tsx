
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { StageIcon } from "./StageIcon";

interface StageHeaderProps {
  icon: React.ReactNode;
  title: string;
  count: number;
  onNewJob: () => void;
  disabled?: boolean;
}

export const StageHeader = ({ icon, title, count, onNewJob, disabled }: StageHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <StageIcon icon={icon} status={disabled ? 'disabled' : 'active'} />
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">
            {count ? `${count} job(s)` : "No jobs yet"}
          </p>
        </div>
      </div>
      <Button 
        size="sm"
        variant="outline"
        className="flex items-center gap-1"
        onClick={() => {
          onNewJob();
        }}
        disabled={disabled}
      >
        <Plus className="h-3 w-3" /> New Job
      </Button>
    </div>
  );
};
