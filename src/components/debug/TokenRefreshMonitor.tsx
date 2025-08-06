import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, RefreshCw, Clock, LucideIcon } from 'lucide-react';

export const TokenRefreshMonitor: React.FC = () => {
  const { 
    session, 
    user, 
    userRole, 
    permissions, 
    isTokenExpired, 
    refreshSession, 
    loading 
  } = useAuth();
  
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Calculate time left until token expiry
  useEffect(() => {
    if (!session) {
      setTimeLeft(null);
      return;
    }

    const updateTimeLeft = () => {
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = session.expires_at || 0;
      const remaining = expiresAt - now;
      setTimeLeft(remaining);
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [session]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshSession();
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Manual refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return '00:00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTokenStatus = (): { color: 'default' | 'secondary' | 'destructive' | 'outline', text: string, icon: LucideIcon } => {
    if (!session) return { color: 'secondary', text: 'No Session', icon: AlertCircle };
    if (isTokenExpired) return { color: 'destructive', text: 'Expiring Soon', icon: AlertCircle };
    if (timeLeft && timeLeft > 600) return { color: 'default', text: 'Valid', icon: CheckCircle };
    if (timeLeft && timeLeft > 300) return { color: 'secondary', text: 'Warning', icon: AlertCircle };
    return { color: 'destructive', text: 'Critical', icon: AlertCircle };
  };

  const tokenStatus = getTokenStatus();

  if (loading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading Auth State...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Token Refresh Monitor
        </CardTitle>
        <CardDescription>
          Monitor authentication token status and refresh functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Session Status:</span>
          <Badge variant={tokenStatus.color} className="flex items-center gap-1">
            <tokenStatus.icon className="h-3 w-3" />
            {tokenStatus.text}
          </Badge>
        </div>

        {/* User Info */}
        {user && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">User:</span>
              <span className="text-sm text-muted-foreground">{user.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Role:</span>
              <Badge variant="outline">{userRole}</Badge>
            </div>
          </div>
        )}

        {/* Token Expiry */}
        {timeLeft !== null && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Time Until Expiry:</span>
              <span className={`text-sm font-mono ${
                timeLeft < 300 ? 'text-red-500' : 
                timeLeft < 600 ? 'text-yellow-500' : 
                'text-green-500'
              }`}>
                {formatTime(timeLeft)}
              </span>
            </div>
            
            {isTokenExpired && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2">
                <div className="flex items-center gap-2 text-yellow-800 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Token expires in less than 5 minutes
                </div>
              </div>
            )}
          </div>
        )}

        {/* Last Refresh */}
        {lastRefresh && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Last Manual Refresh:</span>
            <span className="text-sm text-muted-foreground">
              {lastRefresh.toLocaleTimeString()}
            </span>
          </div>
        )}

        {/* Refresh Button */}
        <Button 
          onClick={handleManualRefresh}
          disabled={refreshing || !session}
          className="w-full"
          variant="outline"
        >
          {refreshing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Token
            </>
          )}
        </Button>

        {/* Permissions Summary */}
        {session && (
          <div className="border-t pt-3">
            <span className="text-sm font-medium">Key Permissions:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {permissions.canManageUsers && (
                <Badge variant="secondary" className="text-xs">Manage Users</Badge>
              )}
              {permissions.canAccessOrders && (
                <Badge variant="secondary" className="text-xs">Orders</Badge>
              )}
              {permissions.canAccessInventory && (
                <Badge variant="secondary" className="text-xs">Inventory</Badge>
              )}
              {permissions.canAccessAnalysis && (
                <Badge variant="secondary" className="text-xs">Analysis</Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
