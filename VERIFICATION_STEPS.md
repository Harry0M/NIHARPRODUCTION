# ✅ Staff Role Fix Verification

## What You Just Fixed

By running the SQL script, you have:

1. **✅ Fixed user metadata** - Set `role: "staff"` in `auth.users.raw_user_meta_data`
2. **✅ Fixed database role** - Set `role: "manager"` in `public.profiles` table
3. **✅ Updated trigger** - New users will now get correct role mapping
4. **✅ Synchronized data** - Both storage locations now match properly

## Next Steps to Verify the Fix

### Step 1: Check the Database (Run in Supabase SQL Editor)

```sql
-- Verify the fix worked
SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data->>'role' as metadata_role,
    p.role as profile_role,
    CASE 
        WHEN u.raw_user_meta_data->>'role' = 'staff' AND p.role = 'manager' THEN '✅ FIXED'
        WHEN u.raw_user_meta_data->>'role' = 'admin' AND p.role = 'admin' THEN '✅ ADMIN'
        ELSE '❌ MISMATCH'
    END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.email;
```

### Step 2: Test in Your App

1. **Have the staff user sign out completely**
2. **Have them sign back in**
3. **Check browser console** - should show:
   ```
   Role loaded from profiles table: manager → staff (metadata: staff)
   ```
4. **Verify they stay as staff** throughout the session

### Step 3: Test Role Changes via UserManagement

Now that the data is fixed, let's also deploy the enhanced RPC function so future role changes work perfectly:

1. **Go to Supabase SQL Editor**
2. **Run this enhanced RPC function:**

```sql
CREATE OR REPLACE FUNCTION update_user_role(target_user_id UUID, new_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  db_role TEXT;
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can update user roles';
  END IF;

  -- Map frontend roles to database enum values
  CASE new_role
    WHEN 'admin' THEN db_role := 'admin';
    WHEN 'staff' THEN db_role := 'manager';
    WHEN 'printer' THEN db_role := 'production';
    WHEN 'cutting' THEN db_role := 'production';
    WHEN 'stitching' THEN db_role := 'production';
    ELSE 
      RAISE EXCEPTION 'Invalid role: %', new_role;
  END CASE;

  -- Update the profiles table with mapped role
  UPDATE public.profiles 
  SET role = db_role, updated_at = NOW()
  WHERE id = target_user_id;

  -- Check if update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found in profiles table';
  END IF;

  -- Update the user metadata to match the frontend role
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'),
    '{role}',
    to_jsonb(new_role)
  )
  WHERE id = target_user_id;

  -- Check if metadata update was successful
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found in auth.users table';
  END IF;

  RETURN TRUE;
END;
$$;
```

## Expected Results

### ✅ What Should Happen Now:

1. **Staff users sign in as staff** and stay staff
2. **No more automatic role switching** to admin
3. **UserManagement interface** works perfectly for role changes
4. **Console logs show** proper role mapping: `manager → staff`
5. **New users get correct roles** based on invitation metadata

### 🚨 If Issues Persist:

1. **Clear browser cache/localStorage**
2. **Check browser console for errors**
3. **Verify user signed out completely before testing**
4. **Run the verification SQL query** to confirm data

## Summary

The combination of your manual fix + the enhanced RPC function creates a complete solution:

- **✅ Existing data fixed** (your SQL script)
- **✅ Future role changes work** (enhanced RPC function) 
- **✅ New user creation works** (updated trigger)
- **✅ AuthContext handles all cases** (our previous fixes)

Your staff users should now maintain their correct roles! 🎉
