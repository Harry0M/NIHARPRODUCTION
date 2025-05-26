-- Check the component_type constraint definition
SELECT
    tc.constraint_name,
    cc.check_clause
FROM
    information_schema.table_constraints tc
JOIN
    information_schema.check_constraints cc
    ON tc.constraint_name = cc.constraint_name
WHERE
    tc.table_name = 'order_components'
    AND tc.constraint_type = 'CHECK'
    AND tc.constraint_name = 'order_components_component_type_check';

-- List all components with their types to see what's currently in use
SELECT 
    component_type, 
    COUNT(*) as count
FROM 
    order_components
GROUP BY 
    component_type
ORDER BY 
    count DESC; 