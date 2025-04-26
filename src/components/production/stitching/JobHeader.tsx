
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface JobHeaderProps {
  onBack: () => void;
}

export const JobHeader = ({ onBack }: JobHeaderProps) => {
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
        <h1 className="text-3xl font-bold tracking-tight">Stitching Job</h1>
        <p className="text-muted-foreground">Manage stitching job details</p>
      </div>
    </div>
  );
};
