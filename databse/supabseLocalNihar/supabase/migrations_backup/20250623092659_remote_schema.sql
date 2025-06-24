

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."component_type" AS ENUM (
    'part',
    'border',
    'handle',
    'chain',
    'runner',
    'custom'
);


ALTER TYPE "public"."component_type" OWNER TO "postgres";


CREATE TYPE "public"."job_status" AS ENUM (
    'pending',
    'in_progress',
    'completed'
);


ALTER TYPE "public"."job_status" OWNER TO "postgres";


CREATE TYPE "public"."order_status" AS ENUM (
    'pending',
    'in_production',
    'cutting',
    'printing',
    'stitching',
    'ready_for_dispatch',
    'completed',
    'cancelled',
    'dispatched'
);


ALTER TYPE "public"."order_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'admin',
    'manager',
    'production',
    'vendor'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."bulk_delete_orders"("order_ids" "uuid"[]) RETURNS TABLE("deleted_count" integer, "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_count integer := 0;
  v_order_id uuid;
  v_result record;
BEGIN
  -- Initialize return values
  deleted_count := 0;
  status := 'success';
  
  -- Loop through each order ID
  FOREACH v_order_id IN ARRAY order_ids
  LOOP
    BEGIN
      -- Call the existing delete_order_completely function for each order
      SELECT * FROM public.delete_order_completely(v_order_id) INTO v_result;
      
      -- Increment the counter for successfully deleted orders
      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      -- Log the error but continue with other orders
      RAISE NOTICE 'Error deleting order %: %', v_order_id, SQLERRM;
    END;
  END LOOP;
  
  -- Set the final count of deleted orders
  deleted_count := v_count;
  
  -- If we didn't delete all orders, adjust the status
  IF v_count < array_length(order_ids, 1) THEN
    status := 'partial';
  END IF;
  
  -- Return the results
  RETURN NEXT;
END;
$$;


ALTER FUNCTION "public"."bulk_delete_orders"("order_ids" "uuid"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_consumption"("p_length" numeric, "p_width" numeric, "p_roll_width" numeric, "p_quantity" integer DEFAULT 1) RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF p_roll_width IS NULL OR p_roll_width = 0 THEN
    RETURN NULL;
  END IF;
  RETURN ((p_length * p_width) / (p_roll_width * 39.39)) * p_quantity;
END;
$$;


ALTER FUNCTION "public"."calculate_consumption"("p_length" numeric, "p_width" numeric, "p_roll_width" numeric, "p_quantity" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_job_wastage"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  v_order_id UUID;
  v_provided_quantity INTEGER;
  v_received_quantity INTEGER;
  v_wastage_quantity INTEGER;
  v_wastage_percentage NUMERIC(5,2);
BEGIN
  -- Get order ID from job card
  SELECT order_id INTO v_order_id FROM public.job_cards WHERE id = NEW.job_card_id;
  
  -- Calculate wastage based on job type
  IF TG_TABLE_NAME = 'printing_jobs' THEN
    v_provided_quantity := CASE WHEN NEW.pulling ~ E'^\\d+$' THEN NEW.pulling::INTEGER ELSE 0 END;
    v_received_quantity := COALESCE(NEW.received_quantity, 0);
  ELSIF TG_TABLE_NAME = 'stitching_jobs' THEN
    v_provided_quantity := COALESCE(NEW.provided_quantity, 0);
    v_received_quantity := COALESCE(NEW.received_quantity, 0);
  END IF;
  
  -- Only proceed if we have both quantities
  IF v_provided_quantity > 0 AND v_received_quantity > 0 THEN
    -- Calculate wastage
    v_wastage_quantity := v_provided_quantity - v_received_quantity;
    
    -- Calculate percentage (avoid division by zero)
    IF v_provided_quantity > 0 THEN
      v_wastage_percentage := (v_wastage_quantity::NUMERIC / v_provided_quantity::NUMERIC) * 100;
    ELSE
      v_wastage_percentage := 0;
    END IF;
    
    -- Insert or update wastage record
    INSERT INTO public.job_wastage (
      order_id,
      job_card_id,
      job_type,
      job_id,
      worker_name,
      provided_quantity,
      received_quantity,
      wastage_quantity,
      wastage_percentage,
      created_at,
      updated_at
    )
    VALUES (
      v_order_id,
      NEW.job_card_id,
      TG_TABLE_NAME,
      NEW.id,
      NEW.worker_name,
      v_provided_quantity,
      v_received_quantity,
      v_wastage_quantity,
      v_wastage_percentage,
      NOW(),
      NOW()
    )
    ON CONFLICT (job_id) DO UPDATE SET
      provided_quantity = v_provided_quantity,
      received_quantity = v_received_quantity,
      wastage_quantity = v_wastage_quantity,
      wastage_percentage = v_wastage_percentage,
      worker_name = NEW.worker_name,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$_$;


ALTER FUNCTION "public"."calculate_job_wastage"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_material_consumption"("p_length" numeric, "p_width" numeric, "p_roll_width" numeric, "p_quantity" integer DEFAULT 1) RETURNS numeric
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF p_roll_width IS NULL OR p_roll_width = 0 OR p_length IS NULL OR p_width IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Formula: (length * width) / (roll_width * 39.39) * quantity
  RETURN ((p_length * p_width) / (p_roll_width * 39.39)) * p_quantity;
END;
$$;


ALTER FUNCTION "public"."calculate_material_consumption"("p_length" numeric, "p_width" numeric, "p_roll_width" numeric, "p_quantity" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."clear_all_transaction_history"("confirmation_text" "text" DEFAULT NULL::"text") RETURNS TABLE("deleted_transaction_logs" integer, "deleted_transactions" integer, "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."clear_all_transaction_history"("confirmation_text" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."clear_all_transaction_history"("confirmation_text" "text") IS 'Safely clears all transaction history with confirmation requirement';



CREATE OR REPLACE FUNCTION "public"."clear_transaction_history_by_date"("start_date" timestamp with time zone, "end_date" timestamp with time zone, "confirmation_text" "text" DEFAULT NULL::"text") RETURNS TABLE("deleted_transaction_logs" integer, "deleted_transactions" integer, "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."clear_transaction_history_by_date"("start_date" timestamp with time zone, "end_date" timestamp with time zone, "confirmation_text" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."clear_transaction_history_by_date"("start_date" timestamp with time zone, "end_date" timestamp with time zone, "confirmation_text" "text") IS 'Safely clears transaction history within a date range with confirmation requirement';



CREATE OR REPLACE FUNCTION "public"."clear_transaction_history_by_material"("material_id" "uuid", "confirmation_text" "text" DEFAULT NULL::"text") RETURNS TABLE("deleted_transaction_logs" integer, "deleted_transactions" integer, "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."clear_transaction_history_by_material"("material_id" "uuid", "confirmation_text" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."clear_transaction_history_by_material"("material_id" "uuid", "confirmation_text" "text") IS 'Safely clears transaction history for a specific material with confirmation requirement';



CREATE OR REPLACE FUNCTION "public"."delete_catalog_product"("input_catalog_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  component_id uuid;
BEGIN
  -- Check if catalog product exists
  IF NOT EXISTS (SELECT 1 FROM public.catalog WHERE id = input_catalog_id) THEN
    RAISE EXCEPTION 'Catalog product with ID % does not exist', input_catalog_id;
  END IF;

  -- First get all component IDs related to this catalog
  FOR component_id IN 
    SELECT id FROM public.catalog_components WHERE catalog_id = input_catalog_id
  LOOP
    -- Delete material associations for each component
    DELETE FROM public.catalog_component_materials
    WHERE catalog_component_id = component_id;
  END LOOP;
  
  -- Now delete all components
  DELETE FROM public.catalog_components
  WHERE catalog_id = input_catalog_id;
  
  -- Finally delete the catalog product itself
  DELETE FROM public.catalog
  WHERE id = input_catalog_id;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error deleting catalog product: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."delete_catalog_product"("input_catalog_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_company"("input_company_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Update orders to remove references to this company
  UPDATE public.orders 
  SET company_id = NULL 
  WHERE company_id = input_company_id;
  
  UPDATE public.orders 
  SET sales_account_id = NULL 
  WHERE sales_account_id = input_company_id;
  
  -- Delete the company
  DELETE FROM public.companies WHERE id = input_company_id;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error deleting company: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."delete_company"("input_company_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_order_completely"("p_order_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_order_exists BOOLEAN;
    v_error_detail TEXT;
BEGIN
    -- Check if order exists
    SELECT EXISTS(SELECT 1 FROM orders WHERE id = p_order_id) INTO v_order_exists;
    
    IF NOT v_order_exists THEN
        RAISE EXCEPTION 'Order with ID % does not exist', p_order_id;
        RETURN FALSE;
    END IF;

    BEGIN
        -- Start transaction
        -- Delete related records in dependency order to avoid foreign key violations

        -- 1. Delete dispatch batches first (they depend on order_dispatches)
        DELETE FROM dispatch_batches db
        WHERE db.order_dispatch_id IN (
            SELECT od.id FROM order_dispatches od WHERE od.order_id = p_order_id
        );

        -- 2. Delete order dispatches (they depend on orders)
        DELETE FROM order_dispatches od WHERE od.order_id = p_order_id;

        -- 3. Delete transactions (they depend on orders)
        -- First get all transactions for this order for potential inventory reversal
        DELETE FROM transactions t WHERE t.order_id = p_order_id;

        -- 4. Delete cutting components (they depend on cutting jobs)
        DELETE FROM cutting_components cc
        WHERE cc.cutting_job_id IN (
            SELECT cj.id FROM cutting_jobs cj 
            JOIN job_cards jc ON cj.job_card_id = jc.id
            WHERE jc.order_id = p_order_id
        );

        -- 5. Delete cutting jobs (they depend on job cards)
        DELETE FROM cutting_jobs cj
        WHERE cj.job_card_id IN (
            SELECT jc.id FROM job_cards jc WHERE jc.order_id = p_order_id
        );

        -- 6. Delete printing jobs (they depend on job cards)
        DELETE FROM printing_jobs pj
        WHERE pj.job_card_id IN (
            SELECT jc.id FROM job_cards jc WHERE jc.order_id = p_order_id
        );

        -- 7. Delete stitching jobs (they depend on job cards)
        DELETE FROM stitching_jobs sj
        WHERE sj.job_card_id IN (
            SELECT jc.id FROM job_cards jc WHERE jc.order_id = p_order_id
        );

        -- 8. Delete job cards (they depend on orders)
        DELETE FROM job_cards jc WHERE jc.order_id = p_order_id;

        -- 9. Delete order components (they depend on orders)
        DELETE FROM order_components oc WHERE oc.order_id = p_order_id;

        -- 10. Finally delete the order itself
        DELETE FROM orders o WHERE o.id = p_order_id;

        RETURN TRUE;

    EXCEPTION WHEN OTHERS THEN
        -- Log the error details
        GET STACKED DIAGNOSTICS v_error_detail = PG_EXCEPTION_DETAIL;
        RAISE EXCEPTION 'Failed to delete order %: % (Detail: %)', 
            p_order_id, SQLERRM, v_error_detail;
        RETURN FALSE;
    END;
END;
$$;


ALTER FUNCTION "public"."delete_order_completely"("p_order_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."delete_order_completely"("p_order_id" "uuid") IS 'Safely deletes an order and all its related records (job cards, jobs, components, dispatches, transactions) in the correct dependency order to avoid foreign key violations. Updated to use correct dispatch table names: order_dispatches and dispatch_batches.';



CREATE OR REPLACE FUNCTION "public"."delete_selected_transaction_logs"("transaction_log_ids" "uuid"[], "confirmation_text" "text" DEFAULT NULL::"text") RETURNS TABLE("deleted_transaction_logs" integer, "deleted_transactions" integer, "status" "text", "processed_count" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."delete_selected_transaction_logs"("transaction_log_ids" "uuid"[], "confirmation_text" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."delete_selected_transaction_logs"("transaction_log_ids" "uuid"[], "confirmation_text" "text") IS 'Safely deletes multiple selected transaction log records by IDs with confirmation requirement';



CREATE OR REPLACE FUNCTION "public"."delete_single_transaction_log"("transaction_log_id" "uuid", "confirmation_text" "text" DEFAULT NULL::"text") RETURNS TABLE("deleted_transaction_logs" integer, "deleted_transactions" integer, "status" "text", "transaction_details" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."delete_single_transaction_log"("transaction_log_id" "uuid", "confirmation_text" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."delete_single_transaction_log"("transaction_log_id" "uuid", "confirmation_text" "text") IS 'Safely deletes a single transaction log record by ID with confirmation requirement';



CREATE OR REPLACE FUNCTION "public"."emergency_delete_order"("target_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Force delete with raw SQL
  EXECUTE format('DELETE FROM public.orders WHERE id = %L', target_id);
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error in emergency delete: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."emergency_delete_order"("target_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_product_order_links"("product_id" "uuid") RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  updated_count INTEGER;
  result JSON;
BEGIN
  -- Update all orders linked to this product to ensure template_sync_enabled is true
  UPDATE public.orders
  SET 
    template_sync_enabled = true,
    updated_at = NOW()
  WHERE 
    (catalog_id = product_id OR template_id = product_id);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Return a JSON object with the results
  result := json_build_object(
    'success', true,
    'product_id', product_id,
    'orders_updated', updated_count
  );
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."ensure_product_order_links"("product_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."ensure_product_order_links"("product_id" "uuid") IS 'Ensures all orders linked to a product maintain their link by setting template_sync_enabled to true. 
This function runs with elevated privileges to bypass RLS restrictions.';



CREATE OR REPLACE FUNCTION "public"."force_delete_order"("target_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Direct deletion with no checks
  DELETE FROM public.orders WHERE orders.id = target_id;
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error in force delete: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."force_delete_order"("target_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_bill_number"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    year_suffix TEXT;
    sequence_num INTEGER;
    bill_number TEXT;
BEGIN
    -- Get current year suffix (e.g., 2024 -> 24)
    year_suffix := TO_CHAR(CURRENT_DATE, 'YY');
    
    -- Get next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(bill_number FROM 'SB-' || year_suffix || '-(\d+)') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.sales_bills
    WHERE bill_number LIKE 'SB-' || year_suffix || '-%';
    
    -- Format: SB-24-0001
    bill_number := 'SB-' || year_suffix || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    RETURN bill_number;
END;
$$;


ALTER FUNCTION "public"."generate_bill_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_invoice_number"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  prefix TEXT := 'INV-';
  next_num INTEGER;
  next_invoice TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '^INV-(\d+)$') AS INTEGER)), 0) + 1
  INTO next_num
  FROM sales_bills
  WHERE invoice_number ~ '^INV-\d+$';
  
  RETURN prefix || LPAD(next_num::TEXT, 6, '0');
END;
$_$;


ALTER FUNCTION "public"."generate_invoice_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_job_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.job_number := 'JOB-' || to_char(current_date, 'YYYY') || '-' ||
        LPAD(COALESCE(
            (SELECT COUNT(*) + 1 FROM public.job_cards 
             WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM current_date))::TEXT,
            '1'
        ), 3, '0');
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_job_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_order_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Only generate order number if it's NULL or empty
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := 'ORD-' || to_char(current_date, 'YYYY') || '-' ||
            LPAD(COALESCE(
                (SELECT COUNT(*) + 1 FROM public.orders 
                 WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM current_date))::TEXT,
                '1'
            ), 4, '0');
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_order_number"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_order_number"() IS 'Automatically generates order numbers for new orders when order_number is NULL or empty';



CREATE OR REPLACE FUNCTION "public"."generate_purchase_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  year_prefix TEXT;
  sequence_number TEXT;
  new_purchase_number TEXT;
BEGIN
  -- If invoice_number is provided, use it in the purchase number
  IF NEW.invoice_number IS NOT NULL AND NEW.invoice_number != '' THEN
    new_purchase_number := 'PUR-' || NEW.invoice_number;
  ELSE
    -- Otherwise use the original format with sequence number
    year_prefix := 'PUR-' || to_char(current_date, 'YYYY') || '-';
    sequence_number := LPAD(nextval('purchase_number_seq')::TEXT, 4, '0');
    new_purchase_number := year_prefix || sequence_number;
  END IF;
  
  NEW.purchase_number := new_purchase_number;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_purchase_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_catalog_cost_data"("catalog_id" "uuid") RETURNS TABLE("total_cost" numeric, "material_cost" numeric, "cutting_charge" numeric, "printing_charge" numeric, "stitching_charge" numeric, "transport_charge" numeric, "margin" numeric, "selling_rate" numeric)
    LANGUAGE "sql"
    AS $$
  SELECT 
    total_cost,
    material_cost,
    cutting_charge,
    printing_charge,
    stitching_charge,
    transport_charge,
    margin,
    selling_rate
  FROM public.catalog
  WHERE id = catalog_id;
$$;


ALTER FUNCTION "public"."get_catalog_cost_data"("catalog_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_company_order_counts"() RETURNS TABLE("company_id" "uuid", "company_name" "text", "as_company_count" bigint, "as_sales_account_count" bigint, "total_orders" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  WITH company_orders AS (
    SELECT 
      c.id,
      c.name,
      COUNT(o1.id) AS company_count
    FROM 
      companies c
    LEFT JOIN 
      orders o1 ON c.id = o1.company_id
    GROUP BY 
      c.id, c.name
  ),
  sales_account_orders AS (
    SELECT 
      c.id,
      c.name,
      COUNT(o2.id) AS sales_account_count
    FROM 
      companies c
    LEFT JOIN 
      orders o2 ON c.id = o2.sales_account_id
    GROUP BY 
      c.id, c.name
  )
  SELECT 
    co.id AS company_id,
    co.name AS company_name,
    co.company_count AS as_company_count,
    COALESCE(sao.sales_account_count, 0) AS as_sales_account_count,
    (co.company_count + COALESCE(sao.sales_account_count, 0)) AS total_orders
  FROM 
    company_orders co
  LEFT JOIN 
    sales_account_orders sao ON co.id = sao.id
  ORDER BY 
    total_orders DESC;
END;
$$;


ALTER FUNCTION "public"."get_company_order_counts"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_company_order_counts"() IS 'Returns a table with company details and counts of related orders, both as company and as sales account';



CREATE OR REPLACE FUNCTION "public"."get_deduplicated_order_consumption"("p_material_id" "uuid" DEFAULT NULL::"uuid", "p_order_ids" "uuid"[] DEFAULT NULL::"uuid"[], "p_start_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_end_date" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS TABLE("order_id" "uuid", "order_number" "text", "company_name" "text", "usage_date" timestamp with time zone, "material_id" "uuid", "material_name" "text", "total_material_used" numeric, "unit" "text", "purchase_price" numeric, "component_type" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  WITH combined_data AS (
    -- Get data from order_material_breakdown
    SELECT
      omb.order_id,
      omb.order_number,
      omb.company_name,
      omb.usage_date,
      omb.material_id,
      omb.material_name,
      omb.total_material_used,
      omb.unit,
      omb.purchase_price,
      omb.component_type,
      'breakdown' as source,
      concat(omb.order_id, '_', omb.material_id, '_', 
             date_trunc('hour', omb.usage_date)) as dedup_key
    FROM
      order_material_breakdown omb
    WHERE
      (p_material_id IS NULL OR omb.material_id = p_material_id) AND
      (p_order_ids IS NULL OR omb.order_id = ANY(p_order_ids)) AND
      (p_start_date IS NULL OR omb.usage_date >= p_start_date) AND
      (p_end_date IS NULL OR omb.usage_date <= p_end_date)
    
    UNION ALL
    
    -- Add consumption records from transaction log
    SELECT
      itl.reference_id as order_id,
      itl.reference_number as order_number,
      (itl.metadata->>'company_name')::text as company_name,
      itl.transaction_date as usage_date,
      itl.material_id,
      (itl.metadata->>'material_name')::text as material_name,
      ABS(itl.quantity) as total_material_used,
      (itl.metadata->>'unit')::text as unit,
      (itl.metadata->>'purchase_price')::numeric as purchase_price,
      (itl.metadata->>'component_type')::text as component_type,
      'transaction_log' as source,
      concat(itl.reference_id, '_', itl.material_id, '_', 
             date_trunc('hour', itl.transaction_date)) as dedup_key
    FROM
      inventory_transaction_log itl
    WHERE
      itl.reference_type = 'Order' AND
      itl.reference_id IS NOT NULL AND
      itl.quantity < 0 AND
      (p_material_id IS NULL OR itl.material_id = p_material_id) AND
      (p_order_ids IS NULL OR itl.reference_id = ANY(p_order_ids)) AND
      (p_start_date IS NULL OR itl.transaction_date >= p_start_date) AND
      (p_end_date IS NULL OR itl.transaction_date <= p_end_date)
  ),
  
  deduplicated AS (
    SELECT DISTINCT ON (dedup_key)
      order_id,
      order_number,
      company_name,
      usage_date,
      material_id,
      material_name,
      total_material_used,
      unit,
      purchase_price,
      component_type,
      source,
      dedup_key
    FROM
      combined_data
    ORDER BY
      dedup_key,
      CASE WHEN source = 'breakdown' THEN 0 ELSE 1 END
  )
  
  SELECT
    order_id,
    order_number,
    company_name,
    usage_date,
    material_id,
    material_name,
    total_material_used,
    unit,
    purchase_price,
    component_type
  FROM
    deduplicated;
END;
$$;


ALTER FUNCTION "public"."get_deduplicated_order_consumption"("p_material_id" "uuid", "p_order_ids" "uuid"[], "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_production_wastage"() RETURNS TABLE("id" "uuid", "order_id" "uuid", "order_number" "text", "company_name" "text", "job_number" "text", "job_type" "text", "worker_name" "text", "provided_quantity" integer, "received_quantity" integer, "wastage_quantity" integer, "wastage_percentage" numeric, "notes" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY 
  SELECT 
    jw.id,
    jw.order_id,
    o.order_number,
    o.company_name,
    jc.job_number,
    jw.job_type,
    jw.worker_name,
    jw.provided_quantity,
    jw.received_quantity,
    jw.wastage_quantity,
    jw.wastage_percentage,
    jw.notes,
    jw.created_at
  FROM 
    public.job_wastage jw
  LEFT JOIN 
    public.orders o ON jw.order_id = o.id
  LEFT JOIN 
    public.job_cards jc ON jw.job_card_id = jc.id
  ORDER BY 
    jw.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_production_wastage"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_system_config"("config_key" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  config_value text;
BEGIN
  SELECT value INTO config_value
  FROM system_config
  WHERE key = config_key;
  
  RETURN config_value::boolean;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;


ALTER FUNCTION "public"."get_system_config"("config_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_transaction_history_stats"() RETURNS TABLE("total_transaction_logs" integer, "total_transactions" integer, "oldest_log_date" timestamp with time zone, "newest_log_date" timestamp with time zone, "materials_with_transactions" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."get_transaction_history_stats"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_transaction_history_stats"() IS 'Returns statistics about current transaction history for preview purposes';



CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role)
  VALUES (new.id, '', '', 'production');
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hard_delete_inventory_with_consumption_preserve"("input_inventory_id" "uuid") RETURNS "json"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    material_record RECORD;
    deleted_transactions INTEGER := 0;
    preserved_consumption INTEGER := 0;
    preserved_purchase INTEGER := 0;
    modified_purchase_items INTEGER := 0;
    result_message TEXT;
BEGIN
    -- Get the inventory item details first
    SELECT id, material_name INTO material_record 
    FROM inventory 
    WHERE id = input_inventory_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Inventory item with ID % not found', input_inventory_id;
    END IF;
    
    BEGIN
        -- Step 1: Count what we'll preserve
        SELECT COUNT(*) INTO preserved_consumption
        FROM inventory_transactions 
        WHERE material_id = input_inventory_id 
        AND transaction_type = 'consumption';
        
        SELECT COUNT(*) INTO preserved_purchase
        FROM inventory_transactions 
        WHERE material_id = input_inventory_id 
        AND transaction_type = 'purchase';
        
        -- Step 2: Delete only adjustment transactions and other non-essential types
        -- PRESERVE both consumption AND purchase transactions
        DELETE FROM inventory_transactions 
        WHERE material_id = input_inventory_id 
        AND transaction_type NOT IN ('consumption', 'purchase');
        
        GET DIAGNOSTICS deleted_transactions = ROW_COUNT;
        
        -- Step 3: Set purchase_items material_id to NULL (preserve purchase history but break reference)
        UPDATE purchase_items 
        SET material_id = NULL 
        WHERE material_id = input_inventory_id;
        
        GET DIAGNOSTICS modified_purchase_items = ROW_COUNT;
        
        -- Step 4: Delete the inventory item itself
        DELETE FROM inventory WHERE id = input_inventory_id;
        
        -- Build success message
        result_message := format(
            'Successfully hard deleted inventory item "%s" (ID: %s). Deleted %s adjustment transactions, preserved %s consumption transactions, preserved %s purchase transactions, modified %s purchase item references.',
            material_record.material_name,
            input_inventory_id,
            deleted_transactions,
            preserved_consumption,
            preserved_purchase,
            modified_purchase_items
        );
        
        RETURN json_build_object(
            'success', true,
            'message', result_message,
            'details', json_build_object(
                'inventory_id', input_inventory_id,
                'material_name', material_record.material_name,
                'deleted_adjustment_transactions', deleted_transactions,
                'preserved_consumption_transactions', preserved_consumption,
                'preserved_purchase_transactions', preserved_purchase,
                'modified_purchase_items', modified_purchase_items
            )
        );
        
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Error hard deleting inventory item "%" (ID: %): %', 
            material_record.material_name, input_inventory_id, SQLERRM;
    END;
END;
$$;


ALTER FUNCTION "public"."hard_delete_inventory_with_consumption_preserve"("input_inventory_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'::public.user_role
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_inventory_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RAISE NOTICE 'INVENTORY CHANGE LOGGED [%]: Material ID: %, Old Qty: %, New Qty: %, Change: %, Source: %', 
    TG_OP, 
    NEW.id, 
    OLD.quantity, 
    NEW.quantity, 
    (NEW.quantity - OLD.quantity),
    current_setting('app.source', true);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_inventory_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_inventory_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  transaction_notes TEXT;
BEGIN
  -- Only log if quantity has changed
  IF NEW.quantity != OLD.quantity THEN
    -- Determine a default note based on the change
    IF NEW.quantity > OLD.quantity THEN
      transaction_notes := 'Quantity increased from ' || OLD.quantity || ' to ' || NEW.quantity;
    ELSE
      transaction_notes := 'Quantity decreased from ' || OLD.quantity || ' to ' || NEW.quantity;
    END IF;
    
    -- Insert into transaction log
    INSERT INTO public.inventory_transaction_log (
      material_id,
      transaction_type,
      quantity,
      previous_quantity,
      new_quantity,
      notes,
      metadata
    ) VALUES (
      NEW.id,
      CASE 
        WHEN NEW.quantity > OLD.quantity THEN 'adjustment-increase' 
        ELSE 'adjustment-decrease' 
      END,
      NEW.quantity - OLD.quantity,
      OLD.quantity,
      NEW.quantity,
      COALESCE(TG_ARGV[0], transaction_notes),
      jsonb_build_object(
        'material_name', NEW.material_name,
        'unit', NEW.unit,
        'update_source', TG_ARGV[0]
      )
    );
    
    -- Also insert into traditional inventory_transactions for compatibility
    INSERT INTO public.inventory_transactions (
      material_id,
      inventory_id,
      transaction_type,
      quantity,
      created_at,
      notes,
      unit
    ) VALUES (
      NEW.id,
      NEW.id,
      CASE 
        WHEN NEW.quantity > OLD.quantity THEN 'adjustment' 
        ELSE 'consumption' 
      END,
      NEW.quantity - OLD.quantity,
      now(),
      COALESCE(TG_ARGV[0], transaction_notes),
      NEW.unit
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_inventory_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_purchase_completion"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Only log when status changes to completed
  IF (TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed') THEN
    RAISE NOTICE 'Purchase % marked as completed. Inventory will be updated by TypeScript code.', NEW.purchase_number;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_purchase_completion"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."migrate_catalog_to_product_details"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Insert data from catalog table into product_details
  INSERT INTO public.product_details (
    catalog_id,
    name,
    description,
    bag_length,
    bag_width,
    border_dimension,
    height,
    default_quantity,
    default_rate,
    selling_rate,
    total_cost,
    margin,
    cutting_charge,
    printing_charge,
    stitching_charge,
    transport_charge,
    created_at,
    updated_at
  )
  SELECT 
    id AS catalog_id,
    name,
    description,
    bag_length,
    bag_width,
    border_dimension,
    height,
    default_quantity,
    default_rate,
    selling_rate,
    total_cost,
    margin,
    cutting_charge,
    printing_charge,
    stitching_charge,
    transport_charge,
    created_at,
    updated_at
  FROM public.catalog
  WHERE NOT EXISTS (
    SELECT 1 FROM public.product_details WHERE catalog_id = catalog.id
  );
  
END;
$$;


ALTER FUNCTION "public"."migrate_catalog_to_product_details"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_template_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  affected_count integer;
BEGIN
  -- Count affected orders
  SELECT COUNT(*) INTO affected_count 
  FROM orders 
  WHERE template_id = NEW.id AND template_sync_enabled = true;
  
  -- If orders are affected, create a notification
  IF affected_count > 0 THEN
    INSERT INTO notifications (
      title,
      message,
      type,
      recipient_role,
      link_path,
      created_at
    ) VALUES (
      'Template Updated',
      'Template "' || NEW.name || '" was updated, affecting ' || affected_count || ' orders.',
      'info',
      'admin',
      '/catalog/' || NEW.id,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_template_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."preserve_order_catalog_associations"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- This function ensures that if a catalog item is updated, 
  -- its ID is preserved so existing orders don't lose their reference
  IF OLD.id != NEW.id THEN
    RAISE EXCEPTION 'Cannot change catalog ID as it would break order associations';
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."preserve_order_catalog_associations"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."preview_inventory_hard_deletion"("input_inventory_id" "uuid") RETURNS "json"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    material_record RECORD;
    deletion_count INTEGER;
    consumption_count INTEGER;
    purchase_count INTEGER;
    purchase_items_count INTEGER;
    result JSON;
BEGIN
    -- Get the inventory item details
    SELECT id, material_name INTO material_record 
    FROM inventory 
    WHERE id = input_inventory_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Inventory item with ID % not found', input_inventory_id;
    END IF;
    
    -- Count transactions that will be deleted (only adjustments and other non-essential types)
    SELECT COUNT(*) INTO deletion_count
    FROM inventory_transactions 
    WHERE material_id = input_inventory_id 
    AND transaction_type NOT IN ('consumption', 'purchase');
    
    -- Count consumption transactions that will be preserved
    SELECT COUNT(*) INTO consumption_count
    FROM inventory_transactions 
    WHERE material_id = input_inventory_id 
    AND transaction_type = 'consumption';
    
    -- Count purchase transactions that will be preserved
    SELECT COUNT(*) INTO purchase_count
    FROM inventory_transactions 
    WHERE material_id = input_inventory_id 
    AND transaction_type = 'purchase';
    
    -- Count purchase items that will lose material reference
    SELECT COUNT(*) INTO purchase_items_count
    FROM purchase_items 
    WHERE material_id = input_inventory_id;
    
    -- Build result JSON
    result := json_build_object(
        'inventory_id', input_inventory_id,
        'material_name', material_record.material_name,
        'deletion_preview', json_build_object(
            'will_be_deleted', json_build_object(
                'inventory_item', true,
                'non_consumption_transactions', deletion_count
            ),
            'will_be_preserved', json_build_object(
                'consumption_transactions', consumption_count,
                'purchase_transactions', purchase_count,
                'purchase_history', purchase_items_count,
                'order_history', 0
            ),
            'will_be_modified', json_build_object(
                'purchase_items_lose_material_ref', purchase_items_count,
                'order_components_lose_material_ref', 0
            )
        ),
        'summary', format('Will hard delete inventory item "%s" and %s adjustment transactions. %s consumption transactions, %s purchase transactions, and %s purchase records will be preserved.',
            material_record.material_name,
            deletion_count,
            consumption_count,
            purchase_count,
            purchase_items_count
        )
    );
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."preview_inventory_hard_deletion"("input_inventory_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_material_usage"("p_material_id" "uuid", "p_order_id" "uuid", "p_job_card_id" "uuid", "p_component_id" "uuid", "p_quantity" numeric, "p_unit" "text", "p_notes" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_usage_id UUID;
BEGIN
  -- Insert the usage record
  INSERT INTO public.material_order_usage(
    material_id, order_id, job_card_id, component_id, usage_quantity, unit, notes
  ) VALUES (
    p_material_id, p_order_id, p_job_card_id, p_component_id, p_quantity, p_unit, p_notes
  ) RETURNING id INTO v_usage_id;
  
  -- Update the inventory quantity
  UPDATE public.inventory
  SET quantity = quantity - p_quantity
  WHERE id = p_material_id;
  
  RETURN v_usage_id;
END;
$$;


ALTER FUNCTION "public"."record_material_usage"("p_material_id" "uuid", "p_order_id" "uuid", "p_job_card_id" "uuid", "p_component_id" "uuid", "p_quantity" numeric, "p_unit" "text", "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_material_usage_from_cutting_job"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_order_id UUID;
  v_component RECORD;
BEGIN
  -- Only proceed if the job status is changing from 'pending' to something else
  IF (TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status != 'pending') THEN
    -- Get the order ID from the job card
    SELECT order_id INTO v_order_id 
    FROM public.job_cards 
    WHERE id = NEW.job_card_id;
    
    -- Process each component in this cutting job
    FOR v_component IN 
      SELECT cc.*, oc.material_id, oc.component_type, oc.consumption
      FROM public.cutting_components cc
      JOIN public.order_components oc ON cc.component_id = oc.id
      WHERE cc.cutting_job_id = NEW.id
    LOOP
      -- Only record usage if there's a material and consumption value
      IF v_component.material_id IS NOT NULL AND v_component.consumption IS NOT NULL AND v_component.consumption > 0 THEN
        -- Record the material usage
        PERFORM public.record_material_usage(
          v_component.material_id,
          v_order_id,
          NEW.job_card_id,
          v_component.component_id,
          v_component.consumption,
          'meters',  -- Assuming all consumption is in meters
          'Automatically recorded from cutting job ' || NEW.id
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."record_material_usage_from_cutting_job"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_order_material_usage"("p_order_id" "uuid", "p_order_number" "text", "p_material_id" "uuid", "p_quantity" numeric, "p_notes" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_current_quantity NUMERIC;
  v_material_name TEXT;
  v_unit TEXT;
BEGIN
  -- Get current material information
  SELECT quantity, material_name, unit 
  INTO v_current_quantity, v_material_name, v_unit
  FROM public.inventory
  WHERE id = p_material_id;
  
  -- Create transaction record
  INSERT INTO public.inventory_transactions (
    material_id,
    inventory_id,
    transaction_type,
    quantity,
    reference_id,
    reference_number,
    reference_type,
    notes,
    unit,
    created_at
  ) VALUES (
    p_material_id,
    p_material_id,
    'order',
    p_quantity * -1, -- Negative because it's consumption
    p_order_id::text,
    p_order_number,
    'Order',
    COALESCE(p_notes, 'Material used in order #' || p_order_number),
    v_unit,
    now()
  );
  
  -- Also log to transaction log
  INSERT INTO public.inventory_transaction_log (
    material_id,
    transaction_type,
    quantity,
    previous_quantity,
    new_quantity,
    reference_id,
    reference_number,
    reference_type,
    notes,
    metadata
  ) VALUES (
    p_material_id,
    'consumption-order',
    p_quantity * -1,
    v_current_quantity,
    v_current_quantity - p_quantity,
    p_order_id::text,
    p_order_number,
    'Order',
    COALESCE(p_notes, 'Material used in order #' || p_order_number),
    jsonb_build_object(
      'material_name', v_material_name,
      'unit', v_unit,
      'order_id', p_order_id,
      'order_number', p_order_number
    )
  );
  
  -- Update inventory quantity
  UPDATE public.inventory
  SET 
    quantity = GREATEST(0, quantity - p_quantity),
    updated_at = now()
  WHERE id = p_material_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error recording material usage: %', SQLERRM;
    RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."record_order_material_usage"("p_order_id" "uuid", "p_order_number" "text", "p_material_id" "uuid", "p_quantity" numeric, "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_bill_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  year_part TEXT;
  next_number INT;
  formatted_number TEXT;
BEGIN
  -- Only set bill number if it's not provided
  IF NEW.bill_number IS NULL OR NEW.bill_number = '' THEN
    -- Get current year and month for the prefix (e.g., "2025-06" for June 2025)
    year_part := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
    
    -- Find the highest bill number for the current month and increment
    SELECT COALESCE(MAX(
      CASE 
        WHEN bill_number LIKE year_part || '-%' 
        THEN CAST(SUBSTRING(bill_number FROM LENGTH(year_part) + 2) AS INTEGER)
        ELSE 0
      END
    ), 0) + 1
    INTO next_number
    FROM sales_bills
    WHERE bill_number LIKE year_part || '-%';
    
    -- Format the number part to be 3 digits with leading zeros
    formatted_number := LPAD(next_number::TEXT, 3, '0');
    
    -- Combine to create the final bill number (e.g., "2025-06-001")
    NEW.bill_number := year_part || '-' || formatted_number;
  END IF;
  
  -- Calculate financial values if not set
  IF NEW.subtotal IS NULL OR NEW.subtotal = 0 THEN
    NEW.subtotal := NEW.quantity * NEW.rate;
  END IF;
  
  IF NEW.gst_amount IS NULL OR NEW.gst_amount = 0 THEN
    NEW.gst_amount := (NEW.subtotal * NEW.gst_percentage) / 100;
  END IF;
  
  IF NEW.total_amount IS NULL OR NEW.total_amount = 0 THEN
    NEW.total_amount := NEW.subtotal + NEW.gst_amount + NEW.transport_charge;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_bill_number"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."set_bill_number"() IS 'Auto-generates bill numbers in the format YYYY-MM-XXX if not provided';



CREATE OR REPLACE FUNCTION "public"."set_config_value"("key" "text", "value" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Set the configuration parameter for the current session
  PERFORM set_config(key, value, false);
END;
$$;


ALTER FUNCTION "public"."set_config_value"("key" "text", "value" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_default_material_supplier"("p_material_id" "uuid", "p_supplier_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- First, unset any existing default suppliers for this material
    UPDATE material_suppliers
    SET is_default = FALSE
    WHERE material_id = p_material_id;
    
    -- Then set the new default supplier
    UPDATE material_suppliers
    SET is_default = TRUE
    WHERE material_id = p_material_id AND supplier_id = p_supplier_id;
    
    -- Update the main inventory record to reflect the default supplier
    UPDATE inventory
    SET supplier_id = p_supplier_id
    WHERE id = p_material_id;
END;
$$;


ALTER FUNCTION "public"."set_default_material_supplier"("p_material_id" "uuid", "p_supplier_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."soft_delete_inventory_item"("input_inventory_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  item_name TEXT;
BEGIN
  -- Check if inventory item exists
  SELECT material_name INTO item_name FROM public.inventory WHERE id = input_inventory_id;
  
  IF item_name IS NULL THEN
    RAISE EXCEPTION 'Inventory item with ID % does not exist', input_inventory_id;
  END IF;
  
  -- Check if already deleted
  IF item_name LIKE '%[DELETED]' THEN
    RAISE EXCEPTION 'This item is already marked as deleted';
  END IF;

  -- First delete any related transaction records
  -- This ensures we clean up transaction history as requested
  DELETE FROM public.inventory_transactions 
  WHERE material_id = input_inventory_id;
  
  -- Mark the inventory item as deleted
  UPDATE public.inventory
  SET 
    is_deleted = true,
    deleted_at = NOW(),
    material_name = material_name || ' [DELETED]'
  WHERE id = input_inventory_id;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error soft-deleting inventory item: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."soft_delete_inventory_item"("input_inventory_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."soft_delete_inventory_item"("input_inventory_id" "uuid") IS 'Safely marks an inventory item as deleted without physically removing it, preserving purchase history';



CREATE OR REPLACE FUNCTION "public"."sync_catalog_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Check if relevant fields have changed that should be synced to orders
    IF (OLD.bag_length != NEW.bag_length OR 
        OLD.bag_width != NEW.bag_width OR 
        OLD.border_dimension != NEW.border_dimension OR 
        OLD.cutting_charge != NEW.cutting_charge OR
        OLD.printing_charge != NEW.printing_charge OR
        OLD.stitching_charge != NEW.stitching_charge OR
        OLD.transport_charge != NEW.transport_charge OR
        OLD.selling_rate != NEW.selling_rate OR
        OLD.margin != NEW.margin)
    THEN
        -- Update all orders linked to this catalog item
        -- EXPLICITLY EXCLUDE quantity as requested
        UPDATE public.orders
        SET 
            bag_length = NEW.bag_length,
            bag_width = NEW.bag_width,
            border_dimension = NEW.border_dimension,
            cutting_charge = NEW.cutting_charge,
            printing_charge = NEW.printing_charge,
            stitching_charge = NEW.stitching_charge,
            transport_charge = NEW.transport_charge,
            rate = NEW.selling_rate,
            margin = NEW.margin,
            material_cost = NEW.material_cost,
            total_cost = NEW.total_cost,
            -- calculated_selling_price can be derived from rate * quantity
            calculated_selling_price = NEW.selling_rate * orders.quantity,
            updated_at = NOW()
        WHERE 
            (catalog_id = NEW.id OR template_id = NEW.id)
            AND template_sync_enabled = true;
            
        -- Log for debugging purposes
        RAISE NOTICE 'Updated orders linked to catalog id %', NEW.id;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_catalog_changes"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."sync_catalog_changes"() IS 'Updates orders when catalog items change, preserving order quantities';



CREATE OR REPLACE FUNCTION "public"."update_catalog_from_order"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  config_value boolean;
BEGIN
  -- Check config to see if this feature is enabled
  SELECT value::boolean INTO config_value FROM system_config 
  WHERE key = 'allow_order_to_update_catalog' AND value::boolean = true;

  -- Only proceed if the order has a template_id and the feature is enabled
  IF NEW.template_id IS NOT NULL AND config_value = true THEN
    UPDATE catalog
    SET 
      bag_length = NEW.bag_length,
      bag_width = NEW.bag_width,
      default_rate = NEW.rate,
      cutting_charge = NEW.cutting_charge,
      printing_charge = NEW.printing_charge,
      stitching_charge = NEW.stitching_charge,
      transport_charge = NEW.transport_charge,
      height = NEW.height,
      border_dimension = NEW.border_dimension,
      material_cost = NEW.material_cost,
      updated_at = NOW()
    WHERE id = NEW.template_id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_catalog_from_order"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_catalog_from_order_values"("p_template_id" "uuid", "p_bag_length" numeric, "p_bag_width" numeric, "p_default_quantity" integer, "p_default_rate" numeric, "p_cutting_charge" numeric, "p_printing_charge" numeric, "p_stitching_charge" numeric, "p_transport_charge" numeric, "p_height" numeric, "p_border_dimension" numeric, "p_material_cost" numeric) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  config_enabled boolean;
BEGIN
  -- Check if this feature is enabled
  SELECT value::boolean INTO config_enabled
  FROM system_config
  WHERE key = 'allow_order_to_update_catalog';
  
  IF NOT config_enabled THEN
    RETURN false;
  END IF;
  
  -- Update the catalog template
  UPDATE catalog
  SET 
    bag_length = p_bag_length,
    bag_width = p_bag_width,
    default_quantity = p_default_quantity, -- Keep this for the RPC function
    default_rate = p_default_rate,
    cutting_charge = p_cutting_charge,
    printing_charge = p_printing_charge,
    stitching_charge = p_stitching_charge,
    transport_charge = p_transport_charge,
    height = p_height,
    border_dimension = p_border_dimension,
    material_cost = p_material_cost,
    updated_at = NOW()
  WHERE id = p_template_id;
  
  RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."update_catalog_from_order_values"("p_template_id" "uuid", "p_bag_length" numeric, "p_bag_width" numeric, "p_default_quantity" integer, "p_default_rate" numeric, "p_cutting_charge" numeric, "p_printing_charge" numeric, "p_stitching_charge" numeric, "p_transport_charge" numeric, "p_height" numeric, "p_border_dimension" numeric, "p_material_cost" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_component_cost_calculation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Calculate component cost based on material rate and consumption if both exist
  IF NEW.material_id IS NOT NULL AND NEW.consumption IS NOT NULL THEN
    -- Fetch the latest material rate
    UPDATE public.order_components
    SET component_cost = (
      SELECT purchase_rate * NEW.consumption
      FROM public.inventory
      WHERE id = NEW.material_id
    )
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_component_cost_calculation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_component_material"("component_id" "uuid", "material_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
BEGIN
  UPDATE public.catalog_components
  SET 
    material_id = $2,
    material_linked = TRUE,
    updated_at = NOW()
  WHERE id = $1;
  
  -- Verify the update was successful with fully qualified column names
  RETURN EXISTS (
    SELECT 1 FROM public.catalog_components 
    WHERE catalog_components.id = $1 
    AND catalog_components.material_id = $2 
    AND catalog_components.material_linked = TRUE
  );
END;
$_$;


ALTER FUNCTION "public"."update_component_material"("component_id" "uuid", "material_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_component_material"("component_id" "uuid", "material_id" "uuid") IS 'Updates the material link for a catalog component with verification';



CREATE OR REPLACE FUNCTION "public"."update_component_material_consumption"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_component RECORD;
  v_quantity NUMERIC;
  v_roll_width NUMERIC;
BEGIN
  -- Get component details
  SELECT * INTO v_component FROM public.catalog_components 
  WHERE id = NEW.catalog_component_id;
  
  -- Extract dimensions
  IF v_component.length IS NOT NULL AND v_component.width IS NOT NULL THEN
    IF NEW.material_id IS NOT NULL THEN
      -- Get roll width from material
      SELECT roll_width INTO v_roll_width 
      FROM public.inventory_transactions 
      WHERE material_id = NEW.material_id 
      ORDER BY created_at DESC LIMIT 1;
      
      IF v_roll_width IS NOT NULL AND v_roll_width > 0 THEN
        -- Calculate consumption based on dimensions and roll width
        NEW.consumption := ((v_component.length * v_component.width) / (v_roll_width * 39.39)) * NEW.quantity_required;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_component_material_consumption"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_inventory_on_cutting_job"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    component_record RECORD;
    material_id uuid;
    consumption numeric;
    component_type text;
    transaction_notes text;
BEGIN
    -- Only proceed if the job status is not 'pending' (meaning work has started or is completed)
    -- or if the status was changed from 'pending' to something else
    IF (TG_OP = 'INSERT' AND NEW.status <> 'pending') OR 
       (TG_OP = 'UPDATE' AND NEW.status <> 'pending' AND (OLD.status = 'pending' OR OLD.status <> NEW.status)) THEN
        
        -- Loop through all components in this cutting job
        FOR component_record IN 
            SELECT cc.*, oc.material_id, oc.component_type 
            FROM cutting_components cc
            JOIN order_components oc ON cc.component_id = oc.id
            WHERE cc.cutting_job_id = NEW.id
        LOOP
            -- Get material_id and consumption from the component
            material_id := component_record.material_id;
            consumption := component_record.consumption;
            component_type := component_record.component_type;
            
            -- Only create transaction if there's a material and consumption value
            IF material_id IS NOT NULL AND consumption IS NOT NULL AND consumption > 0 THEN
                transaction_notes := 'Consumption for ' || component_type || ' in cutting job ' || NEW.id;
                
                -- Create an inventory transaction record
                INSERT INTO inventory_transactions (
                    material_id,
                    quantity,
                    transaction_type,
                    reference_id,
                    reference_number,
                    notes,
                    unit
                ) VALUES (
                    material_id,
                    consumption * -1, -- Negative because it's consumption
                    'consumption',
                    NEW.id::text,    -- Convert UUID to text
                    'CUTTING-JOB-' || NEW.id,
                    transaction_notes,
                    'meters' -- Assuming all consumption is in meters
                );
                
                -- Update the inventory quantity
                UPDATE inventory
                SET quantity = quantity - consumption
                WHERE id = material_id;
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_inventory_on_cutting_job"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_material_supplier_on_purchase"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    item_record RECORD;
BEGIN
    -- Only update material suppliers relationship, DO NOT touch inventory
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        RAISE NOTICE 'Updating material supplier relationships for purchase %', NEW.id;
        
        -- For each purchase item, update the material_suppliers relationship
        FOR item_record IN 
            SELECT pi.material_id, pi.unit_price, p.supplier_id
            FROM purchase_items pi
            JOIN purchases p ON pi.purchase_id = p.id
            WHERE p.id = NEW.id
        LOOP
            -- Insert or update the material_suppliers record
            INSERT INTO material_suppliers (
                material_id, supplier_id, last_purchase_date, purchase_price
            ) VALUES (
                item_record.material_id,
                item_record.supplier_id,
                NOW(),
                item_record.unit_price
            )
            ON CONFLICT (material_id, supplier_id) 
            DO UPDATE SET
                last_purchase_date = NOW(),
                purchase_price = item_record.unit_price;
        END LOOP;
        
        RAISE NOTICE 'Material supplier relationships updated successfully';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_material_supplier_on_purchase"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_material_suppliers_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_material_suppliers_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_orders_from_template"("template_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Update all orders that use this template
  UPDATE public.orders
  SET 
    bag_length = c.bag_length,
    bag_width = c.bag_width,
    border_dimension = c.border_dimension,
    cutting_charge = c.cutting_charge,
    printing_charge = c.printing_charge,
    stitching_charge = c.stitching_charge,
    transport_charge = c.transport_charge,
    template_margin = c.margin,
    updated_at = NOW()
  FROM public.catalog c
  WHERE orders.catalog_id = template_id
  AND c.id = template_id;
  
  -- Recalculate costs for all updated orders
  UPDATE public.orders
  SET
    material_cost = COALESCE(material_cost, 0),
    production_cost = COALESCE(cutting_charge, 0) + COALESCE(printing_charge, 0) + COALESCE(stitching_charge, 0) + COALESCE(transport_charge, 0),
    total_cost = COALESCE(material_cost, 0) + COALESCE(cutting_charge, 0) + COALESCE(printing_charge, 0) + COALESCE(stitching_charge, 0) + COALESCE(transport_charge, 0),
    calculated_selling_price = 
      CASE 
        WHEN template_margin IS NOT NULL AND template_margin > 0 THEN
          (COALESCE(material_cost, 0) + COALESCE(cutting_charge, 0) + COALESCE(printing_charge, 0) + COALESCE(stitching_charge, 0) + COALESCE(transport_charge, 0)) / (1 - template_margin/100)
        ELSE
          COALESCE(rate, 0)
      END
  WHERE orders.catalog_id = template_id;
END;
$$;


ALTER FUNCTION "public"."update_orders_from_template"("template_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_product_details_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_product_details_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_sales_bills_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_sales_bills_updated_at"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_sales_bills_updated_at"() IS 'Updates the updated_at timestamp whenever a sales bill is modified';



CREATE OR REPLACE FUNCTION "public"."update_template_from_order"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Only proceed if the update is from the edit template functionality
  -- We'll check for a special session variable to identify this
  IF current_setting('app.update_template', true) = 'true' THEN
    -- Update the catalog template based on order changes
    UPDATE public.catalog
    SET
      bag_length = NEW.bag_length,
      bag_width = NEW.bag_width,
      border_dimension = NEW.border_dimension,
      cutting_charge = NEW.cutting_charge,
      printing_charge = NEW.printing_charge,
      stitching_charge = NEW.stitching_charge,
      transport_charge = NEW.transport_charge,
      margin = NEW.template_margin,
      updated_at = NOW()
    WHERE id = NEW.catalog_id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_template_from_order"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_charge_values"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.cutting_charge < 0 OR
     NEW.printing_charge < 0 OR
     NEW.stitching_charge < 0 OR
     NEW.transport_charge < 0 
  THEN
    RAISE EXCEPTION USING
      ERRCODE = '22013',
      MESSAGE = 'Charge values cannot be negative',
      DETAIL = FORMAT('Received values: cutting=%s, printing=%s, stitching=%s, transport=%s', 
                     NEW.cutting_charge, NEW.printing_charge, NEW.stitching_charge, NEW.transport_charge);
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_charge_values"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_cutting_component_values"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Since counter and rewinding are now text, we only check width, height and waste_quantity
  IF (NEW.width IS NOT NULL AND NEW.width < 0) OR 
     (NEW.height IS NOT NULL AND NEW.height < 0) OR 
     (NEW.waste_quantity IS NOT NULL AND NEW.waste_quantity < 0) THEN
    RAISE EXCEPTION 'Negative values are not allowed for measurements or quantities';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_cutting_component_values"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."inventory" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "material_name" "text" NOT NULL,
    "color" "text",
    "gsm" "text",
    "quantity" numeric DEFAULT 0 NOT NULL,
    "unit" "text" NOT NULL,
    "alternate_unit" "text",
    "conversion_rate" numeric DEFAULT 0,
    "track_cost" boolean DEFAULT false,
    "purchase_price" numeric,
    "selling_price" numeric,
    "status" "text" DEFAULT 'in_stock'::"text",
    "min_stock_level" numeric,
    "reorder_level" numeric,
    "category_id" "uuid",
    "location_id" "uuid",
    "supplier_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "rate" numeric,
    "reorder_quantity" numeric,
    "roll_width" numeric,
    "purchase_rate" numeric,
    "is_deleted" boolean DEFAULT false,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."inventory" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."active_inventory" AS
 SELECT "inventory"."id",
    "inventory"."material_name",
    "inventory"."color",
    "inventory"."gsm",
    "inventory"."quantity",
    "inventory"."unit",
    "inventory"."alternate_unit",
    "inventory"."conversion_rate",
    "inventory"."track_cost",
    "inventory"."purchase_price",
    "inventory"."selling_price",
    "inventory"."status",
    "inventory"."min_stock_level",
    "inventory"."reorder_level",
    "inventory"."category_id",
    "inventory"."location_id",
    "inventory"."supplier_id",
    "inventory"."created_at",
    "inventory"."updated_at",
    "inventory"."rate",
    "inventory"."reorder_quantity",
    "inventory"."roll_width",
    "inventory"."purchase_rate",
    "inventory"."is_deleted",
    "inventory"."deleted_at"
   FROM "public"."inventory"
  WHERE ("inventory"."is_deleted" = false);


ALTER TABLE "public"."active_inventory" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."catalog" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "bag_length" numeric NOT NULL,
    "bag_width" numeric NOT NULL,
    "default_quantity" integer,
    "default_rate" numeric,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "cutting_charge" numeric DEFAULT 0,
    "printing_charge" numeric DEFAULT 0,
    "stitching_charge" numeric DEFAULT 0,
    "transport_charge" numeric DEFAULT 0,
    "total_cost" numeric,
    "height" numeric DEFAULT 0,
    "border_dimension" numeric DEFAULT 0,
    "selling_rate" numeric,
    "margin" numeric,
    "material_cost" numeric DEFAULT 0
);


ALTER TABLE "public"."catalog" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."catalog_component_materials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "catalog_component_id" "uuid" NOT NULL,
    "material_id" "uuid" NOT NULL,
    "quantity_required" numeric DEFAULT 1 NOT NULL,
    "unit" "text" NOT NULL,
    "consumption" numeric,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."catalog_component_materials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."catalog_components" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "catalog_id" "uuid" NOT NULL,
    "component_type" "text" NOT NULL,
    "size" "text",
    "color" "text",
    "gsm" numeric,
    "custom_name" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "material_id" "uuid",
    "roll_width" numeric,
    "consumption" numeric,
    "length" numeric,
    "width" numeric,
    "material_linked" boolean DEFAULT false,
    "formula" "text",
    "is_manual_consumption" boolean DEFAULT false
);


ALTER TABLE "public"."catalog_components" OWNER TO "postgres";


COMMENT ON COLUMN "public"."catalog_components"."material_id" IS 'Foreign key reference to inventory.id';



COMMENT ON COLUMN "public"."catalog_components"."formula" IS 'Specifies the formula to use for material consumption calculation (standard or linear)';



COMMENT ON COLUMN "public"."catalog_components"."is_manual_consumption" IS 'Specifies whether the consumption value is manually set or calculated using a formula';



CREATE TABLE IF NOT EXISTS "public"."companies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "contact_person" "text",
    "email" "text",
    "phone" "text",
    "address" "text",
    "status" "text" DEFAULT 'active'::"text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "gst_number" "text"
);


ALTER TABLE "public"."companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."components" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "type" "public"."component_type" NOT NULL,
    "size" "text",
    "color" "text",
    "gsm" "text",
    "details" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."components" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cutting_components" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "component_id" "uuid" NOT NULL,
    "cutting_job_id" "uuid" NOT NULL,
    "width" numeric,
    "height" numeric,
    "counter" "text",
    "rewinding" "text",
    "rate" numeric,
    "status" "public"."job_status" DEFAULT 'pending'::"public"."job_status",
    "notes" "text",
    "waste_quantity" numeric,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "roll_width" numeric,
    "consumption" numeric
);


ALTER TABLE "public"."cutting_components" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cutting_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_card_id" "uuid" NOT NULL,
    "roll_width" numeric,
    "consumption_meters" numeric,
    "worker_name" "text",
    "is_internal" boolean DEFAULT true,
    "status" "public"."job_status" DEFAULT 'pending'::"public"."job_status",
    "received_quantity" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid"
);


ALTER TABLE "public"."cutting_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dispatch_batches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_dispatch_id" "uuid" NOT NULL,
    "batch_number" integer NOT NULL,
    "quantity" integer NOT NULL,
    "delivery_date" "date" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_quantity" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."dispatch_batches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_batches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "material_id" "uuid" NOT NULL,
    "batch_number" "text" NOT NULL,
    "quantity" numeric NOT NULL,
    "unit" "text" NOT NULL,
    "expiry_date" "date",
    "manufacturing_date" "date",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."inventory_batches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."inventory_locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_transaction_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "material_id" "uuid" NOT NULL,
    "transaction_type" "text" NOT NULL,
    "quantity" numeric NOT NULL,
    "previous_quantity" numeric NOT NULL,
    "new_quantity" numeric NOT NULL,
    "reference_id" "text",
    "reference_number" "text",
    "reference_type" "text",
    "transaction_date" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "notes" "text",
    "metadata" "jsonb"
);


ALTER TABLE "public"."inventory_transaction_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_transaction_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "affects_quantity" boolean DEFAULT true,
    "multiplier" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."inventory_transaction_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "material_id" "uuid" NOT NULL,
    "quantity" numeric NOT NULL,
    "transaction_type" "text" NOT NULL,
    "transaction_type_id" "uuid",
    "reference_id" "text",
    "reference_number" "text",
    "notes" "text",
    "unit" "text",
    "unit_price" numeric,
    "total_price" numeric,
    "batch_id" "uuid",
    "location_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "roll_width" numeric,
    "inventory_id" "uuid",
    "reference_type" "text"
);


ALTER TABLE "public"."inventory_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_cards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "job_name" "text" NOT NULL,
    "status" "public"."job_status" DEFAULT 'pending'::"public"."job_status",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "job_number" "text",
    "notes" "text"
);


ALTER TABLE "public"."job_cards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_wastage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "job_card_id" "uuid",
    "job_type" "text" NOT NULL,
    "job_id" "uuid" NOT NULL,
    "worker_name" "text",
    "provided_quantity" integer,
    "received_quantity" integer,
    "wastage_quantity" integer,
    "wastage_percentage" numeric(5,2),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."job_wastage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."material_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."material_categories" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."material_consumption_analysis" AS
 SELECT "i"."id" AS "material_id",
    "i"."material_name",
    "i"."unit",
    "i"."gsm",
    "i"."color",
    COALESCE("sum"(
        CASE
            WHEN (("tl"."transaction_type" ~~ 'consumption%'::"text") OR (("tl"."transaction_type" ~~ 'adjustment%'::"text") AND ("tl"."quantity" < (0)::numeric))) THEN "abs"("tl"."quantity")
            ELSE (0)::numeric
        END), (0)::numeric) AS "total_consumption",
    "count"(DISTINCT
        CASE
            WHEN ("tl"."reference_type" = 'Order'::"text") THEN "tl"."reference_id"
            ELSE NULL::"text"
        END) AS "orders_count",
    "min"(
        CASE
            WHEN ("tl"."quantity" < (0)::numeric) THEN "tl"."transaction_date"
            ELSE NULL::timestamp with time zone
        END) AS "first_usage_date",
    "max"(
        CASE
            WHEN ("tl"."quantity" < (0)::numeric) THEN "tl"."transaction_date"
            ELSE NULL::timestamp with time zone
        END) AS "last_usage_date"
   FROM ("public"."inventory" "i"
     LEFT JOIN "public"."inventory_transaction_log" "tl" ON (("i"."id" = "tl"."material_id")))
  GROUP BY "i"."id", "i"."material_name", "i"."unit", "i"."gsm", "i"."color";


ALTER TABLE "public"."material_consumption_analysis" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "public"."material_consumption_summary" AS
 SELECT "m"."id" AS "material_id",
    "m"."material_name",
    "m"."color",
    "m"."gsm",
    "m"."unit",
    "count"(DISTINCT "it"."reference_id") AS "job_count",
    "sum"("abs"("it"."quantity")) AS "total_consumption",
    "m"."quantity" AS "current_stock",
        CASE
            WHEN ("m"."quantity" > (0)::numeric) THEN "round"((("sum"("abs"("it"."quantity")) / ("sum"("abs"("it"."quantity")) + "m"."quantity")) * (100)::numeric), 2)
            ELSE (0)::numeric
        END AS "consumption_percentage"
   FROM ("public"."inventory" "m"
     LEFT JOIN "public"."inventory_transactions" "it" ON ((("m"."id" = "it"."material_id") AND ("it"."transaction_type" = 'consumption'::"text"))))
  GROUP BY "m"."id", "m"."material_name", "m"."color", "m"."gsm", "m"."unit", "m"."quantity"
  WITH NO DATA;


ALTER TABLE "public"."material_consumption_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."material_order_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "material_id" "uuid" NOT NULL,
    "order_id" "uuid" NOT NULL,
    "job_card_id" "uuid",
    "component_id" "uuid",
    "usage_quantity" numeric NOT NULL,
    "usage_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "unit" "text" NOT NULL,
    "notes" "text"
);


ALTER TABLE "public"."material_order_usage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."material_suppliers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "material_id" "uuid" NOT NULL,
    "supplier_id" "uuid" NOT NULL,
    "is_default" boolean DEFAULT false,
    "last_purchase_date" timestamp with time zone,
    "purchase_price" numeric(10,2),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."material_suppliers" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."material_usage_summary" AS
 SELECT "m"."id" AS "material_id",
    "m"."material_name",
    "m"."color",
    "m"."gsm",
    "m"."unit",
    "sum"("mu"."usage_quantity") AS "total_usage",
    "count"(DISTINCT "mu"."order_id") AS "orders_count",
    "min"("mu"."usage_date") AS "first_usage_date",
    "max"("mu"."usage_date") AS "last_usage_date"
   FROM ("public"."inventory" "m"
     LEFT JOIN "public"."material_order_usage" "mu" ON (("m"."id" = "mu"."material_id")))
  GROUP BY "m"."id", "m"."material_name", "m"."color", "m"."gsm", "m"."unit";


ALTER TABLE "public"."material_usage_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_components" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "component_type" "text" NOT NULL,
    "custom_name" "text",
    "size" "text",
    "color" "text",
    "gsm" numeric,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "material_id" "uuid",
    "roll_width" numeric,
    "consumption" numeric,
    "from_template" boolean DEFAULT false,
    "component_cost" numeric,
    "component_cost_breakdown" "jsonb",
    "is_custom" boolean DEFAULT false,
    "formula" "text" DEFAULT 'standard'::"text",
    CONSTRAINT "order_components_component_type_check" CHECK (("component_type" = ANY (ARRAY['part'::"text", 'border'::"text", 'handle'::"text", 'chain'::"text", 'runner'::"text", 'custom'::"text", 'piping'::"text"]))),
    CONSTRAINT "order_components_gsm_check" CHECK (("gsm" > (0)::numeric))
);


ALTER TABLE "public"."order_components" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_dispatches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "delivery_date" "date" NOT NULL,
    "tracking_number" "text",
    "recipient_name" "text" NOT NULL,
    "delivery_address" "text" NOT NULL,
    "notes" "text",
    "quality_checked" boolean DEFAULT false NOT NULL,
    "quantity_checked" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."order_dispatches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_number" "text" NOT NULL,
    "company_name" "text" NOT NULL,
    "quantity" integer NOT NULL,
    "bag_length" numeric NOT NULL,
    "bag_width" numeric NOT NULL,
    "order_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "rate" numeric,
    "status" "public"."order_status" DEFAULT 'pending'::"public"."order_status",
    "special_instructions" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "company_id" "uuid",
    "sales_account_id" "uuid",
    "catalog_id" "uuid",
    "delivery_date" "date",
    "customer_name" "text",
    "customer_phone" "text",
    "customer_address" "text",
    "description" "text",
    "border_dimension" numeric,
    "margin" numeric,
    "material_cost" numeric,
    "production_cost" numeric,
    "total_cost" numeric,
    "calculated_selling_price" numeric,
    "template_margin" numeric,
    "cutting_charge" numeric DEFAULT 0,
    "printing_charge" numeric DEFAULT 0,
    "stitching_charge" numeric DEFAULT 0,
    "transport_charge" numeric DEFAULT 0,
    "template_id" "uuid",
    "template_sync_enabled" boolean DEFAULT true NOT NULL,
    "order_quantity" integer DEFAULT 1,
    CONSTRAINT "company_name_or_id_new" CHECK (((("company_name" IS NOT NULL) AND ("company_id" IS NULL)) OR (("company_name" IS NULL) AND ("company_id" IS NOT NULL)) OR (("company_name" IS NULL) AND ("company_id" IS NULL)) OR (("company_name" IS NOT NULL) AND ("company_id" IS NOT NULL))))
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


COMMENT ON COLUMN "public"."orders"."order_quantity" IS 'The quantity of items in a single order unit';



CREATE OR REPLACE VIEW "public"."order_material_breakdown" AS
 SELECT "o"."id" AS "order_id",
    "o"."order_number",
    "o"."company_name",
    "o"."quantity" AS "order_quantity",
    "mu"."material_id",
    "i"."material_name",
    "i"."color",
    "i"."gsm",
    "sum"("mu"."usage_quantity") AS "total_material_used",
    "i"."unit",
    "mu"."usage_date",
    "oc"."component_type"
   FROM ((("public"."orders" "o"
     JOIN "public"."material_order_usage" "mu" ON (("o"."id" = "mu"."order_id")))
     JOIN "public"."inventory" "i" ON (("mu"."material_id" = "i"."id")))
     LEFT JOIN "public"."order_components" "oc" ON (("mu"."component_id" = "oc"."id")))
  GROUP BY "o"."id", "o"."order_number", "o"."company_name", "o"."quantity", "mu"."material_id", "i"."material_name", "i"."color", "i"."gsm", "i"."unit", "mu"."usage_date", "oc"."component_type";


ALTER TABLE "public"."order_material_breakdown" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."order_number_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."order_number_seq" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."order_template_associations" AS
 SELECT "o"."id" AS "order_id",
    "o"."order_number",
    "c"."id" AS "template_id",
    "c"."name" AS "template_name",
    "o"."template_sync_enabled",
    "o"."bag_length",
    "o"."bag_width",
    "o"."border_dimension",
    "o"."rate",
    "o"."cutting_charge",
    "o"."printing_charge",
    "o"."stitching_charge",
    "o"."transport_charge"
   FROM ("public"."orders" "o"
     JOIN "public"."catalog" "c" ON (("o"."template_id" = "c"."id")));


ALTER TABLE "public"."order_template_associations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."printing_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_card_id" "uuid" NOT NULL,
    "pulling" "text",
    "gsm" "text",
    "sheet_length" numeric,
    "sheet_width" numeric,
    "print_image" "text",
    "worker_name" "text",
    "is_internal" boolean DEFAULT true,
    "status" "public"."job_status" DEFAULT 'pending'::"public"."job_status",
    "rate" numeric,
    "expected_completion_date" "date",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "received_quantity" integer
);


ALTER TABLE "public"."printing_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_details" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "catalog_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "bag_length" numeric NOT NULL,
    "bag_width" numeric NOT NULL,
    "border_dimension" numeric,
    "height" numeric,
    "default_quantity" integer,
    "default_rate" numeric,
    "selling_rate" numeric,
    "total_cost" numeric DEFAULT 0,
    "margin" numeric,
    "cutting_charge" numeric DEFAULT 0,
    "printing_charge" numeric DEFAULT 0,
    "stitching_charge" numeric DEFAULT 0,
    "transport_charge" numeric DEFAULT 0,
    "material_calculation_complete" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_materials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "material_id" "uuid" NOT NULL,
    "quantity_required" numeric NOT NULL,
    "unit" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."product_materials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "sku" "text",
    "unit_price" numeric,
    "stock_quantity" integer DEFAULT 0,
    "category" "text",
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "phone" "text",
    "company_name" "text",
    "role" "public"."user_role" DEFAULT 'production'::"public"."user_role",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "purchase_id" "uuid" NOT NULL,
    "material_id" "uuid",
    "quantity" numeric NOT NULL,
    "unit_price" numeric NOT NULL,
    "line_total" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "gst_percentage" numeric DEFAULT 0,
    "gst_amount" numeric DEFAULT 0,
    "actual_meter" numeric DEFAULT 0 NOT NULL,
    "alt_quantity" numeric DEFAULT 0 NOT NULL,
    "alt_unit_price" numeric DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."purchase_items" OWNER TO "postgres";


COMMENT ON COLUMN "public"."purchase_items"."gst_percentage" IS 'GST percentage applied to this purchase item';



COMMENT ON COLUMN "public"."purchase_items"."gst_amount" IS 'Calculated GST amount for this purchase item';



COMMENT ON COLUMN "public"."purchase_items"."actual_meter" IS 'Actual meter measurement for inventory tracking';



CREATE SEQUENCE IF NOT EXISTS "public"."purchase_number_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE "public"."purchase_number_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "supplier_id" "uuid",
    "purchase_number" "text" NOT NULL,
    "purchase_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "transport_charge" numeric DEFAULT 0,
    "subtotal" numeric DEFAULT 0 NOT NULL,
    "total_amount" numeric DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "invoice_number" "text",
    "gst" numeric DEFAULT 0
);


ALTER TABLE "public"."purchases" OWNER TO "postgres";


COMMENT ON TABLE "public"."purchases" IS 'Inventory updates for purchases are handled by TypeScript code in purchaseInventoryUtils.ts, not database triggers';



COMMENT ON COLUMN "public"."purchases"."invoice_number" IS 'Supplier invoice number, manually entered by user';



CREATE TABLE IF NOT EXISTS "public"."sales_invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "invoice_number" "text" NOT NULL,
    "company_name" "text" NOT NULL,
    "product_name" "text" NOT NULL,
    "quantity" integer NOT NULL,
    "rate" numeric(10,2) NOT NULL,
    "transport_included" boolean DEFAULT false NOT NULL,
    "transport_charge" numeric(10,2) DEFAULT 0 NOT NULL,
    "gst_percentage" numeric(5,2) DEFAULT 0 NOT NULL,
    "gst_amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "other_expenses" numeric(10,2) DEFAULT 0 NOT NULL,
    "subtotal" numeric(10,2) NOT NULL,
    "total_amount" numeric(10,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "notes" "text",
    CONSTRAINT "sales_invoices_gst_amount_check" CHECK (("gst_amount" >= (0)::numeric)),
    CONSTRAINT "sales_invoices_gst_percentage_check" CHECK ((("gst_percentage" >= (0)::numeric) AND ("gst_percentage" <= (100)::numeric))),
    CONSTRAINT "sales_invoices_other_expenses_check" CHECK (("other_expenses" >= (0)::numeric)),
    CONSTRAINT "sales_invoices_quantity_check" CHECK (("quantity" > 0)),
    CONSTRAINT "sales_invoices_rate_check" CHECK (("rate" >= (0)::numeric)),
    CONSTRAINT "sales_invoices_subtotal_check" CHECK (("subtotal" >= (0)::numeric)),
    CONSTRAINT "sales_invoices_total_amount_check" CHECK (("total_amount" >= (0)::numeric)),
    CONSTRAINT "sales_invoices_transport_charge_check" CHECK (("transport_charge" >= (0)::numeric))
);


ALTER TABLE "public"."sales_invoices" OWNER TO "postgres";


COMMENT ON TABLE "public"."sales_invoices" IS 'Stores sales invoice records with all form details captured from the sells creation form. No triggers - simple data storage only.';



CREATE TABLE IF NOT EXISTS "public"."stitching_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_card_id" "uuid" NOT NULL,
    "received_quantity" integer,
    "part_quantity" integer,
    "border_quantity" integer,
    "handle_quantity" integer,
    "chain_quantity" integer,
    "runner_quantity" integer,
    "piping_quantity" integer,
    "start_date" "date",
    "expected_completion_date" "date",
    "notes" "text",
    "worker_name" "text",
    "is_internal" boolean DEFAULT true,
    "status" "public"."job_status" DEFAULT 'pending'::"public"."job_status",
    "rate" numeric,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "provided_quantity" integer
);


ALTER TABLE "public"."stitching_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."suppliers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "contact_person" "text",
    "phone" "text",
    "email" "text",
    "address" "text",
    "materials_provided" "text",
    "payment_terms" "text",
    "status" "text" DEFAULT 'active'::"text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "gst" "text"
);


ALTER TABLE "public"."suppliers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_config" (
    "key" "text" NOT NULL,
    "value" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."system_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "amount" numeric NOT NULL,
    "type" "text" NOT NULL,
    "notes" "text",
    "order_id" "uuid",
    "supplier_id" "uuid",
    "vendor_id" "uuid",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "contact_person" "text",
    "phone" "text",
    "email" "text",
    "address" "text",
    "service_type" "text",
    "payment_terms" "text",
    "status" "text" DEFAULT 'active'::"text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "gst" "text"
);


ALTER TABLE "public"."vendors" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."wastage_analysis" AS
 SELECT "jw"."id",
    "jw"."order_id",
    "o"."order_number",
    "o"."company_name",
    "jc"."job_number",
    "jw"."job_type",
    "jw"."worker_name",
    "jw"."provided_quantity",
    "jw"."received_quantity",
    "jw"."wastage_quantity",
    "jw"."wastage_percentage",
    "jw"."notes",
    "jw"."created_at"
   FROM (("public"."job_wastage" "jw"
     LEFT JOIN "public"."orders" "o" ON (("jw"."order_id" = "o"."id")))
     LEFT JOIN "public"."job_cards" "jc" ON (("jw"."job_card_id" = "jc"."id")))
  ORDER BY "jw"."created_at" DESC;


ALTER TABLE "public"."wastage_analysis" OWNER TO "postgres";


ALTER TABLE ONLY "public"."catalog_component_materials"
    ADD CONSTRAINT "catalog_component_materials_catalog_component_id_material_i_key" UNIQUE ("catalog_component_id", "material_id");



ALTER TABLE ONLY "public"."catalog_component_materials"
    ADD CONSTRAINT "catalog_component_materials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."catalog_components"
    ADD CONSTRAINT "catalog_components_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."catalog"
    ADD CONSTRAINT "catalog_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."components"
    ADD CONSTRAINT "components_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cutting_components"
    ADD CONSTRAINT "cutting_components_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cutting_jobs"
    ADD CONSTRAINT "cutting_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dispatch_batches"
    ADD CONSTRAINT "dispatch_batches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_batches"
    ADD CONSTRAINT "inventory_batches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_locations"
    ADD CONSTRAINT "inventory_locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_transaction_log"
    ADD CONSTRAINT "inventory_transaction_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_transaction_types"
    ADD CONSTRAINT "inventory_transaction_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_transactions"
    ADD CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_cards"
    ADD CONSTRAINT "job_cards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_wastage"
    ADD CONSTRAINT "job_wastage_job_id_key" UNIQUE ("job_id");



ALTER TABLE ONLY "public"."job_wastage"
    ADD CONSTRAINT "job_wastage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."material_categories"
    ADD CONSTRAINT "material_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."material_order_usage"
    ADD CONSTRAINT "material_order_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."material_suppliers"
    ADD CONSTRAINT "material_suppliers_material_id_supplier_id_key" UNIQUE ("material_id", "supplier_id");



ALTER TABLE ONLY "public"."material_suppliers"
    ADD CONSTRAINT "material_suppliers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_components"
    ADD CONSTRAINT "order_components_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_dispatches"
    ADD CONSTRAINT "order_dispatches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_order_number_key" UNIQUE ("order_number");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."printing_jobs"
    ADD CONSTRAINT "printing_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_details"
    ADD CONSTRAINT "product_details_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_materials"
    ADD CONSTRAINT "product_materials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_items"
    ADD CONSTRAINT "purchase_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales_invoices"
    ADD CONSTRAINT "sales_invoices_invoice_number_key" UNIQUE ("invoice_number");



ALTER TABLE ONLY "public"."sales_invoices"
    ADD CONSTRAINT "sales_invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stitching_jobs"
    ADD CONSTRAINT "stitching_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_config"
    ADD CONSTRAINT "system_config_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vendors"
    ADD CONSTRAINT "vendors_pkey" PRIMARY KEY ("id");



CREATE INDEX "cutting_components_component_id_idx" ON "public"."cutting_components" USING "btree" ("component_id");



CREATE INDEX "cutting_components_cutting_job_id_idx" ON "public"."cutting_components" USING "btree" ("cutting_job_id");



CREATE INDEX "cutting_jobs_job_card_id_idx" ON "public"."cutting_jobs" USING "btree" ("job_card_id");



CREATE INDEX "idx_catalog_components_material_id" ON "public"."catalog_components" USING "btree" ("material_id");



CREATE INDEX "idx_dispatch_batches_order_dispatch_id" ON "public"."dispatch_batches" USING "btree" ("order_dispatch_id");



CREATE INDEX "idx_job_wastage_job_card_id" ON "public"."job_wastage" USING "btree" ("job_card_id");



CREATE INDEX "idx_job_wastage_job_type" ON "public"."job_wastage" USING "btree" ("job_type");



CREATE INDEX "idx_job_wastage_order_id" ON "public"."job_wastage" USING "btree" ("order_id");



CREATE INDEX "idx_material_consumption_summary_material_id" ON "public"."material_consumption_summary" USING "btree" ("material_id");



CREATE INDEX "idx_material_order_usage_job_card_id" ON "public"."material_order_usage" USING "btree" ("job_card_id");



CREATE INDEX "idx_material_order_usage_material_id" ON "public"."material_order_usage" USING "btree" ("material_id");



CREATE INDEX "idx_material_order_usage_order_id" ON "public"."material_order_usage" USING "btree" ("order_id");



CREATE INDEX "idx_material_suppliers_material_id" ON "public"."material_suppliers" USING "btree" ("material_id");



CREATE INDEX "idx_material_suppliers_supplier_id" ON "public"."material_suppliers" USING "btree" ("supplier_id");



CREATE INDEX "idx_order_components_material_id" ON "public"."order_components" USING "btree" ("material_id");



CREATE INDEX "idx_orders_template_id" ON "public"."orders" USING "btree" ("template_id");



CREATE INDEX "idx_product_details_catalog_id" ON "public"."product_details" USING "btree" ("catalog_id");



CREATE INDEX "idx_sales_invoices_company_name" ON "public"."sales_invoices" USING "btree" ("company_name");



CREATE INDEX "idx_sales_invoices_created_at" ON "public"."sales_invoices" USING "btree" ("created_at");



CREATE INDEX "idx_sales_invoices_invoice_number" ON "public"."sales_invoices" USING "btree" ("invoice_number");



CREATE INDEX "idx_sales_invoices_order_id" ON "public"."sales_invoices" USING "btree" ("order_id");



CREATE INDEX "idx_transaction_log_date" ON "public"."inventory_transaction_log" USING "btree" ("transaction_date");



CREATE INDEX "idx_transaction_log_material_id" ON "public"."inventory_transaction_log" USING "btree" ("material_id");



CREATE OR REPLACE TRIGGER "cutting_component_validation_trigger" BEFORE INSERT OR UPDATE ON "public"."cutting_components" FOR EACH ROW EXECUTE FUNCTION "public"."validate_cutting_component_values"();



CREATE OR REPLACE TRIGGER "cutting_job_inventory_update_trigger" AFTER INSERT OR UPDATE ON "public"."cutting_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."update_inventory_on_cutting_job"();



CREATE OR REPLACE TRIGGER "generate_job_number_trigger" BEFORE INSERT ON "public"."job_cards" FOR EACH ROW EXECUTE FUNCTION "public"."generate_job_number"();



CREATE OR REPLACE TRIGGER "inventory_change_logger" AFTER UPDATE OF "quantity" ON "public"."inventory" FOR EACH ROW EXECUTE FUNCTION "public"."log_inventory_change"();



CREATE OR REPLACE TRIGGER "inventory_update_trigger" AFTER UPDATE OF "quantity" ON "public"."inventory" FOR EACH ROW EXECUTE FUNCTION "public"."log_inventory_changes"();



CREATE OR REPLACE TRIGGER "record_material_usage_trigger" AFTER UPDATE ON "public"."cutting_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."record_material_usage_from_cutting_job"();



CREATE OR REPLACE TRIGGER "set_job_number" BEFORE INSERT ON "public"."job_cards" FOR EACH ROW EXECUTE FUNCTION "public"."generate_job_number"();



CREATE OR REPLACE TRIGGER "set_order_number" BEFORE INSERT ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."generate_order_number"();



COMMENT ON TRIGGER "set_order_number" ON "public"."orders" IS 'Auto-generates order numbers using format ORD-YYYY-NNNN when order_number is not provided';



CREATE OR REPLACE TRIGGER "set_purchase_number" BEFORE INSERT ON "public"."purchases" FOR EACH ROW WHEN ((("new"."purchase_number" IS NULL) OR ("new"."purchase_number" = ''::"text"))) EXECUTE FUNCTION "public"."generate_purchase_number"();



CREATE OR REPLACE TRIGGER "set_updated_at" BEFORE UPDATE ON "public"."purchase_items" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_generate_purchase_number" BEFORE INSERT ON "public"."purchases" FOR EACH ROW EXECUTE FUNCTION "public"."generate_purchase_number"();



CREATE OR REPLACE TRIGGER "trigger_preserve_order_associations" AFTER UPDATE ON "public"."catalog" FOR EACH ROW EXECUTE FUNCTION "public"."preserve_order_catalog_associations"();



CREATE OR REPLACE TRIGGER "trigger_sync_catalog_changes" AFTER UPDATE ON "public"."catalog" FOR EACH ROW EXECUTE FUNCTION "public"."sync_catalog_changes"();



COMMENT ON TRIGGER "trigger_sync_catalog_changes" ON "public"."catalog" IS 'When catalog items are updated, propagate changes to related orders while preserving quantities';



CREATE OR REPLACE TRIGGER "trigger_update_inventory_on_cutting_job" AFTER INSERT OR UPDATE ON "public"."cutting_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."update_inventory_on_cutting_job"();



CREATE OR REPLACE TRIGGER "trigger_update_template_from_order" AFTER UPDATE ON "public"."orders" FOR EACH ROW WHEN ((("old"."catalog_id" IS NOT NULL) AND ("new"."catalog_id" IS NOT NULL))) EXECUTE FUNCTION "public"."update_template_from_order"();



CREATE OR REPLACE TRIGGER "update_component_cost_trigger" AFTER INSERT OR UPDATE OF "material_id", "consumption" ON "public"."order_components" FOR EACH ROW EXECUTE FUNCTION "public"."update_component_cost_calculation"();



CREATE OR REPLACE TRIGGER "update_inventory_after_cutting_job" AFTER INSERT OR UPDATE ON "public"."cutting_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."update_inventory_on_cutting_job"();



CREATE OR REPLACE TRIGGER "update_material_consumption" BEFORE INSERT OR UPDATE ON "public"."catalog_component_materials" FOR EACH ROW EXECUTE FUNCTION "public"."update_component_material_consumption"();



CREATE OR REPLACE TRIGGER "update_material_supplier_on_purchase" AFTER UPDATE ON "public"."purchases" FOR EACH ROW WHEN ((("old"."status" <> 'completed'::"text") AND ("new"."status" = 'completed'::"text"))) EXECUTE FUNCTION "public"."update_material_supplier_on_purchase"();



CREATE OR REPLACE TRIGGER "update_material_suppliers_updated_at" BEFORE UPDATE ON "public"."material_suppliers" FOR EACH ROW EXECUTE FUNCTION "public"."update_material_suppliers_updated_at"();



CREATE OR REPLACE TRIGGER "update_printing_job_wastage" AFTER INSERT OR UPDATE OF "pulling", "received_quantity" ON "public"."printing_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_job_wastage"();



CREATE OR REPLACE TRIGGER "update_product_details_timestamp" BEFORE UPDATE ON "public"."product_details" FOR EACH ROW EXECUTE FUNCTION "public"."update_product_details_timestamp"();



CREATE OR REPLACE TRIGGER "update_stitching_job_wastage" AFTER INSERT OR UPDATE OF "provided_quantity", "received_quantity" ON "public"."stitching_jobs" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_job_wastage"();



CREATE OR REPLACE TRIGGER "validate_charges" BEFORE INSERT OR UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."validate_charge_values"();



ALTER TABLE ONLY "public"."catalog_component_materials"
    ADD CONSTRAINT "catalog_component_materials_catalog_component_id_fkey" FOREIGN KEY ("catalog_component_id") REFERENCES "public"."catalog_components"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."catalog_component_materials"
    ADD CONSTRAINT "catalog_component_materials_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."inventory"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."catalog_components"
    ADD CONSTRAINT "catalog_components_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "public"."catalog"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."components"
    ADD CONSTRAINT "components_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cutting_components"
    ADD CONSTRAINT "cutting_components_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "public"."order_components"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cutting_components"
    ADD CONSTRAINT "cutting_components_cutting_job_id_fkey" FOREIGN KEY ("cutting_job_id") REFERENCES "public"."cutting_jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cutting_jobs"
    ADD CONSTRAINT "cutting_jobs_job_card_id_fkey" FOREIGN KEY ("job_card_id") REFERENCES "public"."job_cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dispatch_batches"
    ADD CONSTRAINT "dispatch_batches_order_dispatch_id_fkey" FOREIGN KEY ("order_dispatch_id") REFERENCES "public"."order_dispatches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_components"
    ADD CONSTRAINT "fk_order_components_material_id" FOREIGN KEY ("material_id") REFERENCES "public"."inventory"("id");



ALTER TABLE ONLY "public"."inventory_batches"
    ADD CONSTRAINT "inventory_batches_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."inventory"("id");



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."material_categories"("id");



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."inventory_locations"("id");



ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."inventory_transaction_log"
    ADD CONSTRAINT "inventory_transaction_log_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."inventory"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_transactions"
    ADD CONSTRAINT "inventory_transactions_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventory"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_transactions"
    ADD CONSTRAINT "inventory_transactions_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."inventory_locations"("id");



ALTER TABLE ONLY "public"."inventory_transactions"
    ADD CONSTRAINT "inventory_transactions_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."inventory"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_transactions"
    ADD CONSTRAINT "inventory_transactions_transaction_type_id_fkey" FOREIGN KEY ("transaction_type_id") REFERENCES "public"."inventory_transaction_types"("id");



ALTER TABLE ONLY "public"."job_cards"
    ADD CONSTRAINT "job_cards_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."job_cards"
    ADD CONSTRAINT "job_cards_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_wastage"
    ADD CONSTRAINT "job_wastage_job_card_id_fkey" FOREIGN KEY ("job_card_id") REFERENCES "public"."job_cards"("id");



ALTER TABLE ONLY "public"."job_wastage"
    ADD CONSTRAINT "job_wastage_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."material_order_usage"
    ADD CONSTRAINT "material_order_usage_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "public"."order_components"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."material_order_usage"
    ADD CONSTRAINT "material_order_usage_job_card_id_fkey" FOREIGN KEY ("job_card_id") REFERENCES "public"."job_cards"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."material_order_usage"
    ADD CONSTRAINT "material_order_usage_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."inventory"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."material_order_usage"
    ADD CONSTRAINT "material_order_usage_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."material_suppliers"
    ADD CONSTRAINT "material_suppliers_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."inventory"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."material_suppliers"
    ADD CONSTRAINT "material_suppliers_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_components"
    ADD CONSTRAINT "order_components_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_dispatches"
    ADD CONSTRAINT "order_dispatches_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_sales_account_id_fkey" FOREIGN KEY ("sales_account_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."catalog"("id");



ALTER TABLE ONLY "public"."printing_jobs"
    ADD CONSTRAINT "printing_jobs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."printing_jobs"
    ADD CONSTRAINT "printing_jobs_job_card_id_fkey" FOREIGN KEY ("job_card_id") REFERENCES "public"."job_cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_details"
    ADD CONSTRAINT "product_details_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "public"."catalog"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_materials"
    ADD CONSTRAINT "product_materials_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."inventory"("id");



ALTER TABLE ONLY "public"."product_materials"
    ADD CONSTRAINT "product_materials_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_items"
    ADD CONSTRAINT "purchase_items_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."inventory"("id");



ALTER TABLE ONLY "public"."purchase_items"
    ADD CONSTRAINT "purchase_items_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."sales_invoices"
    ADD CONSTRAINT "sales_invoices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sales_invoices"
    ADD CONSTRAINT "sales_invoices_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stitching_jobs"
    ADD CONSTRAINT "stitching_jobs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."stitching_jobs"
    ADD CONSTRAINT "stitching_jobs_job_card_id_fkey" FOREIGN KEY ("job_card_id") REFERENCES "public"."job_cards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id");



ALTER TABLE ONLY "public"."vendors"
    ADD CONSTRAINT "vendors_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



CREATE POLICY "Admins can update all profiles" ON "public"."profiles" FOR UPDATE USING ("public"."is_admin"());



CREATE POLICY "Admins can view all profiles" ON "public"."profiles" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Allow all access for authenticated users" ON "public"."product_details" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow all access to authenticated users" ON "public"."order_components" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow all access to authenticated users" ON "public"."order_dispatches" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated users to insert catalog" ON "public"."catalog" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to insert catalog_components" ON "public"."catalog_components" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to update catalog" ON "public"."catalog" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Allow authenticated users to update catalog_components" ON "public"."catalog_components" FOR UPDATE TO "authenticated" USING ((( SELECT "catalog"."created_by"
   FROM "public"."catalog"
  WHERE ("catalog"."id" = "catalog_components"."catalog_id")) = "auth"."uid"()));



CREATE POLICY "Allow authenticated users to view catalog" ON "public"."catalog" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to view catalog_components" ON "public"."catalog_components" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow read access for authenticated users" ON "public"."product_details" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can create orders" ON "public"."orders" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Authenticated users can perform all operations" ON "public"."components" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can perform all operations" ON "public"."job_cards" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can perform all operations" ON "public"."printing_jobs" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can perform all operations" ON "public"."stitching_jobs" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can perform all operations" ON "public"."suppliers" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can perform all operations" ON "public"."transactions" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can perform all operations" ON "public"."vendors" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Authenticated users can update orders" ON "public"."orders" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can update sales invoices" ON "public"."sales_invoices" FOR UPDATE USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can view all orders" ON "public"."orders" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable all operations for authenticated users on catalog_compon" ON "public"."catalog_components" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Enable delete for authenticated users" ON "public"."purchase_items" FOR DELETE USING (true);



CREATE POLICY "Enable delete for authenticated users" ON "public"."purchases" FOR DELETE USING (true);



CREATE POLICY "Enable insert for authenticated users" ON "public"."purchase_items" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users" ON "public"."purchases" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."purchase_items" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."purchases" FOR SELECT USING (true);



CREATE POLICY "Enable update for authenticated users" ON "public"."catalog" FOR UPDATE USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Enable update for authenticated users" ON "public"."purchase_items" FOR UPDATE USING (true);



CREATE POLICY "Enable update for authenticated users" ON "public"."purchases" FOR UPDATE USING (true);



CREATE POLICY "Only admins can delete orders" ON "public"."orders" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "Only admins can delete profiles" ON "public"."profiles" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "Users can delete their own sales invoices" ON "public"."sales_invoices" FOR DELETE USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Users can insert dispatch batches" ON "public"."dispatch_batches" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Users can insert sales invoices" ON "public"."sales_invoices" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can update dispatch batches" ON "public"."dispatch_batches" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("id" = "auth"."uid"()));



CREATE POLICY "Users can view dispatch batches" ON "public"."dispatch_batches" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can view sales invoices" ON "public"."sales_invoices" FOR SELECT USING (true);



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("id" = "auth"."uid"()));



ALTER TABLE "public"."components" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_cards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_components" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_dispatches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."printing_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stitching_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."suppliers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vendors" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";











































































































































































GRANT ALL ON FUNCTION "public"."bulk_delete_orders"("order_ids" "uuid"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."bulk_delete_orders"("order_ids" "uuid"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."bulk_delete_orders"("order_ids" "uuid"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_consumption"("p_length" numeric, "p_width" numeric, "p_roll_width" numeric, "p_quantity" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_consumption"("p_length" numeric, "p_width" numeric, "p_roll_width" numeric, "p_quantity" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_consumption"("p_length" numeric, "p_width" numeric, "p_roll_width" numeric, "p_quantity" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_job_wastage"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_job_wastage"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_job_wastage"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_material_consumption"("p_length" numeric, "p_width" numeric, "p_roll_width" numeric, "p_quantity" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_material_consumption"("p_length" numeric, "p_width" numeric, "p_roll_width" numeric, "p_quantity" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_material_consumption"("p_length" numeric, "p_width" numeric, "p_roll_width" numeric, "p_quantity" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."clear_all_transaction_history"("confirmation_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."clear_all_transaction_history"("confirmation_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."clear_all_transaction_history"("confirmation_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."clear_transaction_history_by_date"("start_date" timestamp with time zone, "end_date" timestamp with time zone, "confirmation_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."clear_transaction_history_by_date"("start_date" timestamp with time zone, "end_date" timestamp with time zone, "confirmation_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."clear_transaction_history_by_date"("start_date" timestamp with time zone, "end_date" timestamp with time zone, "confirmation_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."clear_transaction_history_by_material"("material_id" "uuid", "confirmation_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."clear_transaction_history_by_material"("material_id" "uuid", "confirmation_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."clear_transaction_history_by_material"("material_id" "uuid", "confirmation_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_catalog_product"("input_catalog_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_catalog_product"("input_catalog_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_catalog_product"("input_catalog_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_company"("input_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_company"("input_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_company"("input_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_order_completely"("p_order_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_order_completely"("p_order_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_order_completely"("p_order_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_selected_transaction_logs"("transaction_log_ids" "uuid"[], "confirmation_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_selected_transaction_logs"("transaction_log_ids" "uuid"[], "confirmation_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_selected_transaction_logs"("transaction_log_ids" "uuid"[], "confirmation_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_single_transaction_log"("transaction_log_id" "uuid", "confirmation_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_single_transaction_log"("transaction_log_id" "uuid", "confirmation_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_single_transaction_log"("transaction_log_id" "uuid", "confirmation_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."emergency_delete_order"("target_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."emergency_delete_order"("target_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."emergency_delete_order"("target_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_product_order_links"("product_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_product_order_links"("product_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_product_order_links"("product_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."force_delete_order"("target_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."force_delete_order"("target_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."force_delete_order"("target_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_bill_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_bill_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_bill_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_invoice_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_invoice_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_invoice_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_job_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_job_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_job_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_order_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_purchase_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_purchase_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_purchase_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_catalog_cost_data"("catalog_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_catalog_cost_data"("catalog_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_catalog_cost_data"("catalog_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_company_order_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_company_order_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_company_order_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_deduplicated_order_consumption"("p_material_id" "uuid", "p_order_ids" "uuid"[], "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_deduplicated_order_consumption"("p_material_id" "uuid", "p_order_ids" "uuid"[], "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_deduplicated_order_consumption"("p_material_id" "uuid", "p_order_ids" "uuid"[], "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_production_wastage"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_production_wastage"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_production_wastage"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_system_config"("config_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_system_config"("config_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_system_config"("config_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_transaction_history_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_transaction_history_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_transaction_history_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."hard_delete_inventory_with_consumption_preserve"("input_inventory_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hard_delete_inventory_with_consumption_preserve"("input_inventory_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hard_delete_inventory_with_consumption_preserve"("input_inventory_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_inventory_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_inventory_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_inventory_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_inventory_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_inventory_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_inventory_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_purchase_completion"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_purchase_completion"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_purchase_completion"() TO "service_role";



GRANT ALL ON FUNCTION "public"."migrate_catalog_to_product_details"() TO "anon";
GRANT ALL ON FUNCTION "public"."migrate_catalog_to_product_details"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."migrate_catalog_to_product_details"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_template_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_template_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_template_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."preserve_order_catalog_associations"() TO "anon";
GRANT ALL ON FUNCTION "public"."preserve_order_catalog_associations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."preserve_order_catalog_associations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."preview_inventory_hard_deletion"("input_inventory_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."preview_inventory_hard_deletion"("input_inventory_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."preview_inventory_hard_deletion"("input_inventory_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."record_material_usage"("p_material_id" "uuid", "p_order_id" "uuid", "p_job_card_id" "uuid", "p_component_id" "uuid", "p_quantity" numeric, "p_unit" "text", "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."record_material_usage"("p_material_id" "uuid", "p_order_id" "uuid", "p_job_card_id" "uuid", "p_component_id" "uuid", "p_quantity" numeric, "p_unit" "text", "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_material_usage"("p_material_id" "uuid", "p_order_id" "uuid", "p_job_card_id" "uuid", "p_component_id" "uuid", "p_quantity" numeric, "p_unit" "text", "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."record_material_usage_from_cutting_job"() TO "anon";
GRANT ALL ON FUNCTION "public"."record_material_usage_from_cutting_job"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_material_usage_from_cutting_job"() TO "service_role";



GRANT ALL ON FUNCTION "public"."record_order_material_usage"("p_order_id" "uuid", "p_order_number" "text", "p_material_id" "uuid", "p_quantity" numeric, "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."record_order_material_usage"("p_order_id" "uuid", "p_order_number" "text", "p_material_id" "uuid", "p_quantity" numeric, "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_order_material_usage"("p_order_id" "uuid", "p_order_number" "text", "p_material_id" "uuid", "p_quantity" numeric, "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_bill_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_bill_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_bill_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_config_value"("key" "text", "value" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."set_config_value"("key" "text", "value" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_config_value"("key" "text", "value" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_default_material_supplier"("p_material_id" "uuid", "p_supplier_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."set_default_material_supplier"("p_material_id" "uuid", "p_supplier_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_default_material_supplier"("p_material_id" "uuid", "p_supplier_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."soft_delete_inventory_item"("input_inventory_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."soft_delete_inventory_item"("input_inventory_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."soft_delete_inventory_item"("input_inventory_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_catalog_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_catalog_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_catalog_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_catalog_from_order"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_catalog_from_order"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_catalog_from_order"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_catalog_from_order_values"("p_template_id" "uuid", "p_bag_length" numeric, "p_bag_width" numeric, "p_default_quantity" integer, "p_default_rate" numeric, "p_cutting_charge" numeric, "p_printing_charge" numeric, "p_stitching_charge" numeric, "p_transport_charge" numeric, "p_height" numeric, "p_border_dimension" numeric, "p_material_cost" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."update_catalog_from_order_values"("p_template_id" "uuid", "p_bag_length" numeric, "p_bag_width" numeric, "p_default_quantity" integer, "p_default_rate" numeric, "p_cutting_charge" numeric, "p_printing_charge" numeric, "p_stitching_charge" numeric, "p_transport_charge" numeric, "p_height" numeric, "p_border_dimension" numeric, "p_material_cost" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_catalog_from_order_values"("p_template_id" "uuid", "p_bag_length" numeric, "p_bag_width" numeric, "p_default_quantity" integer, "p_default_rate" numeric, "p_cutting_charge" numeric, "p_printing_charge" numeric, "p_stitching_charge" numeric, "p_transport_charge" numeric, "p_height" numeric, "p_border_dimension" numeric, "p_material_cost" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_component_cost_calculation"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_component_cost_calculation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_component_cost_calculation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_component_material"("component_id" "uuid", "material_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_component_material"("component_id" "uuid", "material_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_component_material"("component_id" "uuid", "material_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_component_material_consumption"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_component_material_consumption"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_component_material_consumption"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_inventory_on_cutting_job"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_inventory_on_cutting_job"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_inventory_on_cutting_job"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_material_supplier_on_purchase"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_material_supplier_on_purchase"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_material_supplier_on_purchase"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_material_suppliers_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_material_suppliers_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_material_suppliers_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_orders_from_template"("template_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_orders_from_template"("template_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_orders_from_template"("template_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_product_details_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_product_details_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_product_details_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_sales_bills_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_sales_bills_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_sales_bills_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_template_from_order"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_template_from_order"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_template_from_order"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_charge_values"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_charge_values"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_charge_values"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_cutting_component_values"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_cutting_component_values"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_cutting_component_values"() TO "service_role";


















GRANT ALL ON TABLE "public"."inventory" TO "anon";
GRANT ALL ON TABLE "public"."inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory" TO "service_role";



GRANT ALL ON TABLE "public"."active_inventory" TO "anon";
GRANT ALL ON TABLE "public"."active_inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."active_inventory" TO "service_role";



GRANT ALL ON TABLE "public"."catalog" TO "anon";
GRANT ALL ON TABLE "public"."catalog" TO "authenticated";
GRANT ALL ON TABLE "public"."catalog" TO "service_role";



GRANT ALL ON TABLE "public"."catalog_component_materials" TO "anon";
GRANT ALL ON TABLE "public"."catalog_component_materials" TO "authenticated";
GRANT ALL ON TABLE "public"."catalog_component_materials" TO "service_role";



GRANT ALL ON TABLE "public"."catalog_components" TO "anon";
GRANT ALL ON TABLE "public"."catalog_components" TO "authenticated";
GRANT ALL ON TABLE "public"."catalog_components" TO "service_role";



GRANT ALL ON TABLE "public"."companies" TO "anon";
GRANT ALL ON TABLE "public"."companies" TO "authenticated";
GRANT ALL ON TABLE "public"."companies" TO "service_role";



GRANT ALL ON TABLE "public"."components" TO "anon";
GRANT ALL ON TABLE "public"."components" TO "authenticated";
GRANT ALL ON TABLE "public"."components" TO "service_role";



GRANT ALL ON TABLE "public"."cutting_components" TO "anon";
GRANT ALL ON TABLE "public"."cutting_components" TO "authenticated";
GRANT ALL ON TABLE "public"."cutting_components" TO "service_role";



GRANT ALL ON TABLE "public"."cutting_jobs" TO "anon";
GRANT ALL ON TABLE "public"."cutting_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."cutting_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."dispatch_batches" TO "anon";
GRANT ALL ON TABLE "public"."dispatch_batches" TO "authenticated";
GRANT ALL ON TABLE "public"."dispatch_batches" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_batches" TO "anon";
GRANT ALL ON TABLE "public"."inventory_batches" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_batches" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_locations" TO "anon";
GRANT ALL ON TABLE "public"."inventory_locations" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_locations" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_transaction_log" TO "anon";
GRANT ALL ON TABLE "public"."inventory_transaction_log" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_transaction_log" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_transaction_types" TO "anon";
GRANT ALL ON TABLE "public"."inventory_transaction_types" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_transaction_types" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_transactions" TO "anon";
GRANT ALL ON TABLE "public"."inventory_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."job_cards" TO "anon";
GRANT ALL ON TABLE "public"."job_cards" TO "authenticated";
GRANT ALL ON TABLE "public"."job_cards" TO "service_role";



GRANT ALL ON TABLE "public"."job_wastage" TO "anon";
GRANT ALL ON TABLE "public"."job_wastage" TO "authenticated";
GRANT ALL ON TABLE "public"."job_wastage" TO "service_role";



GRANT ALL ON TABLE "public"."material_categories" TO "anon";
GRANT ALL ON TABLE "public"."material_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."material_categories" TO "service_role";



GRANT ALL ON TABLE "public"."material_consumption_analysis" TO "anon";
GRANT ALL ON TABLE "public"."material_consumption_analysis" TO "authenticated";
GRANT ALL ON TABLE "public"."material_consumption_analysis" TO "service_role";



GRANT ALL ON TABLE "public"."material_consumption_summary" TO "anon";
GRANT ALL ON TABLE "public"."material_consumption_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."material_consumption_summary" TO "service_role";



GRANT ALL ON TABLE "public"."material_order_usage" TO "anon";
GRANT ALL ON TABLE "public"."material_order_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."material_order_usage" TO "service_role";



GRANT ALL ON TABLE "public"."material_suppliers" TO "anon";
GRANT ALL ON TABLE "public"."material_suppliers" TO "authenticated";
GRANT ALL ON TABLE "public"."material_suppliers" TO "service_role";



GRANT ALL ON TABLE "public"."material_usage_summary" TO "anon";
GRANT ALL ON TABLE "public"."material_usage_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."material_usage_summary" TO "service_role";



GRANT ALL ON TABLE "public"."order_components" TO "anon";
GRANT ALL ON TABLE "public"."order_components" TO "authenticated";
GRANT ALL ON TABLE "public"."order_components" TO "service_role";



GRANT ALL ON TABLE "public"."order_dispatches" TO "anon";
GRANT ALL ON TABLE "public"."order_dispatches" TO "authenticated";
GRANT ALL ON TABLE "public"."order_dispatches" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."order_material_breakdown" TO "anon";
GRANT ALL ON TABLE "public"."order_material_breakdown" TO "authenticated";
GRANT ALL ON TABLE "public"."order_material_breakdown" TO "service_role";



GRANT ALL ON SEQUENCE "public"."order_number_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."order_number_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."order_number_seq" TO "service_role";



GRANT ALL ON TABLE "public"."order_template_associations" TO "anon";
GRANT ALL ON TABLE "public"."order_template_associations" TO "authenticated";
GRANT ALL ON TABLE "public"."order_template_associations" TO "service_role";



GRANT ALL ON TABLE "public"."printing_jobs" TO "anon";
GRANT ALL ON TABLE "public"."printing_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."printing_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."product_details" TO "anon";
GRANT ALL ON TABLE "public"."product_details" TO "authenticated";
GRANT ALL ON TABLE "public"."product_details" TO "service_role";



GRANT ALL ON TABLE "public"."product_materials" TO "anon";
GRANT ALL ON TABLE "public"."product_materials" TO "authenticated";
GRANT ALL ON TABLE "public"."product_materials" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_items" TO "anon";
GRANT ALL ON TABLE "public"."purchase_items" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_items" TO "service_role";



GRANT ALL ON SEQUENCE "public"."purchase_number_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."purchase_number_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."purchase_number_seq" TO "service_role";



GRANT ALL ON TABLE "public"."purchases" TO "anon";
GRANT ALL ON TABLE "public"."purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."purchases" TO "service_role";



GRANT ALL ON TABLE "public"."sales_invoices" TO "anon";
GRANT ALL ON TABLE "public"."sales_invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_invoices" TO "service_role";



GRANT ALL ON TABLE "public"."stitching_jobs" TO "anon";
GRANT ALL ON TABLE "public"."stitching_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."stitching_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."suppliers" TO "anon";
GRANT ALL ON TABLE "public"."suppliers" TO "authenticated";
GRANT ALL ON TABLE "public"."suppliers" TO "service_role";



GRANT ALL ON TABLE "public"."system_config" TO "anon";
GRANT ALL ON TABLE "public"."system_config" TO "authenticated";
GRANT ALL ON TABLE "public"."system_config" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."vendors" TO "anon";
GRANT ALL ON TABLE "public"."vendors" TO "authenticated";
GRANT ALL ON TABLE "public"."vendors" TO "service_role";



GRANT ALL ON TABLE "public"."wastage_analysis" TO "anon";
GRANT ALL ON TABLE "public"."wastage_analysis" TO "authenticated";
GRANT ALL ON TABLE "public"."wastage_analysis" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
