-- Migration to add transaction history deletion functionality
-- This adds safe functions to clear transaction history with proper safeguards

-- 1. Function to clear all transaction history (with confirmation)
CREATE OR REPLACE FUNCTION public.clear_all_transaction_history(
  confirmation_text text DEFAULT NULL
)
RETURNS TABLE (
  deleted_transaction_logs integer,
  deleted_transactions integer,
  status text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  transaction_log_count integer := 0;
  transaction_count integer := 0;
  total_logs integer := 0;
  total_transactions integer := 0;
BEGIN
  -- Safety check: require confirmation text
  IF confirmation_text IS NULL OR confirmation_text != 'DELETE_ALL_TRANSACTION_HISTORY' THEN
    RAISE EXCEPTION 'Safety confirmation required. Call with confirmation_text: ''DELETE_ALL_TRANSACTION_HISTORY''';
  END IF;
  
  -- Get counts before deletion for reporting
  SELECT COUNT(*) INTO total_logs FROM inventory_transaction_log;
  SELECT COUNT(*) INTO total_transactions FROM inventory_transactions;
  
  -- Log the operation start
  RAISE NOTICE 'Starting transaction history deletion. Found % transaction logs and % transactions', 
    total_logs, total_transactions;
  
  -- Delete from inventory_transaction_log table
  DELETE FROM inventory_transaction_log;
  GET DIAGNOSTICS transaction_log_count = ROW_COUNT;
  
  -- Delete from inventory_transactions table (if it exists)
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory_transactions') THEN
    DELETE FROM inventory_transactions;
    GET DIAGNOSTICS transaction_count = ROW_COUNT;
  END IF;
  
  -- Return results
  deleted_transaction_logs := transaction_log_count;
  deleted_transactions := transaction_count;
  status := 'success';
  
  RAISE NOTICE 'Transaction history deletion completed. Deleted % transaction logs and % transactions', 
    transaction_log_count, transaction_count;
  
  RETURN NEXT;
END;
$$;

-- 2. Function to clear transaction history for a specific date range
CREATE OR REPLACE FUNCTION public.clear_transaction_history_by_date(
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  confirmation_text text DEFAULT NULL
)
RETURNS TABLE (
  deleted_transaction_logs integer,
  deleted_transactions integer,
  status text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  transaction_log_count integer := 0;
  transaction_count integer := 0;
BEGIN
  -- Safety check: require confirmation text
  IF confirmation_text IS NULL OR confirmation_text != 'DELETE_TRANSACTION_HISTORY_BY_DATE' THEN
    RAISE EXCEPTION 'Safety confirmation required. Call with confirmation_text: ''DELETE_TRANSACTION_HISTORY_BY_DATE''';
  END IF;
  
  -- Validate date range
  IF start_date IS NULL OR end_date IS NULL THEN
    RAISE EXCEPTION 'Both start_date and end_date must be provided';
  END IF;
  
  IF start_date >= end_date THEN
    RAISE EXCEPTION 'start_date must be before end_date';
  END IF;
  
  -- Log the operation start
  RAISE NOTICE 'Starting transaction history deletion for date range % to %', start_date, end_date;
  
  -- Delete from inventory_transaction_log table
  DELETE FROM inventory_transaction_log 
  WHERE transaction_date >= start_date 
    AND transaction_date <= end_date;
  GET DIAGNOSTICS transaction_log_count = ROW_COUNT;
  
  -- Delete from inventory_transactions table (if it exists)
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory_transactions') THEN
    DELETE FROM inventory_transactions 
    WHERE created_at >= start_date 
      AND created_at <= end_date;
    GET DIAGNOSTICS transaction_count = ROW_COUNT;
  END IF;
  
  -- Return results
  deleted_transaction_logs := transaction_log_count;
  deleted_transactions := transaction_count;
  status := 'success';
  
  RAISE NOTICE 'Transaction history deletion completed. Deleted % transaction logs and % transactions for date range', 
    transaction_log_count, transaction_count;
  
  RETURN NEXT;
END;
$$;

-- 3. Function to clear transaction history for a specific material
CREATE OR REPLACE FUNCTION public.clear_transaction_history_by_material(
  material_id uuid,
  confirmation_text text DEFAULT NULL
)
RETURNS TABLE (
  deleted_transaction_logs integer,
  deleted_transactions integer,
  status text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  transaction_log_count integer := 0;
  transaction_count integer := 0;
  material_name text;
BEGIN
  -- Safety check: require confirmation text
  IF confirmation_text IS NULL OR confirmation_text != 'DELETE_MATERIAL_TRANSACTION_HISTORY' THEN
    RAISE EXCEPTION 'Safety confirmation required. Call with confirmation_text: ''DELETE_MATERIAL_TRANSACTION_HISTORY''';
  END IF;
  
  -- Validate material exists
  SELECT inv.material_name INTO material_name 
  FROM inventory inv 
  WHERE inv.id = material_id;
  
  IF material_name IS NULL THEN
    RAISE EXCEPTION 'Material with ID % does not exist', material_id;
  END IF;
  
  -- Log the operation start
  RAISE NOTICE 'Starting transaction history deletion for material: % (ID: %)', material_name, material_id;
  
  -- Delete from inventory_transaction_log table
  DELETE FROM inventory_transaction_log 
  WHERE inventory_transaction_log.material_id = clear_transaction_history_by_material.material_id;
  GET DIAGNOSTICS transaction_log_count = ROW_COUNT;
  
  -- Delete from inventory_transactions table (if it exists)
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory_transactions') THEN
    DELETE FROM inventory_transactions 
    WHERE inventory_transactions.material_id = clear_transaction_history_by_material.material_id;
    GET DIAGNOSTICS transaction_count = ROW_COUNT;
  END IF;
  
  -- Return results
  deleted_transaction_logs := transaction_log_count;
  deleted_transactions := transaction_count;
  status := 'success';
  
  RAISE NOTICE 'Transaction history deletion completed. Deleted % transaction logs and % transactions for material %', 
    transaction_log_count, transaction_count, material_name;
  
  RETURN NEXT;
END;
$$;

-- 4. Function to get transaction history statistics (for preview before deletion)
CREATE OR REPLACE FUNCTION public.get_transaction_history_stats()
RETURNS TABLE (
  total_transaction_logs integer,
  total_transactions integer,
  oldest_log_date timestamp with time zone,
  newest_log_date timestamp with time zone,
  materials_with_transactions integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Get transaction log statistics
  SELECT 
    COUNT(*),
    MIN(transaction_date),
    MAX(transaction_date),
    COUNT(DISTINCT material_id)
  INTO 
    total_transaction_logs,
    oldest_log_date,
    newest_log_date,
    materials_with_transactions
  FROM inventory_transaction_log;
  
  -- Get inventory_transactions count if table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory_transactions') THEN
    SELECT COUNT(*) INTO total_transactions FROM inventory_transactions;
  ELSE
    total_transactions := 0;
  END IF;
  
  RETURN NEXT;
END;
$$;

-- 5. Grant appropriate permissions
GRANT EXECUTE ON FUNCTION public.clear_all_transaction_history(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_transaction_history_by_date(timestamp with time zone, timestamp with time zone, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_transaction_history_by_material(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_transaction_history_stats() TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION public.clear_all_transaction_history IS 'Safely clears all transaction history with confirmation requirement';
COMMENT ON FUNCTION public.clear_transaction_history_by_date IS 'Safely clears transaction history within a date range with confirmation requirement';
COMMENT ON FUNCTION public.clear_transaction_history_by_material IS 'Safely clears transaction history for a specific material with confirmation requirement';
COMMENT ON FUNCTION public.get_transaction_history_stats IS 'Returns statistics about current transaction history for preview purposes';
