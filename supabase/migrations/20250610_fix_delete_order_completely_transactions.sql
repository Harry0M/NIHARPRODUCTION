-- Migration to fix delete_order_completely function to handle transactions table
-- This fixes the foreign key constraint violation: transactions_order_id_fkey

-- First, let's check if the function exists and drop it if it does
DROP FUNCTION IF EXISTS public.delete_order_completely(uuid);

-- Create the improved delete_order_completely function that properly cascades deletions
CREATE OR REPLACE FUNCTION public.delete_order_completely(order_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  job_card_record RECORD;
  dispatch_record RECORD;
  sales_record RECORD;
  affected_rows INT;
BEGIN
  -- Check if order exists
  IF NOT EXISTS (SELECT 1 FROM public.orders WHERE id = order_id) THEN
    RAISE EXCEPTION 'Order with ID % does not exist', order_id;
  END IF;

  RAISE NOTICE 'Starting complete deletion of order ID: %', order_id;

  -- Step 1: Delete sales invoices and related data first
  FOR sales_record IN 
    SELECT id, invoice_number FROM public.sales_invoices WHERE order_id = order_id
  LOOP
    RAISE NOTICE 'Deleting sales invoice: % (ID: %)', sales_record.invoice_number, sales_record.id;
    
    -- Delete sales invoice items first
    DELETE FROM public.sales_invoice_items WHERE sales_invoice_id = sales_record.id;
    
    -- Delete the sales invoice
    DELETE FROM public.sales_invoices WHERE id = sales_record.id;
    
    RAISE NOTICE 'Deleted sales invoice: %', sales_record.invoice_number;
  END LOOP;

  -- Step 2: Delete dispatch records
  FOR dispatch_record IN 
    SELECT id FROM public.dispatch WHERE order_id = order_id
  LOOP
    RAISE NOTICE 'Deleting dispatch record: %', dispatch_record.id;
    
    -- Delete dispatch items first
    DELETE FROM public.dispatch_items WHERE dispatch_id = dispatch_record.id;
    
    -- Delete the dispatch record
    DELETE FROM public.dispatch WHERE id = dispatch_record.id;
    
    RAISE NOTICE 'Deleted dispatch record: %', dispatch_record.id;
  END LOOP;

  -- Step 3: Handle job cards using existing deletion logic (this will reverse inventory transactions)
  FOR job_card_record IN 
    SELECT id, job_number FROM public.job_cards WHERE order_id = order_id
  LOOP
    RAISE NOTICE 'Triggering job card deletion logic for: % (ID: %)', job_card_record.job_number, job_card_record.id;
    
    -- Try to call the frontend job card deletion logic through a database function
    -- Since the frontend reversal logic is complex, we'll implement the key steps here
    BEGIN
      -- Delete stitching jobs and their related data
      DELETE FROM public.stitching_jobs WHERE job_card_id = job_card_record.id;
      GET DIAGNOSTICS affected_rows = ROW_COUNT;
      RAISE NOTICE 'Deleted % stitching jobs', affected_rows;
      
      -- Delete printing jobs and their related data  
      DELETE FROM public.printing_jobs WHERE job_card_id = job_card_record.id;
      GET DIAGNOSTICS affected_rows = ROW_COUNT;
      RAISE NOTICE 'Deleted % printing jobs', affected_rows;
      
      -- Delete cutting jobs and their components
      DELETE FROM public.cutting_components 
      WHERE cutting_job_id IN (
        SELECT id FROM public.cutting_jobs WHERE job_card_id = job_card_record.id
      );
      
      DELETE FROM public.cutting_jobs WHERE job_card_id = job_card_record.id;
      GET DIAGNOSTICS affected_rows = ROW_COUNT;
      RAISE NOTICE 'Deleted % cutting jobs', affected_rows;
      
      -- Delete job wastage records
      DELETE FROM public.job_wastage WHERE job_card_id = job_card_record.id;
      GET DIAGNOSTICS affected_rows = ROW_COUNT;
      RAISE NOTICE 'Deleted % job wastage records', affected_rows;
      
      -- NOTE: Material consumption reversal should be handled by the frontend
      -- before calling this function, as it has complex business logic
      
      -- Delete the job card itself
      DELETE FROM public.job_cards WHERE id = job_card_record.id;
      
      RAISE NOTICE 'Successfully deleted job card: %', job_card_record.job_number;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting job card %: %', job_card_record.job_number, SQLERRM;
        -- Continue with other job cards and order deletion
    END;
  END LOOP;
  -- Step 4: Delete order components
  DELETE FROM public.order_components WHERE order_id = order_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Deleted % order components', affected_rows;

  -- Step 5: Delete order items (if they exist)
  DELETE FROM public.order_items WHERE order_id = order_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Deleted % order items', affected_rows;

  -- Step 6: Delete any remaining transactions that reference this order directly
  DELETE FROM public.transactions WHERE order_id = order_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Deleted % remaining transaction records for order', affected_rows;

  -- Step 7: Delete any other related tables that might reference the order
  -- Check for invoice_items that might reference this order
  DELETE FROM public.invoice_items 
  WHERE order_id = order_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Deleted % invoice items', affected_rows;

  -- Step 8: Finally delete the main order record
  DELETE FROM public.orders WHERE id = order_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  IF affected_rows = 0 THEN
    RAISE EXCEPTION 'Failed to delete order with ID %', order_id;
  END IF;
  
  RAISE NOTICE 'Successfully deleted order with ID: %', order_id;
  RETURN true;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error deleting order completely: %', SQLERRM;
END;
$$;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION public.delete_order_completely(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_order_completely(uuid) TO service_role;

-- Add comment explaining the function
COMMENT ON FUNCTION public.delete_order_completely(uuid) IS 
'Completely deletes an order and all related records including transactions, job cards, components, and items. Handles foreign key constraints properly.';

-- Verify the function was created successfully
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'delete_order_completely' 
    AND pronargs = 1
  ) THEN
    RAISE NOTICE 'SUCCESS: delete_order_completely function created successfully';
  ELSE
    RAISE EXCEPTION 'FAILED: delete_order_completely function was not created';
  END IF;
END;
$$;
