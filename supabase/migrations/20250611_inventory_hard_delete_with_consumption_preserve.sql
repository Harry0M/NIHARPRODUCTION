-- Migration to improve inventory deletion - hard delete while preserving consumption transactions
-- This replaces the soft delete approach with a hard delete that maintains data integrity

-- 1. Create improved function for hard deleting inventory item while preserving consumption transactions
CREATE OR REPLACE FUNCTION public.hard_delete_inventory_with_consumption_preserve(input_inventory_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item_name TEXT;
  deleted_transactions_count INT := 0;
  preserved_transactions_count INT := 0;
  result jsonb;
BEGIN
  -- Check if inventory item exists
  SELECT material_name INTO item_name
  FROM public.inventory 
  WHERE id = input_inventory_id;
  
  IF item_name IS NULL THEN
    RAISE EXCEPTION 'Inventory item with ID % does not exist', input_inventory_id;
  END IF;
  
  -- Log start of deletion process
  RAISE NOTICE 'Starting hard deletion of inventory item: % (ID: %)', item_name, input_inventory_id;
  
  -- Step 1: Count existing transactions for reporting
  SELECT COUNT(*) INTO deleted_transactions_count
  FROM public.inventory_transaction_log 
  WHERE material_id = input_inventory_id
  AND transaction_type != 'consumption';
  
  SELECT COUNT(*) INTO preserved_transactions_count
  FROM public.inventory_transaction_log 
  WHERE material_id = input_inventory_id
  AND transaction_type = 'consumption';
  
  RAISE NOTICE 'Found % non-consumption transactions to delete, % consumption transactions to preserve', 
    deleted_transactions_count, preserved_transactions_count;
  
  -- Step 2: Delete all non-consumption transaction logs
  -- Keep only consumption transactions as they represent actual material usage
  DELETE FROM public.inventory_transaction_log 
  WHERE material_id = input_inventory_id
  AND transaction_type IN (
    'purchase',
    'adjustment', 
    'manual',
    'purchase-reversal',
    'job-card-reversal',
    'correction',
    'transfer',
    'return',
    'wastage',
    'initial-stock'
  );
  
  RAISE NOTICE 'Deleted % non-consumption transaction logs', deleted_transactions_count;
  
  -- Step 3: Delete from inventory_transactions table if it exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory_transactions') THEN
    DELETE FROM public.inventory_transactions WHERE material_id = input_inventory_id;
    RAISE NOTICE 'Deleted records from inventory_transactions table';
  END IF;
  
  -- Step 4: Check for purchase items that reference this inventory
  -- Remove the foreign key references but keep purchase history
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'purchase_items') THEN
    UPDATE public.purchase_items 
    SET material_id = NULL
    WHERE material_id = input_inventory_id;
    RAISE NOTICE 'Removed material references from purchase_items (purchase history preserved)';
  END IF;
  
  -- Step 5: Check for order components that reference this inventory
  -- Keep order components but remove material reference
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'order_components') THEN
    UPDATE public.order_components 
    SET material_id = NULL
    WHERE material_id = input_inventory_id;
    RAISE NOTICE 'Removed material references from order_components (order history preserved)';
  END IF;
  
  -- Step 6: Check for catalog component materials that reference this inventory
  -- Remove references but keep catalog structure
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'catalog_component_materials') THEN
    DELETE FROM public.catalog_component_materials 
    WHERE material_id = input_inventory_id;
    RAISE NOTICE 'Removed material references from catalog_component_materials';
  END IF;
  
  -- Step 7: Finally delete the inventory item itself (hard delete)
  DELETE FROM public.inventory WHERE id = input_inventory_id;
  RAISE NOTICE 'Hard deleted inventory item: %', item_name;
  
  -- Step 8: Prepare result summary
  result := jsonb_build_object(
    'success', true,
    'inventory_id', input_inventory_id,
    'material_name', item_name,
    'deletion_type', 'hard_delete',
    'transactions_deleted', deleted_transactions_count,
    'consumption_transactions_preserved', preserved_transactions_count,
    'message', format('Successfully hard deleted inventory item "%s". Deleted %s non-consumption transactions, preserved %s consumption transactions.', 
      item_name, deleted_transactions_count, preserved_transactions_count)
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error hard deleting inventory item "%" (ID: %): %', item_name, input_inventory_id, SQLERRM;
END;
$$;

-- 2. Create a function to get deletion preview (what will be deleted vs preserved)
CREATE OR REPLACE FUNCTION public.preview_inventory_hard_deletion(input_inventory_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item_name TEXT;
  transactions_to_delete INT := 0;
  transactions_to_preserve INT := 0;
  purchase_items_count INT := 0;
  order_components_count INT := 0;
  catalog_materials_count INT := 0;
  result jsonb;
BEGIN
  -- Check if inventory item exists
  SELECT material_name INTO item_name FROM public.inventory WHERE id = input_inventory_id;
  
  IF item_name IS NULL THEN
    RAISE EXCEPTION 'Inventory item with ID % does not exist', input_inventory_id;
  END IF;
  
  -- Count transactions to be deleted (non-consumption)
  SELECT COUNT(*) INTO transactions_to_delete
  FROM public.inventory_transaction_log 
  WHERE material_id = input_inventory_id
  AND transaction_type != 'consumption';
  
  -- Count transactions to be preserved (consumption only)
  SELECT COUNT(*) INTO transactions_to_preserve
  FROM public.inventory_transaction_log 
  WHERE material_id = input_inventory_id
  AND transaction_type = 'consumption';
  
  -- Count purchase items that will lose material reference
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'purchase_items') THEN
    SELECT COUNT(*) INTO purchase_items_count
    FROM public.purchase_items 
    WHERE material_id = input_inventory_id;
  END IF;
  
  -- Count order components that will lose material reference
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'order_components') THEN
    SELECT COUNT(*) INTO order_components_count
    FROM public.order_components 
    WHERE material_id = input_inventory_id;
  END IF;
  
  -- Count catalog component materials that will be deleted
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'catalog_component_materials') THEN
    SELECT COUNT(*) INTO catalog_materials_count
    FROM public.catalog_component_materials 
    WHERE material_id = input_inventory_id;
  END IF;
  
  result := jsonb_build_object(
    'inventory_id', input_inventory_id,
    'material_name', item_name,
    'deletion_preview', jsonb_build_object(
      'will_be_deleted', jsonb_build_object(
        'inventory_item', true,
        'non_consumption_transactions', transactions_to_delete,
        'catalog_material_references', catalog_materials_count
      ),
      'will_be_preserved', jsonb_build_object(
        'consumption_transactions', transactions_to_preserve,
        'purchase_history', purchase_items_count,
        'order_history', order_components_count
      ),
      'will_be_modified', jsonb_build_object(
        'purchase_items_lose_material_ref', purchase_items_count,
        'order_components_lose_material_ref', order_components_count
      )
    ),
    'summary', format('Hard deletion will remove the inventory item and %s non-consumption transactions, while preserving %s consumption transactions and related order/purchase history.', 
      transactions_to_delete, transactions_to_preserve)
  );
  
  RETURN result;
