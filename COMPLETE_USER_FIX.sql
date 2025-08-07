-- Comprehensive User Role Fix
-- This fixes all users with missing metadata roles

-- Step 1: Fix users who should be staff (currently have profile_role = 'staff')
-- These users should have metadata_role = 'staff' and profile_role = 'manager'

-- Fix ankitaben@gmail.com (staff user)
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'), 
    '{role}', 
    '"staff"'
)
WHERE email = 'ankitaben@gmail.com';

UPDATE public.profiles 
SET 
    role = 'manager',  -- staff users map to 'manager' in database
    updated_at = NOW()
WHERE id = (SELECT id FROM auth.users WHERE email = 'ankitaben@gmail.com');

-- Fix bhargavbhai@office.com (staff user)
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'), 
    '{role}', 
    '"staff"'
)
WHERE email = 'bhargavbhai@office.com';

UPDATE public.profiles 
SET 
    role = 'manager',  -- staff users map to 'manager' in database
    updated_at = NOW()
WHERE id = (SELECT id FROM auth.users WHERE email = 'bhargavbhai@office.com');

-- Step 2: Fix admin users who have null metadata
-- These should have metadata_role = 'admin' and keep profile_role = 'admin'

-- Fix hemalshah@gmail.com (admin user)
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'), 
    '{role}', 
    '"admin"'
)
WHERE email = 'hemalshah@gmail.com';

-- Fix niharshah@gmail.com (admin user)
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'), 
    '{role}', 
    '"admin"'
)
WHERE email = 'niharshah@gmail.com';

-- Fix palhariom698@gmail.com (admin user)
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'), 
    '{role}', 
    '"admin"'
)
WHERE email = 'palhariom698@gmail.com';

-- Step 3: Verify all fixes
SELECT 
    u.email,
    u.raw_user_meta_data->>'role' as metadata_role,
    p.role as profile_role,
    CASE 
        WHEN u.raw_user_meta_data->>'role' = 'staff' AND p.role = 'manager' THEN '✅ STAFF FIXED'
        WHEN u.raw_user_meta_data->>'role' = 'admin' AND p.role = 'admin' THEN '✅ ADMIN FIXED'
        ELSE '❌ STILL NEEDS CHECK'
    END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email IS NOT NULL
ORDER BY u.email;
