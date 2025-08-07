-- CORRECTED USER ROLE FIX
-- Your database allows: 'admin', 'staff', 'printer', 'cutting', 'stitching'
-- NOT 'manager' - that was my mistake!

-- Fix staff users: set metadata to 'staff' and profile to 'staff' (not 'manager'!)
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'), 
    '{role}', 
    '"staff"'
)
WHERE email IN ('ankitaben@gmail.com', 'bhargavbhai@office.com');

UPDATE public.profiles 
SET 
    role = 'staff',  -- Use 'staff' directly, not 'manager'!
    updated_at = NOW()
WHERE id IN (
    SELECT id FROM auth.users 
    WHERE email IN ('ankitaben@gmail.com', 'bhargavbhai@office.com')
);

-- Fix admin users: set metadata to 'admin' (keep profile as 'admin')
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'), 
    '{role}', 
    '"admin"'
)
WHERE email IN ('hemalshah@gmail.com', 'niharshah@gmail.com', 'palhariom698@gmail.com');

-- Verification query
SELECT 
    u.email,
    u.raw_user_meta_data->>'role' as metadata_role,
    p.role as profile_role,
    CASE 
        WHEN u.raw_user_meta_data->>'role' = 'staff' AND p.role = 'staff' THEN '✅ STAFF FIXED'
        WHEN u.raw_user_meta_data->>'role' = 'admin' AND p.role = 'admin' THEN '✅ ADMIN FIXED'
        ELSE '❌ STILL NEEDS CHECK'
    END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email IS NOT NULL
ORDER BY u.email;
