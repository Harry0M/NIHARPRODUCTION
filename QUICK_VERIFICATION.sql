-- Quick Verification Query
-- Run this in Supabase SQL Editor to check the fix

SELECT 
    u.email,
    u.raw_user_meta_data->>'role' as metadata_role,
    p.role as profile_role,
    CASE 
        WHEN u.raw_user_meta_data->>'role' = 'staff' AND p.role = 'manager' THEN '✅ STAFF FIXED'
        WHEN u.raw_user_meta_data->>'role' = 'admin' AND p.role = 'admin' THEN '✅ ADMIN OK'
        ELSE '❌ CHECK NEEDED'
    END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email IS NOT NULL
ORDER BY u.email;
