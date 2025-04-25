
import { Button } from "@/components/ui/button";
import { Truck } from "lucide-react";
import { StageIcon } from "./StageIcon";

interface DispatchStageProps {
  isStitchingCompleted: boolean;
  onDispatchClick: () => void;
}

export const DispatchStage = ({ isStitchingCompleted, onDispatchClick }: DispatchStageProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <StageIcon 
          icon={<Truck className="h-5 w-5" />}
          status={!isStitchingCompleted ? 'disabled' : 'completed'}
        />
        <div>
          <p className="text-sm font-medium">Dispatch</p>
          <p className="text-xs text-muted-foreground">
            {!isStitchingCompleted ? (
              <span className="flex items-center gap-1 text-amber-500">
                Complete all stages first
              </span>
            ) : (
              "Final stage"
            )}
          </p>
        </div>
      </div>
      <Button 
        size="sm"
        variant="outline"
        onClick={onDispatchClick}
        disabled={!isStitchingCompleted}
      >
        View
      </Button>
    </div>
  );
};
