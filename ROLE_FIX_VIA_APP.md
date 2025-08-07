# Fix Staff User Role via User Management Interface

## The Solution

Instead of running SQL manually, you can fix the staff user role directly through your app's User Management interface! Here's how to make it work properly:

## Step 1: Update the RPC Function (Run in Supabase SQL Editor)

Replace your existing `update_user_role` function with this enhanced version:

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

## Step 2: Use Your App Interface

1. **Sign in as admin**
2. **Go to User Management page**
3. **Find the user with wrong role**
4. **Change their role from "Admin" to "Staff"**
5. **The user should sign out and sign back in**

## Step 3: Verify the Fix

After updating via the app interface:

1. **Check console logs** - should show:
   ```
   Role loaded from profiles table: manager → staff (metadata: staff)
   ```

2. **User should maintain staff role** throughout the session

## What This Enhanced Function Does

### Before (Old Function):
- ❌ Only updated `profiles` table
- ❌ Left user metadata unchanged 
- ❌ Caused metadata/database mismatch

### After (New Function):
- ✅ Updates both `profiles` table AND user metadata
- ✅ Maps frontend roles to database enum properly
- ✅ Ensures complete consistency
- ✅ Prevents role switching issues

## Mapping Logic

| Frontend Role | Database Role | User Metadata |
|---------------|---------------|---------------|
| `admin`       | `admin`       | `admin`       |
| `staff`       | `manager`     | `staff`       |
| `printer`     | `production`  | `printer`     |
| `cutting`     | `production`  | `cutting`     |
| `stitching`   | `production`  | `stitching`   |

## Benefits

1. **🎯 Fix via UI**: No manual SQL needed
2. **🔄 Complete Sync**: Both metadata and database updated
3. **🛡️ Admin Only**: Proper permission checking
4. **✅ Consistent**: No more role switching issues
5. **🚀 Future Proof**: All future role changes work correctly

After implementing this, your User Management interface will properly fix staff roles and prevent the automatic switching to admin! 🎉
