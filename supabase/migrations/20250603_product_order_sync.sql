-- Migration to add functionality for syncing product edits to related orders
-- This ensures when a catalog item is edited, all orders using that product are updated (except quantity)
-- Also ensures editing orders doesn't modify the product

-- First, drop the existing trigger that might be causing the reverse issue (editing orders affecting products)
DROP TRIGGER IF EXISTS update_catalog_from_order ON public.orders;

-- Function to update orders when a catalog item is updated
CREATE OR REPLACE FUNCTION update_orders_from_catalog()
RETURNS TRIGGER AS $$
BEGIN
    -- Update all orders that use this catalog item
    -- We specifically exclude quantity (as requested) and preserve special_instructions
    UPDATE public.orders
    SET 
        bag_length = NEW.bag_length,
        bag_width = NEW.bag_width,
        border_dimension = NEW.border_dimension,
        rate = NEW.selling_rate,
        updated_at = NOW()
    WHERE 
        catalog_id = NEW.id;

    -- Return the NEW record to complete the trigger
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to execute the function when a catalog item is updated
DROP TRIGGER IF EXISTS update_orders_on_catalog_update ON public.catalog;
CREATE TRIGGER update_orders_on_catalog_update
AFTER UPDATE ON public.catalog
FOR EACH ROW
EXECUTE FUNCTION update_orders_from_catalog();

-- Add a comment to describe what this trigger does
COMMENT ON TRIGGER update_orders_on_catalog_update ON public.catalog IS 
'When a catalog item is updated, update all related orders with the new dimensions and price, but keep order quantities unchanged';
