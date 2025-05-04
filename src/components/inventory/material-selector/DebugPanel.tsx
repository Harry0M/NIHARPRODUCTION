
import { AlertCircle } from "lucide-react";

interface DebugPanelProps {
  debugMode: boolean;
  debugInfo: any;
}

export const DebugPanel = ({ debugMode, debugInfo }: DebugPanelProps) => {
  if (!debugMode || !debugInfo) return null;
  
  return (
    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm">
      <div className="flex items-start gap-2 mb-2">
        <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
        <div className="font-medium text-amber-800">Debug Information</div>
      </div>
      <pre className="text-xs overflow-auto max-h-40 bg-white p-2 rounded">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  );
};
