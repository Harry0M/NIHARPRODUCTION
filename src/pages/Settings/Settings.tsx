import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Settings as SettingsIcon, 
  Database, 
  Trash2, 
  Shield, 
  AlertTriangle,
  History,
  Info 
} from "lucide-react";
import { TransactionHistoryDeleteDialog } from "@/components/dialogs/TransactionHistoryDeleteDialog";
import { useTransactionHistoryDeletion } from "@/hooks/useTransactionHistoryDeletion";

const Settings = () => {
  const {
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    stats,
    isLoadingStats,
  } = useTransactionHistoryDeletion();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-2">
        <SettingsIcon className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>
      
      <div className="grid gap-6">
        {/* Database Management Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Management
            </CardTitle>
            <CardDescription>
              Manage database records and transaction history
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Transaction History Management */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Transaction History
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Manage material transaction history records
                  </p>
                </div>
                
                {!isLoadingStats && stats && (
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Total Records:</span>
                      <Badge variant="outline">
                        {(stats.total_transaction_logs + stats.total_transactions).toLocaleString()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Materials:</span>
                      <Badge variant="outline">
                        {stats.materials_with_transactions}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-start gap-3 p-4 border rounded-lg bg-muted/30">
                <Info className="h-4 w-4 text-blue-500 mt-1 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>What gets deleted:</strong> Transaction history records, audit logs, and historical references.
                  </p>
                  <p className="text-sm">
                    <strong>What stays safe:</strong> Current inventory quantities, stock levels, orders, purchases, and all business data.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => setIsDeleteDialogOpen(true)}
                  variant="outline"
                  className="text-destructive hover:text-destructive border-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Transaction History
                </Button>
                
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3" />
                  <span>Admin password required</span>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Safety Information */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-amber-800">Safety Notice</h4>
                  <p className="text-sm text-amber-700">
                    All database operations require admin authentication and cannot be undone. 
                    Ensure you have recent backups before performing any bulk deletion operations.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Additional Settings Sections can be added here */}
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>
              Current system status and information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Application Version:</span>
                <div className="font-medium">1.0.0</div>
              </div>
              <div>
                <span className="text-muted-foreground">Database Status:</span>
                <div className="font-medium text-green-600">Connected</div>
              </div>
              <div>
                <span className="text-muted-foreground">Last Backup:</span>
                <div className="font-medium">Contact Administrator</div>
              </div>
              <div>
                <span className="text-muted-foreground">Data Retention:</span>
                <div className="font-medium">Unlimited</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Transaction History Delete Dialog */}
      <TransactionHistoryDeleteDialog 
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      />
    </div>
  );
};

export default Settings;
