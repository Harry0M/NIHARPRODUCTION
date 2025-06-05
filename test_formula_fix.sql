-- Simple test to verify formula field fix
-- Run this after applying the database fix

-- 1. Check current triggers (should only show the correct ones)
SELECT 'Current triggers on catalog_components:' as step;
SELECT 
    t.tgname as trigger_name,
    p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'catalog_components'
AND t.tgname NOT LIKE 'RI_%'
ORDER BY t.tgname;

-- 2. Test formula preservation with a simple insert
-- Get any existing catalog_id for testing
DO $$
DECLARE
    test_catalog_id UUID;
    manual_id UUID;
    standard_id UUID;
    linear_id UUID;
BEGIN
    -- Get a catalog_id for testing
    SELECT id INTO test_catalog_id FROM catalog LIMIT 1;
    
    IF test_catalog_id IS NOT NULL THEN
        RAISE NOTICE 'Testing with catalog_id: %', test_catalog_id;
        
        -- Test 1: Manual formula should preserve consumption
        INSERT INTO catalog_components (
            catalog_id, 
            component_type, 
            formula, 
            consumption,
            is_manual_consumption
        ) VALUES (
            test_catalog_id,
            'part', 
            'manual', 
            15.5, -- This should be preserved exactly
            true
        ) RETURNING id INTO manual_id;
        
        -- Test 2: Standard formula should calculate consumption
        INSERT INTO catalog_components (
            catalog_id, 
            component_type, 
            formula, 
            consumption,
            is_manual_consumption,
            length,
            width,
            roll_width
        ) VALUES (
            test_catalog_id,
            'part', 
            'standard', 
            0, -- This should be recalculated
            false,
            10,
            5,
            100
        ) RETURNING id INTO standard_id;
        
        -- Test 3: Linear formula should calculate consumption
        INSERT INTO catalog_components (
            catalog_id, 
            component_type, 
            formula, 
            consumption,
            is_manual_consumption,
            length
        ) VALUES (
            test_catalog_id,
            'part', 
            'linear', 
            0, -- This should be recalculated
            false,
            50
        ) RETURNING id INTO linear_id;
        
        -- Check results
        SELECT 'TEST RESULTS:' as results;
        
        SELECT 
            'Manual formula test' as test_type,
            formula,
            consumption,
            is_manual_consumption,
            CASE 
                WHEN formula = 'manual' AND consumption = 15.5 AND is_manual_consumption = true 
                THEN '✅ PASS' 
                ELSE '❌ FAIL' 
            END as result
        FROM catalog_components 
        WHERE id = manual_id;
        
        SELECT 
            'Standard formula test' as test_type,
            formula,
            consumption,
            is_manual_consumption,
            CASE 
                WHEN formula = 'standard' AND consumption > 0 AND is_manual_consumption = false 
                THEN '✅ PASS' 
                ELSE '❌ FAIL' 
            END as result
        FROM catalog_components 
        WHERE id = standard_id;
        
        SELECT 
            'Linear formula test' as test_type,
            formula,
            consumption,
            is_manual_consumption,
            CASE 
                WHEN formula = 'linear' AND consumption > 0 AND is_manual_consumption = false 
                THEN '✅ PASS' 
                ELSE '❌ FAIL' 
            END as result
        FROM catalog_components 
        WHERE id = linear_id;
        
        -- Clean up test data
        DELETE FROM catalog_components WHERE id IN (manual_id, standard_id, linear_id);
        RAISE NOTICE 'Test data cleaned up';
        
    ELSE
        RAISE NOTICE 'No catalog records found for testing';
    END IF;
END $$;
