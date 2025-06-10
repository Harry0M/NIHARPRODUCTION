import React from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/production/LoadingSpinner";
import { 
  Trash2, 
  AlertTriangle, 
  Clock, 
  Database, 
  Shield, 
  Calendar,
  Package,
  Info,
  Eye,
  EyeOff
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTransactionHistoryDeletion } from "@/hooks/useTransactionHistoryDeletion";

interface TransactionHistoryDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTransactionIds?: string[];
}

export const TransactionHistoryDeleteDialog: React.FC<TransactionHistoryDeleteDialogProps> = ({
  open,
  onOpenChange,
  selectedTransactionIds = [],
}) => {
  const {
    // Dialog state
    handleCloseDialog,
    
    // Deletion type and parameters
    deleteType,
    setDeleteType,
    selectedMaterialId,
    setSelectedMaterialId,
    selectedTransactionIds: hookSelectedIds,
    setSelectedTransactionIds,
    dateRange,
    setDateRange,
    
    // Password validation
    password,
    setPassword,
    showPasswordError,
    
    // Statistics
    stats,
    isLoadingStats,
    
    // Actions
    handleDeleteConfirm,
    isLoading,
  } = useTransactionHistoryDeletion();  const [showPassword, setShowPassword] = React.useState(false);
  const [showFinalConfirmation, setShowFinalConfirmation] = React.useState(false);

  // Sync selected transaction IDs from props to hook
  React.useEffect(() => {
    if (selectedTransactionIds.length > 0) {
      setSelectedTransactionIds(selectedTransactionIds);
      if (selectedTransactionIds.length === 1) {
        setDeleteType('individual');
      } else {
        setDeleteType('selected');
      }
    }
  }, [selectedTransactionIds, setSelectedTransactionIds, setDeleteType]);

  // Fetch materials for selection
  const { data: materials } = useQuery({
    queryKey: ['materials-for-deletion'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("id, material_name")
        .order("material_name");
        
      if (error) throw error;
      return data || [];
    },
    enabled: open
  });

  const handleClose = () => {
    handleCloseDialog();
    onOpenChange(false);
    setShowFinalConfirmation(false);
  };

  const handleInitialConfirm = () => {
    if (!password) {
      // Use the showPasswordError state from the hook
      return;
    }
    setShowFinalConfirmation(true);
  };

  const handleFinalConfirm = () => {
    setShowFinalConfirmation(false);
    handleDeleteConfirm();
  };
  const getDeletionDescription = () => {
    if (deleteType === 'all') {
      return "This will permanently delete ALL transaction history records from the database.";
    } else if (deleteType === 'date-range') {
      const fromDate = dateRange.from ? format(dateRange.from, "MMM d, yyyy") : "Not selected";
      const toDate = dateRange.to ? format(dateRange.to, "MMM d, yyyy") : "Not selected";
      return `This will permanently delete transaction history records from ${fromDate} to ${toDate}.`;
    } else if (deleteType === 'material') {
      const materialName = materials?.find(m => m.id === selectedMaterialId)?.material_name || "Selected material";
      return `This will permanently delete all transaction history records for ${materialName}.`;
    } else if (deleteType === 'individual') {
      return "This will permanently delete the selected individual transaction record.";    } else if (deleteType === 'selected') {
      const count = hookSelectedIds.length;
      return `This will permanently delete ${count} selected transaction record${count === 1 ? '' : 's'}.`;
    }
    return "";
  };
  const getEstimatedDeletionCount = () => {
    if (!stats) return "Unknown";
    
    if (deleteType === 'all') {
      return `${stats.total_transaction_logs} transaction logs`;
    } else if (deleteType === 'date-range') {
      return "Records in selected date range";
    } else if (deleteType === 'material') {
      return "Records for selected material";
    } else if (deleteType === 'individual') {
      return "1 transaction record";    } else if (deleteType === 'selected') {
      const count = hookSelectedIds.length;
      return `${count} transaction record${count === 1 ? '' : 's'}`;
    }
    return "Unknown";
  };

  return (
    <>
      <Dialog open={open && !showFinalConfirmation} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Delete Transaction History
            </DialogTitle>
            <DialogDescription>
              Permanently remove transaction history records without affecting current inventory quantities.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current Statistics */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Current Transaction History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="flex items-center justify-center py-4">
                    <LoadingSpinner />
                  </div>
                ) : stats ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Transaction Logs:</span>
                        <Badge variant="outline">{stats.total_transaction_logs.toLocaleString()}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Legacy Transactions:</span>
                        <Badge variant="outline">{stats.total_transactions.toLocaleString()}</Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Materials with History:</span>
                        <Badge variant="outline">{stats.materials_with_transactions}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Date Range:</span>
                        <div className="text-right">
                          {stats.oldest_log_date && stats.newest_log_date ? (
                            <div className="text-xs">
                              <div>{format(new Date(stats.oldest_log_date), "MMM d, yyyy")}</div>
                              <div className="text-muted-foreground">to</div>
                              <div>{format(new Date(stats.newest_log_date), "MMM d, yyyy")}</div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">No data</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    Failed to load statistics
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Deletion Options */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Deletion Options</CardTitle>
                <CardDescription>
                  Choose what transaction history to delete
                </CardDescription>
              </CardHeader>
              <CardContent>                <RadioGroup value={deleteType} onValueChange={(value: 'all' | 'date-range' | 'material' | 'individual' | 'selected') => setDeleteType(value)}>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="all" />
                      <Label htmlFor="all" className="flex items-center gap-2 cursor-pointer">
                        <Database className="h-4 w-4" />
                        Delete All Transaction History
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="date-range" id="date-range" />
                      <Label htmlFor="date-range" className="flex items-center gap-2 cursor-pointer">
                        <Calendar className="h-4 w-4" />
                        Delete by Date Range
                      </Label>
                    </div>
                    
                    {deleteType === 'date-range' && (
                      <div className="ml-6 space-y-2">
                        <Label>Select Date Range</Label>
                        <DatePickerWithRange 
                          date={{
                            from: dateRange.from,
                            to: dateRange.to
                          }}
                          onChange={(range) => {
                            setDateRange({
                              from: range.from,
                              to: range.to
                            });
                          }}
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="material" id="material" />
                      <Label htmlFor="material" className="flex items-center gap-2 cursor-pointer">
                        <Package className="h-4 w-4" />
                        Delete by Material
                      </Label>
                    </div>
                    
                    {deleteType === 'material' && (
                      <div className="ml-6 space-y-2">
                        <Label>Select Material</Label>
                        <Select 
                          value={selectedMaterialId || ""} 
                          onValueChange={setSelectedMaterialId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a material" />
                          </SelectTrigger>
                          <SelectContent>
                            {materials?.map((material) => (
                              <SelectItem key={material.id} value={material.id}>
                                {material.material_name}
                              </SelectItem>
                            ))}
                          </SelectContent>                        </Select>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="individual" id="individual" />
                      <Label htmlFor="individual" className="flex items-center gap-2 cursor-pointer">
                        <Trash2 className="h-4 w-4" />
                        Delete Individual Transaction
                      </Label>
                    </div>
                    
                    {deleteType === 'individual' && (
                      <div className="ml-6 space-y-2">
                        <Label>Transaction Selection</Label>
                        <div className="text-sm text-muted-foreground">
                          Select exactly one transaction ID to delete. You can copy the transaction ID from the Transaction History page.
                        </div>                        <Input 
                          placeholder="Enter transaction ID (e.g., 12345678-1234-1234-1234-123456789012)"
                          value={hookSelectedIds[0] || ""}
                          onChange={(e) => setSelectedTransactionIds(e.target.value ? [e.target.value] : [])}
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="selected" id="selected" />
                      <Label htmlFor="selected" className="flex items-center gap-2 cursor-pointer">
                        <Trash2 className="h-4 w-4" />
                        Delete Selected Transactions
                      </Label>
                    </div>
                    
                    {deleteType === 'selected' && (
                      <div className="ml-6 space-y-2">
                        <Label>Multiple Transaction IDs</Label>
                        <div className="text-sm text-muted-foreground">
                          Enter multiple transaction IDs, one per line. You can copy these from the Transaction History page.
                        </div>                        <textarea 
                          className="w-full min-h-[80px] px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
                          placeholder={`Enter transaction IDs, one per line:\n12345678-1234-1234-1234-123456789012\n87654321-4321-4321-4321-210987654321`}
                          value={hookSelectedIds.join('\n')}
                          onChange={(e) => {
                            const ids = e.target.value.split('\n').filter(id => id.trim().length > 0);
                            setSelectedTransactionIds(ids);
                          }}
                        />
                        {hookSelectedIds.length > 0 && (
                          <div className="text-sm text-muted-foreground">
                            {hookSelectedIds.length} transaction{hookSelectedIds.length === 1 ? '' : 's'} selected
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Warning */}
            <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Important Warning
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">What will be deleted:</p>
                    <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                      <li>• Transaction history records and logs</li>
                      <li>• Audit trail information</li>
                      <li>• Historical transaction references</li>
                    </ul>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">What will NOT be affected:</p>
                    <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                      <li>• Current inventory quantities</li>
                      <li>• Material stock levels</li>
                      <li>• Orders, purchases, and job cards</li>
                      <li>• Any other business data</li>
                    </ul>
                  </div>
                </div>
                
                <Separator />
                
                <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                  <p className="text-sm text-amber-800">
                    <strong>This action cannot be undone.</strong> Make sure you have a database backup before proceeding.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Admin Password */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Admin Authentication
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Admin Password</Label>
                  <div className="relative">
                    <Input
                      id="admin-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter admin password"
                      className={showPasswordError ? "border-destructive" : ""}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {showPasswordError && (
                    <p className="text-sm text-destructive">
                      Invalid admin password. Please contact your system administrator.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleInitialConfirm}
              disabled={!password}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Transaction History
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Final Confirmation Dialog */}
      <AlertDialog open={showFinalConfirmation} onOpenChange={setShowFinalConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Final Confirmation
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>{getDeletionDescription()}</p>
              
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">
                  <strong>Estimated deletion:</strong> {getEstimatedDeletionCount()}
                </p>
              </div>
              
              <p>
                This action is <strong>irreversible</strong>. Are you absolutely sure you want to proceed?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowFinalConfirmation(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFinalConfirm}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner className="mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Yes, Delete Now
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
