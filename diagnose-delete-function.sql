-- Check if the delete_order_completely function exists and verify its signature
-- Run this in your Supabase SQL editor to diagnose the issue

-- 1. Check if the function exists at all
SELECT 
  p.proname as function_name,
  p.pronargs as num_args,
  pg_get_function_identity_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type,
  p.prosrc as function_body_preview
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname LIKE '%delete_order%'
ORDER BY p.proname;

-- 2. Check all RPC functions available
SELECT 
  p.proname as function_name,
  p.pronargs as num_args,
  pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN ('delete_order_completely', 'delete_order', 'bulk_delete_orders')
ORDER BY p.proname;

-- 3. Check what functions are available that contain 'delete'
SELECT 
  p.proname as function_name,
  p.pronargs as num_args,
  pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname LIKE '%delete%'
ORDER BY p.proname;

-- 4. Try to create a simple test function to verify permissions
CREATE OR REPLACE FUNCTION public.test_function_creation()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN 'Function creation works!';
END;
$$;

-- 5. Test the function
SELECT public.test_function_creation();

-- 6. Clean up test function
DROP FUNCTION IF EXISTS public.test_function_creation();
