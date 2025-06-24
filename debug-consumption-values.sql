-- Debug SQL to investigate consumption value changes during order save/load cycle
-- Execute this to understand what's happening to consumption values

-- 1. Check current order components and their consumption values
SELECT 
    'CURRENT COMPONENTS' as debug_stage,
    oc.id,
    oc.component_type,
    oc.consumption,
    oc.formula,
    oc.is_manual_consumption,
    oc.length,
    oc.width,
    oc.roll_width,
    oc.material_id,
    inv.material_name,
    inv.purchase_rate,
    o.order_number,
    o.quantity as order_quantity
FROM order_components oc
LEFT JOIN inventory inv ON oc.material_id = inv.id
LEFT JOIN orders o ON oc.order_id = o.id
WHERE oc.order_id = (
    SELECT id FROM orders 
    ORDER BY created_at DESC 
    LIMIT 1
)
ORDER BY oc.component_type;

-- 2. Check if any database functions are being called that modify consumption
-- Look for recent entries in postgres logs that might show function calls
-- This would need to be run in a database with logging enabled

-- 3. Test if saving a component triggers any consumption recalculation
-- Insert a test component and see what happens to consumption values
DO $$
DECLARE
    test_order_id UUID;
    test_consumption NUMERIC := 5.1234;
    result_consumption NUMERIC;
BEGIN
    -- Get the most recent order ID
    SELECT id INTO test_order_id 
    FROM orders 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Log what we're doing
    RAISE NOTICE 'Testing consumption preservation with order_id: %, initial consumption: %', 
        test_order_id, test_consumption;
    
    -- Insert a test component with specific consumption
    INSERT INTO order_components (
        order_id,
        component_type,
        consumption,
        formula,
        is_manual_consumption,
        material_id,
        length,
        width,
        roll_width
    ) VALUES (
        test_order_id,
        'test_part',
        test_consumption,
        'manual',
        true,
        NULL, -- No material to avoid material cost calculations
        NULL,
        NULL,
        NULL
    );
    
    -- Immediately check what value was stored
    SELECT consumption INTO result_consumption
    FROM order_components
    WHERE order_id = test_order_id 
    AND component_type = 'test_part';
    
    RAISE NOTICE 'Result after INSERT: Expected %, Got %', test_consumption, result_consumption;
    
    -- Update the component and see if consumption changes
    UPDATE order_components 
    SET component_type = 'test_part_updated'
    WHERE order_id = test_order_id 
    AND component_type = 'test_part';
    
    -- Check consumption after update
    SELECT consumption INTO result_consumption
    FROM order_components
    WHERE order_id = test_order_id 
    AND component_type = 'test_part_updated';
    
    RAISE NOTICE 'Result after UPDATE: Expected %, Got %', test_consumption, result_consumption;
    
    -- Clean up test data
    DELETE FROM order_components 
    WHERE order_id = test_order_id 
    AND component_type = 'test_part_updated';
    
    RAISE NOTICE 'Test cleanup completed';
END $$;

-- 4. Check if there are any other triggers on order_components
SELECT 
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'order_components';

-- 5. Look for any functions that might be called after order save/load
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name LIKE '%consumption%' 
   OR routine_name LIKE '%component%'
   OR routine_definition ILIKE '%order_components%'
ORDER BY routine_name;
