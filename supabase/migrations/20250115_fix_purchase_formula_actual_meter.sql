-- Migration to add actual_meter column to purchase_items and update purchase formula logic
-- This fixes the purchase formula to use "Actual Meter" instead of "Main Quantity" for inventory transactions

-- Step 1: Add actual_meter column to purchase_items table
ALTER TABLE public.purchase_items 
ADD COLUMN IF NOT EXISTS actual_meter NUMERIC DEFAULT 0;

-- Step 2: Update the column to be NOT NULL with default 0
UPDATE public.purchase_items 
SET actual_meter = 0 
WHERE actual_meter IS NULL;

ALTER TABLE public.purchase_items 
ALTER COLUMN actual_meter SET NOT NULL;

-- Step 3: Add comment to explain the column
COMMENT ON COLUMN public.purchase_items.actual_meter IS 
'Actual meter quantity used for inventory calculations instead of main quantity';

-- Step 4: Drop the existing triggers and functions that use quantity
DROP TRIGGER IF EXISTS update_inventory_on_purchase_complete ON purchases;
DROP TRIGGER IF EXISTS purchases_status_trigger ON purchases;
DROP FUNCTION IF EXISTS calculate_transport_adjusted_price();
DROP FUNCTION IF EXISTS handle_purchase_status_change();

-- Step 5: Create new function that uses actual_meter for inventory calculations
CREATE OR REPLACE FUNCTION public.handle_purchase_completion_with_actual_meter()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
  curr_qty NUMERIC;
  already_processed BOOLEAN;
  event_id UUID;
  v_transport_charge NUMERIC;
  v_total_weight NUMERIC;
  v_per_kg_transport NUMERIC;
