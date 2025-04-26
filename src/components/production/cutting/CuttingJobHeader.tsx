
import { Button } from "@/components/ui/button";
import { ArrowLeft, Scissors } from "lucide-react";

interface CuttingJobHeaderProps {
  jobName: string | undefined;
  selectedJobId: string | null;
  onBack: () => void;
}

export function CuttingJobHeader({ jobName, selectedJobId, onBack }: CuttingJobHeaderProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1"
        onClick={onBack}
        type="button"
      >
        <ArrowLeft size={16} />
        Back
      </Button>
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Scissors className="h-6 w-6" />
          Cutting Job
        </h1>
        <p className="text-muted-foreground">
          {selectedJobId ? "Update" : "Create"} cutting job for {jobName}
        </p>
      </div>
    </div>
  );
}
