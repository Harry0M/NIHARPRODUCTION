# Fix Staff User Role Issue - Step by Step Guide

## Problem Analysis

From your logs:
```
Role loaded from profiles table: staff → admin (metadata: admin)
```

This shows:
- **Database role**: `staff` ✅ (correct in profiles table)  
- **Metadata role**: `admin` ❌ (wrong in user metadata)
- **Final result**: `admin` ❌ (metadata is overriding)

## Root Cause

The user's `raw_user_meta_data` contains `{"role": "admin"}` when it should contain `{"role": "staff"}`.

## Step-by-Step Fix

### Step 1: Check Current User Data
Run this in Supabase SQL Editor to see all users:

```sql
SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data,
    p.role as profile_role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.email;
```

Look for users where `profile_role` is `'manager'` (which means staff) but `raw_user_meta_data` shows `'admin'`.

### Step 2: Fix Staff User Metadata  
For each staff user, run this (replace email):

```sql
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'), 
    '{role}', 
    '"staff"'
)
WHERE email = 'staff-user@example.com';
```

### Step 3: Ensure Profiles Table is Correct
If the profiles table role is wrong, fix it:

```sql
UPDATE public.profiles 
SET 
    role = 'manager',
    updated_at = NOW()
WHERE id = (
    SELECT id FROM auth.users WHERE email = 'staff-user@example.com'
);
```

### Step 4: Verify the Fix
```sql
SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data,
    p.role as profile_role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'staff-user@example.com';
```

Should show:
- `raw_user_meta_data`: `{"role": "staff"}`
- `profile_role`: `"manager"`

## Expected Result After Fix

Console logs should show:
```
Role loaded from profiles table: manager → staff (metadata: staff)
```

## Quick Fix Alternative

If you know the exact email of the staff user, here's a single command:

```sql
-- Fix metadata
UPDATE auth.users 
SET raw_user_meta_data = '{"role": "staff"}'
WHERE email = 'your-staff-user-email@example.com';

-- Fix profiles table  
UPDATE public.profiles 
SET role = 'manager'
WHERE id = (SELECT id FROM auth.users WHERE email = 'your-staff-user-email@example.com');
```

## Prevention: Fix New User Creation

To prevent this in the future, update the trigger function:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, created_at, updated_at)
    VALUES (
        NEW.id, 
        NEW.email, 
        CASE 
            WHEN NEW.raw_user_meta_data->>'role' = 'staff' THEN 'manager'
            WHEN NEW.raw_user_meta_data->>'role' IN ('printer', 'cutting', 'stitching') THEN 'production'
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
```

## Test the Fix

1. **Run the SQL fixes above**
2. **Sign out and sign back in** with the staff user
3. **Check console logs** - should show:
   ```
   Role loaded from profiles table: manager → staff (metadata: staff)
   ```
4. **Verify in app** - user should remain as staff role

The key is making sure the user metadata matches their intended role! 🎯
