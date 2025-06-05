-- COMPREHENSIVE FIX FOR FORMULA FIELD OVERRIDE ISSUE
-- This script addresses multiple triggers conflicting with formula field preservation

-- 1. First, let's check what calculate_component_consumption function does
SELECT 'Checking calculate_component_consumption function:' as step;
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'calculate_component_consumption';

-- 2. Check all current triggers
SELECT 'Current triggers on catalog_components:' as step;
SELECT 
    t.tgname as trigger_name,
    t.tgenabled as trigger_enabled,
    p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'catalog_components'
AND t.tgname NOT LIKE 'RI_%'
ORDER BY t.tgname;

-- 3. Drop the problematic trigger that's overriding our formula field
DROP TRIGGER IF EXISTS tr_calculate_component_consumption ON catalog_components;

-- 4. Also drop the duplicate trigger to avoid conflicts
DROP TRIGGER IF EXISTS catalog_component_consumption_trigger ON catalog_components;

-- 5. Keep only the main trigger with our corrected function
-- The calculate_catalog_consumption trigger should remain with our fixed update_catalog_component_consumption function

-- 6. Verify the formula field is working by testing an insert
SELECT 'Testing formula field preservation:' as step;

-- Test insert with standard formula
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
    (SELECT id FROM catalog LIMIT 1), -- Use any existing catalog_id
    'Test Component', 
    'standard', 
    0, -- Should be recalculated
    false,
    10,
    5,
    100
) RETURNING id, formula, consumption, is_manual_consumption;

-- Test insert with manual formula
INSERT INTO catalog_components (
    catalog_id, 
    component_type, 
    formula, 
    consumption,
    is_manual_consumption
) VALUES (
    (SELECT id FROM catalog LIMIT 1), -- Use any existing catalog_id
    'Test Manual Component', 
    'manual', 
    15.75, -- Should be preserved
    true
) RETURNING id, formula, consumption, is_manual_consumption;

-- Test insert with linear formula
INSERT INTO catalog_components (
    catalog_id, 
    component_type, 
    formula, 
    consumption,
    is_manual_consumption,
    length
) VALUES (
    (SELECT id FROM catalog LIMIT 1), -- Use any existing catalog_id
    'Test Linear Component', 
    'linear', 
    0, -- Should be recalculated
    false,
    50
) RETURNING id, formula, consumption, is_manual_consumption;

-- 7. Clean up test records
SELECT 'Cleaning up test records:' as step;
DELETE FROM catalog_components WHERE component_type LIKE 'Test%Component';

SELECT 'Fix completed. Formula field should now be preserved correctly.' as result;
