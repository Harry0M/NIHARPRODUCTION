import React from 'react';
import { ChevronLeft, ChevronRight, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useNavigationHistory } from '@/hooks/useNavigationHistory';
import { formatDistanceToNow } from 'date-fns';

interface NavigationHistoryProps {
  className?: string;
}

export const NavigationHistory: React.FC<NavigationHistoryProps> = ({ className }) => {
  const {
    history,
    currentIndex,
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    goToHistoryEntry,
    clearHistory
  } = useNavigationHistory();

  if (history.length === 0) {
    return null;
  }

  const getCurrentPageTitle = () => {
    if (currentIndex >= 0 && currentIndex < history.length) {
      return history[currentIndex].title || 'Current Page';
    }
    return 'Current Page';
  };

  const formatTime = (timestamp: number) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* Back Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={goBack}
        disabled={!canGoBack}
        title={canGoBack ? `Go back to ${history[currentIndex - 1]?.title}` : 'No previous page'}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Forward Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={goForward}
        disabled={!canGoForward}
        title={canGoForward ? `Go forward to ${history[currentIndex + 1]?.title}` : 'No next page'}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* History Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="View navigation history"
          >
            <Clock className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between px-2 py-2">
            <DropdownMenuLabel className="p-0">Navigation History</DropdownMenuLabel>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {history.length} {history.length === 1 ? 'page' : 'pages'}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={clearHistory}
                title="Clear history"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <DropdownMenuSeparator />
          
          {/* History Items */}
          <div className="max-h-72 overflow-y-auto">
            {history.map((entry, index) => {
              const isCurrent = index === currentIndex;
              const isVisited = index <= currentIndex;
              
              return (
                <DropdownMenuItem
                  key={`${entry.path}-${entry.timestamp}`}
                  className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${
                    isCurrent 
                      ? 'bg-accent/50 border-l-4 border-primary' 
                      : isVisited 
                        ? 'opacity-100' 
                        : 'opacity-60'
                  }`}
                  onClick={() => goToHistoryEntry(index)}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`font-medium text-sm truncate ${isCurrent ? 'text-primary' : ''}`}>
                      {entry.title}
                    </span>
                    {isCurrent && (
                      <Badge variant="default" className="text-xs ml-2 shrink-0">
                        Current
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                    <span className="truncate mr-2">{entry.path}</span>
                    <span className="shrink-0">{formatTime(entry.timestamp)}</span>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </div>

          {history.length > 10 && (
            <>
              <DropdownMenuSeparator />
              <div className="px-3 py-2 text-xs text-muted-foreground">
                Showing {history.length} recent pages
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
