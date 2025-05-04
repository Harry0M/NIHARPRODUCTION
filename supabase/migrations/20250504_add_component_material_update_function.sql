
-- Function to update component material information with verification
CREATE OR REPLACE FUNCTION public.update_component_material(component_id UUID, material_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.catalog_components
  SET 
    material_id = $2,
    material_linked = TRUE,
    updated_at = NOW()
  WHERE id = $1;
  
  -- Verify the update was successful
  RETURN EXISTS (
    SELECT 1 FROM public.catalog_components 
    WHERE id = $1 AND material_id = $2 AND material_linked = TRUE
  );
END;
$$;
