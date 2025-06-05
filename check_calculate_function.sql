-- Check the calculate_component_consumption function definition
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'calculate_component_consumption';

-- Check all triggers on catalog_components table
SELECT 
    t.tgname as trigger_name,
    t.tgenabled as trigger_enabled,
    c.relname as table_name,
    p.proname as function_name,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'catalog_components'
AND t.tgname NOT LIKE 'RI_%'
ORDER BY t.tgname;