END;
$$;

-- 3. Grant appropriate permissions
GRANT ALL ON FUNCTION public.hard_delete_inventory_with_consumption_preserve(input_inventory_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.hard_delete_inventory_with_consumption_preserve(input_inventory_id uuid) TO service_role;

GRANT ALL ON FUNCTION public.preview_inventory_hard_deletion(input_inventory_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.preview_inventory_hard_deletion(input_inventory_id uuid) TO service_role;

-- 4. Add comments explaining the functions
COMMENT ON FUNCTION public.hard_delete_inventory_with_consumption_preserve IS 
'Completely deletes an inventory item while preserving consumption transactions. Removes all non-consumption transaction types (purchases, adjustments, etc.) but keeps consumption records for audit trail. Also removes material references from related tables while preserving order and purchase history.';

COMMENT ON FUNCTION public.preview_inventory_hard_deletion IS 
'Provides a preview of what will be deleted vs preserved when hard deleting an inventory item. Use this before calling the actual deletion function to understand the impact.';

-- 5. Migration notes and instructions
DO $$
BEGIN
  RAISE NOTICE '================================================================';
  RAISE NOTICE 'INVENTORY HARD DELETE WITH CONSUMPTION PRESERVATION - CREATED';
  RAISE NOTICE '================================================================';
  RAISE NOTICE 'New functions available:';
  RAISE NOTICE '1. hard_delete_inventory_with_consumption_preserve(uuid) - Performs hard deletion';
  RAISE NOTICE '2. preview_inventory_hard_deletion(uuid) - Shows deletion preview';
  RAISE NOTICE '';
  RAISE NOTICE 'Key Features:';
  RAISE NOTICE '- Completely removes inventory item (hard delete)';
  RAISE NOTICE '- Preserves consumption transactions for audit trail';
  RAISE NOTICE '- Deletes all other transaction types (purchase, adjustment, etc.)';
  RAISE NOTICE '- Maintains order and purchase history integrity';
  RAISE NOTICE '- Provides detailed deletion summary';
  RAISE NOTICE '';
  RAISE NOTICE 'Usage:';
  RAISE NOTICE '- Preview: SELECT preview_inventory_hard_deletion(''uuid-here'');';
  RAISE NOTICE '- Delete: SELECT hard_delete_inventory_with_consumption_preserve(''uuid-here'');';
  RAISE NOTICE '================================================================';
END;
$$;
