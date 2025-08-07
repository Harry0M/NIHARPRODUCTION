# Staff Role Issue - Fix Analysis

## The Problem

When a **staff** user signed in:
1. Profile query timed out → Falls back to metadata
2. **BUT** the metadata role was being overwritten as "admin" 
3. This "admin" role was then synced to the profiles table
4. Later loads showed "admin" instead of "staff"

## Root Cause Analysis

### Original Problematic Code:
```typescript
// ❌ This was the issue
role = currentUser.user_metadata?.role as UserRole || 'admin';

// When user_metadata.role was undefined/null, it defaulted to 'admin'
// This happened because the staff user might not have had proper metadata set
```

### The Flow That Was Breaking:
```
Staff user signs in
↓
Profile query timeout
↓ 
Fallback to metadata: undefined/null
↓
Default to 'admin' ❌ WRONG!
↓
Sync 'admin' to profiles table ❌ WRONG!
↓
Load 'admin' from profiles table ❌ WRONG!
```

## The Fix

### 1. **Better Metadata Handling**
```typescript
// ✅ Now properly extracts and preserves metadata role
const metadataRole = currentUser.user_metadata?.role as UserRole;
role = metadataRole || 'admin';
console.debug('Role loaded from metadata or default:', role, '(metadata:', metadataRole, ')');
```

### 2. **Proper Role Mapping for Sync**
```typescript
// ✅ Only sync if we actually have a metadata role
if (metadataRole && profileError) {
  const dbRoleMapping: Record<UserRole, string> = {
    'admin': 'admin',
    'staff': 'manager', // ✅ Staff maps to manager in DB
    'printer': 'production',
    'cutting': 'production', 
    'stitching': 'production',
  };
  
  const dbRole = dbRoleMapping[metadataRole]; // ✅ Use the actual metadata role
}
```

### 3. **Intelligent Role Mapping Back from DB**
```typescript
// ✅ Smart mapping that preserves specific roles
if (dbRole === 'manager') {
  role = 'staff'; // Manager in DB = Staff in frontend
} else if (dbRole === 'production') {
  // For production, check metadata to preserve specific type
  if (metadataRole && ['printer', 'cutting', 'stitching'].includes(metadataRole)) {
    role = metadataRole; // Preserve specific production role
  } else {
    role = 'printer'; // Default production role
  }
}
```

## Expected Behavior Now

### Staff User Sign In:
```
Auth state change: SIGNED_IN
Profile query timed out or failed: Error: Profile query timeout
Role loaded from metadata or default: staff (metadata: staff)
Role synced to profiles table: staff → manager
```

### Later Session Load:
```
Auth state change: INITIAL_SESSION  
Role loaded from profiles table: manager → staff (metadata: staff)
```

## How to Test

### 1. **Verify Staff User Metadata**
Check that your staff user has proper metadata:
```sql
-- In Supabase SQL Editor
SELECT 
  id, 
  email, 
  raw_user_meta_data,
  user_metadata
FROM auth.users 
WHERE email = 'staff-user@example.com';
```

Should show:
```json
{
  "role": "staff"
}
```

### 2. **Test the Flow**
1. Sign in with staff user
2. Check console logs - should show:
   - `Role loaded from metadata or default: staff (metadata: staff)`
   - `Role synced to profiles table: staff → manager`

### 3. **Verify Database State**
```sql
-- Check profiles table
SELECT id, email, role 
FROM profiles 
WHERE email = 'staff-user@example.com';
```

Should show `role: "manager"` (DB enum value for staff)

## User Metadata Setup

If staff users don't have proper metadata, you can set it:

### Option 1: Update via Supabase Dashboard
1. Go to Authentication → Users
2. Find the staff user
3. Edit their user metadata to include: `{"role": "staff"}`

### Option 2: Update via SQL
```sql
-- Update user metadata
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'), 
  '{role}', 
  '"staff"'
)
WHERE email = 'staff-user@example.com';
```

## Debugging Console Logs

You should now see these improved logs:

```
✅ Auth state change: SIGNED_IN
✅ Role loaded from metadata or default: staff (metadata: staff)
✅ Role synced to profiles table: staff → manager

✅ Auth state change: INITIAL_SESSION
✅ Role loaded from profiles table: manager → staff (metadata: staff)
```

The key indicators that it's working:
- Metadata shows the correct role ("staff")
- Database sync shows correct mapping ("staff → manager")
- Final role assignment is correct ("staff")

This fix ensures that user roles are properly preserved throughout the authentication flow! 🎯
