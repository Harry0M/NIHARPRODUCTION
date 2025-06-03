-- Migration to fix product-order synchronization issues
-- 1. Stops orders from affecting catalog items (fixes reverse sync issue)
-- 2. Enhances product-to-order sync while preserving order quantities

-- First, drop the trigger that causes orders to update catalog items (the reverse issue)
DROP TRIGGER IF EXISTS trigger_update_catalog_from_order ON public.orders;

-- If the update_catalog_from_order function exists but isn't used elsewhere, we can drop it
-- However, we'll comment this out in case it's used by other parts of the system
-- DROP FUNCTION IF EXISTS update_catalog_from_order();

-- Modify the existing sync_catalog_changes function to properly handle orders
-- This ensures order quantities aren't changed when catalog items are updated
CREATE OR REPLACE FUNCTION sync_catalog_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if relevant fields have changed that should be synced to orders
    IF (OLD.bag_length != NEW.bag_length OR 
        OLD.bag_width != NEW.bag_width OR 
        OLD.border_dimension != NEW.border_dimension OR 
        OLD.cutting_charge != NEW.cutting_charge OR
        OLD.printing_charge != NEW.printing_charge OR
        OLD.stitching_charge != NEW.stitching_charge OR
        OLD.transport_charge != NEW.transport_charge OR
        OLD.selling_rate != NEW.selling_rate OR
        OLD.margin != NEW.margin)
    THEN
        -- Update all orders linked to this catalog item
        -- EXPLICITLY EXCLUDE quantity as requested
        UPDATE public.orders
        SET 
            bag_length = NEW.bag_length,
            bag_width = NEW.bag_width,
            border_dimension = NEW.border_dimension,
            cutting_charge = NEW.cutting_charge,
            printing_charge = NEW.printing_charge,
            stitching_charge = NEW.stitching_charge,
            transport_charge = NEW.transport_charge,
            rate = NEW.selling_rate,
            margin = NEW.margin,
            material_cost = NEW.material_cost,
            total_cost = NEW.total_cost,
            -- calculated_selling_price can be derived from rate * quantity
            calculated_selling_price = NEW.selling_rate * orders.quantity,
            updated_at = NOW()
        WHERE 
            (catalog_id = NEW.id OR template_id = NEW.id)
            AND template_sync_enabled = true;
            
        -- Log for debugging purposes
        RAISE NOTICE 'Updated orders linked to catalog id %', NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Make sure the sync_catalog_changes trigger exists
-- If it already exists (as shown in your schema), this will be skipped
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_sync_catalog_changes' 
        AND tgrelid = 'public.catalog'::regclass
    ) THEN
        CREATE TRIGGER trigger_sync_catalog_changes
        AFTER UPDATE ON public.catalog
        FOR EACH ROW
        EXECUTE FUNCTION sync_catalog_changes();
    END IF;
END
$$;

-- Add helpful comments
COMMENT ON FUNCTION sync_catalog_changes() IS 
'Updates orders when catalog items change, preserving order quantities';

COMMENT ON TRIGGER trigger_sync_catalog_changes ON public.catalog IS 
'When catalog items are updated, propagate changes to related orders while preserving quantities';
