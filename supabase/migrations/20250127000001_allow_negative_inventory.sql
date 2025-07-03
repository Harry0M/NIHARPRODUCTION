-- Migration: Allow negative inventory values in transactions
-- This removes the GREATEST(0, ...) constraint that prevents negative inventory
-- and allows proper tracking of negative inventory states

-- Update the record_order_material_usage function to allow negative inventory
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
  
  -- Update inventory quantity - ALLOW NEGATIVE VALUES
  UPDATE public.inventory
  SET 
    quantity = quantity - p_quantity,
    updated_at = now()
  WHERE id = p_material_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error recording material usage: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Add comment explaining the change
COMMENT ON FUNCTION "public"."record_order_material_usage"("p_order_id" "uuid", "p_order_number" "text", "p_material_id" "uuid", "p_quantity" numeric, "p_notes" "text") IS 'Records material usage for orders. Updated to allow negative inventory values for proper tracking of material shortages.';

-- Update the update_inventory_on_cutting_job function to allow negative inventory
CREATE OR REPLACE FUNCTION "public"."update_inventory_on_cutting_job"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    component_record RECORD;
    material_id UUID;
    consumption NUMERIC;
    component_type TEXT;
    transaction_notes TEXT;
BEGIN
    -- Only process when cutting job is completed or status changes to something other than pending
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
                
                -- Update the inventory quantity - ALLOW NEGATIVE VALUES
                UPDATE inventory
                SET quantity = quantity - consumption
                WHERE id = material_id;
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Add comment explaining the change
COMMENT ON FUNCTION "public"."update_inventory_on_cutting_job"() IS 'Updates inventory when cutting jobs are completed. Updated to allow negative inventory values for proper tracking of material shortages.';

-- Log the migration
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: Inventory transactions now allow negative values';
END
$$;
