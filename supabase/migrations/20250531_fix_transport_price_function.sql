-- Drop and recreate the function to fix the ambiguous column reference

-- Drop existing trigger first since it depends on the function
DROP TRIGGER IF EXISTS update_inventory_on_purchase_complete ON purchases;

-- Now drop the function
DROP FUNCTION IF EXISTS calculate_transport_adjusted_price();

-- Recreate the function with the fixed column reference
CREATE OR REPLACE FUNCTION calculate_transport_adjusted_price()
RETURNS TRIGGER AS $$
DECLARE
  total_weight NUMERIC := 0;
  per_kg_transport NUMERIC := 0;
BEGIN
  -- Calculate total weight of all items in the purchase
  SELECT COALESCE(SUM(pi.quantity * COALESCE(inv.conversion_rate, 1)), 0)
  INTO total_weight
  FROM purchase_items pi
  JOIN inventory inv ON pi.material_id = inv.id
  WHERE pi.purchase_id = NEW.id;
  
  -- Only proceed with transport charge calculation if there is weight and transport charge
  IF total_weight > 0 AND NEW.transport_charge > 0 THEN
    -- Calculate per kg transport charge
    per_kg_transport := NEW.transport_charge / total_weight;
    
    -- Update inventory with transport-adjusted prices directly
    -- This avoids using FOR loops by doing a single UPDATE with calculated values
    UPDATE inventory inv
    SET purchase_price = pi.unit_price + (
        (pi.quantity * COALESCE(inv.conversion_rate, 1) * per_kg_transport) / 
        NULLIF(pi.quantity, 0)
      ),
      updated_at = NOW()
    FROM purchase_items pi
    WHERE pi.purchase_id = NEW.id
    AND inv.id = pi.material_id;
  ELSE
    -- If no transport charge or weight, just update with the base unit price
    UPDATE inventory inv
    SET purchase_price = pi.unit_price,
        updated_at = NOW()
    FROM purchase_items pi
    WHERE pi.purchase_id = NEW.id
    AND inv.id = pi.material_id;
  END IF;
  
  -- Also update inventory quantities when purchase is completed
  UPDATE inventory inv
  SET quantity = inv.quantity + pi.quantity,
      updated_at = NOW()
  FROM purchase_items pi
  WHERE pi.purchase_id = NEW.id
  AND inv.id = pi.material_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_inventory_on_purchase_complete ON purchases;

-- Recreate the trigger
CREATE TRIGGER update_inventory_on_purchase_complete
AFTER UPDATE OF status ON purchases
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
EXECUTE FUNCTION calculate_transport_adjusted_price();

-- Add a comment explaining the purpose of this trigger
COMMENT ON TRIGGER update_inventory_on_purchase_complete ON purchases IS 
'Updates inventory quantities and purchase price (including transport charge) when a purchase is marked as completed';
