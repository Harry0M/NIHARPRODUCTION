-- Disable all purchase completion triggers to allow TypeScript inventory management
-- This ensures the TypeScript code in purchaseInventoryUtils.ts handles all inventory updates

-- Drop all existing purchase completion triggers
DROP TRIGGER IF EXISTS update_inventory_on_purchase_complete ON purchases;
DROP TRIGGER IF EXISTS purchases_status_trigger ON purchases;
DROP TRIGGER IF EXISTS purchases_after_update_trigger ON purchases;
DROP TRIGGER IF EXISTS on_purchase_status_change ON purchases;
DROP TRIGGER IF EXISTS purchases_actual_meter_trigger ON purchases;

-- Drop related functions
DROP FUNCTION IF EXISTS calculate_transport_adjusted_price();
DROP FUNCTION IF EXISTS handle_purchase_status_change();
DROP FUNCTION IF EXISTS handle_purchase_completion_with_actual_meter();

-- Add a note that TypeScript is handling inventory updates
COMMENT ON TABLE purchases IS 'Inventory updates for purchases are handled by TypeScript code in purchaseInventoryUtils.ts, not database triggers';

-- Create a simple logging function to track when purchases are completed (for debugging)
CREATE OR REPLACE FUNCTION log_purchase_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log when status changes to completed
  IF (TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed') THEN
    RAISE NOTICE 'Purchase % marked as completed. Inventory will be updated by TypeScript code.', NEW.purchase_number;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a simple logging trigger (no inventory updates)
CREATE TRIGGER log_purchase_completion_trigger
AFTER UPDATE OF status ON purchases
FOR EACH ROW
EXECUTE FUNCTION log_purchase_completion();

-- Add comment explaining the approach
COMMENT ON TRIGGER log_purchase_completion_trigger ON purchases IS 'Logs purchase completion. Actual inventory updates are handled by TypeScript in completePurchaseWithActualMeter().';

-- Verify no inventory-updating triggers remain
DO $$
DECLARE
  trigger_record RECORD;
  trigger_count INT := 0;
BEGIN
  RAISE NOTICE '=== CHECKING FOR REMAINING PURCHASE TRIGGERS ===';
  
  FOR trigger_record IN (
    SELECT trigger_name, event_manipulation
    FROM information_schema.triggers
    WHERE event_object_table = 'purchases'
    ORDER BY trigger_name
  ) LOOP
    trigger_count := trigger_count + 1;
    RAISE NOTICE 'Active trigger: % (event: %)', trigger_record.trigger_name, trigger_record.event_manipulation;
  END LOOP;
  
  IF trigger_count = 1 THEN
    RAISE NOTICE 'SUCCESS: Only logging trigger remains. TypeScript will handle inventory updates.';
  ELSE
    RAISE NOTICE 'WARNING: % triggers found. Expected only 1 logging trigger.', trigger_count;
  END IF;
  
  RAISE NOTICE '=== TRIGGER CHECK COMPLETE ===';
END;
$$;
