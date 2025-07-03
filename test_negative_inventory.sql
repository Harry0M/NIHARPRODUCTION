-- Test script to verify negative inventory is now allowed
-- This script will test the inventory system with negative values

-- First, let's check if we can update inventory to a negative value directly
DO $$
DECLARE
    test_material_id UUID;
    test_result BOOLEAN;
BEGIN
    -- Find a material to test with
    SELECT id INTO test_material_id 
    FROM inventory 
    WHERE quantity > 0 
    LIMIT 1;
    
    IF test_material_id IS NOT NULL THEN
        -- Try to use the record_order_material_usage function with more quantity than available
        SELECT record_order_material_usage(
            gen_random_uuid(), -- dummy order id
            'TEST-ORDER-' || extract(epoch from now()), -- test order number
            test_material_id,
            9999, -- Use a large quantity that should make inventory negative
            'Test negative inventory functionality'
        ) INTO test_result;
        
        IF test_result THEN
            RAISE NOTICE 'SUCCESS: Negative inventory is now allowed!';
            
            -- Check the actual quantity
            DECLARE
                current_quantity NUMERIC;
                mat_name TEXT;
            BEGIN
                SELECT quantity, material_name 
                INTO current_quantity, mat_name
                FROM inventory 
                WHERE id = test_material_id;
                
                RAISE NOTICE 'Material: % now has quantity: %', mat_name, current_quantity;
                
                IF current_quantity < 0 THEN
                    RAISE NOTICE 'CONFIRMED: Negative inventory values are working correctly!';
                ELSE
                    RAISE NOTICE 'WARNING: Quantity is still non-negative: %', current_quantity;
                END IF;
            END;
        ELSE
            RAISE NOTICE 'FAILED: record_order_material_usage returned false';
        END IF;
    ELSE
        RAISE NOTICE 'No materials found in inventory to test with';
    END IF;
END
$$;
