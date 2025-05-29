
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  text?: string;
  fullHeight?: boolean;
}

export const LoadingSpinner = ({ 
  className, 
  text = "Loading production data...", 
  fullHeight = true 
}: LoadingSpinnerProps) => (
  <div className={cn(
    "flex justify-center items-center", 
    fullHeight && "h-[50vh]",
    className
  )}>
    <div className="flex flex-col items-center gap-2">
      <div className={cn("animate-spin rounded-full border-b-2 border-primary", className || "h-12 w-12")}></div>
      {text && <p className="text-muted-foreground">{text}</p>}
    </div>
  </div>
);
