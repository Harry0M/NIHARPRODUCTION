-- Migration to add individual transaction deletion functionality
-- This adds a function to delete single transaction records with proper safeguards

-- Function to delete a single transaction log by ID
CREATE OR REPLACE FUNCTION public.delete_single_transaction_log(
  transaction_log_id uuid,
  confirmation_text text DEFAULT NULL
)
RETURNS TABLE (
  deleted_transaction_logs integer,
  deleted_transactions integer,
  status text,
  transaction_details jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  transaction_log_count integer := 0;
  transaction_count integer := 0;
  log_details jsonb;
  material_name_val text;
BEGIN
  -- Safety check: require confirmation text
  IF confirmation_text IS NULL OR confirmation_text != 'DELETE_SINGLE_TRANSACTION' THEN
    RAISE EXCEPTION 'Safety confirmation required. Call with confirmation_text: ''DELETE_SINGLE_TRANSACTION''';
  END IF;
  
  -- Validate transaction log exists and get details
  SELECT 
    to_jsonb(itl.*) || jsonb_build_object('material_name', inv.material_name),
    inv.material_name
  INTO log_details, material_name_val
  FROM inventory_transaction_log itl
  LEFT JOIN inventory inv ON itl.material_id = inv.id
  WHERE itl.id = transaction_log_id;
  
  IF log_details IS NULL THEN
    RAISE EXCEPTION 'Transaction log with ID % does not exist', transaction_log_id;
  END IF;
  
  -- Log the operation start
  RAISE NOTICE 'Starting single transaction deletion for ID: % (Material: %)', 
    transaction_log_id, material_name_val;
  
  -- Delete from inventory_transaction_log table
  DELETE FROM inventory_transaction_log 
  WHERE id = transaction_log_id;
  GET DIAGNOSTICS transaction_log_count = ROW_COUNT;
  
  -- Check if there's a corresponding entry in inventory_transactions table (if it exists)
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory_transactions') THEN
    -- Try to find and delete matching transaction based on material_id and timestamp proximity
    DELETE FROM inventory_transactions 
    WHERE material_id = (log_details->>'material_id')::uuid
      AND ABS(EXTRACT(EPOCH FROM (created_at - (log_details->>'transaction_date')::timestamptz))) < 60; -- Within 1 minute
    GET DIAGNOSTICS transaction_count = ROW_COUNT;
  END IF;
  
  -- Return results
  deleted_transaction_logs := transaction_log_count;
  deleted_transactions := transaction_count;
  status := 'success';
  transaction_details := log_details;
  
  RAISE NOTICE 'Single transaction deletion completed. Deleted % transaction logs and % transactions for material %', 
    transaction_log_count, transaction_count, material_name_val;
  
  RETURN NEXT;
END;
$$;

-- Function to delete multiple selected transaction logs by IDs
CREATE OR REPLACE FUNCTION public.delete_selected_transaction_logs(
  transaction_log_ids uuid[],
  confirmation_text text DEFAULT NULL
)
RETURNS TABLE (
  deleted_transaction_logs integer,
  deleted_transactions integer,
  status text,
  processed_count integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  transaction_log_count integer := 0;
  transaction_count integer := 0;
  processed_count_val integer := 0;
  log_id uuid;
BEGIN
  -- Safety check: require confirmation text
  IF confirmation_text IS NULL OR confirmation_text != 'DELETE_SELECTED_TRANSACTIONS' THEN
    RAISE EXCEPTION 'Safety confirmation required. Call with confirmation_text: ''DELETE_SELECTED_TRANSACTIONS''';
  END IF;
  
  -- Validate input
  IF transaction_log_ids IS NULL OR array_length(transaction_log_ids, 1) = 0 THEN
    RAISE EXCEPTION 'No transaction log IDs provided';
  END IF;
  
  -- Log the operation start
  RAISE NOTICE 'Starting bulk transaction deletion for % transaction IDs', 
    array_length(transaction_log_ids, 1);
  
  -- Process each transaction ID
  FOREACH log_id IN ARRAY transaction_log_ids
  LOOP
    BEGIN
      -- Delete from inventory_transaction_log table
      DELETE FROM inventory_transaction_log 
      WHERE id = log_id;
      
      IF FOUND THEN
        transaction_log_count := transaction_log_count + 1;
        processed_count_val := processed_count_val + 1;
        
        -- Check if there's a corresponding entry in inventory_transactions table (if it exists)
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory_transactions') THEN
          -- Try to find and delete matching transaction based on the log we just deleted
          -- This is a best-effort approach since we don't have the exact mapping
          DELETE FROM inventory_transactions 
          WHERE id = log_id; -- Try direct ID match first
          
          IF FOUND THEN
            transaction_count := transaction_count + 1;
          END IF;
        END IF;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log the error but continue with other transactions
      RAISE NOTICE 'Error deleting transaction log %: %', log_id, SQLERRM;
    END;
  END LOOP;
  
  -- Return results
  deleted_transaction_logs := transaction_log_count;
  deleted_transactions := transaction_count;
  status := 'success';
  processed_count := processed_count_val;
  
  RAISE NOTICE 'Bulk transaction deletion completed. Processed % IDs, deleted % transaction logs and % transactions', 
    processed_count_val, transaction_log_count, transaction_count;
  
  RETURN NEXT;
END;
$$;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION public.delete_single_transaction_log(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_selected_transaction_logs(uuid[], text) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION public.delete_single_transaction_log IS 'Safely deletes a single transaction log record by ID with confirmation requirement';
COMMENT ON FUNCTION public.delete_selected_transaction_logs IS 'Safely deletes multiple selected transaction log records by IDs with confirmation requirement';
