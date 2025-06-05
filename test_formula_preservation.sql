-- Test script to verify formula preservation fix
-- This will help verify that formulas are being saved correctly

-- First, let's check the current state of components
SELECT 
    cc.component_type,
    cc.formula,
    cc.is_manual_consumption,
    cc.consumption,
    c.name as product_name
FROM catalog_components cc
LEFT JOIN catalogs c ON cc.catalog_id = c.id
WHERE cc.formula IS NOT NULL
ORDER BY c.name, cc.component_type;

-- Test case 1: Create a test product with linear formula
DO $$
DECLARE
    test_catalog_id UUID;
    test_component_id UUID;
BEGIN
    -- Insert test catalog product
    INSERT INTO catalogs (
        name, 
        description, 
        bag_length, 
        bag_width, 
        default_quantity, 
        total_cost
    ) VALUES (
        'Test Formula Preservation', 
        'Testing that linear formula is preserved', 
        36, 
        24, 
        1000, 
        50.00
    ) RETURNING id INTO test_catalog_id;
    
    -- Insert component with LINEAR formula
    INSERT INTO catalog_components (
        catalog_id,
        component_type,
        length,
        consumption,
        formula,
        is_manual_consumption
    ) VALUES (
        test_catalog_id,
        'handle',
        36,
        0.9144, -- 36 inches / 39.37 inches per meter
        'linear',
        false
    ) RETURNING id INTO test_component_id;
    
    RAISE NOTICE 'Created test product with ID: % and component with ID: %', test_catalog_id, test_component_id;
    
    -- Verify the formula was saved correctly
    PERFORM 
        component_type,
        formula,
        is_manual_consumption,
        consumption
    FROM catalog_components 
    WHERE id = test_component_id;
    
    IF FOUND THEN
        RAISE NOTICE 'Component created successfully';
    ELSE
        RAISE NOTICE 'ERROR: Component not found';
    END IF;
    
END $$;

-- Verify our test case
SELECT 
    'After Creation' as test_phase,
    cc.component_type,
    cc.formula,
    cc.is_manual_consumption,
    cc.consumption,
    c.name as product_name
FROM catalog_components cc
LEFT JOIN catalogs c ON cc.catalog_id = c.id
WHERE c.name = 'Test Formula Preservation'
ORDER BY cc.component_type;
