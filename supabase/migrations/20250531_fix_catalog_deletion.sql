-- Fixed catalog product deletion function
-- Removed order_items check that was causing the 400 error
CREATE OR REPLACE FUNCTION public.delete_catalog_product(input_catalog_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  component_id uuid;
BEGIN
  -- Check if catalog product exists
  IF NOT EXISTS (SELECT 1 FROM public.catalog WHERE id = input_catalog_id) THEN
    RAISE EXCEPTION 'Catalog product with ID % does not exist', input_catalog_id;
  END IF;

  -- First get all component IDs related to this catalog
  FOR component_id IN 
    SELECT id FROM public.catalog_components WHERE catalog_id = input_catalog_id
  LOOP
    -- Delete material associations for each component
    DELETE FROM public.catalog_component_materials
    WHERE catalog_component_id = component_id;
  END LOOP;
  
  -- Now delete all components
  DELETE FROM public.catalog_components
  WHERE catalog_id = input_catalog_id;
  
  -- Finally delete the catalog product itself
  DELETE FROM public.catalog
  WHERE id = input_catalog_id;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error deleting catalog product: %', SQLERRM;
END;
$$;

-- Update permissions
GRANT ALL ON FUNCTION public.delete_catalog_product(input_catalog_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.delete_catalog_product(input_catalog_id uuid) TO service_role;
