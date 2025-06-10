import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface DispatchBatchUpdate {
  id: string;
  quantity: number;
  delivery_date: string;
  notes?: string;
  status?: string;
}

export interface DispatchBatchCreate {
  order_dispatch_id: string;
  batch_number: number;
  quantity: number;
  delivery_date: string;
  notes?: string;
  status?: string;
}

export const useDispatchBatchActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Update an existing dispatch batch
   */
  const updateDispatchBatch = async (batchId: string, updates: Partial<DispatchBatchUpdate>) => {
    setLoading(true);
    setError(null);

    try {
      // Validate the updates
      if (updates.quantity && updates.quantity <= 0) {
        throw new Error("Quantity must be greater than 0");
      }

      if (updates.delivery_date && new Date(updates.delivery_date) < new Date()) {
        // Allow past dates but warn user
        console.warn("Delivery date is in the past");
      }

      const { data, error: updateError } = await supabase
        .from('dispatch_batches')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', batchId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update batch: ${updateError.message}`);
      }

      toast({
        title: "Batch Updated",
        description: `Batch ${data.batch_number} has been updated successfully.`,
      });

      return { success: true, data };
    } catch (error: any) {
      const errorMessage = error.message || "An unexpected error occurred";
      setError(errorMessage);
      
      toast({
        title: "Error Updating Batch",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete a dispatch batch
   */
  const deleteDispatchBatch = async (batchId: string, batchNumber: number) => {
    setLoading(true);
    setError(null);

    try {
      // Check if this is the only batch for the dispatch
      const { data: batchesData, error: batchesError } = await supabase
        .from('dispatch_batches')
        .select('id, order_dispatch_id')
        .eq('id', batchId)
        .single();

      if (batchesError) {
        throw new Error(`Failed to fetch batch details: ${batchesError.message}`);
      }

      // Check how many batches exist for this dispatch
      const { count, error: countError } = await supabase
        .from('dispatch_batches')
        .select('id', { count: 'exact' })
        .eq('order_dispatch_id', batchesData.order_dispatch_id);

      if (countError) {
        throw new Error(`Failed to count batches: ${countError.message}`);
      }

      if (count === 1) {
        throw new Error("Cannot delete the last remaining batch. A dispatch must have at least one batch.");
      }

      // Delete the batch
      const { error: deleteError } = await supabase
        .from('dispatch_batches')
        .delete()
        .eq('id', batchId);

      if (deleteError) {
        throw new Error(`Failed to delete batch: ${deleteError.message}`);
      }

      // After deletion, renumber the remaining batches to maintain sequence
      await renumberBatches(batchesData.order_dispatch_id);

      toast({
        title: "Batch Deleted",
        description: `Batch ${batchNumber} has been deleted successfully.`,
      });

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || "An unexpected error occurred";
      setError(errorMessage);
      
      toast({
        title: "Error Deleting Batch",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create a new dispatch batch
   */
  const createDispatchBatch = async (batchData: DispatchBatchCreate) => {
    setLoading(true);
    setError(null);

    try {
      // Validate the batch data
      if (batchData.quantity <= 0) {
        throw new Error("Quantity must be greater than 0");
      }

      if (!batchData.delivery_date) {
        throw new Error("Delivery date is required");
      }

      const { data, error: createError } = await supabase
        .from('dispatch_batches')
        .insert([{
          ...batchData,
          status: batchData.status || 'pending'
        }])
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create batch: ${createError.message}`);
      }

      toast({
        title: "Batch Created",
        description: `New batch ${data.batch_number} has been created successfully.`,
      });

      return { success: true, data };
    } catch (error: any) {
      const errorMessage = error.message || "An unexpected error occurred";
      setError(errorMessage);
      
      toast({
        title: "Error Creating Batch",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Renumber batches after deletion to maintain sequential numbering
   */
  const renumberBatches = async (orderDispatchId: string) => {
    try {
      // Get all remaining batches for this dispatch, ordered by batch_number
      const { data: batches, error: fetchError } = await supabase
        .from('dispatch_batches')
        .select('id, batch_number')
        .eq('order_dispatch_id', orderDispatchId)
        .order('batch_number', { ascending: true });

      if (fetchError) {
        console.error("Error fetching batches for renumbering:", fetchError);
        return;
      }

      // Update batch numbers to be sequential starting from 1
      for (let i = 0; i < batches.length; i++) {
        const expectedNumber = i + 1;
        if (batches[i].batch_number !== expectedNumber) {
          await supabase
            .from('dispatch_batches')
            .update({ batch_number: expectedNumber })
            .eq('id', batches[i].id);
        }
      }
    } catch (error) {
      console.error("Error renumbering batches:", error);
      // Don't throw error as this is a cleanup operation
    }
  };

  /**
   * Update multiple batches at once
   */
  const updateMultipleBatches = async (updates: DispatchBatchUpdate[]) => {
    setLoading(true);
    setError(null);

    try {
      const results = [];
      
      for (const update of updates) {
        const result = await updateDispatchBatch(update.id, update);
        results.push(result);
      }

      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;

      if (errorCount === 0) {
        toast({
          title: "All Batches Updated",
          description: `${successCount} batches have been updated successfully.`,
        });
      } else {
        toast({
          title: "Partial Success",
          description: `${successCount} batches updated, ${errorCount} failed.`,
          variant: "destructive",
        });
      }

      return { success: errorCount === 0, results };
    } catch (error: any) {
      const errorMessage = error.message || "An unexpected error occurred";
      setError(errorMessage);
      
      toast({
        title: "Error Updating Batches",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    updateDispatchBatch,
    deleteDispatchBatch,
    createDispatchBatch,
    updateMultipleBatches,
  };
};
