
import { toast } from "@/hooks/use-toast";
import { Check, X, AlertTriangle, Info } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface ShowToastOptions {
  title: string;
  description?: string;
  type?: ToastType;
}

export const showToast = ({ title, description, type = "info" }: ShowToastOptions) => {
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

  toast({
    title: (
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${className}`} />
        {title}
      </div>
    ),
    description: description,
    className: "animate-in slide-in-from-top-full duration-300",
  });
};
