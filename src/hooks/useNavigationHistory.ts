import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface HistoryEntry {
  path: string;
  timestamp: number;
  title?: string;
}

export const useNavigationHistory = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const location = useLocation();
  const navigate = useNavigate();

  // Track route changes
  useEffect(() => {
    const newEntry: HistoryEntry = {
      path: location.pathname + location.search,
      timestamp: Date.now(),
      title: document.title || getRouteTitle(location.pathname)
    };

    setHistory(prev => {
      // If we're navigating to a new route (not using back/forward)
      if (currentIndex === prev.length - 1 || currentIndex === -1) {
        // Don't add duplicate consecutive entries
        if (prev.length > 0 && prev[prev.length - 1].path === newEntry.path) {
          return prev;
        }
        
        const newHistory = [...prev, newEntry];
        // Keep only last 50 entries to prevent memory issues
        const trimmedHistory = newHistory.slice(-50);
        setCurrentIndex(trimmedHistory.length - 1);
        return trimmedHistory;
      } else {
        // If we're using back/forward, update current index
        const existingIndex = prev.findIndex(entry => entry.path === newEntry.path);
        if (existingIndex !== -1) {
          setCurrentIndex(existingIndex);
          return prev;
        }
        
        // If the path doesn't exist in history, add it
        const newHistory = [...prev.slice(0, currentIndex + 1), newEntry];
        const trimmedHistory = newHistory.slice(-50);
        setCurrentIndex(trimmedHistory.length - 1);
        return trimmedHistory;
      }
    });
  }, [location.pathname, location.search, currentIndex]);

  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < history.length - 1;

  const goBack = () => {
    if (canGoBack) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      navigate(history[newIndex].path);
    }
  };

  const goForward = () => {
    if (canGoForward) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      navigate(history[newIndex].path);
    }
  };

  const goToHistoryEntry = (index: number) => {
    if (index >= 0 && index < history.length) {
      setCurrentIndex(index);
      navigate(history[index].path);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    setCurrentIndex(-1);
  };

  return {
    history,
    currentIndex,
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    goToHistoryEntry,
    clearHistory
  };
};

// Helper function to get a readable title for routes
const getRouteTitle = (pathname: string): string => {
  const routeTitles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/orders': 'Orders',
    '/orders/new': 'New Order',
    '/production': 'Production',
    '/production/job-cards': 'Job Cards',
    '/production/job-cards/new': 'New Job Card',
    '/production/cutting': 'Cutting Jobs',
    '/production/printing': 'Printing Jobs',
    '/production/stitching': 'Stitching Jobs',
    '/inventory': 'Inventory',
    '/inventory/new': 'New Inventory Item',
    '/partners': 'Partners',
    '/vendors': 'Vendors',
    '/vendors/new': 'New Vendor',
    '/suppliers': 'Suppliers',
    '/suppliers/new': 'New Supplier',
    '/purchases': 'Purchases',
    '/companies': 'Companies',
    '/analysis': 'Analysis',
    '/dispatch': 'Dispatch',
    '/settings': 'Settings',
    '/settings/users': 'User Management',
    '/settings/role': 'Role Assignment'
  };

  // Check for exact match first
  if (routeTitles[pathname]) {
    return routeTitles[pathname];
  }

  // Check for partial matches
  for (const route in routeTitles) {
    if (pathname.startsWith(route) && route !== '/') {
      return routeTitles[route];
    }
  }

  // Fallback: capitalize the last segment
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0) {
    const lastSegment = segments[segments.length - 1];
    return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ');
  }

  return 'Page';
};
