-- Migration to add soft delete capability to inventory items

-- 1. Add is_deleted column to inventory table
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;

-- 2. Add deleted_at column to inventory table
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- 3. Create function for soft deleting an inventory item
CREATE OR REPLACE FUNCTION public.soft_delete_inventory_item(input_inventory_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item_name TEXT;
  affected_rows INT;
BEGIN
  -- Check if inventory item exists
  SELECT material_name INTO item_name FROM public.inventory WHERE id = input_inventory_id;
  
  IF item_name IS NULL THEN
    RAISE EXCEPTION 'Inventory item with ID % does not exist', input_inventory_id;
  END IF;
  
  -- Check if item name already contains [DELETED] to avoid double marking
  IF item_name LIKE '%[DELETED]' THEN
    RAISE EXCEPTION 'This item is already marked as deleted';
  END IF;

  -- Delete any related inventory transaction records
  -- Only check if the table exists to avoid errors
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory_transactions') THEN
    DELETE FROM public.inventory_transactions WHERE material_id = input_inventory_id;
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RAISE NOTICE 'Deleted % transaction records', affected_rows;
  END IF;

  -- Mark the inventory item as deleted instead of actually deleting it
  UPDATE public.inventory
  SET 
    is_deleted = true,
    deleted_at = NOW(),
    material_name = material_name || ' [DELETED]' -- Mark name to indicate deletion
  WHERE id = input_inventory_id;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error soft-deleting inventory item: %', SQLERRM;
END;
$$;

-- 4. Create or replace view for active inventory items (not deleted)
CREATE OR REPLACE VIEW public.active_inventory AS
SELECT * FROM public.inventory
WHERE is_deleted = false;

-- 5. Modify any existing views or functions that should only show active inventory
-- Update inventory list query in the application to filter by is_deleted = false

-- 6. Grant appropriate permissions
GRANT ALL ON FUNCTION public.soft_delete_inventory_item(input_inventory_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.soft_delete_inventory_item(input_inventory_id uuid) TO service_role;
GRANT ALL ON FUNCTION public.soft_delete_inventory_item(input_inventory_id uuid) TO anon;

GRANT SELECT ON public.active_inventory TO authenticated;
GRANT SELECT ON public.active_inventory TO anon;
GRANT SELECT ON public.active_inventory TO service_role;

-- 7. Create RPC endpoint for the frontend
COMMENT ON FUNCTION public.soft_delete_inventory_item IS 'Safely marks an inventory item as deleted without physically removing it, preserving purchase history';
