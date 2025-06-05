-- Check what the calculate_component_consumption function does
-- This function is likely overriding our formula field after the corrected trigger runs

SELECT 'Current function definition:' as info;
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'calculate_component_consumption';

-- Check the function source code
SELECT prosrc
FROM pg_proc 
WHERE proname = 'calculate_component_consumption';
