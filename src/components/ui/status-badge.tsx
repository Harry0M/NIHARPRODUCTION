
import { Check, Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusType = "completed" | "in_progress" | "pending" | "cancelled";

interface StatusBadgeProps {
  status: StatusType;
  withAnimation?: boolean;
  className?: string;
}

export function StatusBadge({ status, withAnimation = true, className }: StatusBadgeProps) {
  const getStatusConfig = (status: StatusType) => {
    switch (status) {
      case "completed":
        return {
          icon: Check,
          className: "bg-green-100 text-green-800 border-green-200",
        };
      case "in_progress":
        return {
          icon: Clock,
          className: "bg-amber-100 text-amber-800 border-amber-200",
        };
      case "cancelled":
        return {
          icon: AlertTriangle,
          className: "bg-red-100 text-red-800 border-red-200",
        };
      default:
        return {
          icon: Clock,
          className: "bg-gray-100 text-gray-800 border-gray-200",
        };
    }
  };

  const { icon: Icon, className: statusClassName } = getStatusConfig(status);

  return (
    <Badge
      variant="outline"
      className={cn(
        "flex items-center gap-1 capitalize transition-all duration-200",
        statusClassName,
        withAnimation && status === "in_progress" && "animate-pulse",
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
