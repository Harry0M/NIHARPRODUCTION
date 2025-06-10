-- Fix for inventory hard delete constraint issue
-- The purchase_items.material_id column has NOT NULL constraint but we need to allow NULL
-- for hard delete functionality while preserving purchase history

-- Step 1: Remove the NOT NULL constraint from purchase_items.material_id
ALTER TABLE public.purchase_items 
ALTER COLUMN material_id DROP NOT NULL;

-- Step 2: Update the foreign key constraint to handle NULL values properly
-- The existing constraint will still work with NULL values, so no change needed there

-- Verify the change
SELECT 
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default
FROM information_schema.columns c
WHERE c.table_name = 'purchase_items' 
  AND c.table_schema = 'public'
  AND c.column_name = 'material_id';
