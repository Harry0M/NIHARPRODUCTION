-- Migration to fix purchase double-counting issue when inventory is updated

-- Add debug logging function for inventory changes
CREATE OR REPLACE FUNCTION public.log_inventory_change()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger for logging inventory changes
DROP TRIGGER IF EXISTS inventory_change_logger ON inventory;
CREATE TRIGGER inventory_change_logger
AFTER UPDATE OF quantity ON public.inventory
FOR EACH ROW
EXECUTE FUNCTION public.log_inventory_change();

-- IMPORTANT: Let's find all purchase-related triggers that might be causing double-counting
DO $$
DECLARE
  trigger_record RECORD;
  trigger_count INT := 0;
BEGIN
  -- Count and log all triggers on the purchases table
  FOR trigger_record IN (
    SELECT 
      trigger_name,
      event_manipulation,
      action_statement
    FROM information_schema.triggers
    WHERE event_object_table = 'purchases'
  ) LOOP
    trigger_count := trigger_count + 1;
    RAISE NOTICE 'Found trigger on purchases table: % (event: %)', 
      trigger_record.trigger_name, 
      trigger_record.event_manipulation;
  END LOOP;
  
  RAISE NOTICE 'Total triggers found on purchases table: %', trigger_count;
  
  -- Also count triggers on purchase_items table that might affect inventory
  trigger_count := 0;
  FOR trigger_record IN (
    SELECT 
      trigger_name,
      event_manipulation,
      action_statement
    FROM information_schema.triggers
    WHERE event_object_table = 'purchase_items'
  ) LOOP
    trigger_count := trigger_count + 1;
    RAISE NOTICE 'Found trigger on purchase_items table: % (event: %)', 
      trigger_record.trigger_name, 
      trigger_record.event_manipulation;
  END LOOP;
  
  RAISE NOTICE 'Total triggers found on purchase_items table: %', trigger_count;
END;
$$;

-- STEP 1: Drop ALL existing triggers related to purchase status changes to prevent duplication
DROP TRIGGER IF EXISTS purchases_status_trigger ON purchases;
DROP TRIGGER IF EXISTS update_inventory_on_purchase_complete ON purchases;
DROP TRIGGER IF EXISTS on_purchase_status_change ON purchases;
DROP TRIGGER IF EXISTS purchases_after_update_trigger ON purchases;

-- STEP 2: Create a flag table to prevent double processing
CREATE TABLE IF NOT EXISTS public.processed_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR NOT NULL,
  reference_id UUID NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_type, reference_id)
);

-- STEP 3: Create a new, improved version of the purchase status update function
CREATE OR REPLACE FUNCTION public.handle_purchase_status_change()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
  curr_qty NUMERIC;
  already_processed BOOLEAN;
  event_id UUID;
BEGIN
  -- Set a variable to track source in logs
  PERFORM set_config('app.source', 'purchase_trigger', false);

  -- Only process when status changes to 'completed'
  IF (TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed') THEN
    RAISE NOTICE 'START - Processing purchase status change to COMPLETED for purchase ID: %', NEW.id;
    
    -- Check if this purchase completion has already been processed (prevents double counting)
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
    
    -- Process each purchase item and update inventory
    FOR item IN (
      SELECT 
        pi.material_id,
        pi.quantity,
        i.material_name,
        i.quantity as current_quantity
      FROM 
        purchase_items pi
        JOIN inventory i ON pi.material_id = i.id
      WHERE 
        pi.purchase_id = NEW.id
    )
    LOOP
      RAISE NOTICE 'Updating inventory for material: % (ID: %), Current qty: %, Adding: %', 
        item.material_name, item.material_id, item.current_quantity, item.quantity;
      
      -- Update inventory quantity
      UPDATE inventory
      SET 
        quantity = quantity + item.quantity,
        updated_at = NOW()
      WHERE id = item.material_id;
      
      -- Get updated quantity for logging
      SELECT quantity INTO curr_qty 
      FROM inventory 
      WHERE id = item.material_id;
      
      RAISE NOTICE 'Updated inventory quantity for %: before=%, after=%, added=%', 
        item.material_name, item.current_quantity, curr_qty, item.quantity;
      
      -- Add transaction record only if the table exists
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
          item.quantity,
          'Purchase ' || NEW.purchase_number || ' completed',
          NEW.id,
          NEW.created_by
        );
        
        RAISE NOTICE 'Added transaction record for material: %', item.material_id;
      ELSE
        RAISE NOTICE 'Skipping transaction record - inventory_transactions table does not exist';
      END IF;
    END LOOP;
    
    RAISE NOTICE 'FINISHED - Processing purchase completion for ID: %', NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ERROR in handle_purchase_status_change: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 4: Create ONLY ONE trigger for purchase status changes
CREATE TRIGGER purchases_status_trigger
AFTER UPDATE ON purchases
FOR EACH ROW
EXECUTE FUNCTION public.handle_purchase_status_change();

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_purchase_status_change() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_purchase_status_change() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_purchase_status_change() TO service_role;

-- STEP 5: Modify the PurchaseDetail component in code to NOT manually update inventory quantities
-- (This will be handled by the database trigger only)
