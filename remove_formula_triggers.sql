-- Remove problematic database triggers and functions
-- Keep only the schema with proper columns for frontend formula handling

-- Drop the problematic triggers first
DROP TRIGGER IF EXISTS calculate_catalog_consumption ON public.catalog_components;
DROP TRIGGER IF EXISTS catalog_component_consumption_trigger ON public.catalog_components;
DROP TRIGGER IF EXISTS update_material_info_trigger ON public.catalog_components;

-- Drop the problematic functions that override formula values
DROP FUNCTION IF EXISTS public.update_catalog_component_consumption();
DROP FUNCTION IF EXISTS public.calculate_component_consumption();
DROP FUNCTION IF EXISTS public.update_material_info();

-- Ensure the catalog_components table has the correct schema
-- (This is just for verification - the table should already exist with these columns)
/*
Table should have these columns:
- id uuid (primary key)
- catalog_id uuid (foreign key to catalog.id)
- component_type text
- size text
- color text
- gsm numeric
- custom_name text
- created_at timestamp
- updated_at timestamp
- material_id uuid
- roll_width numeric
- consumption numeric
- length numeric
- width numeric
- material_linked boolean (default false)
- formula text (stores 'standard', 'linear', or 'manual')
- is_manual_consumption boolean (default false)
*/

-- Update any existing records that might have incorrect formula values
-- Set formula to 'manual' for records where is_manual_consumption is true
UPDATE public.catalog_components 
SET formula = 'manual' 
WHERE is_manual_consumption = true AND (formula IS NULL OR formula != 'manual');

-- Set formula to 'standard' for records where formula is null and not manual
UPDATE public.catalog_components 
SET formula = 'standard' 
WHERE formula IS NULL AND (is_manual_consumption = false OR is_manual_consumption IS NULL);

-- Verification query to check the current state
SELECT 
    component_type,
    formula,
    is_manual_consumption,
    consumption,
    length,
    width,
    roll_width
FROM public.catalog_components 
ORDER BY created_at DESC 
LIMIT 10;
