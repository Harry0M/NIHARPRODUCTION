
import { Loader2 } from "lucide-react";

export const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-[50vh]">
    <div className="flex flex-col items-center gap-2">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="text-muted-foreground">Loading production data...</p>
    </div>
  </div>
);
