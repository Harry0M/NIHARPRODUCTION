-- Drop existing trigger and function
DROP TRIGGER IF EXISTS update_inventory_on_purchase_complete ON purchases;
DROP FUNCTION IF EXISTS calculate_transport_adjusted_price();

-- Create a new function with debugging info
CREATE OR REPLACE FUNCTION calculate_transport_adjusted_price()
RETURNS TRIGGER AS $$
DECLARE
  total_weight NUMERIC := 0;
  per_kg_transport NUMERIC := 0;
  debug_info TEXT;
BEGIN
  -- Log the start of function execution
  RAISE NOTICE 'Transport price calculation triggered for purchase_id: %', NEW.id;
  RAISE NOTICE 'Transport charge amount: %', NEW.transport_charge;
  
  -- Calculate total weight of all items in the purchase
  SELECT COALESCE(SUM(pi.quantity * COALESCE(inv.conversion_rate, 1)), 0)
  INTO total_weight
  FROM purchase_items pi
  JOIN inventory inv ON pi.material_id = inv.id
  WHERE pi.purchase_id = NEW.id;
  
  RAISE NOTICE 'Total weight calculated: %', total_weight;
  
  -- Only proceed with transport charge calculation if there is weight and transport charge
  IF total_weight > 0 AND NEW.transport_charge > 0 THEN
    -- Calculate per kg transport charge
    per_kg_transport := NEW.transport_charge / total_weight;
    RAISE NOTICE 'Per kg transport charge: %', per_kg_transport;
    
    -- Let's modify our approach to update each material one by one with explicit logging
    FOR item_record IN 
      SELECT pi.material_id, pi.quantity, pi.unit_price, inv.conversion_rate, inv.purchase_price AS current_price
      FROM purchase_items pi
      JOIN inventory inv ON pi.material_id = inv.id
      WHERE pi.purchase_id = NEW.id
    LOOP
      -- Calculate weight and transport share with explicit values
      DECLARE
        this_weight NUMERIC;
        this_transport_share NUMERIC;
        new_unit_price NUMERIC;
      BEGIN
        this_weight := item_record.quantity * COALESCE(item_record.conversion_rate, 1);
        this_transport_share := this_weight * per_kg_transport;
        new_unit_price := item_record.unit_price + (this_transport_share / NULLIF(item_record.quantity, 0));
        
        -- Log before update
        RAISE NOTICE 'Material ID: %, Old price: %, Base price: %, Transport share: %, New price: %', 
          item_record.material_id, item_record.current_price, item_record.unit_price, 
          this_transport_share, new_unit_price;
        
        -- Update inventory with explicit transport-adjusted price
        UPDATE inventory
        SET purchase_price = new_unit_price,
            updated_at = NOW()
        WHERE id = item_record.material_id;
        
        -- Verify the update happened
        SELECT purchase_price INTO debug_info FROM inventory WHERE id = item_record.material_id;
        RAISE NOTICE 'Updated price in DB: %', debug_info;
      END;
    END LOOP;
    
    -- Also update inventory quantities 
    UPDATE inventory inv
    SET quantity = inv.quantity + pi.quantity,
        updated_at = NOW()
    FROM purchase_items pi
    WHERE pi.purchase_id = NEW.id
    AND inv.id = pi.material_id;
    
  ELSE
    RAISE NOTICE 'Skipping transport calculation (weight or charge is zero)';
    -- If no transport charge or weight, just update with the base unit price
    UPDATE inventory inv
    SET purchase_price = pi.unit_price,
        updated_at = NOW()
    FROM purchase_items pi
    WHERE pi.purchase_id = NEW.id
    AND inv.id = pi.material_id;
  END IF;
  
  RAISE NOTICE 'Transport price calculation completed';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger with HIGH priority
CREATE TRIGGER update_inventory_on_purchase_complete
AFTER UPDATE OF status ON purchases
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
EXECUTE FUNCTION calculate_transport_adjusted_price();

-- Check for any other triggers that might be interfering
DO $$
DECLARE
  trigger_record RECORD;
BEGIN
  RAISE NOTICE 'Listing all triggers on purchases table:';
  FOR trigger_record IN
    SELECT trigger_name, event_manipulation, action_statement
    FROM information_schema.triggers
    WHERE event_object_table = 'purchases'
    ORDER BY action_order
  LOOP
    RAISE NOTICE 'Trigger: %, Event: %, Action: %', 
      trigger_record.trigger_name, trigger_record.event_manipulation, trigger_record.action_statement;
  END LOOP;
END;
$$;
