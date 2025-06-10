import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface TransactionDeletionStats {
  total_transaction_logs: number;
  total_transactions: number;
  oldest_log_date: string | null;
  newest_log_date: string | null;
  materials_with_transactions: number;
}

export interface TransactionDeletionResult {
  deleted_transaction_logs: number;
  deleted_transactions: number;
  status: string;
  processed_count?: number;
  transaction_details?: Record<string, unknown>;
}

export const useTransactionHistoryDeletion = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'all' | 'date-range' | 'material' | 'individual' | 'selected'>('all');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{
    from: Date | null;
    to: Date | null;
  }>({ from: null, to: null });
  const [password, setPassword] = useState("");
  const [showPasswordError, setShowPasswordError] = useState(false);

  // The correct admin password for transaction deletion
  const ADMIN_PASSWORD = "DELETE_HISTORY_2025";  // Fetch transaction statistics
  const { data: stats, isLoading: isLoadingStats, refetch: refetchStats } = useQuery({
    queryKey: ['transaction-history-stats'],
    queryFn: async (): Promise<TransactionDeletionStats> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc('get_transaction_history_stats');
      
      if (error) {
        throw error;
      }
      
      return data[0] || {
        total_transaction_logs: 0,
        total_transactions: 0,
        oldest_log_date: null,
        newest_log_date: null,
        materials_with_transactions: 0
      };
    }
  });

  // Clear all transaction history
  const clearAllMutation = useMutation({
    mutationFn: async (): Promise<TransactionDeletionResult> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc('clear_all_transaction_history', {
        confirmation_text: 'DELETE_ALL_TRANSACTION_HISTORY'
      });

      if (error) {
        throw error;
      }

      return data[0];
    },
    onSuccess: (result) => {
      toast({
        title: "Transaction history cleared",
        description: `Deleted ${result.deleted_transaction_logs} transaction logs and ${result.deleted_transactions} transactions.`,
      });
      
      // Refresh all transaction-related queries
      queryClient.invalidateQueries({ queryKey: ['transaction-history'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-history-stats'] });
      queryClient.invalidateQueries({ queryKey: ['stock-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['stock-transaction-logs'] });
      
      handleCloseDialog();
    },
    onError: (error: Error) => {
      console.error("Error clearing transaction history:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to clear transaction history",
        variant: "destructive",
      });
    },
  });
  // Clear transaction history by date range
  const clearByDateMutation = useMutation({
    mutationFn: async ({ startDate, endDate }: { startDate: Date; endDate: Date }): Promise<TransactionDeletionResult> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc('clear_transaction_history_by_date', {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        confirmation_text: 'DELETE_TRANSACTION_HISTORY_BY_DATE'
      });

      if (error) {
        throw error;
      }

      return data[0];
    },
    onSuccess: (result) => {
      toast({
        title: "Transaction history cleared",
        description: `Deleted ${result.deleted_transaction_logs} transaction logs and ${result.deleted_transactions} transactions for the selected date range.`,
      });
      
      // Refresh all transaction-related queries
      queryClient.invalidateQueries({ queryKey: ['transaction-history'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-history-stats'] });
      queryClient.invalidateQueries({ queryKey: ['stock-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['stock-transaction-logs'] });
      
      handleCloseDialog();
    },
    onError: (error: Error) => {
      console.error("Error clearing transaction history by date:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to clear transaction history for date range",
        variant: "destructive",
      });
    },
  });
  // Clear transaction history by material
  const clearByMaterialMutation = useMutation({
    mutationFn: async (materialId: string): Promise<TransactionDeletionResult> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc('clear_transaction_history_by_material', {
        material_id: materialId,
        confirmation_text: 'DELETE_MATERIAL_TRANSACTION_HISTORY'
      });

      if (error) {
        throw error;
      }

      return data[0];
    },
    onSuccess: (result) => {
      toast({
        title: "Transaction history cleared",
        description: `Deleted ${result.deleted_transaction_logs} transaction logs and ${result.deleted_transactions} transactions for the selected material.`,
      });
      
      // Refresh all transaction-related queries
      queryClient.invalidateQueries({ queryKey: ['transaction-history'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-history-stats'] });
      queryClient.invalidateQueries({ queryKey: ['stock-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['stock-transaction-logs'] });
      
      handleCloseDialog();
    },
    onError: (error: Error) => {
      console.error("Error clearing transaction history by material:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to clear transaction history for material",
        variant: "destructive",
      });
    },  });

  // Delete single transaction by ID
  const deleteSingleMutation = useMutation({
    mutationFn: async (transactionId: string): Promise<TransactionDeletionResult> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc('delete_single_transaction_log', {
        transaction_log_id: transactionId,
        confirmation_text: 'DELETE_SINGLE_TRANSACTION'
      });

      if (error) {
        throw error;
      }

      return data[0];
    },
    onSuccess: (result) => {
      toast({
        title: "Transaction deleted",
        description: `Successfully deleted transaction record.`,
      });
      
      // Refresh all transaction-related queries
      queryClient.invalidateQueries({ queryKey: ['transaction-history'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-history-stats'] });
      queryClient.invalidateQueries({ queryKey: ['stock-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['stock-transaction-logs'] });
      
      handleCloseDialog();
    },
    onError: (error: Error) => {
      console.error("Error deleting single transaction:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete transaction",
        variant: "destructive",
      });
    },
  });

  // Delete multiple selected transactions by IDs
  const deleteSelectedMutation = useMutation({
    mutationFn: async (transactionIds: string[]): Promise<TransactionDeletionResult> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc('delete_selected_transaction_logs', {
        transaction_log_ids: transactionIds,
        confirmation_text: 'DELETE_SELECTED_TRANSACTIONS'
      });

      if (error) {
        throw error;
      }

      return data[0];
    },
    onSuccess: (result) => {
      toast({
        title: "Transactions deleted",
        description: `Successfully deleted ${result.processed_count} transaction records.`,
      });
      
      // Refresh all transaction-related queries
      queryClient.invalidateQueries({ queryKey: ['transaction-history'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-history-stats'] });
      queryClient.invalidateQueries({ queryKey: ['stock-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['stock-transaction-logs'] });
      
      // Clear selected transactions
      setSelectedTransactionIds([]);
      handleCloseDialog();
    },
    onError: (error: Error) => {
      console.error("Error deleting selected transactions:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete selected transactions",
        variant: "destructive",
      });
    },
  });

  const validatePassword = (inputPassword: string): boolean => {
    return inputPassword === ADMIN_PASSWORD;
  };

  const handleDeleteConfirm = async () => {
    setShowPasswordError(false);
    
    if (!validatePassword(password)) {
      setShowPasswordError(true);
      toast({
        title: "Invalid Password",
        description: "Please enter the correct admin password to proceed with deletion.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (deleteType === 'all') {
        await clearAllMutation.mutateAsync();
      } else if (deleteType === 'date-range') {
        if (!dateRange.from || !dateRange.to) {
          toast({
            title: "Invalid Date Range",
            description: "Please select both start and end dates.",
            variant: "destructive",
          });
          return;
        }
        await clearByDateMutation.mutateAsync({
          startDate: dateRange.from,
          endDate: dateRange.to
        });
      } else if (deleteType === 'material') {
        if (!selectedMaterialId) {
          toast({
            title: "No Material Selected",
            description: "Please select a material to clear its transaction history.",
            variant: "destructive",
          });
          return;
        }        await clearByMaterialMutation.mutateAsync(selectedMaterialId);
      } else if (deleteType === 'individual') {
        if (selectedTransactionIds.length === 1) {
          await deleteSingleMutation.mutateAsync(selectedTransactionIds[0]);
        } else {
          toast({
            title: "Invalid Selection",
            description: "Please select exactly one transaction for individual deletion.",
            variant: "destructive",
          });
          return;
        }
      } else if (deleteType === 'selected') {
        if (selectedTransactionIds.length === 0) {
          toast({
            title: "No Transactions Selected",
            description: "Please select one or more transactions to delete.",
            variant: "destructive",
          });
          return;
        }
        await deleteSelectedMutation.mutateAsync(selectedTransactionIds);
      }
    } catch (error) {
      // Error handling is done in the mutation's onError callback
    }
  };

  const handleCloseDialog = () => {
    setIsDeleteDialogOpen(false);
    setPassword("");
    setShowPasswordError(false);    setDeleteType('all');
    setSelectedMaterialId(null);
    setSelectedTransactionIds([]);
    setDateRange({ from: null, to: null });
  };

  const isLoading = clearAllMutation.isPending || clearByDateMutation.isPending || clearByMaterialMutation.isPending || deleteSingleMutation.isPending || deleteSelectedMutation.isPending;

  return {
    // Dialog state
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    handleCloseDialog,
    
    // Deletion type and parameters
    deleteType,
    setDeleteType,    selectedMaterialId,
    setSelectedMaterialId,
    selectedTransactionIds,
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
    refetchStats,
    
    // Actions
    handleDeleteConfirm,
    isLoading,
      // Individual mutations (for advanced usage)
    clearAllMutation,
    clearByDateMutation,
    clearByMaterialMutation,
    deleteSingleMutation,
    deleteSelectedMutation,
  };
};