BEGIN
  -- Set a variable to track source in logs
  PERFORM set_config('app.source', 'purchase_actual_meter_trigger', false);

  -- Only process when status changes to 'completed'
  IF (TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed') THEN
    RAISE NOTICE 'START - Processing purchase completion with ACTUAL METER for purchase ID: %', NEW.id;
    
    -- Check if this purchase completion has already been processed
    SELECT EXISTS (
      SELECT 1 FROM processed_events 
      WHERE event_type = 'purchase_completed' AND reference_id = NEW.id
    ) INTO already_processed;
    
    IF already_processed THEN
      RAISE NOTICE 'SKIPPING - This purchase (ID: %) has already been processed', NEW.id;
      RETURN NEW;
    END IF;
    
    -- Mark this purchase as processed to prevent duplicate processing
    INSERT INTO processed_events (event_type, reference_id)
    VALUES ('purchase_completed', NEW.id)
    RETURNING id INTO event_id;
    
    RAISE NOTICE 'PROCESSING - Created process record (ID: %) for purchase: %', event_id, NEW.id;
    
    -- Get transport charge value for price calculations
    v_transport_charge := NEW.transport_charge;
    
    -- Calculate transport-adjusted pricing if transport charge exists
    IF v_transport_charge > 0 THEN
      -- Calculate total weight using actual_meter instead of quantity
      SELECT COALESCE(SUM(pi.actual_meter * COALESCE(inv.conversion_rate, 1)), 0)
      INTO v_total_weight
      FROM purchase_items pi
      JOIN inventory inv ON pi.material_id = inv.id
      WHERE pi.purchase_id = NEW.id;
      
      -- Calculate per kg transport if we have weight
      IF v_total_weight > 0 THEN
        v_per_kg_transport := v_transport_charge / v_total_weight;
        RAISE NOTICE 'Transport calculation: Total charge: %, Total weight: %kg, Per kg: %', 
          v_transport_charge, v_total_weight, v_per_kg_transport;
      ELSE
        v_per_kg_transport := 0;
        RAISE NOTICE 'No weight calculated, transport per kg set to 0';
      END IF;
    ELSE
      v_per_kg_transport := 0;
      RAISE NOTICE 'No transport charge, per kg transport set to 0';
    END IF;
    
    -- Process each purchase item and update inventory using ACTUAL_METER
    FOR item IN (
      SELECT 
        pi.material_id,
        pi.quantity as main_quantity,
        pi.actual_meter,
        pi.unit_price,
        i.material_name,
        i.quantity as current_inventory_quantity,
        COALESCE(i.conversion_rate, 1) as conversion_rate
      FROM 
        purchase_items pi
        JOIN inventory i ON pi.material_id = i.id
      WHERE 
        pi.purchase_id = NEW.id
    )
    LOOP
      RAISE NOTICE 'Processing material: % (ID: %)', item.material_name, item.material_id;
      RAISE NOTICE '  - Main quantity: %, Actual meter: %, Current inventory: %', 
        item.main_quantity, item.actual_meter, item.current_inventory_quantity;
      
      -- Use ACTUAL_METER for inventory quantity updates instead of main quantity
      DECLARE
        inventory_update_quantity NUMERIC;
        adjusted_unit_price NUMERIC;
        item_weight NUMERIC;
        transport_share_per_unit NUMERIC;
      BEGIN
        -- Use actual_meter for inventory updates (this is the key change)
        inventory_update_quantity := item.actual_meter;
        
        -- Calculate transport-adjusted unit price if needed
        IF v_per_kg_transport > 0 THEN
          item_weight := item.actual_meter * item.conversion_rate;
          transport_share_per_unit := (item_weight * v_per_kg_transport) / NULLIF(item.actual_meter, 0);
          adjusted_unit_price := item.unit_price + transport_share_per_unit;
          
          RAISE NOTICE '  - Item weight: %kg, Transport share per unit: %, Adjusted price: %', 
            item_weight, transport_share_per_unit, adjusted_unit_price;
        ELSE
          adjusted_unit_price := item.unit_price;
        END IF;
        
        -- Update inventory quantity using ACTUAL_METER
        UPDATE inventory
        SET 
          quantity = quantity + inventory_update_quantity,
          purchase_price = adjusted_unit_price,
          updated_at = NOW()
        WHERE id = item.material_id;
        
        -- Get updated quantity for logging
        SELECT quantity INTO curr_qty 
        FROM inventory 
        WHERE id = item.material_id;
        
        RAISE NOTICE '  - Updated inventory: before=%, after=%, added=%', 
          item.current_inventory_quantity, curr_qty, inventory_update_quantity;
        RAISE NOTICE '  - Updated purchase price: %', adjusted_unit_price;
        
        -- Add transaction record using ACTUAL_METER quantity
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory_transactions') THEN
          INSERT INTO inventory_transactions (
            material_id,
            transaction_type,
            quantity,
            description,
            purchase_id,
            created_by
          ) VALUES (
            item.material_id,
            'PURCHASE',
            inventory_update_quantity, -- Use actual_meter here too
            'Purchase ' || NEW.purchase_number || ' completed (using actual meter: ' || inventory_update_quantity || ')',
            NEW.id,
            NEW.created_by
          );
          
          RAISE NOTICE '  - Added transaction record with actual meter quantity: %', inventory_update_quantity;
        ELSE
          RAISE NOTICE '  - Skipping transaction record - inventory_transactions table does not exist';
        END IF;
      END;
    END LOOP;
    
    RAISE NOTICE 'FINISHED - Processing purchase completion with actual meter for ID: %', NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ERROR in handle_purchase_completion_with_actual_meter: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create the new trigger using the actual_meter function
CREATE TRIGGER purchases_actual_meter_trigger
AFTER UPDATE ON purchases
FOR EACH ROW
EXECUTE FUNCTION public.handle_purchase_completion_with_actual_meter();

-- Step 7: Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_purchase_completion_with_actual_meter() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_purchase_completion_with_actual_meter() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_purchase_completion_with_actual_meter() TO service_role;

-- Step 8: Add notification about the change
DO $$
BEGIN
  RAISE NOTICE '=== PURCHASE FORMULA FIX APPLIED ===';
  RAISE NOTICE 'Purchase inventory calculations now use ACTUAL_METER instead of MAIN_QUANTITY';
  RAISE NOTICE 'Transport price calculations also updated to use actual_meter values';
  RAISE NOTICE 'This ensures accurate inventory tracking based on actual material received';
  RAISE NOTICE '=============================================';
END;
$$;
