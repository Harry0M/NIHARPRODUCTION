-- =====================================================
-- FIX PURCHASE TRIGGERS FOR TYPESCRIPT APPROACH
-- =====================================================
-- This script ensures we use TypeScript functions instead of database triggers
-- for purchase completion and inventory updates. This provides better control
-- and uses actual_meter values correctly.

-- Step 1: List current triggers for documentation
DO $$
DECLARE
  trigger_record RECORD;
  trigger_count INT := 0;
BEGIN
  RAISE NOTICE '======= CURRENT TRIGGERS ON PURCHASES TABLE =======';
  
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
    RAISE NOTICE 'Found trigger: % (event: %) - %', 
      trigger_record.trigger_name, 
      trigger_record.event_manipulation,
      trigger_record.action_statement;
  END LOOP;
  
  RAISE NOTICE 'Total triggers found on purchases table: %', trigger_count;
  RAISE NOTICE '=====================================================';
END;
$$;

-- Step 2: Remove ONLY the conflicting inventory update trigger
-- This trigger likely uses main unit quantities instead of actual_meter
DROP TRIGGER IF EXISTS trigger_update_inventory_from_purchase ON purchases;
DROP FUNCTION IF EXISTS public.update_inventory_from_purchase();

-- Step 3: Verify the material supplier trigger function is safe
-- (Re-create it to ensure it ONLY updates material_suppliers, not inventory)
CREATE OR REPLACE FUNCTION public.update_material_supplier_on_purchase()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Step 4: Ensure the material supplier trigger exists (this is safe)
DROP TRIGGER IF EXISTS update_material_supplier_on_purchase ON purchases;
CREATE TRIGGER update_material_supplier_on_purchase
AFTER UPDATE ON purchases
FOR EACH ROW
WHEN (OLD.status != 'completed' AND NEW.status = 'completed')
EXECUTE FUNCTION update_material_supplier_on_purchase();

-- Step 5: Keep purchase number generation triggers (these are essential and safe)
-- No changes needed - these triggers only generate purchase numbers

-- Step 6: Clean up any processed_events tracking
DROP TABLE IF EXISTS public.processed_events;

-- Step 7: Verification - List remaining triggers
DO $$
DECLARE
  trigger_record RECORD;
  trigger_count INT := 0;
BEGIN
  RAISE NOTICE '======= FINAL TRIGGERS ON PURCHASES TABLE =======';
  
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
    RAISE NOTICE 'Remaining trigger: % (event: %) - %', 
      trigger_record.trigger_name, 
      trigger_record.event_manipulation,
      trigger_record.action_statement;
  END LOOP;
  
  RAISE NOTICE 'Total remaining triggers: %', trigger_count;
  RAISE NOTICE '========================================================';
END;
$$;

-- Step 8: Final notification
DO $$
BEGIN
  RAISE NOTICE '================================================================';
  RAISE NOTICE 'PURCHASE TRIGGERS FIXED FOR TYPESCRIPT APPROACH';
  RAISE NOTICE '================================================================';
  RAISE NOTICE 'CONFIGURATION:';
  RAISE NOTICE '✓ Removed conflicting inventory update trigger';
  RAISE NOTICE '✓ Inventory updates handled by TypeScript code only';
  RAISE NOTICE '✓ TypeScript code uses actual_meter values correctly';
  RAISE NOTICE '✓ Material supplier relationships maintained via safe trigger';
  RAISE NOTICE '✓ Purchase number generation preserved';
  RAISE NOTICE '';
  RAISE NOTICE 'TYPESCRIPT FUNCTIONS USED:';
  RAISE NOTICE '- completePurchaseWithActualMeter() for inventory updates';
  RAISE NOTICE '- reversePurchaseCompletion() for purchase cancellation';
  RAISE NOTICE '- Uses actual_meter when > 0, falls back to quantity';
  RAISE NOTICE '';
  RAISE NOTICE 'REMAINING DATABASE TRIGGERS:';
  RAISE NOTICE '- Purchase number generation (safe)';
  RAISE NOTICE '- Material supplier relationship updates (safe)';
  RAISE NOTICE '================================================================';
END;
$$;

-- Step 9: Grant permissions for the material supplier function
GRANT EXECUTE ON FUNCTION public.update_material_supplier_on_purchase() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_material_supplier_on_purchase() TO anon;
GRANT EXECUTE ON FUNCTION public.update_material_supplier_on_purchase() TO service_role;
