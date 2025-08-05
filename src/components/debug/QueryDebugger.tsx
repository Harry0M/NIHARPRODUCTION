import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Bug } from "lucide-react";

interface QueryDebuggerProps {
  queryKey: unknown[];
  enabled?: boolean;
}

export const QueryDebugger = ({ queryKey, enabled = true }: QueryDebuggerProps) => {
  const [showDebug, setShowDebug] = useState(false);
  
  // Get the query state without executing it
  const queryState = useQuery({
    queryKey: ['debug-info', ...queryKey],
    queryFn: () => null,
    enabled: false, // Don't execute, just get state
  });

  if (!enabled || !showDebug) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDebug(true)}
        className="fixed bottom-4 right-4 z-50 bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
      >
        <Bug className="h-4 w-4 mr-2" />
        Debug Query
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg border-orange-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bug className="h-4 w-4" />
            Query Debug Info
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDebug(false)}
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div>
          <strong>Query Key:</strong>
          <pre className="text-[10px] bg-muted p-2 rounded mt-1 overflow-auto max-h-20">
            {JSON.stringify(queryKey, null, 2)}
          </pre>
        </div>
        
        <div className="flex flex-wrap gap-1">
          <Badge variant={queryState.status === 'pending' ? 'default' : 'outline'}>
            Status: {queryState.status}
          </Badge>
          <Badge variant={queryState.isLoading ? 'default' : 'outline'}>
            Loading: {queryState.isLoading ? 'Yes' : 'No'}
          </Badge>
          <Badge variant={queryState.isFetching ? 'default' : 'outline'}>
            Fetching: {queryState.isFetching ? 'Yes' : 'No'}
          </Badge>
        </div>

        <div className="text-[10px] space-y-1">
          <div><strong>Has Data:</strong> {queryState.data ? 'Yes' : 'No'}</div>
          <div><strong>Has Error:</strong> {queryState.error ? 'Yes' : 'No'}</div>
          <div><strong>Fetch Status:</strong> {queryState.fetchStatus}</div>
          <div><strong>Stale:</strong> {queryState.isStale ? 'Yes' : 'No'}</div>
        </div>

        {queryState.error && (
          <div className="text-red-600 text-[10px]">
            <strong>Error:</strong>
            <pre className="bg-red-50 p-1 rounded mt-1 overflow-auto max-h-16">
              {JSON.stringify(queryState.error, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
