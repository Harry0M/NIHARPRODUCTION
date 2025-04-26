
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface CuttingJobHeaderProps {
  onBack: () => void;
}

export const CuttingJobHeader = ({ onBack }: CuttingJobHeaderProps) => {
  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="ghost" 
        size="sm" 
        className="gap-1"
        onClick={onBack}
      >
        <ArrowLeft size={16} />
        Back
      </Button>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cutting Job</h1>
        <p className="text-muted-foreground">Manage cutting job details</p>
      </div>
    </div>
  );
};
