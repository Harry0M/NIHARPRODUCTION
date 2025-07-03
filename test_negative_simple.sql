-- Simple test to verify negative inventory functionality
-- This will show actual results instead of just notices

-- First, let's see current inventory levels
SELECT 
    material_name,
    quantity,
    unit
FROM inventory 
WHERE quantity > 0 
ORDER BY quantity DESC
LIMIT 5;

-- Now let's test with a specific material
WITH test_material AS (
    SELECT id, material_name, quantity 
    FROM inventory 
    WHERE quantity > 0 
    LIMIT 1
)
SELECT 
    tm.material_name,
    tm.quantity as original_quantity,
    record_order_material_usage(
        gen_random_uuid(),
        'TEST-NEGATIVE-' || extract(epoch from now()),
        tm.id,
        tm.quantity + 30, -- Use 30 more than available
        'Testing negative inventory'
    ) as function_result
FROM test_material tm;

-- Check the results - should show negative inventory
SELECT 
    material_name,
    quantity,
    unit,
    CASE 
        WHEN quantity < 0 THEN 'NEGATIVE - SUCCESS!'
        ELSE 'Still positive'
    END as status
FROM inventory 
WHERE quantity < 0
ORDER BY quantity ASC
LIMIT 10;
