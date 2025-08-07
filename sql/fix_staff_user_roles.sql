-- Fix Staff User Role Issue
-- This script fixes the metadata and database role for staff users

-- First, let's see what users we have and their current roles
SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data,
    p.role as profile_role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.email;

-- If you see a user that should be staff but shows admin, 
-- run the following commands (replace with actual email):

-- Step 1: Fix the user metadata
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'), 
    '{role}', 
    '"staff"'
)
WHERE email = 'your-staff-user@example.com';  -- ⚠️ Replace with actual email

-- Step 2: Fix the profiles table role
UPDATE public.profiles 
SET 
    role = 'manager',  -- staff users map to 'manager' in database
    updated_at = NOW()
WHERE id = (
    SELECT id FROM auth.users WHERE email = 'your-staff-user@example.com'  -- ⚠️ Replace with actual email
);

-- Step 3: Verify the changes
SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data,
    p.role as profile_role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'your-staff-user@example.com';  -- ⚠️ Replace with actual email

-- Optional: Update the default new user role to not always be admin
-- This prevents future users from defaulting to admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Get role from user metadata, default to 'admin' if not specified
    INSERT INTO public.profiles (id, email, role, created_at, updated_at)
    VALUES (
        NEW.id, 
        NEW.email, 
        CASE 
            WHEN NEW.raw_user_meta_data->>'role' = 'staff' THEN 'manager'
            WHEN NEW.raw_user_meta_data->>'role' = 'printer' THEN 'production'
            WHEN NEW.raw_user_meta_data->>'role' = 'cutting' THEN 'production'
            WHEN NEW.raw_user_meta_data->>'role' = 'stitching' THEN 'production'
            ELSE 'admin'
        END,
        NOW(), 
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        role = EXCLUDED.role,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
