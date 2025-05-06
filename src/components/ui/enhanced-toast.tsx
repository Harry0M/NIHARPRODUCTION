import { toast } from "@/hooks/use-toast";
import { Check, X, AlertTriangle, Info } from "lucide-react";
import { ReactNode } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface ShowToastOptions {
  title: string | ReactNode;
  description?: string;
  type?: ToastType;
  duration?: number;
}

export const showToast = ({ title, description, type = "info", duration }: ShowToastOptions) => {
  const getToastConfig = (type: ToastType) => {
    switch (type) {
      case "success":
        return {
          icon: Check,
          className: "text-green-600",
        };
      case "error":
        return {
          icon: X,
          className: "text-red-600",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          className: "text-amber-600",
        };
      default:
        return {
          icon: Info,
          className: "text-blue-600",
        };
    }
  };

  const { icon: Icon, className } = getToastConfig(type);

  // Convert the title to a React node if it's a string,
  // otherwise use it as is
  const titleContent = typeof title === "string" 
    ? (
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${className}`} />
          {title}
        </div>
      ) 
    : title;

  return toast({
    // Explicitly cast 'titleContent' to a type that the toast function accepts
    // by using it as the direct title property
    title: titleContent,
    description: description,
    duration: duration
  } as any); // Using 'as any' to bypass the strict type checking temporarily
}
