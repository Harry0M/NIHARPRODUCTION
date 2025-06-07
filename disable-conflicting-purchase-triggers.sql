-- =====================================================
-- DISABLE CONFLICTING PURCHASE TRIGGERS
-- =====================================================
-- This script disables database triggers that cause duplicate inventory transactions
-- when purchases are completed. The TypeScript code in purchaseInventoryUtils.ts
-- already correctly handles inventory updates using actual_meter values.

-- Step 1: List all existing triggers on purchases table for documentation
DO $$
DECLARE
  trigger_record RECORD;
  trigger_count INT := 0;
BEGIN
  RAISE NOTICE '======= EXISTING TRIGGERS ON PURCHASES TABLE =======';
  
  FOR trigger_record IN (
    SELECT 
      trigger_name,
      event_manipulation,
      action_statement
    FROM information_schema.triggers
    WHERE event_object_table = 'purchases'
      AND trigger_schema = 'public'
    ORDER BY trigger_name
  ) LOOP
    trigger_count := trigger_count + 1;
    RAISE NOTICE 'Found trigger: % (event: %)', 
      trigger_record.trigger_name, 
      trigger_record.event_manipulation;
  END LOOP;
  
  RAISE NOTICE 'Total triggers found on purchases table: %', trigger_count;
  RAISE NOTICE '=====================================================';
END;
$$;

-- Step 2: Drop all conflicting purchase-related triggers that update inventory
-- These triggers were causing duplicate inventory transactions alongside the TypeScript code

-- Main purchase status triggers that update inventory
DROP TRIGGER IF EXISTS purchases_status_trigger ON purchases;
DROP TRIGGER IF EXISTS update_inventory_on_purchase_complete ON purchases;
DROP TRIGGER IF EXISTS purchases_actual_meter_trigger ON purchases;
DROP TRIGGER IF EXISTS on_purchase_status_change ON purchases;
DROP TRIGGER IF EXISTS purchases_after_update_trigger ON purchases;

-- Transport price calculation triggers (these also update inventory quantities)
DROP TRIGGER IF EXISTS calculate_transport_adjusted_price ON purchases;
DROP TRIGGER IF EXISTS transport_price_trigger ON purchases;

-- Material supplier update triggers (these don't affect inventory but run on completion)
DROP TRIGGER IF EXISTS update_material_supplier_on_purchase ON purchases;

-- Step 3: Drop the corresponding functions that were used by these triggers
-- Keep only the functions that don't update inventory directly

DROP FUNCTION IF EXISTS public.handle_purchase_status_change();
DROP FUNCTION IF EXISTS public.handle_purchase_completion_with_actual_meter();
DROP FUNCTION IF EXISTS public.calculate_transport_adjusted_price();

-- Keep the material supplier function but recreate trigger with a safer approach
-- This function only updates material_suppliers table, not inventory
CREATE OR REPLACE FUNCTION public.update_material_supplier_on_purchase()
RETURNS TRIGGER AS $$
DECLARE
    item_record RECORD;
BEGIN
    -- Only update material suppliers relationship, DO NOT touch inventory
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
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
        
        RAISE NOTICE 'Updated material supplier relationships for purchase %', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate only the material supplier trigger (this doesn't affect inventory)
CREATE TRIGGER update_material_supplier_on_purchase
AFTER UPDATE ON purchases
FOR EACH ROW
WHEN (OLD.status != 'completed' AND NEW.status = 'completed')
EXECUTE FUNCTION update_material_supplier_on_purchase();

-- Step 4: Keep the purchase number generation trigger (this doesn't affect inventory)
-- This trigger should remain as it only generates purchase numbers

-- Step 5: Clean up any processed_events entries to prevent issues
-- Remove the processed_events tracking since we're moving away from database triggers
DROP TABLE IF EXISTS public.processed_events;

-- Step 6: Verification - List remaining triggers
DO $$
DECLARE
  trigger_record RECORD;
  trigger_count INT := 0;
BEGIN
  RAISE NOTICE '======= REMAINING TRIGGERS ON PURCHASES TABLE =======';
  
  FOR trigger_record IN (
    SELECT 
      trigger_name,
      event_manipulation,
      action_statement
    FROM information_schema.triggers
    WHERE event_object_table = 'purchases'
      AND trigger_schema = 'public'
    ORDER BY trigger_name
  ) LOOP
    trigger_count := trigger_count + 1;
    RAISE NOTICE 'Remaining trigger: % (event: %)', 
      trigger_record.trigger_name, 
      trigger_record.event_manipulation;
  END LOOP;
  
  RAISE NOTICE 'Total remaining triggers: %', trigger_count;
  RAISE NOTICE '========================================================';
END;
$$;

-- Step 7: Add final notification
DO $$
BEGIN
  RAISE NOTICE '================================================================';
  RAISE NOTICE 'CONFLICTING PURCHASE TRIGGERS HAVE BEEN DISABLED';
  RAISE NOTICE '================================================================';
  RAISE NOTICE 'The following actions have been completed:';
  RAISE NOTICE '1. Removed database triggers that update inventory on purchase completion';
  RAISE NOTICE '2. Inventory updates are now handled ONLY by TypeScript code';
  RAISE NOTICE '3. TypeScript code correctly uses actual_meter values for inventory';
  RAISE NOTICE '4. Material supplier relationships are still maintained';
  RAISE NOTICE '5. Purchase number generation is preserved';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '- Test purchase completion to verify no duplicate transactions';
  RAISE NOTICE '- Monitor inventory_transaction_log for single entries per purchase';
  RAISE NOTICE '- Verify actual_meter values are used correctly';
  RAISE NOTICE '================================================================';
END;
$$;

-- Step 8: Grant permissions for the remaining functions
GRANT EXECUTE ON FUNCTION public.update_material_supplier_on_purchase() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_material_supplier_on_purchase() TO anon;
GRANT EXECUTE ON FUNCTION public.update_material_supplier_on_purchase() TO service_role;
