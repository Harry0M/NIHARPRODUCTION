
import { Wifi, WifiOff } from "lucide-react";
import { useOfflineStatus } from "@/hooks/use-offline-status";
import { cn } from "@/lib/utils";

interface OfflineStatusIndicatorProps {
  className?: string;
}

export function OfflineStatusIndicator({ className }: OfflineStatusIndicatorProps) {
  const { isOnline, wasOffline } = useOfflineStatus();

  if (isOnline && !wasOffline) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-md p-2 text-sm transition-all animate-in slide-in-from-bottom-5",
        isOnline
          ? "bg-green-100 text-green-800 border border-green-200"
          : "bg-orange-100 text-orange-800 border border-orange-200",
        className
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4" />
          <span>Back online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span>You are offline. Some features may not work.</span>
        </>
      )}
    </div>
  );
}
