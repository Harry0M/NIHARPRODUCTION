-- Disable conflicting purchase triggers that interfere with TypeScript deletion logic
-- These triggers are causing duplicate/conflicting inventory transactions

-- Drop the purchase completion trigger that's causing transaction conflicts
DROP TRIGGER IF EXISTS log_purchase_completion_trigger ON purchases;

-- Optionally, we can also drop the function if it's no longer needed
-- DROP FUNCTION IF EXISTS log_purchase_completion();

-- Keep the purchase number generation triggers as they are still needed
-- set_purchase_number and trigger_generate_purchase_number will remain active
-- update_material_supplier_on_purchase will also remain active

-- Note: The TypeScript utilities (completePurchaseWithActualMeter and reversePurchaseCompletion)
-- now handle all inventory management, making the database trigger redundant and problematic.
