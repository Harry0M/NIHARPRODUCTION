-- Clean slate approach for transport price calculation
-- Drop existing trigger and function
DROP TRIGGER IF EXISTS update_inventory_on_purchase_complete ON purchases;
DROP FUNCTION IF EXISTS calculate_transport_adjusted_price();

-- Create a simpler, more direct function without loops
CREATE OR REPLACE FUNCTION calculate_transport_adjusted_price()
RETURNS TRIGGER AS $$
DECLARE
  v_transport_charge NUMERIC;
  v_total_weight NUMERIC;
  v_per_kg_transport NUMERIC;
BEGIN
  -- Get transport charge value
  v_transport_charge := NEW.transport_charge;
  
  -- Skip everything if no transport charge
  IF v_transport_charge <= 0 THEN
    -- Just update quantities and base prices without transport adjustment
    UPDATE inventory inv
    SET 
      quantity = inv.quantity + pi.quantity,
      purchase_price = pi.unit_price,
      updated_at = NOW()
    FROM purchase_items pi
    WHERE pi.purchase_id = NEW.id
    AND inv.id = pi.material_id;
    
    RETURN NEW;
  END IF;
  
  -- Calculate total weight of all items in purchase
  SELECT COALESCE(SUM(pi.quantity * COALESCE(inv.conversion_rate, 1)), 0)
  INTO v_total_weight
  FROM purchase_items pi
  JOIN inventory inv ON pi.material_id = inv.id
  WHERE pi.purchase_id = NEW.id;
  
  -- If no weight, exit early
  IF v_total_weight <= 0 THEN
    -- Just update quantities and base prices without transport adjustment
    UPDATE inventory inv
    SET 
      quantity = inv.quantity + pi.quantity,
      purchase_price = pi.unit_price,
      updated_at = NOW()
    FROM purchase_items pi
    WHERE pi.purchase_id = NEW.id
    AND inv.id = pi.material_id;
    
    RETURN NEW;
  END IF;
  
  -- Calculate per kg transport
  v_per_kg_transport := v_transport_charge / v_total_weight;
  
  -- Direct update with complex calculation to avoid loops
  UPDATE inventory inv
  SET 
    -- Update quantity
    quantity = inv.quantity + pi.quantity,
    
    -- Update purchase price with transport charge included
    purchase_price = pi.unit_price + (
      (pi.quantity * COALESCE(inv.conversion_rate, 1) * v_per_kg_transport) / 
      NULLIF(pi.quantity, 0)
    ),
    
    updated_at = NOW()
  FROM purchase_items pi
  WHERE pi.purchase_id = NEW.id
  AND inv.id = pi.material_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger with HIGH priority
CREATE TRIGGER update_inventory_on_purchase_complete
AFTER UPDATE OF status ON purchases
FOR EACH ROW
WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
EXECUTE FUNCTION calculate_transport_adjusted_price();

-- Add comment explaining what this trigger does
COMMENT ON TRIGGER update_inventory_on_purchase_complete ON purchases IS 
'Updates inventory quantities and purchase prices including transport charges when a purchase is completed';

-- Add a query to explain what we've done
DO $$
BEGIN
  RAISE NOTICE 'Updated the purchase completion trigger to include transport charges in purchase prices.';
  RAISE NOTICE 'When a purchase is marked as completed, inventory quantities and prices will be updated.';
  RAISE NOTICE 'The purchase price will include the transport share based on weight.';
END;
$$;
