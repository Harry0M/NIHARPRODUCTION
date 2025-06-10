-- FINAL SCHEMA-AWARE FIX: Eliminate ALL column ambiguity
-- This version uses table aliases to prevent any column reference conflicts

-- Drop any existing versions completely
DROP FUNCTION IF EXISTS public.delete_order_completely(uuid);

-- Create the function with proper table aliasing to eliminate all ambiguity
CREATE OR REPLACE FUNCTION public.delete_order_completely(p_order_id uuid)
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
  IF NOT EXISTS (SELECT 1 FROM public.orders o WHERE o.id = p_order_id) THEN
    RAISE EXCEPTION 'Order with ID % does not exist', p_order_id;
  END IF;

  RAISE NOTICE 'Starting complete deletion of order ID: %', p_order_id;

  -- Step 1: Delete sales invoices and related data first
  FOR sales_record IN 
    SELECT si.id, si.invoice_number 
    FROM public.sales_invoices si 
    WHERE si.order_id = p_order_id
  LOOP
    RAISE NOTICE 'Deleting sales invoice: % (ID: %)', sales_record.invoice_number, sales_record.id;
    
    -- Delete sales invoice items first
    DELETE FROM public.sales_invoice_items sii WHERE sii.sales_invoice_id = sales_record.id;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RAISE NOTICE 'Deleted % sales invoice items', affected_rows;
    
    -- Delete the sales invoice
    DELETE FROM public.sales_invoices si WHERE si.id = sales_record.id;
    
    RAISE NOTICE 'Deleted sales invoice: %', sales_record.invoice_number;
  END LOOP;

  -- Step 2: Delete dispatch records
  FOR dispatch_record IN 
    SELECT d.id 
    FROM public.dispatch d 
    WHERE d.order_id = p_order_id
  LOOP
    RAISE NOTICE 'Deleting dispatch record: %', dispatch_record.id;
    
    -- Delete dispatch items first
    DELETE FROM public.dispatch_items di WHERE di.dispatch_id = dispatch_record.id;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RAISE NOTICE 'Deleted % dispatch items', affected_rows;
    
    -- Delete the dispatch record
    DELETE FROM public.dispatch d WHERE d.id = dispatch_record.id;
    
    RAISE NOTICE 'Deleted dispatch record: %', dispatch_record.id;
  END LOOP;

  -- Step 3: Handle job cards (Material consumption reversal handled by frontend)
  FOR job_card_record IN 
    SELECT jc.id, jc.job_number 
    FROM public.job_cards jc 
    WHERE jc.order_id = p_order_id
  LOOP
    RAISE NOTICE 'Deleting job card: % (ID: %)', job_card_record.job_number, job_card_record.id;
    
    BEGIN
      -- Delete job wastage records
      DELETE FROM public.job_wastage jw WHERE jw.job_card_id = job_card_record.id;
      GET DIAGNOSTICS affected_rows = ROW_COUNT;
      RAISE NOTICE 'Deleted % job wastage records', affected_rows;
      
      -- Delete stitching jobs and their related data
      DELETE FROM public.stitching_jobs sj WHERE sj.job_card_id = job_card_record.id;
      GET DIAGNOSTICS affected_rows = ROW_COUNT;
      RAISE NOTICE 'Deleted % stitching jobs', affected_rows;
      
      -- Delete printing jobs and their related data  
      DELETE FROM public.printing_jobs pj WHERE pj.job_card_id = job_card_record.id;
      GET DIAGNOSTICS affected_rows = ROW_COUNT;
      RAISE NOTICE 'Deleted % printing jobs', affected_rows;
      
      -- Delete cutting jobs and their components
      DELETE FROM public.cutting_components cc 
      WHERE cc.cutting_job_id IN (
        SELECT cj.id FROM public.cutting_jobs cj WHERE cj.job_card_id = job_card_record.id
      );
      GET DIAGNOSTICS affected_rows = ROW_COUNT;
      RAISE NOTICE 'Deleted % cutting components', affected_rows;
      
      DELETE FROM public.cutting_jobs cj WHERE cj.job_card_id = job_card_record.id;
      GET DIAGNOSTICS affected_rows = ROW_COUNT;
      RAISE NOTICE 'Deleted % cutting jobs', affected_rows;
      
      -- Delete any transactions related to this job card
      DELETE FROM public.transactions t WHERE t.job_card_id = job_card_record.id;
      GET DIAGNOSTICS affected_rows = ROW_COUNT;
      RAISE NOTICE 'Deleted % transaction records for job card', affected_rows;
      
      -- Delete the job card itself
      DELETE FROM public.job_cards jc WHERE jc.id = job_card_record.id;
      
      RAISE NOTICE 'Successfully deleted job card: %', job_card_record.job_number;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Error deleting job card %: %', job_card_record.job_number, SQLERRM;
        -- Continue with other job cards and order deletion
    END;
  END LOOP;

  -- Step 4: Delete order components
  DELETE FROM public.order_components oc WHERE oc.order_id = p_order_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Deleted % order components', affected_rows;

  -- Step 5: Delete order items (if they exist)
  DELETE FROM public.order_items oi WHERE oi.order_id = p_order_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Deleted % order items', affected_rows;

  -- Step 6: Delete any remaining transactions that reference this order directly
  DELETE FROM public.transactions t WHERE t.order_id = p_order_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Deleted % remaining transaction records for order', affected_rows;

  -- Step 7: Delete any other related tables that might reference the order
  DELETE FROM public.invoice_items ii WHERE ii.order_id = p_order_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Deleted % invoice items', affected_rows;

  -- Step 8: Finally delete the main order record
  DELETE FROM public.orders o WHERE o.id = p_order_id;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  IF affected_rows = 0 THEN
    RAISE EXCEPTION 'Failed to delete order with ID %', p_order_id;
  END IF;
  
  RAISE NOTICE 'Successfully deleted order with ID: %', p_order_id;
  RETURN true;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error deleting order completely: %', SQLERRM;
END;
$$;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION public.delete_order_completely(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_order_completely(uuid) TO service_role;

-- Add comment
COMMENT ON FUNCTION public.delete_order_completely(uuid) IS 
'Completely deletes an order and all related records. Uses table aliases to prevent column ambiguity. Handles proper cascade deletion sequence: sales → dispatch → job cards → production jobs → components → transactions → order. Material consumption reversal should be handled by frontend before calling this function.';

-- Verify the function was created successfully
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'delete_order_completely' 
    AND pronargs = 1
  ) THEN
    RAISE NOTICE 'SUCCESS: delete_order_completely function created with table aliases to eliminate ambiguity';
  ELSE
    RAISE EXCEPTION 'FAILED: delete_order_completely function was not created';
  END IF;
END;
$$;
